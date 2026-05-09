from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_merchant
from app.models.merchant import Merchant
from app.models.transaction import Transaction, TransactionStatus, PaymentMethod
from app.schemas.dashboard import DashboardResponse, DailySummary, PnLSummary

router = APIRouter()


@router.get("", response_model=DashboardResponse)
def get_dashboard(
    merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=7)
    month_start = today_start.replace(day=1)

    base_q = db.query(Transaction).filter(
        Transaction.merchant_id == merchant.id,
        Transaction.payment_status == TransactionStatus.PAID,
    )

    def sum_amount(q):
        result = q.with_entities(func.sum(Transaction.total_amount)).scalar()
        return result or 0

    def count_tx(q):
        return q.count()

    def build_pnl(label: str, q) -> PnLSummary:
        revenue = sum_amount(q)
        count = count_tx(q)
        cash = sum_amount(q.filter(Transaction.payment_method == PaymentMethod.CASH))
        khata = sum_amount(q.filter(Transaction.payment_method == PaymentMethod.KHATA))
        digital = revenue - cash - khata
        return PnLSummary(
            period=label,
            revenue=revenue,
            transaction_count=count,
            avg_transaction=revenue // count if count else 0,
            cash_revenue=cash,
            digital_revenue=max(0, digital),
            khata_revenue=khata,
        )

    today_q = base_q.filter(Transaction.created_at >= today_start)
    week_q = base_q.filter(Transaction.created_at >= week_start)
    month_q = base_q.filter(Transaction.created_at >= month_start)

    cash_q = today_q.filter(Transaction.payment_method == PaymentMethod.CASH)
    digital_q = today_q.filter(Transaction.payment_method.notin_([PaymentMethod.CASH, PaymentMethod.KHATA]))

    # Last 7 days breakdown
    recent_days = []
    for i in range(7):
        day_start = today_start - timedelta(days=i)
        day_end = day_start + timedelta(days=1)
        day_q = base_q.filter(
            Transaction.created_at >= day_start,
            Transaction.created_at < day_end,
        )
        recent_days.append(DailySummary(
            date=day_start.date(),
            total_sales=sum_amount(day_q),
            transaction_count=count_tx(day_q),
            cash_sales=sum_amount(day_q.filter(Transaction.payment_method == PaymentMethod.CASH)),
            digital_sales=sum_amount(day_q.filter(Transaction.payment_method.notin_([PaymentMethod.CASH, PaymentMethod.KHATA]))),
        ))

    return DashboardResponse(
        today_total=sum_amount(today_q),
        today_transactions=count_tx(today_q),
        today_cash=sum_amount(cash_q),
        today_digital=sum_amount(digital_q),
        this_week_total=sum_amount(week_q),
        this_month_total=sum_amount(month_q),
        recent_days=recent_days,
        pnl=[
            build_pnl("today", today_q),
            build_pnl("this_week", week_q),
            build_pnl("this_month", month_q),
        ],
    )
