import uuid
from enum import Enum as PyEnum

from sqlalchemy import Column, String, Enum, Boolean, DateTime, Float, Text, Integer, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class MerchantType(str, PyEnum):
    RETAIL = "retail"
    RESTAURANT = "restaurant"


class Merchant(Base):
    __tablename__ = "merchants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    phone = Column(String(20), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    address = Column(String(500), nullable=True)
    type = Column(Enum(MerchantType, values_callable=lambda x: [e.value for e in x]), nullable=False, default=MerchantType.RETAIL)
    is_active = Column(Boolean, default=True)
    phone_verified = Column(Boolean, default=False)
    # Public store profile
    description = Column(Text, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    is_public = Column(Boolean, default=False)      # merchant opts in to be discoverable
    avg_rating = Column(Float, nullable=True)
    rating_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    products = relationship("Product", back_populates="merchant", lazy="dynamic")
    transactions = relationship("Transaction", back_populates="merchant", lazy="dynamic")
