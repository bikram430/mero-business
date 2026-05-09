"""004 — Khata (buy-now-pay-later) table

Revision ID: 004
Revises: 003
Create Date: 2026-05-06
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'khata',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('merchant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('merchants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('customer_phone', sa.String(20), nullable=False),
        sa.Column('customer_name', sa.String(255), nullable=True),
        sa.Column('amount_due', sa.Integer, nullable=False),
        sa.Column('amount_paid', sa.Integer, default=0),
        sa.Column('due_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('notes', sa.String(500), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, default='active'),
        sa.Column('transaction_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('transactions.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    op.create_index('idx_khata_merchant', 'khata', ['merchant_id'])
    op.create_index('idx_khata_phone', 'khata', ['customer_phone'])
    op.create_index('idx_khata_status', 'khata', ['status'])


def downgrade():
    op.drop_index('idx_khata_status', table_name='khata')
    op.drop_index('idx_khata_phone', table_name='khata')
    op.drop_index('idx_khata_merchant', table_name='khata')
    op.drop_table('khata')
