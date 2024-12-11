from pydantic import BaseModel, Field
from typing import Literal, Optional, List, Union
from datetime import datetime, date


# ========== User-Related Schemas ==========

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)  # Password will be hashed before storage
    budget: float = Field(default=0.0)


class UserLogin(BaseModel):
    username: str
    password: str


class BudgetUpdate(BaseModel):
    new_budget: float = Field(..., ge=0)


# ========== Stock-Related Schemas ==========

class StockResponse(BaseModel):
    id: int
    symbol: str
    name: str
    price: float

    class Config:
        orm_mode = True


# ========== Portfolio-Related Schemas ==========

class StockAddRequest(BaseModel):
    ticker: str = Field(..., min_length=1, max_length=5, pattern=r"^[A-Z]+$")
    quantity: int = Field(..., gt=0)
    purchase_price: float = Field(..., ge=0)


class PortfolioEntry(BaseModel):
    ticker: str
    quantity: int
    purchase_price: float
    total_cost: float
    current_price: Optional[float] = Field(default=0.0)
    current_value: Optional[float] = Field(default=0.0)


class PortfolioResponse(BaseModel):
    message: str
    portfolio: List[PortfolioEntry]
    total_portfolio_value: float

    class Config:
        orm_mode = True


# ========== Transaction-Related Schemas ==========

class TransactionCreate(BaseModel):
    user_id: int  # Include user_id
    ticker: str = Field(..., min_length=1, max_length=5, pattern=r"^[A-Z]+$")
    transaction_type: Literal["buy", "sell"]
    quantity: int = Field(..., gt=0)
    price: float = Field(..., ge=0)


class TransactionResponse(BaseModel):
    id: int
    ticker: str
    transaction_type: Literal["buy", "sell"]
    quantity: int
    price: float
    total_cost: float
    timestamp: datetime

    class Config:
        orm_mode = True


# ========== Market Data Schemas ==========

class MarketDataResponse(BaseModel):
    ticker: str
    date: date  # Changed from str to date for consistency
    open: float
    high: float
    low: float
    close: float
    volume: Optional[int] = Field(default=None)


# ========== Portfolio Analysis Schemas ==========

class PortfolioWeight(BaseModel):
    ticker: str
    weight: float


class SectorDistribution(BaseModel):
    sector: str
    percentage: float


class SP500Comparison(BaseModel):
    portfolio_return: float
    sp500_return: float


class PortfolioAnalysisResponse(BaseModel):
    weights: List[PortfolioWeight]
    sectors: List[SectorDistribution]
    sp500_comparison: SP500Comparison
    suggestions: List[str]


# ========== Portfolio Trend Schemas ==========

class PortfolioTrendEntry(BaseModel):
    date: date
    portfolio_value: float
    daily_return: Optional[float] = None


class PortfolioTrendResponse(BaseModel):
    message: str
    trend: List[PortfolioTrendEntry]


# ========== Stock Price Data and API Response Schemas ==========

class StockPriceData(BaseModel):
    date: date  # Changed from str to date for consistency
    open: float
    high: float
    low: float
    close: float
    volume: int


class HistoricalPricesResponse(BaseModel):
    success: bool
    data: Optional[List[StockPriceData]]
    error: Optional[str]


# ========== Generic API Response Schema ==========

class ApiResponse(BaseModel):
    success: bool
    data: Optional[Union[dict, list, str]]  # Adjusted for flexibility
    error: Optional[str]


class MessageRequest(BaseModel):
    message: str