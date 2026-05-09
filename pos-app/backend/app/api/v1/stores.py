"""
Public store discovery API — no merchant auth required for browsing.
Merchants auth required for: updating their profile/location, managing offers, viewing orders.
"""
import math
import re
from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel, field_validator
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.rate_limit import _get_redis
from app.api.deps import get_current_merchant, get_current_customer
from app.models.customer import Customer
from app.models.merchant import Merchant
from app.models.product import Product
from app.models.store import StoreRating, Offer, CollectOrder, CollectOrderItem, CollectOrderStatus

router = APIRouter()


# ── Haversine distance ─────────────────────────────────────────────────────────

def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ── Schemas ────────────────────────────────────────────────────────────────────

class OfferOut(BaseModel):
    id: UUID
    title: str
    description: Optional[str]
    discount_percent: Optional[int]
    discount_flat: Optional[int]
    valid_until: Optional[str]

    class Config:
        from_attributes = True


class StoreListItem(BaseModel):
    id: UUID
    name: str
    address: Optional[str]
    description: Optional[str]
    type: str
    avg_rating: Optional[float]
    rating_count: int
    distance_km: Optional[float]
    active_offers: List[OfferOut]


class ProductOut(BaseModel):
    id: UUID
    name: str
    price: int
    category: Optional[str]
    stock_qty: Optional[int]

    class Config:
        from_attributes = True


class StoreDetail(BaseModel):
    id: UUID
    name: str
    address: Optional[str]
    description: Optional[str]
    type: str
    avg_rating: Optional[float]
    rating_count: int
    products: List[ProductOut]
    active_offers: List[OfferOut]


class RatingRequest(BaseModel):
    rating: int
    review: Optional[str] = None

    @field_validator("rating")
    @classmethod
    def check_rating(cls, v: int) -> int:
        if not 1 <= v <= 5:
            raise ValueError("Rating must be 1–5")
        return v

    @field_validator("review")
    @classmethod
    def check_review_length(cls, v: Optional[str]) -> Optional[str]:
        if v and len(v) > 500:
            raise ValueError("Review must be 500 characters or less")
        return v


class CollectItemRequest(BaseModel):
    product_id: UUID
    qty: int

    @field_validator("qty")
    @classmethod
    def check_qty(cls, v: int) -> int:
        if v <= 0 or v > 100:
            raise ValueError("Quantity must be between 1 and 100")
        return v


class CollectOrderRequest(BaseModel):
    customer_phone: str
    customer_name: Optional[str] = None
    items: List[CollectItemRequest]
    notes: Optional[str] = None

    @field_validator("customer_phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        cleaned = re.sub(r"\D", "", v)
        if not re.match(r"^(98|97)\d{8}$", cleaned):
            raise ValueError("Valid Nepal mobile number chahincha (98xxxxxxxx)")
        return cleaned

    @field_validator("notes")
    @classmethod
    def check_notes_length(cls, v: Optional[str]) -> Optional[str]:
        if v and len(v) > 300:
            raise ValueError("Notes must be 300 characters or less")
        return v


class CollectOrderOut(BaseModel):
    id: UUID
    customer_phone: str
    customer_name: Optional[str]
    total_amount: int
    status: str
    notes: Optional[str]
    created_at: Optional[str]
    items: List[dict]

    class Config:
        from_attributes = True


class UpdateLocationRequest(BaseModel):
    latitude: float
    longitude: float
    description: Optional[str] = None
    is_public: bool = True


class OfferCreateRequest(BaseModel):
    title: str
    description: Optional[str] = None
    discount_percent: Optional[int] = None
    discount_flat: Optional[int] = None
    valid_until: Optional[str] = None

    @field_validator("title")
    @classmethod
    def check_title(cls, v: str) -> str:
        if len(v) > 100:
            raise ValueError("Title must be 100 characters or less")
        return v.strip()

    @field_validator("description")
    @classmethod
    def check_description(cls, v: Optional[str]) -> Optional[str]:
        if v and len(v) > 500:
            raise ValueError("Description must be 500 characters or less")
        return v

    @field_validator("discount_percent")
    @classmethod
    def check_discount_percent(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and not 1 <= v <= 100:
            raise ValueError("Discount percent must be 1–100")
        return v

    @field_validator("discount_flat")
    @classmethod
    def check_discount_flat(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v <= 0:
            raise ValueError("Flat discount must be greater than zero")
        return v


# ── Helpers ────────────────────────────────────────────────────────────────────

def _active_offers(merchant_id, db: Session) -> List[Offer]:
    now = datetime.now(timezone.utc)
    return (
        db.query(Offer)
        .filter(
            Offer.merchant_id == merchant_id,
            Offer.is_active == True,
        )
        .filter((Offer.valid_until == None) | (Offer.valid_until > now))
        .all()
    )


def _offer_out(o: Offer) -> OfferOut:
    return OfferOut(
        id=o.id,
        title=o.title,
        description=o.description,
        discount_percent=o.discount_percent,
        discount_flat=o.discount_flat,
        valid_until=o.valid_until.isoformat() if o.valid_until else None,
    )


# ── Public: browse stores ──────────────────────────────────────────────────────

@router.get("", response_model=List[StoreListItem])
def list_stores(
    lat: Optional[float] = Query(None),
    lng: Optional[float] = Query(None),
    db: Session = Depends(get_db),
):
    merchants = db.query(Merchant).filter(
        Merchant.is_public == True,
        Merchant.is_active == True,
    ).all()

    results = []
    for m in merchants:
        dist = None
        if lat is not None and lng is not None and m.latitude and m.longitude:
            dist = round(haversine_km(lat, lng, m.latitude, m.longitude), 2)
        offers = _active_offers(m.id, db)
        results.append(StoreListItem(
            id=m.id,
            name=m.name,
            address=m.address,
            description=m.description,
            type=m.type.value if hasattr(m.type, "value") else str(m.type),
            avg_rating=m.avg_rating,
            rating_count=m.rating_count or 0,
            distance_km=dist,
            active_offers=[_offer_out(o) for o in offers],
        ))

    if lat is not None:
        results.sort(key=lambda x: x.distance_km if x.distance_km is not None else 9999)
    return results


@router.get("/nearby", response_model=List[StoreListItem])
def nearby_stores(
    lat: float = Query(..., description="Customer latitude"),
    lng: float = Query(..., description="Customer longitude"),
    radius_km: float = Query(5.0, ge=0.5, le=50),
    db: Session = Depends(get_db),
):
    merchants = db.query(Merchant).filter(
        Merchant.is_public == True,
        Merchant.is_active == True,
        Merchant.latitude != None,
        Merchant.longitude != None,
    ).all()

    results = []
    for m in merchants:
        dist = haversine_km(lat, lng, m.latitude, m.longitude)
        if dist <= radius_km:
            offers = _active_offers(m.id, db)
            results.append(StoreListItem(
                id=m.id,
                name=m.name,
                address=m.address,
                description=m.description,
                type=m.type.value if hasattr(m.type, "value") else str(m.type),
                avg_rating=m.avg_rating,
                rating_count=m.rating_count or 0,
                distance_km=round(dist, 2),
                active_offers=[_offer_out(o) for o in offers],
            ))

    results.sort(key=lambda x: x.distance_km or 0)
    return results


@router.get("/{store_id}", response_model=StoreDetail)
def get_store(store_id: UUID, db: Session = Depends(get_db)):
    m = db.query(Merchant).filter(
        Merchant.id == store_id,
        Merchant.is_public == True,
        Merchant.is_active == True,
    ).first()
    if not m:
        raise HTTPException(status_code=404, detail="Store not found")

    products = (
        db.query(Product)
        .filter(Product.merchant_id == m.id, Product.is_active == True)
        .all()
    )
    offers = _active_offers(m.id, db)

    return StoreDetail(
        id=m.id,
        name=m.name,
        address=m.address,
        description=m.description,
        type=m.type.value if hasattr(m.type, "value") else str(m.type),
        avg_rating=m.avg_rating,
        rating_count=m.rating_count or 0,
        products=[ProductOut.model_validate(p) for p in products],
        active_offers=[_offer_out(o) for o in offers],
    )


@router.post("/{store_id}/rate", status_code=status.HTTP_201_CREATED)
def rate_store(
    store_id: UUID,
    payload: RatingRequest,
    customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db),
):
    """Requires customer auth — phone is taken from JWT, not request body."""
    m = db.query(Merchant).filter(Merchant.id == store_id, Merchant.is_public == True).first()
    if not m:
        raise HTTPException(status_code=404, detail="Store not found")

    # One rating per verified customer per store — update if exists
    existing = db.query(StoreRating).filter(
        StoreRating.merchant_id == store_id,
        StoreRating.customer_phone == customer.phone,
    ).first()

    if existing:
        existing.rating = payload.rating
        existing.review = payload.review
    else:
        db.add(StoreRating(
            merchant_id=store_id,
            customer_phone=customer.phone,
            rating=payload.rating,
            review=payload.review,
        ))

    # Recompute avg
    db.flush()
    stats = db.query(
        func.avg(StoreRating.rating),
        func.count(StoreRating.id),
    ).filter(StoreRating.merchant_id == store_id).one()
    m.avg_rating = round(float(stats[0]), 1) if stats[0] else None
    m.rating_count = stats[1] or 0

    db.commit()
    return {"message": "Rating submitted — shukriya!"}


# ── Public: click & collect ────────────────────────────────────────────────────

def _check_order_rate(request: Request) -> None:
    """Max 5 orders per IP per 10 minutes — prevents order flood attacks."""
    r = _get_redis()
    ip = request.client.host if request.client else "unknown"
    key = f"rl:order:{ip}"
    count = r.incr(key)
    if count == 1:
        r.expire(key, 10 * 60)
    if count > 5:
        raise HTTPException(status_code=429, detail="Too many orders — please wait before placing another")


@router.post("/{store_id}/collect", response_model=CollectOrderOut, status_code=status.HTTP_201_CREATED)
def place_collect_order(store_id: UUID, payload: CollectOrderRequest, request: Request, db: Session = Depends(get_db)):
    _check_order_rate(request)
    m = db.query(Merchant).filter(Merchant.id == store_id, Merchant.is_public == True).first()
    if not m:
        raise HTTPException(status_code=404, detail="Store not found")

    total = 0
    items_data = []
    for ci in payload.items:
        product = db.query(Product).filter(
            Product.id == ci.product_id,
            Product.merchant_id == store_id,
            Product.is_active == True,
        ).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {ci.product_id} not found in this store")
        if product.stock_qty is not None and product.stock_qty < ci.qty:
            raise HTTPException(status_code=400, detail=f"'{product.name}' ko stock kam cha")
        line = ci.qty * product.price
        total += line
        items_data.append({"product": product, "qty": ci.qty, "unit_price": product.price})

    order = CollectOrder(
        merchant_id=store_id,
        customer_phone=payload.customer_phone,
        customer_name=payload.customer_name,
        total_amount=total,
        notes=payload.notes,
        status=CollectOrderStatus.PENDING,
    )
    db.add(order)
    db.flush()

    for it in items_data:
        db.add(CollectOrderItem(
            order_id=order.id,
            product_id=it["product"].id,
            product_name=it["product"].name,
            unit_price=it["unit_price"],
            qty=it["qty"],
        ))

    db.commit()
    db.refresh(order)
    return _order_out(order)


# ── Merchant: manage their own store ──────────────────────────────────────────

class MerchantStoreProfile(BaseModel):
    id: UUID
    name: str
    address: Optional[str]
    description: Optional[str]
    type: str
    latitude: Optional[float]
    longitude: Optional[float]
    is_public: bool
    avg_rating: Optional[float]
    rating_count: int

    class Config:
        from_attributes = True


@router.get("/me", response_model=MerchantStoreProfile)
def get_my_store(
    merchant: Merchant = Depends(get_current_merchant),
):
    return MerchantStoreProfile(
        id=merchant.id,
        name=merchant.name,
        address=merchant.address,
        description=merchant.description,
        type=merchant.type.value if hasattr(merchant.type, "value") else str(merchant.type),
        latitude=merchant.latitude,
        longitude=merchant.longitude,
        is_public=merchant.is_public or False,
        avg_rating=merchant.avg_rating,
        rating_count=merchant.rating_count or 0,
    )


@router.put("/me/location")
def update_location(
    payload: UpdateLocationRequest,
    merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db),
):
    merchant.latitude = payload.latitude
    merchant.longitude = payload.longitude
    merchant.is_public = payload.is_public
    if payload.description is not None:
        merchant.description = payload.description
    db.commit()
    return {"message": "Location updated — store is now discoverable"}


@router.post("/me/offers", status_code=status.HTTP_201_CREATED)
def create_offer(
    payload: OfferCreateRequest,
    merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db),
):
    valid_dt = None
    if payload.valid_until:
        try:
            valid_dt = datetime.fromisoformat(payload.valid_until).replace(tzinfo=timezone.utc)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid valid_until — use ISO format")

    offer = Offer(
        merchant_id=merchant.id,
        title=payload.title,
        description=payload.description,
        discount_percent=payload.discount_percent,
        discount_flat=payload.discount_flat,
        valid_until=valid_dt,
    )
    db.add(offer)
    db.commit()
    db.refresh(offer)
    return _offer_out(offer)


@router.delete("/me/offers/{offer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_offer(
    offer_id: UUID,
    merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db),
):
    offer = db.query(Offer).filter(Offer.id == offer_id, Offer.merchant_id == merchant.id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    db.delete(offer)
    db.commit()


@router.get("/me/collect-orders", response_model=List[CollectOrderOut])
def list_collect_orders(
    status_filter: Optional[str] = None,
    merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db),
):
    q = db.query(CollectOrder).filter(CollectOrder.merchant_id == merchant.id)
    if status_filter:
        q = q.filter(CollectOrder.status == status_filter)
    orders = q.order_by(CollectOrder.created_at.asc()).all()  # FIFO: oldest first
    return [_order_out(o) for o in orders]


@router.put("/me/collect-orders/{order_id}/status")
def update_order_status(
    order_id: UUID,
    new_status: str = Query(...),
    merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db),
):
    valid = {s.value for s in CollectOrderStatus}
    if new_status not in valid:
        raise HTTPException(status_code=400, detail=f"Valid statuses: {valid}")

    order = db.query(CollectOrder).filter(
        CollectOrder.id == order_id,
        CollectOrder.merchant_id == merchant.id,
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.status = new_status
    db.commit()
    return {"message": f"Order marked as {new_status}"}


def _order_out(o: CollectOrder) -> CollectOrderOut:
    return CollectOrderOut(
        id=o.id,
        customer_phone=o.customer_phone,
        customer_name=o.customer_name,
        total_amount=o.total_amount,
        status=o.status,
        notes=o.notes,
        created_at=o.created_at.isoformat() if o.created_at else None,
        items=[
            {"product_name": i.product_name, "qty": i.qty, "unit_price": i.unit_price}
            for i in o.items
        ],
    )
