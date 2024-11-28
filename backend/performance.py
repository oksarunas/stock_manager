from fastapi import APIRouter, HTTPException, Body
from typing import List
from pydantic import BaseModel, Field
import asyncio
from market import get_current_price
from yfinance import Ticker
from datetime import datetime, timedelta

router = APIRouter()

# Define a Pydantic model for better type validation
class StockItem(BaseModel):
    ticker: str
    quantity: float = Field(gt=0, description="Quantity must be greater than 0")
    purchase_price: float = Field(ge=0, description="Purchase price cannot be negative")

# Model to structure each detail entry in the response
class Detail(BaseModel):
    ticker: str
    quantity: float
    purchase_price: float
    current_price: float
    investment: float
    current_value: float
    individual_roi: float

# Response model to structure the output
class PerformanceResponse(BaseModel):
    total_investment: float
    total_current_value: float
    roi: float
    details: List[Detail]


@router.post("/", response_model=PerformanceResponse)
async def calculate_portfolio_performance(
    portfolio: List[StockItem] = Body(...)
):
    """
    Calculate the performance of a given portfolio.

    Each portfolio item should include 'ticker', 'quantity', and 'purchase_price'.
    Example:
    [
        {"ticker": "AAPL", "quantity": 10, "purchase_price": 150.00},
        {"ticker": "GOOGL", "quantity": 5, "purchase_price": 2800.00}
    ]
    """
    if not portfolio:
        raise HTTPException(status_code=400, detail="Portfolio cannot be empty.")

    total_investment = 0.0
    total_current_value = 0.0
    details = []

    # Fetch current prices concurrently for all stocks in the portfolio
    async def fetch_price(stock):
        try:
            current_price = await get_current_price(stock.ticker)
            if current_price is None:
                raise ValueError(f"Price not available for {stock.ticker}")
            return stock.ticker, current_price
        except Exception as e:
            print(f"[ERROR] Failed to fetch current price for {stock.ticker}: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to fetch price for {stock.ticker}")

    try:
        prices = await asyncio.gather(*[fetch_price(stock) for stock in portfolio])
    except HTTPException as e:
        raise e  # Re-raise to handle HTTP error responses

    # Calculate total values and individual ROIs
    for stock, (ticker, current_price) in zip(portfolio, prices):
        investment = stock.quantity * stock.purchase_price
        current_value = stock.quantity * current_price
        individual_roi = ((current_value - investment) / investment * 100) if investment > 0 else 0

        total_investment += investment
        total_current_value += current_value

        details.append({
            "ticker": ticker,
            "quantity": stock.quantity,
            "purchase_price": stock.purchase_price,
            "current_price": current_price,
            "investment": investment,
            "current_value": current_value,
            "individual_roi": individual_roi
        })

    # Calculate overall ROI
    roi = (total_current_value - total_investment) / total_investment * 100 if total_investment > 0 else 0
    return {
        "total_investment": total_investment,
        "total_current_value": total_current_value,
        "roi": roi,
        "details": details
    }


async def fetch_sp500_performance() -> dict:
    """
    Fetch S&P 500 performance data and sector weights.

    Returns:
        dict: A dictionary containing S&P 500 total return and sector weights.
    """
    try:
        sp500 = Ticker("^GSPC")
        today = datetime.now()
        thirty_days_ago = today - timedelta(days=30)
        historical_data = sp500.history(start=thirty_days_ago.strftime("%Y-%m-%d"), end=today.strftime("%Y-%m-%d"))

        if not historical_data.empty:
            start_price = historical_data["Close"].iloc[0]
            end_price = historical_data["Close"].iloc[-1]
            total_return = ((end_price - start_price) / start_price) * 100
        else:
            raise ValueError("No historical data available for S&P 500.")

        sector_weights = sp500.info.get("sectorWeightings", None)
        return {
            "return": total_return,
            "sector_weights": sector_weights if sector_weights else {}
        }
    except Exception as e:
        print(f"[ERROR] Failed to fetch S&P 500 performance: {e}")
        return {"return": 0.0, "sector_weights": {}}


def generate_diversification_suggestions(
    portfolio_sectors: dict, sp500_sector_weights: dict
) -> list:
    """
    Generate suggestions to improve portfolio diversification.
    """
    suggestions = []
    total_portfolio_value = sum(portfolio_sectors.values())

    portfolio_weights = {
        sector: (value / total_portfolio_value) * 100 if total_portfolio_value > 0 else 0
        for sector, value in portfolio_sectors.items()
    }
    if total_portfolio_value == 0:
        suggestions.append("Portfolio value is zero; no diversification analysis possible.")
        return suggestions

    for sector, sp500_weight in sp500_sector_weights.items():
        portfolio_weight = portfolio_weights.get(sector, 0)

        if portfolio_weight < sp500_weight * 0.8:
            suggestions.append(
                f"Consider increasing exposure to {sector} (current: {portfolio_weight:.2f}%, S&P 500: {sp500_weight:.2f}%)"
            )
        elif portfolio_weight > sp500_weight * 1.2:
            suggestions.append(
                f"Consider reducing exposure to {sector} (current: {portfolio_weight:.2f}%, S&P 500: {sp500_weight:.2f}%)"
            )

    for sector in portfolio_weights.keys():
        if sector not in sp500_sector_weights:
            suggestions.append(f"Review exposure to {sector}, as it is not part of the S&P 500 sectors.")

    return suggestions
