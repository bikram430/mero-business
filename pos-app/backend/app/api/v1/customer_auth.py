import re
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token
from app.core.rate_limit import check_login_not_locked, record_login_failure, clear_login_failures
from app.models.customer import Customer
from app.schemas.auth import TokenResponse

router = APIRouter()


class CustomerRegisterRequest(BaseModel):
    phone: str
    name: Optional[str] = None
    password: str

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        cleaned = re.sub(r"\D", "", v)
        if not re.match(r"^(98|97)\d{8}$", cleaned):
            raise ValueError("Valid Nepal mobile number chahincha (98xxxxxxxx)")
        return cleaned

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password kam se kam 8 characters hunu parcha")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password ma kam se kam ek number hunu parcha")
        return v


class CustomerLoginRequest(BaseModel):
    phone: str
    password: str

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        cleaned = re.sub(r"\D", "", v)
        if not re.match(r"^(98|97)\d{8}$", cleaned):
            raise ValueError("Valid Nepal mobile number chahincha (98xxxxxxxx)")
        return cleaned


class CustomerResponse(BaseModel):
    id: uuid.UUID
    phone: str
    name: Optional[str]

    class Config:
        from_attributes = True


@router.post("/register", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def register(payload: CustomerRegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(Customer).filter(Customer.phone == payload.phone).first()
    if existing:
        if existing.password_hash:
            raise HTTPException(status_code=400, detail="Phone number already registered")
        # Merchant-created customer — add password to their account
        existing.password_hash = hash_password(payload.password)
        if payload.name:
            existing.name = payload.name
        db.commit()
        db.refresh(existing)
        return existing

    customer = Customer(
        phone=payload.phone,
        name=payload.name,
        password_hash=hash_password(payload.password),
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


@router.post("/login", response_model=TokenResponse)
def login(payload: CustomerLoginRequest, db: Session = Depends(get_db)):
    check_login_not_locked(payload.phone)

    customer = db.query(Customer).filter(Customer.phone == payload.phone).first()
    if not customer or not customer.password_hash or not verify_password(payload.password, customer.password_hash):
        record_login_failure(payload.phone)
        raise HTTPException(status_code=401, detail="Phone number ya password mildaina")
    if not customer.is_active:
        raise HTTPException(status_code=403, detail="Account suspended")

    clear_login_failures(payload.phone)
    return TokenResponse(
        access_token=create_access_token(str(customer.id), role="customer"),
        refresh_token=create_refresh_token(str(customer.id), role="customer"),
    )
