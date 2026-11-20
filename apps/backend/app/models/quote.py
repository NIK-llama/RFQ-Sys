import uuid
from datetime import UTC, datetime

from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Quote(Base):
    __tablename__ = "quotes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rfq_id = Column(
        UUID(as_uuid=True), ForeignKey("rfqs.id", ondelete="CASCADE"), nullable=False, index=True
    )

    carrier_name = Column(String(150), nullable=False)
    freight_charges = Column(Numeric(12, 2), nullable=False)
    origin_charges = Column(Numeric(12, 2), nullable=False)
    destination_charges = Column(Numeric(12, 2), nullable=False)
    total_price = Column(Numeric(12, 2), nullable=False, index=True)

    transit_time_days = Column(Integer, nullable=False)
    validity_date = Column(Date, nullable=False)

    submitted_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )

    rfq = relationship("RFQ", back_populates="quotes")
    activity_logs = relationship("AuctionActivityLog", back_populates="quote")
