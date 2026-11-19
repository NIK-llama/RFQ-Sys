import pytest
from datetime import datetime, timezone, timedelta, date
from decimal import Decimal
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException

from app.database import Base
from app.models.rfq import RFQ, RFQStatus, ExtensionTriggerType
from app.models.quote import Quote
from app.models.activity_log import AuctionActivityLog, ActivityType
from app.schemas.rfq import RFQCreate
from app.schemas.quote import QuoteCreate
from app.services.auction_service import AuctionService


# In-memory SQLite or test Postgres session
@pytest.fixture
def test_db():
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSession()
    yield db
    db.close()


def test_create_rfq_validations():
    now = datetime.now(timezone.utc)
    # Invalid: close <= start
    with pytest.raises(ValueError, match="Bid Close Time must be later than Bid Start Time"):
        RFQCreate(
            reference_id="TEST-001",
            name="Test RFQ",
            bid_start_time=now,
            bid_close_time=now - timedelta(minutes=5),
            forced_bid_close_time=now + timedelta(minutes=10),
            pickup_service_date=date(2026, 12, 1),
            trigger_window_minutes=10,
            extension_duration_minutes=5,
            extension_trigger_type=ExtensionTriggerType.BID_RECEIVED
        )

    # Invalid: forced_close <= close
    with pytest.raises(ValueError, match="Forced Bid Close Time must always be greater than Bid Close Time"):
        RFQCreate(
            reference_id="TEST-002",
            name="Test RFQ",
            bid_start_time=now,
            bid_close_time=now + timedelta(minutes=30),
            forced_bid_close_time=now + timedelta(minutes=20),
            pickup_service_date=date(2026, 12, 1),
            trigger_window_minutes=10,
            extension_duration_minutes=5,
            extension_trigger_type=ExtensionTriggerType.BID_RECEIVED
        )


def test_bid_received_trigger_extends_auction(test_db):
    now = datetime.now(timezone.utc)
    rfq_payload = RFQCreate(
        reference_id="TEST-BID-TRIGGER",
        name="Test Bid Trigger",
        bid_start_time=now - timedelta(hours=1),
        bid_close_time=now + timedelta(minutes=5),  # 5 mins left
        forced_bid_close_time=now + timedelta(minutes=30),
        pickup_service_date=date(2026, 12, 1),
        trigger_window_minutes=10,  # inside 10 min window!
        extension_duration_minutes=5,
        extension_trigger_type=ExtensionTriggerType.BID_RECEIVED
    )
    rfq = AuctionService.create_rfq(test_db, rfq_payload)
    initial_close = rfq.bid_close_time

    # Submit bid inside trigger window
    quote_payload = QuoteCreate(
        carrier_name="Speedy Express",
        freight_charges=Decimal("1000.00"),
        origin_charges=Decimal("100.00"),
        destination_charges=Decimal("100.00"),
        transit_time_days=2,
        validity_date=date(2026, 12, 15),
        simulated_submitted_at=now
    )

    quote, extended, reason = AuctionService.submit_quote(test_db, rfq.id, quote_payload)
    assert extended is True
    assert rfq.bid_close_time == initial_close + timedelta(minutes=5)
    assert "Auction extended by 5 minutes" in reason


def test_l1_rank_change_trigger(test_db):
    now = datetime.now(timezone.utc)
    rfq_payload = RFQCreate(
        reference_id="TEST-L1-TRIGGER",
        name="Test L1 Trigger",
        bid_start_time=now - timedelta(hours=1),
        bid_close_time=now + timedelta(minutes=4),  # 4 mins left
        forced_bid_close_time=now + timedelta(minutes=40),
        pickup_service_date=date(2026, 12, 1),
        trigger_window_minutes=10,
        extension_duration_minutes=5,
        extension_trigger_type=ExtensionTriggerType.L1_RANK_CHANGE
    )
    rfq = AuctionService.create_rfq(test_db, rfq_payload)
    initial_close = rfq.bid_close_time

    # 1. Existing L1 bid submitted earlier (outside window)
    q1 = Quote(
        rfq_id=rfq.id,
        carrier_name="Carrier Alpha",
        freight_charges=Decimal("2000.00"),
        origin_charges=Decimal("100.00"),
        destination_charges=Decimal("100.00"),
        total_price=Decimal("2200.00"),
        transit_time_days=3,
        validity_date=date(2026, 12, 15),
        submitted_at=now - timedelta(minutes=20)
    )
    test_db.add(q1)
    test_db.commit()

    # 2. Inside trigger window: Submit a bid that does NOT beat L1 ($2,500 > $2,200)
    q2_payload = QuoteCreate(
        carrier_name="Carrier Beta",
        freight_charges=Decimal("2300.00"),
        origin_charges=Decimal("100.00"),
        destination_charges=Decimal("100.00"),
        transit_time_days=3,
        validity_date=date(2026, 12, 15),
        simulated_submitted_at=now
    )
    _, extended, _ = AuctionService.submit_quote(test_db, rfq.id, q2_payload)
    assert extended is False
    assert rfq.bid_close_time == initial_close  # no extension!

    # 3. Inside trigger window: Submit a bid that BEATS L1 ($1,900 < $2,200)
    q3_payload = QuoteCreate(
        carrier_name="Carrier Gamma",
        freight_charges=Decimal("1700.00"),
        origin_charges=Decimal("100.00"),
        destination_charges=Decimal("100.00"),
        transit_time_days=2,
        validity_date=date(2026, 12, 15),
        simulated_submitted_at=now
    )
    _, extended, reason = AuctionService.submit_quote(test_db, rfq.id, q3_payload)
    assert extended is True
    assert rfq.bid_close_time == initial_close + timedelta(minutes=5)
    assert "Lowest bidder (L1) changed" in reason


def test_extension_capped_at_forced_close_time(test_db):
    now = datetime.now(timezone.utc)
    # Bid close is 2 mins from now, Forced close is 4 mins from now.
    # Extension duration is 10 mins!
    # Expected: close time extends only by 2 mins up to forced close time.
    rfq_payload = RFQCreate(
        reference_id="TEST-FORCED-CAP",
        name="Test Forced Cap",
        bid_start_time=now - timedelta(hours=1),
        bid_close_time=now + timedelta(minutes=2),
        forced_bid_close_time=now + timedelta(minutes=4),
        pickup_service_date=date(2026, 12, 1),
        trigger_window_minutes=10,
        extension_duration_minutes=10,
        extension_trigger_type=ExtensionTriggerType.BID_RECEIVED
    )
    rfq = AuctionService.create_rfq(test_db, rfq_payload)

    q_payload = QuoteCreate(
        carrier_name="Carrier Delta",
        freight_charges=Decimal("1000.00"),
        origin_charges=Decimal("100.00"),
        destination_charges=Decimal("100.00"),
        transit_time_days=2,
        validity_date=date(2026, 12, 15),
        simulated_submitted_at=now
    )
    _, extended, reason = AuctionService.submit_quote(test_db, rfq.id, q_payload)
    assert extended is True
    assert rfq.bid_close_time == rfq.forced_bid_close_time
    assert "Forced Close limit" in reason

    # Now if another bid comes in when already at forced close time:
    q2_payload = QuoteCreate(
        carrier_name="Carrier Epsilon",
        freight_charges=Decimal("900.00"),
        origin_charges=Decimal("100.00"),
        destination_charges=Decimal("100.00"),
        transit_time_days=2,
        validity_date=date(2026, 12, 15),
        simulated_submitted_at=now + timedelta(seconds=10)
    )
    _, extended_again, _ = AuctionService.submit_quote(test_db, rfq.id, q2_payload)
    assert extended_again is False
    assert rfq.bid_close_time == rfq.forced_bid_close_time
