import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.activity_log import ActivityType


class ActivityLogResponse(BaseModel):
    id: uuid.UUID
    rfq_id: uuid.UUID
    quote_id: Optional[uuid.UUID] = None
    activity_type: ActivityType
    description: str
    previous_close_time: Optional[datetime] = None
    new_close_time: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}
