#start.py
import asyncio
import logging
from tasks.sync_stocks import sync_stocks_with_user_stocks
from tasks.update_prices import update_stock_data
from tasks.daily import track_portfolio_performance, track_fear_greed_index

# Configure logging for better feedback during testing
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

if __name__ == "__main__":
    logging.info("Testing: sync_stocks_with_user_stocks")
    asyncio.run(sync_stocks_with_user_stocks())
    
    logging.info("Testing: update_stock_data")
    asyncio.run(update_stock_data())
    
    logging.info("Testing: track_portfolio_performance")
    asyncio.run(track_portfolio_performance())
    
    logging.info("Testing: track_fear_greed_index")
    asyncio.run(track_fear_greed_index())
    
    logging.info("All tasks have been tested.")
