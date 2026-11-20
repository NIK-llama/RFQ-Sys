import uuid

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.quote import QuoteCreate, QuoteResponse
from app.services.auction_service import AuctionService

router = APIRouter(prefix="/rfqs/{rfq_id}/quotes", tags=["Quotes"])


class QuoteSubmissionResult(BaseModel):
    quote: QuoteResponse
    auction_extended: bool
    extension_reason: str | None = None


@router.post("", response_model=QuoteSubmissionResult, status_code=status.HTTP_201_CREATED)
def submit_quote(rfq_id: uuid.UUID, payload: QuoteCreate, db: Session = Depends(get_db)):
    """
    Submit a quote for an RFQ.
    If within the trigger window, evaluates extension rules and automatically extends the auction.
    """
    quote, extended, reason = AuctionService.submit_quote(db, rfq_id, payload)

    # Fetch rank
    quote_resp = QuoteResponse(
        id=quote.id,
        rfq_id=quote.rfq_id,
        carrier_name=quote.carrier_name,
        freight_charges=quote.freight_charges,
        origin_charges=quote.origin_charges,
        destination_charges=quote.destination_charges,
        total_price=quote.total_price,
        transit_time_days=quote.transit_time_days,
        validity_date=quote.validity_date,
        submitted_at=quote.submitted_at,
    )

    return QuoteSubmissionResult(
        quote=quote_resp, auction_extended=extended, extension_reason=reason
    )
