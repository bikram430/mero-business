"""Store discovery: location, ratings, offers, click & collect."""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
import uuid

revision = "005"
down_revision = "004"
branch_labels = None
depends_on = None


def upgrade():
    # Add location + public profile fields to merchants
    op.add_column("merchants", sa.Column("description", sa.Text(), nullable=True))
    op.add_column("merchants", sa.Column("latitude", sa.Float(), nullable=True))
    op.add_column("merchants", sa.Column("longitude", sa.Float(), nullable=True))
    op.add_column("merchants", sa.Column("is_public", sa.Boolean(), nullable=False, server_default="false"))
    op.add_column("merchants", sa.Column("avg_rating", sa.Float(), nullable=True))
    op.add_column("merchants", sa.Column("rating_count", sa.Integer(), nullable=False, server_default="0"))

    # Store ratings
    op.create_table(
        "store_ratings",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("merchant_id", UUID(as_uuid=True), sa.ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("customer_phone", sa.String(20), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("review", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_store_ratings_merchant_id", "store_ratings", ["merchant_id"])

    # Offers
    op.create_table(
        "offers",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("merchant_id", UUID(as_uuid=True), sa.ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("discount_percent", sa.Integer(), nullable=True),
        sa.Column("discount_flat", sa.Integer(), nullable=True),
        sa.Column("valid_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_offers_merchant_id", "offers", ["merchant_id"])

    # Click & collect orders
    op.create_table(
        "collect_orders",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("merchant_id", UUID(as_uuid=True), sa.ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("customer_phone", sa.String(20), nullable=False),
        sa.Column("customer_name", sa.String(255), nullable=True),
        sa.Column("total_amount", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    op.create_index("ix_collect_orders_merchant_id", "collect_orders", ["merchant_id"])

    # Click & collect order items
    op.create_table(
        "collect_order_items",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("order_id", UUID(as_uuid=True), sa.ForeignKey("collect_orders.id", ondelete="CASCADE"), nullable=False),
        sa.Column("product_id", UUID(as_uuid=True), sa.ForeignKey("products.id", ondelete="SET NULL"), nullable=True),
        sa.Column("product_name", sa.String(255), nullable=False),
        sa.Column("unit_price", sa.Integer(), nullable=False),
        sa.Column("qty", sa.Integer(), nullable=False),
    )


def downgrade():
    op.drop_table("collect_order_items")
    op.drop_table("collect_orders")
    op.drop_index("ix_offers_merchant_id", "offers")
    op.drop_table("offers")
    op.drop_index("ix_store_ratings_merchant_id", "store_ratings")
    op.drop_table("store_ratings")
    op.drop_column("merchants", "rating_count")
    op.drop_column("merchants", "avg_rating")
    op.drop_column("merchants", "is_public")
    op.drop_column("merchants", "longitude")
    op.drop_column("merchants", "latitude")
    op.drop_column("merchants", "description")
