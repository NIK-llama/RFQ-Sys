import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class QuoteBase(BaseModel):
    carrier_name: str = Field(..., min_length=1, max_length=150)
    freight_charges: Decimal = Field(..., ge=0, decimal_places=2)
    origin_charges: Decimal = Field(..., ge=0, decimal_places=2)
    destination_charges: Decimal = Field(..., ge=0, decimal_places=2)
    transit_time_days: int = Field(..., gt=0)
    validity_date: date


class QuoteCreate(QuoteBase):
    # Optional field to simulate submission time for automated testing / demo evaluation
    simulated_submitted_at: datetime | None = None


class QuoteResponse(QuoteBase):
    id: uuid.UUID
    rfq_id: uuid.UUID
    total_price: Decimal
    submitted_at: datetime
    rank: str | None = None  # e.g., "L1", "L2"
    rank_number: int | None = None  # e.g., 1, 2

    model_config = {"from_attributes": True}
