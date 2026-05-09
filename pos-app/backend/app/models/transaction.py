import uuid
from enum import Enum as PyEnum

from sqlalchemy import Column, String, Integer, Enum, DateTime, ForeignKey, func, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class PaymentMethod(str, PyEnum):
    CASH = "cash"
    ESEWA = "esewa"
    FONEPAY = "fonepay"
    KHALTI = "khalti"
    KHATA = "khata"      # buy-now-pay-later (Phase 3)


class TransactionStatus(str, PyEnum):
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"
    CANCELLED = "cancelled"


class Transaction(Base):
    __tablename__ = "transactions"
    __table_args__ = (
        # Critical indexes from PDF — add from day one
        Index("idx_tx_merchant", "merchant_id"),
        Index("idx_tx_created", "created_at"),
        Index("idx_tx_status", "payment_status"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    merchant_id = Column(UUID(as_uuid=True), ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id", ondelete="SET NULL"), nullable=True)
    customer_phone = Column(String(20), nullable=True)    # captured at checkout even without account
    total_amount = Column(Integer, nullable=False)        # paisa
    discount_amount = Column(Integer, default=0)         # paisa
    payment_method = Column(Enum(PaymentMethod, values_callable=lambda x: [e.value for e in x]), nullable=False)
    payment_status = Column(Enum(TransactionStatus, values_callable=lambda x: [e.value for e in x]), nullable=False, default=TransactionStatus.PENDING)
    table_number = Column(String(20), nullable=True)    # restaurant: table 1, 2, ...
    idempotency_key = Column(String(100), unique=True, nullable=True)
    gateway_ref = Column(String(255), nullable=True)     # eSewa / Fonepay reference
    receipt_url = Column(String(500), nullable=True)     # Cloudflare R2 URL
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    merchant = relationship("Merchant", back_populates="transactions")
    customer = relationship("Customer", back_populates="transactions")
    items = relationship("ReceiptItem", back_populates="transaction", cascade="all, delete-orphan")


class ReceiptItem(Base):
    __tablename__ = "receipt_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    transaction_id = Column(UUID(as_uuid=True), ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    product_name = Column(String(255), nullable=False)   # snapshot — product may be edited later
    qty = Column(Integer, nullable=False)
    unit_price = Column(Integer, nullable=False)         # paisa at time of sale

    transaction = relationship("Transaction", back_populates="items")
    product = relationship("Product", back_populates="receipt_items")
