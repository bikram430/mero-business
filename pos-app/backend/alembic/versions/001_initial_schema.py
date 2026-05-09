"""initial schema

Revision ID: 001
Create Date: 2026-05-05
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "merchants",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(20), unique=True, nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("address", sa.String(500), nullable=True),
        sa.Column("type", sa.Enum("retail", "restaurant", name="merchanttype"), nullable=False),
        sa.Column("is_active", sa.Boolean(), default=True),
        sa.Column("phone_verified", sa.Boolean(), default=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )

    op.create_table(
        "customers",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("phone", sa.String(20), unique=True, nullable=False),
        sa.Column("name", sa.String(255), nullable=True),
        sa.Column("is_active", sa.Boolean(), default=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("idx_customer_phone", "customers", ["phone"])

    op.create_table(
        "products",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("merchant_id", UUID(as_uuid=True), sa.ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("price", sa.Integer(), nullable=False),
        sa.Column("barcode", sa.String(100), nullable=True),
        sa.Column("stock_qty", sa.Integer(), nullable=True),
        sa.Column("is_active", sa.Boolean(), default=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_products_barcode", "products", ["barcode"])

    op.create_table(
        "transactions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("merchant_id", UUID(as_uuid=True), sa.ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("customer_id", UUID(as_uuid=True), sa.ForeignKey("customers.id", ondelete="SET NULL"), nullable=True),
        sa.Column("customer_phone", sa.String(20), nullable=True),
        sa.Column("total_amount", sa.Integer(), nullable=False),
        sa.Column("discount_amount", sa.Integer(), default=0),
        sa.Column("payment_method", sa.Enum("cash", "esewa", "fonepay", "khalti", "khata", name="paymentmethod"), nullable=False),
        sa.Column("payment_status", sa.Enum("pending", "paid", "failed", "cancelled", name="transactionstatus"), nullable=False),
        sa.Column("idempotency_key", sa.String(100), unique=True, nullable=True),
        sa.Column("gateway_ref", sa.String(255), nullable=True),
        sa.Column("receipt_url", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    # Critical indexes from PDF — add from day one
    op.create_index("idx_tx_merchant", "transactions", ["merchant_id"])
    op.create_index("idx_tx_created", "transactions", ["created_at"])
    op.create_index("idx_tx_status", "transactions", ["payment_status"])

    op.create_table(
        "receipt_items",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("transaction_id", UUID(as_uuid=True), sa.ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("product_id", UUID(as_uuid=True), sa.ForeignKey("products.id", ondelete="SET NULL"), nullable=True),
        sa.Column("product_name", sa.String(255), nullable=False),
        sa.Column("qty", sa.Integer(), nullable=False),
        sa.Column("unit_price", sa.Integer(), nullable=False),
    )


def downgrade():
    op.drop_table("receipt_items")
    op.drop_index("idx_tx_status", "transactions")
    op.drop_index("idx_tx_created", "transactions")
    op.drop_index("idx_tx_merchant", "transactions")
    op.drop_table("transactions")
    op.drop_index("ix_products_barcode", "products")
    op.drop_table("products")
    op.drop_index("idx_customer_phone", "customers")
    op.drop_table("customers")
    op.drop_table("merchants")
    op.execute("DROP TYPE IF EXISTS merchanttype")
    op.execute("DROP TYPE IF EXISTS paymentmethod")
    op.execute("DROP TYPE IF EXISTS transactionstatus")
