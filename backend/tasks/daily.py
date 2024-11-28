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
    """
    try:
        async with async_session_maker() as session:
            today = date.today()
            yesterday = today - timedelta(days=1)
            day_before_yesterday = yesterday - timedelta(days=1)

            # Get all users with stocks
            result = await session.execute(select(UserStock.user_id).distinct())
            user_ids = result.scalars().all()

            # Initialize data structures
            performances = []
            all_stock_ids = set()
            user_stocks = {}

            # Fetch user stocks and collect stock_ids
            for user_id in user_ids:
                stocks = await session.execute(
                    select(UserStock.ticker, UserStock.quantity, Stock.id.label("stock_id"))
                    .join(Stock, UserStock.ticker == Stock.symbol)
                    .where(UserStock.user_id == user_id)
                )
                stocks = stocks.all()
                user_stocks[user_id] = stocks
                for _, _, stock_id in stocks:
                    all_stock_ids.add(stock_id)

            # Fetch all stock prices in bulk
            stock_prices_result = await session.execute(
                select(StockPrice.stock_id, StockPrice.close_price)
                .where(
                    and_(
                        StockPrice.stock_id.in_(all_stock_ids),
                        StockPrice.date == yesterday
                    )
                )
            )
            stock_prices = {(row.stock_id): row.close_price for row in stock_prices_result.all()}

            # Fetch previous performances in bulk
            previous_performances_result = await session.execute(
                select(PortfolioPerformance.user_id, PortfolioPerformance.portfolio_value)
                .where(
                    and_(
                        PortfolioPerformance.user_id.in_(user_ids),
                        PortfolioPerformance.date == day_before_yesterday
                    )
                )
            )
            previous_performances = {row.user_id: row.portfolio_value for row in previous_performances_result.all()}

            # Calculate performances
            for user_id in user_ids:
                portfolio_value = Decimal(0)
                stocks = user_stocks.get(user_id, [])

                for ticker, quantity, stock_id in stocks:
                    latest_price = stock_prices.get(stock_id)
                    if latest_price is not None:
                        portfolio_value += Decimal(quantity) * Decimal(latest_price)
                    else:
                        logger.warning(f"Missing price data for {ticker} on {yesterday}")

                yesterday_performance = previous_performances.get(user_id)

                if yesterday_performance and Decimal(yesterday_performance) != 0:
                    daily_return = (
                        (portfolio_value - Decimal(yesterday_performance)) / Decimal(yesterday_performance) * 100
                    )
                else:
                    daily_return = Decimal(0)

                # Append today's performance
                performances.append(
                    PortfolioPerformance(
                        user_id=user_id,
                        date=yesterday,
                        portfolio_value=portfolio_value,
                        daily_return=round_to_two_decimals(daily_return),
                    )
                )
                logger.info(
                    f"Tracked performance for user {user_id}: "
                    f"Portfolio value = {portfolio_value}, Daily return = {daily_return:.2f}%"
                )

            # Bulk insert performances
            session.add_all(performances)
            await session.commit()
            logger.info("Portfolio performance tracking complete.")
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
