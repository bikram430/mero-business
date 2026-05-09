from datetime import datetime, timedelta, timezone
from typing import Optional
import hmac
import hashlib

from jose import JWTError, jwt
from passlib.context import CryptContext

from .config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(subject: str, role: str = "merchant") -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": subject, "exp": expire, "type": "access", "role": role}, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(subject: str, role: str = "merchant") -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    return jwt.encode({"sub": subject, "exp": expire, "type": "refresh", "role": role}, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None


def verify_esewa_hmac(data: str, signature: str) -> bool:
    """Verify eSewa webhook HMAC signature — never trust client payment claims."""
    if not settings.ESEWA_SECRET_KEY:
        return False
    expected = hmac.new(
        settings.ESEWA_SECRET_KEY.encode(),
        data.encode(),
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature.lower())


def verify_fonepay_hmac(data: str, signature: str) -> bool:
    """Verify Fonepay webhook HMAC signature."""
    if not settings.FONEPAY_SECRET_KEY:
        return False
    expected = hmac.new(
        settings.FONEPAY_SECRET_KEY.encode(),
        data.encode(),
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature.lower())
