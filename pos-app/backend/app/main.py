from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.v1 import auth, products, transactions, dashboard, analytics, customer_auth, customer_profile, receipts, khata, stores

app = FastAPI(
    title="Mero Business API",
    description="POS and digital receipt platform for Nepal",
    version="1.0.0",
    docs_url=None if settings.ENVIRONMENT == "production" else "/docs",
    redoc_url=None if settings.ENVIRONMENT == "production" else "/redoc",
    openapi_url=None if settings.ENVIRONMENT == "production" else "/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(products.router, prefix="/products", tags=["products"])
app.include_router(transactions.router, prefix="/transactions", tags=["transactions"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
app.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
app.include_router(customer_auth.router, prefix="/auth/customer", tags=["customer-auth"])
app.include_router(customer_profile.router, prefix="/customer", tags=["customer-profile"])
app.include_router(receipts.router, prefix="/receipts", tags=["receipts"])
app.include_router(khata.router, prefix="/khata", tags=["khata"])
app.include_router(stores.router, prefix="/stores", tags=["stores"])


@app.get("/health")
def health():
    return {"status": "ok", "service": "mero-business-api"}
