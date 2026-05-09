import re
import uuid
from typing import Optional

from pydantic import BaseModel, field_validator

from app.models.merchant import MerchantType


class MerchantRegisterRequest(BaseModel):
    name: str
    phone: str
    password: str
    address: Optional[str] = None
    type: MerchantType = MerchantType.RETAIL

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        cleaned = re.sub(r"\D", "", v)
        if not re.match(r"^(98|97)\d{8}$", cleaned):
            raise ValueError("Must be a valid Nepal mobile number (98xxxxxxxx or 97xxxxxxxx)")
        return cleaned

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one number")
        return v


class MerchantLoginRequest(BaseModel):
    phone: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class OTPVerifyRequest(BaseModel):
    phone: str
    otp: str


class MerchantResponse(BaseModel):
    id: uuid.UUID
    name: str
    phone: str
    address: Optional[str]
    type: MerchantType
    phone_verified: bool

    class Config:
        from_attributes = True
