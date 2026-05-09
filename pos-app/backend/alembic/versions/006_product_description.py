"""Add description column to products for restaurant menu items."""
from alembic import op
import sqlalchemy as sa

revision = "006"
down_revision = "005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("products", sa.Column("description", sa.String(500), nullable=True))


def downgrade() -> None:
    op.drop_column("products", "description")
