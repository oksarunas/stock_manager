"""Add sector column to stocks

Revision ID: ac0707463fe9
Revises: 
Create Date: 2024-11-19 09:33:05.216434

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ac0707463fe9'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add the sector column to the stocks table
    op.add_column('stocks', sa.Column('sector', sa.String(), nullable=True))

    # Modify the transactions table using batch mode
    with op.batch_alter_table('transactions', schema=None) as batch_op:
        batch_op.drop_constraint(None, type_='foreignkey')
        batch_op.create_foreign_key(None, 'stocks', ['ticker'], ['symbol'], ondelete='CASCADE')
        batch_op.create_foreign_key(None, 'users', ['user_id'], ['id'], ondelete='CASCADE')

    # Modify the user_stocks table using batch mode
    with op.batch_alter_table('user_stocks', schema=None) as batch_op:
        batch_op.drop_constraint(None, type_='foreignkey')
        batch_op.create_foreign_key(None, 'users', ['user_id'], ['id'], ondelete='CASCADE')
        batch_op.create_foreign_key(None, 'stocks', ['ticker'], ['symbol'], ondelete='CASCADE')


def downgrade() -> None:
    # Remove the sector column from the stocks table
    op.drop_column('stocks', 'sector')

    # Revert changes to the transactions table using batch mode
    with op.batch_alter_table('transactions', schema=None) as batch_op:
        batch_op.drop_constraint(None, type_='foreignkey')
        batch_op.create_foreign_key(None, 'users', ['user_id'], ['id'])

    # Revert changes to the user_stocks table using batch mode
    with op.batch_alter_table('user_stocks', schema=None) as batch_op:
        batch_op.drop_constraint(None, type_='foreignkey')
        batch_op.create_foreign_key(None, 'users', ['user_id'], ['id'])