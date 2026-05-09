from datetime import date
from typing import List

from pydantic import BaseModel


class DailySummary(BaseModel):
    date: date
    total_sales: int        # paisa
    transaction_count: int
    cash_sales: int
    digital_sales: int


class PnLSummary(BaseModel):
    period: str             # "today" | "this_week" | "this_month"
    revenue: int            # paisa — total paid transactions
    transaction_count: int
    avg_transaction: int    # paisa
    cash_revenue: int
    digital_revenue: int
    khata_revenue: int


class DashboardResponse(BaseModel):
    today_total: int            # paisa
    today_transactions: int
    today_cash: int
    today_digital: int
    this_week_total: int
    this_month_total: int
    recent_days: List[DailySummary]
    pnl: List[PnLSummary]       # P&L for today / week / month
