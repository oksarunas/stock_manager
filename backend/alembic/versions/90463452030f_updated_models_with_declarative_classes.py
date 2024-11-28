"""Updated models with declarative classes

Revision ID: 90463452030f
Revises: ac0707463fe9
Create Date: 2024-11-25 11:34:51.348491

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '90463452030f'
down_revision: Union[str, None] = 'ac0707463fe9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("stock_prices", schema=None) as batch_op:
        batch_op.add_column(sa.Column('stock_id', sa.Integer(), nullable=True))
        batch_op.create_index('ix_stock_price_stock_date', ['stock_id', 'date'], unique=False)
        batch_op.create_index('ix_stock_prices_stock_id', ['stock_id'], unique=False)
        batch_op.create_foreign_key(
            "fk_stock_prices_stock_id",
            "stocks",
            ["stock_id"],
            ["id"],
            ondelete='CASCADE',
        )
        # Safely drop the `ticker` column only if it exists
        if 'ticker' in [col['name'] for col in op.get_bind().execute(
            sa.text("PRAGMA table_info(stock_prices)")
        )]:
            batch_op.drop_column('ticker')

    # Stocks Table
    with op.batch_alter_table("stocks", schema=None) as batch_op:
        batch_op.alter_column('symbol', existing_type=sa.VARCHAR(), nullable=False)

    # Transactions Table
    with op.batch_alter_table("transactions", schema=None) as batch_op:
        batch_op.add_column(sa.Column('stock_id', sa.Integer(), nullable=False))
        batch_op.create_foreign_key(
            "fk_transactions_user_id",  # Name of the foreign key
            "users",  # Referenced table
            ["user_id"],  # Local columns
            ["id"],  # Referenced columns
            ondelete='CASCADE',
        )
        batch_op.create_foreign_key(
            "fk_transactions_stock_id",  # Name of the foreign key
            "stocks",  # Referenced table
            ["stock_id"],  # Local columns
            ["id"],  # Referenced columns
            ondelete='CASCADE',
        )
        batch_op.drop_column('ticker')

    # User Stocks Table
    with op.batch_alter_table("user_stocks", schema=None) as batch_op:
        batch_op.add_column(sa.Column('stock_id', sa.Integer(), nullable=False))
        batch_op.create_index('ix_user_stock_user_id', ['user_id'], unique=False)
        batch_op.create_index('ix_user_stocks_user_id', ['user_id'], unique=False)
        batch_op.create_unique_constraint('uq_user_stock', ['user_id', 'stock_id'])
        batch_op.create_foreign_key(
            "fk_user_stocks_user_id",  # Name of the foreign key
            "users",  # Referenced table
            ["user_id"],  # Local columns
            ["id"],  # Referenced columns
            ondelete='CASCADE',
        )
        batch_op.create_foreign_key(
            "fk_user_stocks_stock_id",  # Name of the foreign key
            "stocks",  # Referenced table
            ["stock_id"],  # Local columns
            ["id"],  # Referenced columns
            ondelete='CASCADE',
        )
        batch_op.drop_column('ticker')


def downgrade() -> None:
    # User Stocks Table
    with op.batch_alter_table("user_stocks", schema=None) as batch_op:
        batch_op.add_column(sa.Column('ticker', sa.VARCHAR(), nullable=False))
        batch_op.drop_constraint('fk_user_stocks_stock_id', type_='foreignkey')
        batch_op.drop_constraint('fk_user_stocks_user_id', type_='foreignkey')
        batch_op.drop_constraint('uq_user_stock', type_='unique')
        batch_op.drop_index('ix_user_stocks_user_id')
        batch_op.drop_index('ix_user_stock_user_id')
        batch_op.drop_column('stock_id')

    # Transactions Table
    with op.batch_alter_table("transactions", schema=None) as batch_op:
        batch_op.add_column(sa.Column('ticker', sa.VARCHAR(), nullable=False))
        batch_op.drop_constraint('fk_transactions_stock_id', type_='foreignkey')
        batch_op.drop_constraint('fk_transactions_user_id', type_='foreignkey')
        batch_op.drop_column('stock_id')

    # Stocks Table
    with op.batch_alter_table("stocks", schema=None) as batch_op:
        batch_op.alter_column('symbol', existing_type=sa.VARCHAR(), nullable=True)

    # Stock Prices Table
    with op.batch_alter_table("stock_prices", schema=None) as batch_op:
        batch_op.add_column(sa.Column('ticker', sa.VARCHAR(), nullable=True))
        batch_op.drop_constraint('fk_stock_prices_stock_id', type_='foreignkey')
        batch_op.drop_index('ix_stock_prices_stock_id')
        batch_op.drop_index('ix_stock_price_stock_date')
        batch_op.drop_column('stock_id')
