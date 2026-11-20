from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app

engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


def test_api_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"


def test_create_and_query_rfq():
    now = datetime.now(UTC)
    payload = {
        "reference_id": "API-RFQ-001",
        "name": "Ocean Freight Express",
        "bid_start_time": (now - timedelta(minutes=5)).isoformat(),
        "bid_close_time": (now + timedelta(minutes=30)).isoformat(),
        "forced_bid_close_time": (now + timedelta(minutes=60)).isoformat(),
        "pickup_service_date": "2026-12-10",
        "trigger_window_minutes": 10,
        "extension_duration_minutes": 5,
        "extension_trigger_type": "BID_RECEIVED",
    }

    create_res = client.post("/api/rfqs", json=payload)
    assert create_res.status_code == 201
    rfq_data = create_res.json()
    assert rfq_data["reference_id"] == "API-RFQ-001"
    assert rfq_data["status"] == "ACTIVE"
    rfq_id = rfq_data["id"]

    # Submit a quote
    quote_payload = {
        "carrier_name": "Evergreen Line",
        "freight_charges": 1500.00,
        "origin_charges": 200.00,
        "destination_charges": 250.00,
        "transit_time_days": 18,
        "validity_date": "2026-12-30",
    }
    quote_res = client.post(f"/api/rfqs/{rfq_id}/quotes", json=quote_payload)
    assert quote_res.status_code == 201
    q_data = quote_res.json()
    assert float(q_data["quote"]["total_price"]) == 1950.00

    # Query details
    detail_res = client.get(f"/api/rfqs/{rfq_id}")
    assert detail_res.status_code == 200
    detail_data = detail_res.json()
    assert len(detail_data["quotes"]) == 1
    assert detail_data["quotes"][0]["carrier_name"] == "Evergreen Line"
    assert detail_data["quotes"][0]["rank"] == "L1"
    assert float(detail_data["current_lowest_bid"]) == 1950.00
