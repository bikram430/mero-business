"""Customer-facing store models: ratings, offers, click & collect orders."""
import uuid
from enum import Enum as PyEnum

from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class StoreRating(Base):
    __tablename__ = "store_ratings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    merchant_id = Column(UUID(as_uuid=True), ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_phone = Column(String(20), nullable=False)
    rating = Column(Integer, nullable=False)        # 1–5
    review = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Offer(Base):
    __tablename__ = "offers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    merchant_id = Column(UUID(as_uuid=True), ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    discount_percent = Column(Integer, nullable=True)   # e.g. 20 = 20% off
    discount_flat = Column(Integer, nullable=True)      # paisa flat discount
    valid_until = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class CollectOrderStatus(str, PyEnum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    READY = "ready"
    COLLECTED = "collected"
    CANCELLED = "cancelled"


class CollectOrder(Base):
    __tablename__ = "collect_orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    merchant_id = Column(UUID(as_uuid=True), ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_phone = Column(String(20), nullable=False)
    customer_name = Column(String(255), nullable=True)
    total_amount = Column(Integer, nullable=False)      # paisa
    status = Column(
        String(20),
        nullable=False,
        default=CollectOrderStatus.PENDING,
    )
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    items = relationship("CollectOrderItem", back_populates="order", cascade="all, delete-orphan")


class CollectOrderItem(Base):
    __tablename__ = "collect_order_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("collect_orders.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    product_name = Column(String(255), nullable=False)
    unit_price = Column(Integer, nullable=False)    # paisa
    qty = Column(Integer, nullable=False)

    order = relationship("CollectOrder", back_populates="items")
