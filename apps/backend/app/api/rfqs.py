import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.rfq import RFQ, RFQStatus
from app.schemas.rfq import RFQCreate, RFQResponse, RFQDetailResponse
from app.services.auction_service import AuctionService

router = APIRouter(prefix="/rfqs", tags=["RFQs"])


@router.get("", response_model=List[RFQResponse])
def list_rfqs(
    status_filter: Optional[RFQStatus] = Query(None, alias="status"),
    db: Session = Depends(get_db)
):
    """List all RFQs with summary status, lowest bid, and closing times."""
    query = db.query(RFQ).order_by(RFQ.created_at.desc())
    rfqs = query.all()
    
    results = []
    for r in rfqs:
        resp = AuctionService.format_rfq_response(r, db)
        if status_filter is None or resp.status == status_filter:
            results.append(resp)
    return results


@router.post("", response_model=RFQDetailResponse, status_code=status.HTTP_201_CREATED)
def create_rfq(payload: RFQCreate, db: Session = Depends(get_db)):
    """Create a new RFQ with British Auction configuration."""
    rfq = AuctionService.create_rfq(db, payload)
    return AuctionService.format_rfq_detail_response(rfq, db)


@router.get("/{rfq_id}", response_model=RFQDetailResponse)
def get_rfq_details(rfq_id: uuid.UUID, db: Session = Depends(get_db)):
    """Retrieve full details of an RFQ, including supplier rankings and activity logs."""
    rfq = db.query(RFQ).filter(RFQ.id == rfq_id).first()
    if not rfq:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="RFQ not found.")
    return AuctionService.format_rfq_detail_response(rfq, db)


@router.post("/{rfq_id}/time-travel", response_model=RFQDetailResponse)
def simulate_time_travel(
    rfq_id: uuid.UUID,
    minutes_from_now: int = Query(..., description="Set close time to X minutes from now to test live window!"),
    db: Session = Depends(get_db)
):
    """
    Testing helper: Shifts the bid_close_time so it is `minutes_from_now` minutes away,
    making it trivial to enter and test the trigger window in real-time.
    """
    rfq = db.query(RFQ).filter(RFQ.id == rfq_id).first()
    if not rfq:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="RFQ not found.")
    
    now = datetime.now(timezone.utc)
    from datetime import timedelta
    new_close = now + timedelta(minutes=minutes_from_now)
    
    if new_close >= rfq.forced_bid_close_time:
        rfq.forced_bid_close_time = new_close + timedelta(minutes=15)
    
    rfq.bid_close_time = new_close
    rfq.status = RFQStatus.ACTIVE
    db.commit()
    db.refresh(rfq)
    return AuctionService.format_rfq_detail_response(rfq, db)
