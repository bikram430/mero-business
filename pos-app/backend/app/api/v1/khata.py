"""Khata API — Phase 3 buy-now-pay-later credit system."""
import re
from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_merchant
from app.models.merchant import Merchant
from app.models.khata import Khata, KhataStatus

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class CreateKhataRequest(BaseModel):
    customer_phone: str
    customer_name: Optional[str] = None
    amount_due: int          # paisa
    due_date: Optional[str] = None   # ISO date string
    notes: Optional[str] = None
    transaction_id: Optional[UUID] = None

    @field_validator("customer_phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        cleaned = re.sub(r"\D", "", v)
        if not re.match(r"^(98|97)\d{8}$", cleaned):
            raise ValueError("Valid Nepal mobile number chahincha")
        return cleaned

    @field_validator("amount_due")
    @classmethod
    def validate_amount(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("Amount must be greater than zero")
        return v


class RecordPaymentRequest(BaseModel):
    amount_paid: int    # paisa being paid now


class KhataResponse(BaseModel):
    id: UUID
    customer_phone: str
    customer_name: Optional[str]
    amount_due: int
    amount_paid: int
    amount_remaining: int
    due_date: Optional[str]
    notes: Optional[str]
    status: KhataStatus
    created_at: Optional[str]

    class Config:
        from_attributes = True


class KhataSummaryResponse(BaseModel):
    total_active: int
    total_amount_due: int      # paisa
    total_amount_paid: int     # paisa
    total_outstanding: int     # paisa
    khata_list: List[KhataResponse]


# ── Helpers ───────────────────────────────────────────────────────────────────

def _to_response(k: Khata) -> KhataResponse:
    return KhataResponse(
        id=k.id,
        customer_phone=k.customer_phone,
        customer_name=k.customer_name,
        amount_due=k.amount_due,
        amount_paid=k.amount_paid,
        amount_remaining=max(0, k.amount_due - k.amount_paid),
        due_date=k.due_date.isoformat() if k.due_date else None,
        notes=k.notes,
        status=k.status,
        created_at=k.created_at.isoformat() if k.created_at else None,
    )


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("", response_model=KhataSummaryResponse)
def list_khata(
    status_filter: Optional[str] = None,
    merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db),
):
    q = db.query(Khata).filter(Khata.merchant_id == merchant.id)
    if status_filter:
        q = q.filter(Khata.status == status_filter)
    entries = q.order_by(Khata.created_at.desc()).all()

    active = [e for e in entries if e.status != KhataStatus.PAID]
    return KhataSummaryResponse(
        total_active=len(active),
        total_amount_due=sum(e.amount_due for e in active),
        total_amount_paid=sum(e.amount_paid for e in active),
        total_outstanding=sum(max(0, e.amount_due - e.amount_paid) for e in active),
        khata_list=[_to_response(e) for e in entries],
    )


@router.post("", response_model=KhataResponse, status_code=status.HTTP_201_CREATED)
def create_khata(
    payload: CreateKhataRequest,
    merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db),
):
    due_dt = None
    if payload.due_date:
        try:
            due_dt = datetime.fromisoformat(payload.due_date).replace(tzinfo=timezone.utc)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid due_date format — use ISO format")

    entry = Khata(
        merchant_id=merchant.id,
        customer_phone=payload.customer_phone,
        customer_name=payload.customer_name,
        amount_due=payload.amount_due,
        due_date=due_dt,
        notes=payload.notes,
        transaction_id=payload.transaction_id,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return _to_response(entry)


@router.post("/{khata_id}/pay", response_model=KhataResponse)
def record_payment(
    khata_id: UUID,
    payload: RecordPaymentRequest,
    merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db),
):
    entry = db.query(Khata).filter(
        Khata.id == khata_id,
        Khata.merchant_id == merchant.id,
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Khata entry not found")
    if entry.status == KhataStatus.PAID:
        raise HTTPException(status_code=400, detail="Already fully paid")

    remaining = entry.amount_due - entry.amount_paid
    if payload.amount_paid > remaining:
        raise HTTPException(
            status_code=400,
            detail=f"Paying more than owed — remaining is {remaining} paisa",
        )

    entry.amount_paid += payload.amount_paid
    if entry.amount_paid >= entry.amount_due:
        entry.status = KhataStatus.PAID
    elif entry.amount_paid > 0:
        entry.status = KhataStatus.PARTIAL

    db.commit()
    db.refresh(entry)
    return _to_response(entry)


@router.delete("/{khata_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_khata(
    khata_id: UUID,
    merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db),
):
    entry = db.query(Khata).filter(
        Khata.id == khata_id,
        Khata.merchant_id == merchant.id,
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Khata entry not found")
    db.delete(entry)
    db.commit()
