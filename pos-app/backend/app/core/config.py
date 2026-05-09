import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    REDIS_URL: str = "redis://localhost:6379"
    ENVIRONMENT: str = "development"   # "development" | "production"

    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Rate limiting (requests enforced at Nginx; these are app-level guards)
    LOGIN_MAX_ATTEMPTS: int = 5
    OTP_MAX_PER_HOUR: int = 3

    # Nepal payment gateways
    ESEWA_MERCHANT_CODE: str = ""
    ESEWA_SECRET_KEY: str = ""
    FONEPAY_MERCHANT_CODE: str = ""
    FONEPAY_SECRET_KEY: str = ""

    # SMS (Sparrow SMS — Nepal-based)
    SPARROW_SMS_TOKEN: str = ""
    SPARROW_SMS_SENDER: str = "MeroBiz"

    # WhatsApp (Twilio or 360dialog)
    WHATSAPP_API_URL: str = ""
    WHATSAPP_API_TOKEN: str = ""

    # Cloudflare R2 (receipt storage)
    CF_R2_BUCKET: str = ""
    CF_R2_ACCESS_KEY: str = ""
    CF_R2_SECRET_KEY: str = ""
    CF_R2_ENDPOINT: str = ""

    # CORS — merchant portal and customer app only; never ["*"] in production
    ALLOWED_ORIGINS: list[str] = [
        "https://merchant.merobusiness.com.np",
        "https://merobusiness.com.np",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
