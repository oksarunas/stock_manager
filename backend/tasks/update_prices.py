import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_
from yfinance import download
from database import async_session_maker
from models import Stock, StockPrice
from datetime import date, timedelta

async def update_stock_data():
    """
    Fetches and updates daily stock prices for all tickers in the stocks table.
    Prevents duplicate entries in the stock_prices table.
    """
    try:
        async with async_session_maker() as session:
            # Get all tickers from the Stock table with their stock IDs
            result = await session.execute(select(Stock.symbol, Stock.id))
            tracked_stocks = {row[0]: row[1] for row in result.fetchall()}

            if not tracked_stocks:
                print("[INFO] No stocks to update.")
                return

            print(f"[INFO] Fetching data for tickers: {list(tracked_stocks.keys())}")

            # Define the date range for fetching prices
            today = date.today()
            yesterday = today - timedelta(days=1)

            for ticker, stock_id in tracked_stocks.items():
                try:
                    # Fetch stock data using yfinance in a separate thread
                    data = await asyncio.to_thread(
                        download, ticker, start=yesterday.isoformat(), end=today.isoformat()
                    )

                    if not data.empty:
                        for index, row in data.iterrows():
                            record_date = index.date()  # Extract the date from the index

                            # Check if the record already exists in StockPrice
                            record_exists = await session.execute(
                                select(StockPrice).where(
                                    and_(
                                        StockPrice.stock_id == stock_id,
                                        StockPrice.date == record_date
                                    )
                                )
                            )

                            if record_exists.first():
                                print(f"[INFO] Record for {ticker} on {record_date} already exists. Skipping.")
                                continue

                            # Add a new record to StockPrice
                            stock_price = StockPrice(
                                stock_id=stock_id,
                                date=record_date,
                                open_price=round(float(row["Open"].iloc[0]), 2),
                                close_price=round(float(row["Close"].iloc[0]), 2),
                                high=round(float(row["High"].iloc[0]), 2),
                                low=round(float(row["Low"].iloc[0]), 2),
                                volume=int(row["Volume"].iloc[0]),
                            )
                            session.add(stock_price)

                        # Commit the session after processing the ticker
                        await session.commit()
                        print(f"[INFO] Updated prices for {ticker}")
                    else:
                        print(f"[WARNING] No data fetched for {ticker}")
                except Exception as e:
                    print(f"[ERROR] Failed to update prices for {ticker}: {e}")

    except Exception as e:
        print(f"[ERROR] Error in update_stock_data: {e}")

if __name__ == "__main__":
    asyncio.run(update_stock_data())
