from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    ForeignKey,
    DateTime,
    Enum,
    Index,
    Date,
    UniqueConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base  # Assuming Base = declarative_base()
from pydantic import BaseModel
from typing import List

# Enum for transaction types
transaction_type_enum = Enum("buy", "sell", name="transaction_type")

class Stock(Base):
    __tablename__ = 'stocks'

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, unique=True, index=True, nullable=False)
    name = Column(String)
    price = Column(Float)
    sector = Column(String, nullable=True)

    # Relationships
    stock_prices = relationship('StockPrice', back_populates='stock', cascade='all, delete-orphan')
    user_stocks = relationship('UserStock', back_populates='stock', cascade='all, delete-orphan')
    transactions = relationship('Transaction', back_populates='stock', cascade='all, delete-orphan')

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    budget = Column(Float, default=0.0)

    # Relationships
    user_stocks = relationship('UserStock', back_populates='user', cascade='all, delete-orphan')
    transactions = relationship('Transaction', back_populates='user', cascade='all, delete-orphan')
    portfolio_performances = relationship('PortfolioPerformance', back_populates='user', cascade='all, delete-orphan')

class UserStock(Base):
    __tablename__ = 'user_stocks'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    ticker = Column(String, ForeignKey('stocks.symbol', ondelete='CASCADE'), nullable=False, index=True)  # Use ticker as foreign key
    quantity = Column(Integer, nullable=False)
    purchase_price = Column(Float, nullable=False)
    total_cost = Column(Float, nullable=False)

    # Relationships
    user = relationship('User', back_populates='user_stocks')
    stock = relationship('Stock', back_populates='user_stocks')

    __table_args__ = (
        UniqueConstraint('user_id', 'ticker', name='uq_user_stock'),
        Index('ix_user_stock_user_id', 'user_id'),
    )

class Transaction(Base):
    __tablename__ = 'transactions'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    ticker = Column(String, ForeignKey('stocks.symbol', ondelete='CASCADE'), nullable=False, index=True)  # Use ticker as foreign key
    transaction_type = Column(transaction_type_enum, nullable=False)
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)
    total_cost = Column(Float, nullable=False)
    timestamp = Column(DateTime, server_default=func.now())

    # Relationships
    user = relationship('User', back_populates='transactions')
    stock = relationship('Stock', back_populates='transactions')

    __table_args__ = (
        Index('ix_transaction_user_id', 'user_id'),
    )

class StockPrice(Base):
    __tablename__ = 'stock_prices'

    id = Column(Integer, primary_key=True)
    stock_id = Column(Integer, ForeignKey('stocks.id', ondelete='CASCADE'), index=True)
    date = Column(Date, index=True)
    open_price = Column(Float)
    close_price = Column(Float)
    high = Column(Float)
    low = Column(Float)
    volume = Column(Integer)

    # Relationships
    stock = relationship('Stock', back_populates='stock_prices')

    __table_args__ = (
        Index('ix_stock_price_stock_date', 'stock_id', 'date'),
    )

class PortfolioPerformance(Base):
    __tablename__ = 'portfolio_performance'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), index=True)
    date = Column(Date, index=True)
    portfolio_value = Column(Float)
    daily_return = Column(Float)
    total_invested = Column(Float, nullable=True)

    # Relationships
    user = relationship('User', back_populates='portfolio_performances')

    __table_args__ = (
        Index('ix_portfolio_performance_user_date', 'user_id', 'date'),
    )

class FearGreedEntry(BaseModel):
    date: str  # Use ISO format for dates
    value: float

class FearGreedHistoryResponse(BaseModel):
    message: str
    trend: List[FearGreedEntry]


class FearGreedIndex(Base):
    __tablename__ = "fear_greed_index"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    date = Column(Date, nullable=False, unique=True)  # Each date should be unique
    value = Column(Float, nullable=False)  # Value of the Fear & Greed Index


class Trade(Base):
    __tablename__ = 'trades'

    id = Column(Integer, primary_key=True)
    timestamp = Column(DateTime, nullable=False, server_default=func.now())
    action = Column(String, nullable=False)
    ticker = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    quantity = Column(Float, nullable=False)
    profit_loss = Column(Float, nullable=True)
    budget = Column(Float, nullable=False)

    __table_args__ = (
        Index('ix_trades_ticker', 'ticker'),
        Index('ix_trades_timestamp', 'timestamp'),
    )
