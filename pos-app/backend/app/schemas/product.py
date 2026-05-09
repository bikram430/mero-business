from typing import Optional
from uuid import UUID

from pydantic import BaseModel, field_validator


class ProductCreateRequest(BaseModel):
    name: str
    price: int
    barcode: Optional[str] = None
    stock_qty: Optional[int] = None
    category: Optional[str] = None
    description: Optional[str] = None

    @field_validator("price")
    @classmethod
    def validate_price(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("Price must be greater than zero")
        return v

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Product name cannot be empty")
        return v.strip()


class ProductUpdateRequest(BaseModel):
    name: Optional[str] = None
    price: Optional[int] = None
    barcode: Optional[str] = None
    stock_qty: Optional[int] = None
    category: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class ProductResponse(BaseModel):
    id: UUID
    merchant_id: UUID
    name: str
    price: int
    barcode: Optional[str]
    stock_qty: Optional[int]
    category: Optional[str]
    description: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True
