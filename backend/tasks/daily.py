import asyncio
import logging
import traceback
from decimal import Decimal, ROUND_HALF_UP
from datetime import date, timedelta

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_

from database import async_session_maker
from models import UserStock, StockPrice, PortfolioPerformance, Stock, FearGreedIndex
from fear_greed import fetch_fear_greed_index

# Configure logging for this module
logger = logging.getLogger(__name__)

# Helper function to round to two decimal places
def round_to_two_decimals(value):
    return float(Decimal(value).quantize(Decimal("0.00"), rounding=ROUND_HALF_UP))

async def track_portfolio_performance():
    """
    Calculates and tracks daily portfolio performance for all users.
    Ensures one data point per day for each user in the PortfolioPerformance table.
    """
    try:
        async with async_session_maker() as session:
            # Use yesterday's date
            today = date.today() - timedelta(days=1)
            logger.info(f"Calculating portfolio performance for date: {today}")

            # Check if today's performance is already recorded
            existing_performance_result = await session.execute(
                select(PortfolioPerformance.user_id)
                .where(PortfolioPerformance.date == today)
            )
            existing_user_ids = set(existing_performance_result.scalars().all())

            # Get all users with stocks
            result = await session.execute(select(UserStock.user_id).distinct())
            user_ids = set(result.scalars().all())

            # Filter users who don't already have performance recorded for today
            users_to_process = user_ids - existing_user_ids
            if not users_to_process:
                logger.info(f"Portfolio performance for {today} is already recorded for all users.")
                return

            # Initialize data structures
            all_stock_ids = set()
            user_stocks = {}

            # Fetch user stocks and collect stock_ids
            for user_id in users_to_process:
                stocks_result = await session.execute(
                    select(UserStock.ticker, UserStock.quantity, Stock.id.label("stock_id"))
                    .join(Stock, UserStock.ticker == Stock.symbol)
                    .where(UserStock.user_id == user_id)
                )
                stocks = stocks_result.all()
                logger.info(f"Stocks for user {user_id}: {stocks}")
                user_stocks[user_id] = stocks
                for _, _, stock_id in stocks:
                    all_stock_ids.add(stock_id)

            logger.info(f"All stock IDs to fetch prices for: {all_stock_ids}")

            # Fetch all stock prices in bulk
            stock_prices_result = await session.execute(
                select(StockPrice.stock_id, StockPrice.close_price)
                .where(
                    and_(
                        StockPrice.stock_id.in_(all_stock_ids),
                        StockPrice.date == today
                    )
                )
            )
            stock_prices_rows = stock_prices_result.all()
            logger.info(f"Raw query results: {stock_prices_rows}")
            stock_prices = {row.stock_id: row.close_price for row in stock_prices_rows}
            logger.info(f"Parsed stock prices: {stock_prices}")

            # Calculate performances
            performances = []
            for user_id in users_to_process:
                portfolio_value = Decimal(0)
                stocks = user_stocks.get(user_id, [])

                for ticker, quantity, stock_id in stocks:
                    latest_price = stock_prices.get(stock_id)
                    if latest_price is not None:
                        portfolio_value += Decimal(quantity) * Decimal(latest_price)
                    else:
                        logger.warning(f"Missing price data for {ticker} on {today}")

                # Skip users with no valid portfolio value
                if portfolio_value == 0:
                    logger.info(f"No valid portfolio data for user {user_id} on {today}. Skipping.")
                    continue

                # Append today's performance
                performances.append(
                    PortfolioPerformance(
                        user_id=user_id,
                        date=today,
                        portfolio_value=round_to_two_decimals(portfolio_value),
                        daily_return=None,  # Set this to None initially
                    )
                )
                logger.info(
                    f"Tracked performance for user {user_id}: "
                    f"Portfolio value = {portfolio_value}"
                )

            # Bulk insert performances if there are any valid ones
            if performances:
                session.add_all(performances)
                await session.commit()
                logger.info(f"Portfolio performance tracking complete for {len(performances)} users.")
            else:
                logger.info(f"No valid portfolio data to track for any user on {today}.")

    except Exception as e:
        logger.error(f"Failed to track portfolio performance: {e}", exc_info=True)


async def track_fear_greed_index():
    """
    Fetches and tracks the daily Fear & Greed Index.
    """
    try:
        async with async_session_maker() as session:
            try:
                today = date.today()

                # Check if today's index is already recorded
                existing_record_result = await session.execute(
                    select(FearGreedIndex)
                    .where(FearGreedIndex.date == today)
                )
                existing_record = existing_record_result.scalar()

                if existing_record:
                    logger.info(f"Fear & Greed Index for {today} already tracked.")
                    return

                # Fetch the index value
                index_data = await asyncio.to_thread(fetch_fear_greed_index)
                index_value = index_data.get("score", 0)  # Use 'score' or provide fallback

                # Insert into the database
                session.add(
                    FearGreedIndex(
                        date=today,
                        value=index_value
                    )
                )
                await session.commit()
                logger.info(f"Tracked Fear & Greed Index for {today}: {index_value}")
            except Exception as e:
                await session.rollback()
                logger.error(f"Failed to track Fear & Greed Index: {e}", exc_info=True)
    except Exception as e:
        logger.error(f"Failed to create database session: {e}", exc_info=True)

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    asyncio.run(track_portfolio_performance())
    asyncio.run(track_fear_greed_index())
