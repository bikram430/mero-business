from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.core.rate_limit import check_login_not_locked, record_login_failure, clear_login_failures
from app.models.merchant import Merchant
from app.schemas.auth import (
    MerchantRegisterRequest, MerchantLoginRequest,
    TokenResponse, RefreshRequest, MerchantResponse,
)
from app.api.deps import get_current_merchant

router = APIRouter()


@router.get("/me", response_model=MerchantResponse)
def get_me(merchant: Merchant = Depends(get_current_merchant)):
    return merchant


@router.post("/register", response_model=MerchantResponse, status_code=status.HTTP_201_CREATED)
def register(payload: MerchantRegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(Merchant).filter(Merchant.phone == payload.phone).first()
    if existing:
        raise HTTPException(status_code=400, detail="Phone number already registered")

    merchant = Merchant(
        name=payload.name,
        phone=payload.phone,
        password_hash=hash_password(payload.password),
        address=payload.address,
        type=payload.type,
    )
    db.add(merchant)
    db.commit()
    db.refresh(merchant)
    return merchant


@router.post("/login", response_model=TokenResponse)
def login(payload: MerchantLoginRequest, db: Session = Depends(get_db)):
    # Check lockout before hitting DB — prevents timing oracle attacks
    check_login_not_locked(payload.phone)

    merchant = db.query(Merchant).filter(Merchant.phone == payload.phone).first()
    if not merchant or not verify_password(payload.password, merchant.password_hash):
        record_login_failure(payload.phone)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid phone or password")
    if not merchant.is_active:
        raise HTTPException(status_code=403, detail="Account suspended — contact support")

    clear_login_failures(payload.phone)
    return TokenResponse(
        access_token=create_access_token(str(merchant.id)),
        refresh_token=create_refresh_token(str(merchant.id)),
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(payload: RefreshRequest, db: Session = Depends(get_db)):
    token_data = decode_token(payload.refresh_token)
    if not token_data or token_data.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    merchant = db.query(Merchant).filter(Merchant.id == token_data["sub"], Merchant.is_active == True).first()
    if not merchant:
        raise HTTPException(status_code=401, detail="Merchant not found")

    return TokenResponse(
        access_token=create_access_token(str(merchant.id)),
        refresh_token=create_refresh_token(str(merchant.id)),
    )
