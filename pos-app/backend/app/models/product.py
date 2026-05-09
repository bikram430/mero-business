import uuid

from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    merchant_id = Column(UUID(as_uuid=True), ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    price = Column(Integer, nullable=False)     # stored in paisa (1 Rs = 100 paisa)
    barcode = Column(String(100), nullable=True, index=True)
    stock_qty = Column(Integer, nullable=True)
    category = Column(String(100), nullable=True)   # restaurant: Appetizer/Main/Drinks/Dessert
    description = Column(String(500), nullable=True)  # menu item description for restaurants
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    merchant = relationship("Merchant", back_populates="products")
    receipt_items = relationship("ReceiptItem", back_populates="product")
