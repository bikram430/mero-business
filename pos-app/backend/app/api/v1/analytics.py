"""
Analytics endpoint — sales intelligence for the merchant dashboard.
Covers: hourly breakdown, top products, stock velocity, payment mix.
"""
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import func, extract
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_merchant
from app.models.merchant import Merchant
from app.models.transaction import Transaction, TransactionStatus, PaymentMethod, ReceiptItem
from app.models.product import Product

router = APIRouter()


# ── Schemas ────────────────────────────────────────────────────────────────────

class HourlyStat(BaseModel):
    hour: int
    count: int
    revenue: int


class DayStat(BaseModel):
    day: int       # 0=Mon … 6=Sun
    count: int
    revenue: int


class ProductStat(BaseModel):
    product_name: str
    category: Optional[str]
    total_qty: int
    total_revenue: int


class StockAlert(BaseModel):
    product_name: str
    category: Optional[str]
    stock_qty: int
    revenue_30d: int
    units_sold_30d: int
    velocity_per_day: float
    days_remaining: Optional[float]
    restock_by: Optional[str]
    urgency: str   # "critical" | "low" | "ok"


class AnalyticsResponse(BaseModel):
    period: str
    total_revenue: int
    total_orders: int
    avg_order_value: int
    peak_hour: Optional[int]
    peak_day: Optional[int]
    hourly_stats: List[HourlyStat]
    day_stats: List[DayStat]
    top_by_revenue: List[ProductStat]
    top_by_qty: List[ProductStat]
    cash_revenue: int
    digital_revenue: int
    khata_revenue: int
    stock_alerts: List[StockAlert]


# ── Endpoint ───────────────────────────────────────────────────────────────────

@router.get("", response_model=AnalyticsResponse)
def get_analytics(
    period: str = Query("month", enum=["today", "week", "month"]),
    merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    if period == "today":
        start = today_start
    elif period == "week":
        start = today_start - timedelta(days=7)
    else:
        start = today_start - timedelta(days=30)

    thirty_start = today_start - timedelta(days=30)

    def _paid(q):
        return q.filter(
            Transaction.merchant_id == merchant.id,
            Transaction.payment_status == TransactionStatus.PAID,
        )

    base_q = _paid(db.query(Transaction)).filter(Transaction.created_at >= start)

    # ── Summary ────────────────────────────────────────────────────────────────
    total_revenue = base_q.with_entities(func.sum(Transaction.total_amount)).scalar() or 0
    total_orders = base_q.count()
    avg_order_value = total_revenue // total_orders if total_orders else 0

    cash_revenue = (
        base_q.filter(Transaction.payment_method == PaymentMethod.CASH)
        .with_entities(func.sum(Transaction.total_amount)).scalar() or 0
    )
    khata_revenue = (
        base_q.filter(Transaction.payment_method == PaymentMethod.KHATA)
        .with_entities(func.sum(Transaction.total_amount)).scalar() or 0
    )
    digital_revenue = max(0, total_revenue - cash_revenue - khata_revenue)

    # ── Hourly breakdown ───────────────────────────────────────────────────────
    hourly_rows = (
        db.query(
            extract("hour", Transaction.created_at).label("hour"),
            func.count(Transaction.id).label("count"),
            func.sum(Transaction.total_amount).label("revenue"),
        )
        .filter(
            Transaction.merchant_id == merchant.id,
            Transaction.payment_status == TransactionStatus.PAID,
            Transaction.created_at >= start,
        )
        .group_by(extract("hour", Transaction.created_at))
        .order_by(extract("hour", Transaction.created_at))
        .all()
    )

    hourly_map = {int(r.hour): (r.count, r.revenue or 0) for r in hourly_rows}
    hourly_stats = [
        HourlyStat(hour=h, count=hourly_map.get(h, (0, 0))[0], revenue=hourly_map.get(h, (0, 0))[1])
        for h in range(24)
    ]
    peak_hour = max(hourly_stats, key=lambda x: x.revenue).hour if any(h.revenue > 0 for h in hourly_stats) else None

    # ── Day-of-week breakdown ──────────────────────────────────────────────────
    # PostgreSQL DOW: 0=Sun,1=Mon,...,6=Sat — remap to 0=Mon..6=Sun
    day_rows = (
        db.query(
            extract("dow", Transaction.created_at).label("dow"),
            func.count(Transaction.id).label("count"),
            func.sum(Transaction.total_amount).label("revenue"),
        )
        .filter(
            Transaction.merchant_id == merchant.id,
            Transaction.payment_status == TransactionStatus.PAID,
            Transaction.created_at >= start,
        )
        .group_by(extract("dow", Transaction.created_at))
        .all()
    )
    dow_map = {int(r.dow): (r.count, r.revenue or 0) for r in day_rows}
    # remap Sun=0 → 6, Mon=1 → 0, etc.
    day_stats = [
        DayStat(
            day=d,
            count=dow_map.get((d + 1) % 7, (0, 0))[0],
            revenue=dow_map.get((d + 1) % 7, (0, 0))[1],
        )
        for d in range(7)
    ]
    peak_day = max(day_stats, key=lambda x: x.revenue).day if any(d.revenue > 0 for d in day_stats) else None

    # ── Top products ───────────────────────────────────────────────────────────
    def _top_products(order_col, limit=10):
        return (
            db.query(
                ReceiptItem.product_name,
                func.coalesce(Product.category, ReceiptItem.product_name).label("category"),
                func.sum(ReceiptItem.qty).label("total_qty"),
                func.sum(ReceiptItem.qty * ReceiptItem.unit_price).label("total_revenue"),
            )
            .join(Transaction, Transaction.id == ReceiptItem.transaction_id)
            .outerjoin(Product, Product.id == ReceiptItem.product_id)
            .filter(
                Transaction.merchant_id == merchant.id,
                Transaction.payment_status == TransactionStatus.PAID,
                Transaction.created_at >= start,
            )
            .group_by(ReceiptItem.product_name, Product.category)
            .order_by(order_col.desc())
            .limit(limit)
            .all()
        )

    rev_col = func.sum(ReceiptItem.qty * ReceiptItem.unit_price)
    qty_col = func.sum(ReceiptItem.qty)

    top_by_revenue = [
        ProductStat(product_name=r.product_name, category=r.category, total_qty=int(r.total_qty), total_revenue=int(r.total_revenue or 0))
        for r in _top_products(rev_col)
    ]
    top_by_qty = [
        ProductStat(product_name=r.product_name, category=r.category, total_qty=int(r.total_qty), total_revenue=int(r.total_revenue or 0))
        for r in _top_products(qty_col)
    ]

    # ── Stock velocity & restock alerts ────────────────────────────────────────
    products = (
        db.query(Product)
        .filter(Product.merchant_id == merchant.id, Product.is_active == True)
        .all()
    )

    # Single query for all product sales — avoids N+1 problem
    sales_rows = (
        db.query(
            ReceiptItem.product_id,
            func.coalesce(func.sum(ReceiptItem.qty), 0).label("total_qty"),
            func.coalesce(func.sum(ReceiptItem.qty * ReceiptItem.unit_price), 0).label("revenue"),
        )
        .join(Transaction, Transaction.id == ReceiptItem.transaction_id)
        .filter(
            Transaction.merchant_id == merchant.id,
            Transaction.payment_status == TransactionStatus.PAID,
            Transaction.created_at >= thirty_start,
            ReceiptItem.product_id.in_([p.id for p in products]),
        )
        .group_by(ReceiptItem.product_id)
        .all()
    )
    sales_map = {str(r.product_id): (int(r.total_qty), int(r.revenue)) for r in sales_rows}

    stock_alerts: List[StockAlert] = []
    for p in products:
        units_sold, revenue_30d = sales_map.get(str(p.id), (0, 0))
        velocity = round(units_sold / 30, 2)

        days_remaining: Optional[float] = None
        restock_by: Optional[str] = None
        urgency = "ok"

        if p.stock_qty is not None:
            if velocity > 0:
                days_remaining = round(p.stock_qty / velocity, 1)
                if days_remaining <= 3:
                    urgency = "critical"
                elif days_remaining <= 7:
                    urgency = "low"
                restock_date = now + timedelta(days=max(0, (days_remaining or 0) - 1))
                if days_remaining < 14:
                    restock_by = restock_date.strftime("%Y-%m-%d")
            elif p.stock_qty < 5:
                urgency = "low"

        # Only include products with sales or with tracked stock
        if revenue_30d > 0 or p.stock_qty is not None:
            stock_alerts.append(StockAlert(
                product_name=p.name,
                category=p.category,
                stock_qty=p.stock_qty if p.stock_qty is not None else -1,
                revenue_30d=revenue_30d,
                units_sold_30d=units_sold,
                velocity_per_day=velocity,
                days_remaining=days_remaining,
                restock_by=restock_by,
                urgency=urgency,
            ))

    stock_alerts.sort(key=lambda x: (
        0 if x.urgency == "critical" else 1 if x.urgency == "low" else 2,
        -(x.revenue_30d)
    ))

    return AnalyticsResponse(
        period=period,
        total_revenue=total_revenue,
        total_orders=total_orders,
        avg_order_value=avg_order_value,
        peak_hour=peak_hour,
        peak_day=peak_day,
        hourly_stats=hourly_stats,
        day_stats=day_stats,
        top_by_revenue=top_by_revenue,
        top_by_qty=top_by_qty,
        cash_revenue=cash_revenue,
        digital_revenue=digital_revenue,
        khata_revenue=khata_revenue,
        stock_alerts=stock_alerts,
    )
