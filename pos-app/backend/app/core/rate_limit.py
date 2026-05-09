"""
Redis-based rate limiting for authentication endpoints.

Rules (from PDF security diagram):
  - Login:     max 5 failed attempts per phone per 10 minutes → 30-minute lockout
  - OTP send:  max 3 requests per phone per 60 minutes
  - Payment:   max 20 per minute per merchant (enforced separately in transactions)

Redis keys:
  rl:login_fail:<phone>   → incremented counter, TTL 10 min; if ≥5 → lock key written
  rl:login_lock:<phone>   → exists = locked, TTL 30 min
  rl:otp:<phone>          → counter, TTL 60 min
"""
import redis
from fastapi import HTTPException, Request, status

from .config import settings

_pool = redis.ConnectionPool.from_url(settings.REDIS_URL, decode_responses=True)


def _get_redis() -> redis.Redis:
    return redis.Redis(connection_pool=_pool)


# ── Login brute-force guard ───────────────────────────────────────────────────

FAIL_WINDOW_SEC = 10 * 60   # 10 minutes
LOCK_DURATION_SEC = 30 * 60  # 30 minutes
MAX_FAILS = 5


def check_login_not_locked(phone: str) -> None:
    r = _get_redis()
    if r.exists(f"rl:login_lock:{phone}"):
        ttl = r.ttl(f"rl:login_lock:{phone}")
        mins = max(1, ttl // 60)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Dherai attempts — {mins} minute(s) pachi pheri koshish garna",
        )


def record_login_failure(phone: str) -> None:
    r = _get_redis()
    fail_key = f"rl:login_fail:{phone}"
    count = r.incr(fail_key)
    if count == 1:
        r.expire(fail_key, FAIL_WINDOW_SEC)
    if count >= MAX_FAILS:
        r.setex(f"rl:login_lock:{phone}", LOCK_DURATION_SEC, "1")
        r.delete(fail_key)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="5 galat koshish — account 30 minutes ko lagi lock bhayo",
        )


def clear_login_failures(phone: str) -> None:
    """Call on successful login to reset the failure counter."""
    r = _get_redis()
    r.delete(f"rl:login_fail:{phone}")


# ── OTP rate guard ────────────────────────────────────────────────────────────

OTP_WINDOW_SEC = 60 * 60   # 1 hour
MAX_OTP_PER_HOUR = 3


def check_otp_rate(phone: str) -> None:
    r = _get_redis()
    key = f"rl:otp:{phone}"
    count = r.incr(key)
    if count == 1:
        r.expire(key, OTP_WINDOW_SEC)
    if count > MAX_OTP_PER_HOUR:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="OTP limit reached — 1 ghanta pachi pheri koshish garna",
        )


# ── Payment rate guard ────────────────────────────────────────────────────────

PAYMENT_WINDOW_SEC = 60
MAX_PAYMENTS_PER_MIN = 20


def check_payment_rate(merchant_id: str) -> None:
    r = _get_redis()
    key = f"rl:pay:{merchant_id}"
    count = r.incr(key)
    if count == 1:
        r.expire(key, PAYMENT_WINDOW_SEC)
    if count > MAX_PAYMENTS_PER_MIN:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many transactions — ek minute pachi pheri koshish garna",
        )
