from fastapi import APIRouter, HTTPException, Depends
from typing import List
from sqlalchemy import select, update, distinct
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date, timedelta
import yfinance as yf
import pandas as pd
import logging
from yfinance import Ticker
from database import async_session_maker, database, get_db
from models import StockPrice, UserStock, Stock, FearGreedEntry, FearGreedHistoryResponse, FearGreedIndex
from schemas import MarketDataResponse, ApiResponse, StockPriceData


# Configure logging
logging.basicConfig(level=logging.INFO)

# FastAPI router
router = APIRouter()


@router.get("/company/{query}")
async def get_company_info(query: str):
    """
    Fetch company information by either ticker or company name.
    """
    ticker = query.upper()
    try:
        stock = yf.Ticker(ticker)
        info = stock.info

        # Fetch the last 7 days of daily historical data
        historical_data = stock.history(period="5d")
        if historical_data.empty:
            raise HTTPException(status_code=404, detail="No historical data available for the ticker.")

        # Convert historical data to JSON format
        dates = pd.to_datetime(historical_data.index).strftime('%Y-%m-%d').tolist()
        prices = historical_data['Close'].tolist()

        company_info = {
            "name": info.get("longName", "Unknown"),
            "ticker": info.get("symbol", ticker),
            "industry": info.get("industry", "N/A"),
            "description": info.get("longBusinessSummary", "N/A"),
            "currentPrice": info.get("currentPrice", 0.0),
            "marketCap": info.get("marketCap", 0),
            "peRatio": info.get("trailingPE", "N/A"),
            "fiftyTwoWeekHigh": info.get("fiftyTwoWeekHigh", 0.0),
            "fiftyTwoWeekLow": info.get("fiftyTwoWeekLow", 0.0),
            "dividendYield": info.get("dividendYield", 0.0),
            "priceToBook": info.get("priceToBook", "N/A"),
            "historicalPrices": {
                "dates": dates,
                "prices": prices,
            }
        }
        return company_info

    except Exception as e:
        logging.error(f"[ERROR] Failed to fetch data for '{query}': {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch company information.")


@router.get("/{ticker}", response_model=MarketDataResponse)
async def get_market_data(ticker: str):
    """
    Fetch market data for a specific ticker.
    """
    try:
        stock = yf.Ticker(ticker)
        data = stock.history(period="1d")

        if data.empty:
            raise HTTPException(status_code=404, detail=f"No data available for ticker '{ticker}'")

        latest_data = data.iloc[-1]
        market_data = {
            "ticker": ticker,
            "date": latest_data.name.strftime('%Y-%m-%d'),
            "open": latest_data["Open"],
            "high": latest_data["High"],
            "low": latest_data["Low"],
            "close": latest_data["Close"],
            "volume": int(latest_data["Volume"]),
        }

        return market_data

    except Exception as e:
        logging.error(f"[ERROR] Failed to fetch data for ticker '{ticker}': {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch market data.")


async def get_current_price(ticker: str) -> float:
    """
    Fetch the current price of a stock using yfinance.
    """
    try:
        stock = yf.Ticker(ticker)
        history = stock.history(period="1d")

        if history.empty:
            raise ValueError(f"No price data available for ticker {ticker}")

        current_price = history.iloc[-1]['Close']
        logging.info(f"[PRICE FETCH] Current price for {ticker}: {round(current_price, 2)}")
        return round(current_price, 2)

    except Exception as e:
        logging.error(f"[PRICE FETCH ERROR] Failed to fetch price for {ticker}: {e}")
        return None


@router.get("/fear-greed/history", response_model=FearGreedHistoryResponse)
async def get_fear_greed_index_history(session: AsyncSession = Depends(get_db)):
    """
    Fetch historical Fear & Greed Index data from the database.
    """
    try:
        # Query the database for historical Fear & Greed Index data
        result = await session.execute(
            select(FearGreedIndex.date, FearGreedIndex.value)
            .order_by(FearGreedIndex.date.asc())
        )
        fear_greed_records = result.all()

        # Format the data into a list of trend entries
        trend_entries = [
            FearGreedEntry(date=row.date.isoformat(), value=row.value) for row in fear_greed_records
        ]

        if not trend_entries:
            raise HTTPException(status_code=404, detail="No Fear & Greed Index data found")

        return FearGreedHistoryResponse(
            message="Fear & Greed Index history retrieved successfully",
            trend=trend_entries,
        )

    except Exception as e:
        logging.error(f"[ERROR] Failed to fetch Fear & Greed Index history: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch Fear & Greed Index history")




async def update_stock_prices():
    """
    Fetch and update stock prices for all stocks owned by users.
    """
    async with async_session_maker() as session:
        try:
            tracked_tickers = await session.execute(select(distinct(UserStock.ticker)))
            tracked_tickers = [row[0] for row in tracked_tickers]

            if not tracked_tickers:
                logging.info("[INFO] No stocks to update.")
                return

            yesterday = (date.today() - timedelta(days=1)).isoformat()
            today = date.today().isoformat()

            for ticker in tracked_tickers:
                try:
                    data = yf.download(ticker, start=yesterday, end=today)

                    for idx, row in data.iterrows():
                        stock_price = StockPrice(
                            ticker=ticker,
                            date=idx.date(),
                            open_price=row["Open"],
                            close_price=row["Close"],
                            high=row["High"],
                            low=row["Low"],
                            volume=int(row["Volume"])
                        )
                        session.add(stock_price)

                    await session.commit()
                    logging.info(f"[INFO] Updated prices for {ticker}")

                except Exception as e:
                    logging.error(f"[ERROR] Failed to update prices for {ticker}: {e}")

        except Exception as e:
            logging.error(f"[ERROR] Error in update_stock_prices: {e}")

async def fetch_stock_sector(ticker: str) -> str:
    """
    Fetch the sector of a stock by its ticker symbol.
    """
    try:
        # Check database for existing sector data
        query = select(Stock.sector).where(Stock.symbol == ticker)
        sector_record = await database.fetch_one(query)

        if sector_record and sector_record["sector"]:
            return sector_record["sector"]

        # Fetch sector data from Yahoo Finance
        stock = Ticker(ticker)
        sector = stock.info.get("sector", None)

        if sector:
            # Update the database with the fetched sector
            update_query = (
                update(Stock)
                .where(Stock.symbol == ticker)
                .values(sector=sector)
            )
            await database.execute(update_query)
            logging.info(f"[SECTOR FETCH] Updated sector for {ticker}: {sector}")
            return sector
        else:
            logging.warning(f"[SECTOR FETCH ERROR] Sector data not found for {ticker}")
            return "Unknown"

    except Exception as e:
        logging.error(f"[ERROR] Error fetching sector for {ticker}: {e}")
        return "Unknown"
    


@router.get("/historical/{ticker}", response_model=ApiResponse)
async def get_historical_prices(ticker: str, range: str = "1mo"):
    """
    Fetch historical price data for a specific ticker and range.
    """
    try:
        stock = yf.Ticker(ticker)
        historical_data = stock.history(period=range)

        if historical_data.empty:
            raise HTTPException(status_code=404, detail=f"No historical data available for ticker '{ticker}'")

        stock_prices = []
        for idx, row in historical_data.iterrows():
            stock_price = StockPriceData(
                date=idx.strftime('%Y-%m-%d'),
                open=row['Open'],
                high=row['High'],
                low=row['Low'],
                close=row['Close'],
                volume=int(row['Volume'])
            )
            stock_prices.append(stock_price)

        return ApiResponse(success=True, data=stock_prices, error=None)

    except Exception as e:
        logging.error(f"[ERROR] Failed to fetch historical prices for '{ticker}': {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch historical prices.")
