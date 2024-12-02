from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from database import get_db
from models import User, UserStock, PortfolioPerformance
from schemas import (
    PortfolioEntry,
    PortfolioResponse,
    StockAddRequest,
    PortfolioAnalysisResponse,
    PortfolioWeight,
    SectorDistribution,
    SP500Comparison,
    PortfolioTrendResponse,
    PortfolioTrendEntry,
)
from market import get_current_price, fetch_stock_sector
from performance import fetch_sp500_performance, generate_diversification_suggestions

router = APIRouter()


@router.post("/add", response_model=dict)
async def add_stock_to_portfolio(request: StockAddRequest, session: AsyncSession = Depends(get_db)):
    """
    Add a stock to the user's portfolio.
    """
    user = await session.get(User, request.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if the stock already exists in the user's portfolio
    existing_stock = (
        await session.execute(
            select(UserStock)
            .where((UserStock.user_id == request.user_id) & (UserStock.ticker == request.ticker))
        )
    ).scalar_one_or_none()

    formatted_purchase_price = round(request.purchase_price, 2)
    total_cost = request.quantity * formatted_purchase_price

    if existing_stock:
        existing_stock.quantity += request.quantity
        existing_stock.total_cost += total_cost
    else:
        new_stock = UserStock(
            user_id=request.user_id,
            ticker=request.ticker,
            quantity=request.quantity,
            purchase_price=formatted_purchase_price,
            total_cost=total_cost,
        )
        session.add(new_stock)

    await session.commit()

    return {"message": "Stock added to portfolio successfully"}


@router.delete("/remove", response_model=dict)
async def remove_stock_from_portfolio(user_id: int, ticker: str, session: AsyncSession = Depends(get_db)):
    """
    Remove a stock from the user's portfolio.
    """
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    result = (
        await session.execute(
            select(UserStock).where((UserStock.user_id == user_id) & (UserStock.ticker == ticker))
        )
    ).scalar_one_or_none()

    if not result:
        raise HTTPException(status_code=404, detail="Stock not found in portfolio")

    await session.delete(result)
    await session.commit()

    return {"message": "Stock removed from portfolio successfully"}


@router.get("/{user_id}", response_model=PortfolioResponse)
async def get_user_portfolio(user_id: int, session: AsyncSession = Depends(get_db)):
    """
    Get the user's entire portfolio, including current prices for each stock.
    """
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    portfolio_records = (
        await session.execute(
            select(UserStock).where(UserStock.user_id == user_id)
        )
    ).scalars().all()

    if not portfolio_records:
        raise HTTPException(status_code=404, detail="Portfolio is empty")

    portfolio = []
    total_portfolio_value = 0.0

    for record in portfolio_records:
        ticker = record.ticker
        quantity = record.quantity
        purchase_price = record.purchase_price
        total_cost = record.total_cost

        current_price = await get_current_price(ticker)
        current_value = current_price * quantity if current_price else 0.0

        portfolio.append(
            PortfolioEntry(
                ticker=ticker,
                quantity=quantity,
                purchase_price=purchase_price,
                total_cost=total_cost,
                current_price=current_price,
                current_value=current_value,
            )
        )

        if current_value:
            total_portfolio_value += current_value

    return PortfolioResponse(
        message="Portfolio retrieved successfully",
        user_id=user_id,
        portfolio=portfolio,
        total_portfolio_value=total_portfolio_value,
    )



@router.get("/analyze/{user_id}", response_model=PortfolioAnalysisResponse)
async def analyze_portfolio(user_id: int, session: AsyncSession = Depends(get_db)):
    """
    Analyze the user's portfolio to provide insights.
    - Retrieves the user's portfolio data.
    - Calculates portfolio weights and sector distribution.
    - Compares the portfolio's performance against the S&P 500.
    - Generates diversification suggestions.
    """
    # Retrieve the user from the database
    user = await session.get(User, user_id)
    if not user:
        # Raise an error if the user is not found
        raise HTTPException(status_code=404, detail="User not found")

    # Fetch the user's portfolio records
    portfolio_records = (
        await session.execute(
            select(UserStock).where(UserStock.user_id == user_id)
        )
    ).scalars().all()

    if not portfolio_records:
        # Raise an error if the portfolio is empty
        raise HTTPException(status_code=404, detail="Portfolio is empty")

    # Initialize variables for portfolio analysis
    total_value = 0.0
    weights = []  # List of portfolio weights by ticker
    sectors = {}  # Dictionary to calculate sector distribution

    # Loop through each portfolio record to calculate current values and weights
    for record in portfolio_records:
        ticker = record.ticker  # Stock ticker
        quantity = record.quantity  # Quantity of stocks held

        # Fetch the current price of the stock
        current_price = await get_current_price(ticker)
        # Calculate the current value of the stock in the portfolio
        current_value = current_price * quantity if current_price else 0.0
        total_value += current_value  # Update the total portfolio value

        # Append the weight of the stock in the portfolio
        weights.append(
            PortfolioWeight(
                ticker=ticker,
                weight=(current_value / total_value) * 100 if total_value else 0
            )
        )

        # Fetch the stock's sector and update the sector distribution
        sector = await fetch_stock_sector(ticker)
        if sector:
            # Add the current value of the stock to its sector
            sectors[sector] = sectors.get(sector, 0) + current_value

    # Calculate the sector distribution as percentages
    sector_distribution = [
        SectorDistribution(
            sector=sector,
            percentage=(value / total_value) * 100 if total_value else 0
        )
        for sector, value in sectors.items()
    ]

    # Fetch S&P 500 performance data
    sp500_performance = await fetch_sp500_performance()

    # Calculate the portfolio's return compared to the S&P 500
    portfolio_return = await calculate_portfolio_return(portfolio_records, sp500_performance)

    # Prepare the performance comparison object
    comparison = SP500Comparison(
        portfolio_return=portfolio_return,
        sp500_return=sp500_performance["return"],
    )

    # Generate diversification suggestions based on the portfolio and S&P 500 sector weights
    suggestions = generate_diversification_suggestions(sectors, sp500_performance["sector_weights"])

    # Return the analysis response
    return PortfolioAnalysisResponse(
        weights=weights,  # Portfolio weights by ticker
        sectors=sector_distribution,  # Sector distribution percentages
        sp500_comparison=comparison,  # Portfolio vs. S&P 500 comparison
        suggestions=suggestions,  # Diversification suggestions
    )


# Helper function to calculate portfolio return
async def calculate_portfolio_return(portfolio_records: list, sp500_performance: dict) -> float:
    """
    Calculate the portfolio's overall return.
    - Compares the current value of the portfolio with the total invested value.
    """
    total_invested = 0.0  # Total amount invested in the portfolio
    total_current_value = 0.0  # Total current value of the portfolio

    # Loop through each stock in the portfolio
    for record in portfolio_records:
        quantity = record.quantity  # Quantity of stocks held
        purchase_price = record.purchase_price  # Purchase price per stock

        # Fetch the current price of the stock
        current_price = await get_current_price(record.ticker)
        if current_price is None:
            continue  # Skip if the current price is not available

        # Calculate the invested and current values
        invested = quantity * purchase_price
        current_value = quantity * current_price

        total_invested += invested  # Accumulate the total invested amount
        total_current_value += current_value  # Accumulate the total current value

    if total_invested == 0:
        # Avoid division by zero
        return 0.0

    # Calculate the return as a percentage
    return ((total_current_value - total_invested) / total_invested) * 100



@router.get("/trend/{user_id}", response_model=PortfolioTrendResponse)
async def get_portfolio_trend(user_id: int, session: AsyncSession = Depends(get_db)):
    """
    Retrieve the portfolio performance trend for the given user, day by day.
    """
    try:
        # Fetch performance records for the user, ordered by date
        result = await session.execute(
            select(PortfolioPerformance.date, PortfolioPerformance.portfolio_value, PortfolioPerformance.daily_return)
            .where(PortfolioPerformance.user_id == user_id)
            .order_by(PortfolioPerformance.date)
        )
        performance_records = result.all()

        # Format the data into a list of trend entries
        trend_entries = [
            PortfolioTrendEntry(
                date=record.date,
                portfolio_value=record.portfolio_value,
                daily_return=record.daily_return,
            )
            for record in performance_records
        ]

        if not trend_entries:
            raise HTTPException(status_code=404, detail="No portfolio performance data found")

        return PortfolioTrendResponse(
            message="Portfolio trend retrieved successfully",
            user_id=user_id,
            trend=trend_entries,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch portfolio trend: {str(e)}")
