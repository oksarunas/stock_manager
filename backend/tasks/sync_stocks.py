import asyncio
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database import async_session_maker
from models import Stock, UserStock

async def sync_stocks_with_user_stocks():
    """
    Syncs the Stock table with all tickers from UserStock.
    Adds any missing tickers to the Stock table.
    """
    # Configure logging for this module
    logger = logging.getLogger(__name__)

    try:
        async with async_session_maker() as session:
            try:
                # Get all distinct tickers from user_stocks
                user_tickers_query = select(UserStock.ticker).distinct()
                result = await session.execute(user_tickers_query)
                user_tickers = {row[0] for row in result.fetchall()}

                # Get all existing tickers in the stocks table
                existing_tickers_query = select(Stock.symbol)
                result = await session.execute(existing_tickers_query)
                existing_tickers = {row[0] for row in result.fetchall()}

                # Find tickers in user_stocks but not in stocks
                new_tickers = user_tickers - existing_tickers

                if not new_tickers:
                    logger.info("No new tickers to add.")
                    return

                # Insert new tickers into the Stock table
                for ticker in new_tickers:
                    new_stock = Stock(symbol=ticker, price=None, name=None, sector=None)
                    session.add(new_stock)
                    logger.info(f"Added new stock: {ticker}")
                
                # Commit the changes
                await session.commit()
                logger.info("Sync complete.")
            except Exception as e:
                await session.rollback()
                logger.error(f"Failed to sync stocks: {e}", exc_info=True)
    except Exception as e:
        logger.error(f"Failed to create database session: {e}", exc_info=True)
