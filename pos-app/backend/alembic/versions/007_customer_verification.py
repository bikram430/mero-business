"""Add email and verification fields to customers

Revision ID: 007
Revises: 006
Create Date: 2026-05-09
"""
from alembic import op
import sqlalchemy as sa

revision = "007"
down_revision = "006"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("customers", sa.Column("email", sa.String(255), nullable=True))
    op.add_column("customers", sa.Column("phone_verified", sa.Boolean(), nullable=True, server_default="false"))
    op.add_column("customers", sa.Column("email_verified", sa.Boolean(), nullable=True, server_default="false"))
    op.create_index("idx_customer_email", "customers", ["email"], unique=True)


def downgrade():
    op.drop_index("idx_customer_email", table_name="customers")
    op.drop_column("customers", "email_verified")
    op.drop_column("customers", "phone_verified")
    op.drop_column("customers", "email")
