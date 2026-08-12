"""rename subscription provider stripe to cashfree

Revision ID: 94ae5e5e3a6b
Revises: c1591202f33d
Create Date: 2026-07-31 21:08:50.255560

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '94ae5e5e3a6b'
down_revision: Union[str, None] = 'c1591202f33d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE subscription_provider RENAME VALUE 'stripe' TO 'cashfree'")


def downgrade() -> None:
    op.execute("ALTER TYPE subscription_provider RENAME VALUE 'cashfree' TO 'stripe'")
