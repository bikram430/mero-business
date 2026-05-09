"""
Customer profile & verification endpoints.
OTP is stored in Redis with a 10-minute TTL.
In development the OTP is returned in the response body so you can test without SMS/email.
In production replace the _send_* stubs with your SMS/email provider.
"""
import hmac as hmac_lib
import secrets
import string
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

import redis as redis_lib

from app.core.database import get_db
from app.core.config import settings
from app.core.rate_limit import check_otp_rate
from app.api.deps import get_current_customer
from app.models.customer import Customer
from app.models.transaction import Transaction, TransactionStatus
from app.models.store import CollectOrder

router = APIRouter()

_pool = redis_lib.ConnectionPool.from_url(settings.REDIS_URL, decode_responses=True)


def _redis() -> redis_lib.Redis:
    return redis_lib.Redis(connection_pool=_pool)


OTP_TTL = 10 * 60       # 10 minutes
OTP_MAX_ATTEMPTS = 3    # wrong guesses before OTP is invalidated


def _generate_otp() -> str:
    return "".join(secrets.choice(string.digits) for _ in range(6))


def _store_otp(key: str, otp: str) -> None:
    r = _redis()
    r.setex(key, OTP_TTL, otp)
    r.delete(f"{key}:attempts")  # reset attempt counter on new OTP


def _verify_otp(key: str, otp: str) -> bool:
    r = _redis()
    stored = r.get(key)
    if not stored:
        return False

    # Track wrong attempts to prevent brute force of 6-digit code
    attempt_key = f"{key}:attempts"
    attempts = int(r.get(attempt_key) or 0)
    if attempts >= OTP_MAX_ATTEMPTS:
        r.delete(key)
        r.delete(attempt_key)
        return False

    # Timing-safe comparison
    if hmac_lib.compare_digest(stored, otp):
        r.delete(key)
        r.delete(attempt_key)
        return True

    r.incr(attempt_key)
    r.expire(attempt_key, OTP_TTL)
    return False


def _send_phone_otp(phone: str, otp: str) -> None:
    # TODO: integrate Sparrow SMS / Twilio for production
    pass


def _send_email_otp(email: str, otp: str) -> None:
    # TODO: integrate SendGrid / AWS SES for production
    pass


# ── Schemas ────────────────────────────────────────────────────────────────────

class ProfileResponse(BaseModel):
    id: str
    phone: str
    name: Optional[str]
    email: Optional[str]
    phone_verified: bool
    email_verified: bool

    class Config:
        from_attributes = True


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None


class OtpConfirmRequest(BaseModel):
    otp: str


class CustomerReceiptItem(BaseModel):
    product_name: str
    qty: int
    unit_price: int


class CustomerReceiptSummary(BaseModel):
    id: UUID
    merchant_name: str
    total_amount: int
    payment_method: str
    payment_status: str
    created_at: Optional[str]
    items: List[CustomerReceiptItem]


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.get("/me", response_model=ProfileResponse)
def get_profile(customer: Customer = Depends(get_current_customer)):
    return ProfileResponse(
        id=str(customer.id),
        phone=customer.phone,
        name=customer.name,
        email=customer.email,
        phone_verified=customer.phone_verified or False,
        email_verified=customer.email_verified or False,
    )


@router.put("/me", response_model=ProfileResponse)
def update_profile(
    payload: UpdateProfileRequest,
    customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db),
):
    if payload.name is not None:
        customer.name = payload.name.strip() or None
    if payload.email is not None:
        email = payload.email.strip().lower() or None
        if email and email != customer.email:
            # Reset email verification when email changes
            customer.email = email
            customer.email_verified = False
        elif not email:
            customer.email = None
            customer.email_verified = False
    db.commit()
    db.refresh(customer)
    return ProfileResponse(
        id=str(customer.id),
        phone=customer.phone,
        name=customer.name,
        email=customer.email,
        phone_verified=customer.phone_verified or False,
        email_verified=customer.email_verified or False,
    )


@router.post("/me/verify-phone/send")
def send_phone_otp(customer: Customer = Depends(get_current_customer)):
    if customer.phone_verified:
        raise HTTPException(status_code=400, detail="Phone already verified")
    check_otp_rate(customer.phone)
    otp = _generate_otp()
    _store_otp(f"otp:phone:{customer.id}", otp)
    _send_phone_otp(customer.phone, otp)
    resp: dict = {"message": f"OTP sent to {customer.phone}"}
    if settings.ENVIRONMENT != "production":
        resp["dev_otp"] = otp
    return resp


@router.post("/me/verify-phone/confirm")
def confirm_phone_otp(
    payload: OtpConfirmRequest,
    customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db),
):
    if customer.phone_verified:
        raise HTTPException(status_code=400, detail="Phone already verified")
    if not _verify_otp(f"otp:phone:{customer.id}", payload.otp):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    customer.phone_verified = True
    db.commit()
    return {"message": "Phone verified successfully"}


@router.post("/me/verify-email/send")
def send_email_otp(customer: Customer = Depends(get_current_customer)):
    if not customer.email:
        raise HTTPException(status_code=400, detail="Please add an email address first")
    if customer.email_verified:
        raise HTTPException(status_code=400, detail="Email already verified")
    check_otp_rate(customer.phone)
    otp = _generate_otp()
    _store_otp(f"otp:email:{customer.id}", otp)
    _send_email_otp(customer.email, otp)
    resp: dict = {"message": f"OTP sent to {customer.email}"}
    if settings.ENVIRONMENT != "production":
        resp["dev_otp"] = otp
    return resp


@router.post("/me/verify-email/confirm")
def confirm_email_otp(
    payload: OtpConfirmRequest,
    customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db),
):
    if customer.email_verified:
        raise HTTPException(status_code=400, detail="Email already verified")
    if not _verify_otp(f"otp:email:{customer.id}", payload.otp):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    customer.email_verified = True
    db.commit()
    return {"message": "Email verified successfully"}


@router.get("/receipts", response_model=List[CustomerReceiptSummary])
def get_customer_receipts(
    customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db),
):
    """Return paid receipts for the logged-in customer — matched by customer_id or phone."""
    txs = (
        db.query(Transaction)
        .options(joinedload(Transaction.merchant), joinedload(Transaction.items))
        .filter(
            or_(
                Transaction.customer_id == customer.id,
                Transaction.customer_phone == customer.phone,
            ),
            Transaction.payment_status == TransactionStatus.PAID,
        )
        .order_by(Transaction.created_at.desc())
        .limit(50)
        .all()
    )

    return [
        CustomerReceiptSummary(
            id=tx.id,
            merchant_name=tx.merchant.name if tx.merchant else "Unknown",
            total_amount=tx.total_amount,
            payment_method=tx.payment_method.value if hasattr(tx.payment_method, "value") else str(tx.payment_method),
            payment_status=tx.payment_status.value if hasattr(tx.payment_status, "value") else str(tx.payment_status),
            created_at=tx.created_at.isoformat() if tx.created_at else None,
            items=[
                CustomerReceiptItem(
                    product_name=item.product_name,
                    qty=item.qty,
                    unit_price=item.unit_price,
                )
                for item in tx.items
            ],
        )
        for tx in txs
    ]


# ── Customer: Click & Collect order tracking ───────────────────────────────────

class CustomerOrderItem(BaseModel):
    product_name: str
    qty: int
    unit_price: int


class CustomerOrderSummary(BaseModel):
    id: UUID
    store_name: str
    store_id: UUID
    total_amount: int
    status: str
    notes: Optional[str]
    created_at: Optional[str]
    items: List[CustomerOrderItem]


@router.get("/orders", response_model=List[CustomerOrderSummary])
def get_customer_orders(
    customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db),
):
    """Return Click & Collect orders placed by this customer — matched by phone."""
    from app.models.merchant import Merchant
    from sqlalchemy.orm import joinedload as jl

    orders = (
        db.query(CollectOrder)
        .options(jl(CollectOrder.items))
        .filter(CollectOrder.customer_phone == customer.phone)
        .order_by(CollectOrder.created_at.desc())
        .limit(50)
        .all()
    )

    merchant_ids = list({o.merchant_id for o in orders})
    merchants = {m.id: m for m in db.query(Merchant).filter(Merchant.id.in_(merchant_ids)).all()}

    return [
        CustomerOrderSummary(
            id=o.id,
            store_name=merchants[o.merchant_id].name if o.merchant_id in merchants else "Unknown",
            store_id=o.merchant_id,
            total_amount=o.total_amount,
            status=o.status,
            notes=o.notes,
            created_at=o.created_at.isoformat() if o.created_at else None,
            items=[
                CustomerOrderItem(product_name=i.product_name, qty=i.qty, unit_price=i.unit_price)
                for i in o.items
            ],
        )
        for o in orders
    ]
