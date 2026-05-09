"""add category to products and table_number to transactions

Revision ID: 003
Revises: 002
Create Date: 2026-05-06
"""
from alembic import op
import sqlalchemy as sa

revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('products', sa.Column('category', sa.String(100), nullable=True))
    op.add_column('transactions', sa.Column('table_number', sa.String(20), nullable=True))


def downgrade():
    op.drop_column('products', 'category')
    op.drop_column('transactions', 'table_number')
