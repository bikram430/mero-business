from datetime import datetime
from typing import Literal, Optional, List
from uuid import UUID

from pydantic import BaseModel, field_validator

from app.models.transaction import PaymentMethod, TransactionStatus


class SaleItem(BaseModel):
    product_id: UUID
    qty: int
    unit_price: int     # paisa — must match product price at time of sale

    @field_validator("qty")
    @classmethod
    def validate_qty(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("Quantity must be at least 1")
        return v

    @field_validator("unit_price")
    @classmethod
    def validate_unit_price(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("Unit price must be greater than zero")
        return v


class CreateTransactionRequest(BaseModel):
    merchant_id: Optional[UUID] = None   # Determined from JWT token
    items: List[SaleItem]
    payment_method: PaymentMethod
    customer_phone: Optional[str] = None
    discount_amount: int = 0
    table_number: Optional[str] = None
    idempotency_key: Optional[str] = None


class PaymentWebhookRequest(BaseModel):
    """Incoming webhook from eSewa or Fonepay — always server-verified before trusting."""
    transaction_id: str
    amount: int
    status: str
    signature: str
    gateway: str    # "esewa" | "fonepay"


class ReceiptItemResponse(BaseModel):
    product_name: str
    qty: int
    unit_price: int

    class Config:
        from_attributes = True


class TransactionResponse(BaseModel):
    id: UUID
    merchant_id: UUID
    total_amount: int
    discount_amount: int
    payment_method: PaymentMethod
    payment_status: TransactionStatus
    customer_phone: Optional[str]
    table_number: Optional[str]
    receipt_url: Optional[str]
    gateway_ref: Optional[str]
    created_at: Optional[datetime] = None
    items: List[ReceiptItemResponse]

    class Config:
        from_attributes = True


class SendReceiptRequest(BaseModel):
    channel: Literal["whatsapp", "sms"] = "whatsapp"
    phone: Optional[str] = None  # override — sends to this number if provided
