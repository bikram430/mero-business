import uuid
from enum import Enum as PyEnum

from sqlalchemy import Column, String, Integer, Enum, DateTime, ForeignKey, func, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class KhataStatus(str, PyEnum):
    ACTIVE = "active"     # customer still owes money
    PARTIAL = "partial"   # partial payment made
    PAID = "paid"         # fully settled


class Khata(Base):
    """
    Khata = buy-now-pay-later ledger entry (Phase 3).
    One Khata row per credit sale. Partial payments update amount_paid.
    """
    __tablename__ = "khata"
    __table_args__ = (
        Index("idx_khata_merchant", "merchant_id"),
        Index("idx_khata_phone", "customer_phone"),
        Index("idx_khata_status", "status"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    merchant_id = Column(UUID(as_uuid=True), ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False)
    customer_phone = Column(String(20), nullable=False)
    customer_name = Column(String(255), nullable=True)
    amount_due = Column(Integer, nullable=False)    # paisa — original credit amount
    amount_paid = Column(Integer, default=0)        # paisa — total paid so far
    due_date = Column(DateTime(timezone=True), nullable=True)
    notes = Column(String(500), nullable=True)
    status = Column(
        Enum(KhataStatus, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=KhataStatus.ACTIVE,
    )
    transaction_id = Column(UUID(as_uuid=True), ForeignKey("transactions.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    merchant = relationship("Merchant")
    transaction = relationship("Transaction")
