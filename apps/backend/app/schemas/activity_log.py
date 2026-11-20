import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.activity_log import ActivityType


class ActivityLogResponse(BaseModel):
    id: uuid.UUID
    rfq_id: uuid.UUID
    quote_id: uuid.UUID | None = None
    activity_type: ActivityType
    description: str
    previous_close_time: datetime | None = None
    new_close_time: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
