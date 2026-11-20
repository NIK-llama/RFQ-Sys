import enum
import uuid
from datetime import UTC, datetime

from sqlalchemy import Column, Date, DateTime, Integer, String
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class RFQStatus(enum.StrEnum):
    UPCOMING = "UPCOMING"
    ACTIVE = "ACTIVE"
    CLOSED = "CLOSED"
    FORCE_CLOSED = "FORCE_CLOSED"


class ExtensionTriggerType(enum.StrEnum):
    BID_RECEIVED = "BID_RECEIVED"
    ANY_RANK_CHANGE = "ANY_RANK_CHANGE"
    L1_RANK_CHANGE = "L1_RANK_CHANGE"


class RFQ(Base):
    __tablename__ = "rfqs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reference_id = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)

    bid_start_time = Column(DateTime(timezone=True), nullable=False)
    bid_close_time = Column(DateTime(timezone=True), nullable=False)
    original_bid_close_time = Column(DateTime(timezone=True), nullable=False)
    forced_bid_close_time = Column(DateTime(timezone=True), nullable=False)

    pickup_service_date = Column(Date, nullable=False)

    # British Auction Config
    trigger_window_minutes = Column(Integer, nullable=False, default=10)  # X
    extension_duration_minutes = Column(Integer, nullable=False, default=5)  # Y
    extension_trigger_type = Column(
        SQLEnum(ExtensionTriggerType, name="extension_trigger_type_enum"),
        nullable=False,
        default=ExtensionTriggerType.BID_RECEIVED,
    )

    # Optional explicitly saved status; can also be evaluated dynamically
    status = Column(
        SQLEnum(RFQStatus, name="rfq_status_enum"), nullable=False, default=RFQStatus.ACTIVE
    )

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )

    quotes = relationship(
        "Quote",
        back_populates="rfq",
        cascade="all, delete-orphan",
        order_by="Quote.total_price.asc()",
    )
    activity_logs = relationship(
        "AuctionActivityLog",
        back_populates="rfq",
        cascade="all, delete-orphan",
        order_by="AuctionActivityLog.created_at.desc()",
    )
