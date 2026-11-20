from datetime import UTC, date, datetime, timedelta
from decimal import Decimal

from app.database import SessionLocal, init_db
from app.models.activity_log import ActivityType, AuctionActivityLog
from app.models.quote import Quote
from app.models.rfq import RFQ, ExtensionTriggerType, RFQStatus


def seed_database():
    init_db()
    db = SessionLocal()
    try:
        # Clear existing data for clean demo
        db.query(AuctionActivityLog).delete()
        db.query(Quote).delete()
        db.query(RFQ).delete()
        db.commit()

        now = datetime.now(UTC)
        print(f"Seeding database with India-centric RFQs at: {now.isoformat()}")

        # -------------------------------------------------------------
        # RFQ 1: ACTIVE - CLOSING IN 4 MINUTES (IN TRIGGER WINDOW!)
        # Chennai to Gurugram / Auto Components corridor
        # Trigger: L1_RANK_CHANGE, Window: 10 mins, Extension: 5 mins
        # -------------------------------------------------------------
        rfq1_start = now - timedelta(hours=1)
        rfq1_close = now + timedelta(minutes=4)  # 4 mins left!
        rfq1_forced = now + timedelta(minutes=25)

        rfq1 = RFQ(
            reference_id="RFQ-2026-001",
            name="Automotive Parts Freight (Chennai Auto Cluster -> Gurugram/NCR)",
            bid_start_time=rfq1_start,
            bid_close_time=rfq1_close,
            original_bid_close_time=now + timedelta(minutes=4),
            forced_bid_close_time=rfq1_forced,
            pickup_service_date=date(2026, 12, 1),
            trigger_window_minutes=10,
            extension_duration_minutes=5,
            extension_trigger_type=ExtensionTriggerType.L1_RANK_CHANGE,
            status=RFQStatus.ACTIVE,
        )
        db.add(rfq1)
        db.flush()

        log1_init = AuctionActivityLog(
            rfq_id=rfq1.id,
            activity_type=ActivityType.RFQ_CREATED,
            description=(
                f"RFQ '{rfq1.name}' opened with British Auction (L1 Rank Change trigger)."
            ),
            created_at=rfq1_start,
        )
        db.add(log1_init)

        # Quotes for RFQ 1
        q1_1 = Quote(
            rfq_id=rfq1.id,
            carrier_name="Blue Dart Express",
            freight_charges=Decimal("42000.00"),
            origin_charges=Decimal("3500.00"),
            destination_charges=Decimal("3000.00"),
            total_price=Decimal("48500.00"),
            transit_time_days=3,
            validity_date=date(2026, 12, 15),
            submitted_at=now - timedelta(minutes=35),
        )
        q1_2 = Quote(
            rfq_id=rfq1.id,
            carrier_name="Delhivery Freight",
            freight_charges=Decimal("38000.00"),
            origin_charges=Decimal("3000.00"),
            destination_charges=Decimal("2500.00"),
            total_price=Decimal("43500.00"),
            transit_time_days=2,
            validity_date=date(2026, 12, 20),
            submitted_at=now - timedelta(minutes=15),
        )
        db.add_all([q1_1, q1_2])
        db.flush()

        db.add(
            AuctionActivityLog(
                rfq_id=rfq1.id,
                quote_id=q1_1.id,
                activity_type=ActivityType.BID_SUBMITTED,
                description="Quote submitted by 'Blue Dart Express' for ₹48,500.00. Rank: L1.",
                created_at=q1_1.submitted_at,
            )
        )
        db.add(
            AuctionActivityLog(
                rfq_id=rfq1.id,
                quote_id=q1_2.id,
                activity_type=ActivityType.BID_SUBMITTED,
                description="Quote submitted by 'Delhivery Freight' for ₹43,500.00. Rank: L1.",
                created_at=q1_2.submitted_at,
            )
        )

        # -------------------------------------------------------------
        # RFQ 2: ACTIVE - ANY BID RECEIVED EXTENDS
        # Hyderabad Genome Valley to Mumbai JNPT Port
        # Trigger: BID_RECEIVED, Window: 15 mins, Extension: 10 mins
        # -------------------------------------------------------------
        rfq2_start = now - timedelta(hours=2)
        rfq2_close = now + timedelta(minutes=12)
        rfq2_forced = now + timedelta(hours=1)

        rfq2 = RFQ(
            reference_id="RFQ-2026-002",
            name="Pharma Cold Chain Corridor (Hyderabad Genome Valley -> Mumbai JNPT)",
            bid_start_time=rfq2_start,
            bid_close_time=rfq2_close,
            original_bid_close_time=now + timedelta(minutes=12),
            forced_bid_close_time=rfq2_forced,
            pickup_service_date=date(2026, 12, 10),
            trigger_window_minutes=15,
            extension_duration_minutes=10,
            extension_trigger_type=ExtensionTriggerType.BID_RECEIVED,
            status=RFQStatus.ACTIVE,
        )
        db.add(rfq2)
        db.flush()

        db.add(
            AuctionActivityLog(
                rfq_id=rfq2.id,
                activity_type=ActivityType.RFQ_CREATED,
                description=(
                    f"RFQ '{rfq2.name}' opened with British Auction (Bid Received trigger)."
                ),
                created_at=rfq2_start,
            )
        )

        q2_1 = Quote(
            rfq_id=rfq2.id,
            carrier_name="Gati KWE",
            freight_charges=Decimal("28000.00"),
            origin_charges=Decimal("2500.00"),
            destination_charges=Decimal("2500.00"),
            total_price=Decimal("33000.00"),
            transit_time_days=2,
            validity_date=date(2026, 12, 25),
            submitted_at=now - timedelta(minutes=45),
        )
        db.add(q2_1)
        db.flush()
        db.add(
            AuctionActivityLog(
                rfq_id=rfq2.id,
                quote_id=q2_1.id,
                activity_type=ActivityType.BID_SUBMITTED,
                description="Quote submitted by 'Gati KWE' for ₹33,000.00. Current Rank: L1.",
                created_at=q2_1.submitted_at,
            )
        )

        # -------------------------------------------------------------
        # RFQ 3: COMPLETED / CLOSED AUCTION
        # Pune MIDC to Kolkata Haldia Port
        # -------------------------------------------------------------
        rfq3_start = now - timedelta(days=2)
        rfq3_close = now - timedelta(hours=3)
        rfq3_forced = now - timedelta(hours=1)

        rfq3 = RFQ(
            reference_id="RFQ-2026-003",
            name="Heavy Industrial Machinery (Pune MIDC -> Kolkata Haldia Port)",
            bid_start_time=rfq3_start,
            bid_close_time=rfq3_close,
            original_bid_close_time=rfq3_close - timedelta(minutes=10),
            forced_bid_close_time=rfq3_forced,
            pickup_service_date=date(2026, 11, 28),
            trigger_window_minutes=10,
            extension_duration_minutes=5,
            extension_trigger_type=ExtensionTriggerType.ANY_RANK_CHANGE,
            status=RFQStatus.CLOSED,
        )
        db.add(rfq3)
        db.flush()

        q3_1 = Quote(
            rfq_id=rfq3.id,
            carrier_name="TCI Freight",
            freight_charges=Decimal("85000.00"),
            origin_charges=Decimal("6000.00"),
            destination_charges=Decimal("5000.00"),
            total_price=Decimal("96000.00"),
            transit_time_days=4,
            validity_date=date(2026, 12, 5),
            submitted_at=now - timedelta(hours=4),
        )
        q3_2 = Quote(
            rfq_id=rfq3.id,
            carrier_name="VRL Logistics",
            freight_charges=Decimal("78000.00"),
            origin_charges=Decimal("5500.00"),
            destination_charges=Decimal("4500.00"),
            total_price=Decimal("88000.00"),
            transit_time_days=4,
            validity_date=date(2026, 12, 5),
            submitted_at=now - timedelta(hours=3, minutes=8),
        )
        db.add_all([q3_1, q3_2])
        db.flush()

        db.add(
            AuctionActivityLog(
                rfq_id=rfq3.id,
                quote_id=q3_2.id,
                activity_type=ActivityType.TIME_EXTENDED,
                description=(
                    "Supplier ranking changed within last 10 minutes. "
                    f"Auction extended by 5 minutes to {rfq3_close.strftime('%H:%M:%S UTC')}"
                ),
                previous_close_time=rfq3_close - timedelta(minutes=5),
                new_close_time=rfq3_close,
                created_at=q3_2.submitted_at,
            )
        )

        db.commit()
        print("Successfully seeded 3 realistic India-centric RFQs with quotes and activity logs!")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
