import enum
import uuid
from datetime import UTC, datetime

from sqlalchemy import Column, DateTime, ForeignKey, Text
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class ActivityType(enum.StrEnum):
    RFQ_CREATED = "RFQ_CREATED"
    BID_SUBMITTED = "BID_SUBMITTED"
    TIME_EXTENDED = "TIME_EXTENDED"
    STATUS_CHANGED = "STATUS_CHANGED"


class AuctionActivityLog(Base):
    __tablename__ = "auction_activity_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rfq_id = Column(
        UUID(as_uuid=True), ForeignKey("rfqs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    quote_id = Column(
        UUID(as_uuid=True), ForeignKey("quotes.id", ondelete="SET NULL"), nullable=True
    )

    activity_type = Column(SQLEnum(ActivityType, name="activity_type_enum"), nullable=False)
    description = Column(Text, nullable=False)

    previous_close_time = Column(DateTime(timezone=True), nullable=True)
    new_close_time = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )

    rfq = relationship("RFQ", back_populates="activity_logs")
    quote = relationship("Quote", back_populates="activity_logs")
