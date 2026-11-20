import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field, model_validator

from app.models.rfq import ExtensionTriggerType, RFQStatus
from app.schemas.activity_log import ActivityLogResponse
from app.schemas.quote import QuoteResponse


class RFQBase(BaseModel):
    reference_id: str = Field(..., min_length=2, max_length=50)
    name: str = Field(..., min_length=2, max_length=255)
    bid_start_time: datetime
    bid_close_time: datetime
    forced_bid_close_time: datetime
    pickup_service_date: date
    trigger_window_minutes: int = Field(default=10, gt=0)
    extension_duration_minutes: int = Field(default=5, gt=0)
    extension_trigger_type: ExtensionTriggerType = Field(default=ExtensionTriggerType.BID_RECEIVED)

    @model_validator(mode="after")
    def validate_times(self):
        if self.bid_close_time <= self.bid_start_time:
            raise ValueError("Bid Close Time must be later than Bid Start Time.")
        if self.forced_bid_close_time <= self.bid_close_time:
            raise ValueError("Forced Bid Close Time must always be greater than Bid Close Time.")
        return self


class RFQCreate(RFQBase):
    pass


class RFQResponse(BaseModel):
    id: uuid.UUID
    reference_id: str
    name: str
    status: RFQStatus
    bid_start_time: datetime
    bid_close_time: datetime
    original_bid_close_time: datetime
    forced_bid_close_time: datetime
    pickup_service_date: date
    trigger_window_minutes: int
    extension_duration_minutes: int
    extension_trigger_type: ExtensionTriggerType

    current_lowest_bid: Decimal | None = None
    current_lowest_carrier: str | None = None
    total_bids_count: int = 0
    is_in_trigger_window: bool = False

    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class RFQDetailResponse(RFQResponse):
    quotes: list[QuoteResponse] = []
    activity_logs: list[ActivityLogResponse] = []
