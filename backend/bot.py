import asyncio
import aiohttp
import time as time_module  
import math
import csv
import os
import pytz
import json
from datetime import datetime, time as datetime_time
import logging
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from models import Trade
from decimal import Decimal
import tempfile

# Configure logging
logging.basicConfig(
    filename='trading_bot.log',
    level=logging.INFO,
    format='%(asctime)s %(levelname)s:%(message)s'
)

# Global Variables
state_file = "bot_state.json"  # File to store the bot's state
budget = Decimal('1000000')    # $1,000,000 initial budget
ticker = 'NQ=F'
price_increment = Decimal('10')  # Use $10 increments

# Initialize state variables
buy_orders = []         # Each entry is (price, quantity)
sell_orders = []        # Each entry is (price, quantity)
positions = []          # Each entry is {'buy_price': price, 'quantity': qty}
occupied_prices = set() # To track price levels that are occupied
prev_price_cents = None
total_profit_loss = Decimal('0.0')

# Database setup with asynchronous engine
DATABASE_URL = "sqlite+aiosqlite:///stock_manager.db"  
engine = create_async_engine(DATABASE_URL, echo=False)
async_session_maker = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

def save_state():
    global buy_orders, sell_orders, positions, budget, total_profit_loss, occupied_prices, prev_price_cents

    def convert_decimals(obj):
        """Recursively convert Decimal objects to float."""
        if isinstance(obj, Decimal):
            logging.debug(f"Converting Decimal to float: {obj}")
            return float(obj)
        elif isinstance(obj, dict):
            return {k: convert_decimals(v) for k, v in obj.items()}
        elif isinstance(obj, (list, tuple, set)):
            return [convert_decimals(i) for i in obj]
        else:
            return obj

    state = {
        "buy_orders": convert_decimals(buy_orders),
        "sell_orders": convert_decimals(sell_orders),
        "positions": convert_decimals(positions),
        "budget": float(budget),
        "total_profit_loss": float(total_profit_loss),
        "occupied_prices": convert_decimals(list(occupied_prices)),  # Convert set to list
        "prev_price_cents": prev_price_cents,
    }

    try:
        import tempfile
        import os
        with tempfile.NamedTemporaryFile("w", delete=False) as tmp_file:
            json.dump(state, tmp_file)
            tmp_filename = tmp_file.name
        os.replace(tmp_filename, state_file)  # Atomically replace the old file
        logging.info("Bot state saved successfully.")
    except Exception as e:
        logging.error(f"Failed to save state: {e}")


def load_state():
    global buy_orders, sell_orders, positions, budget, total_profit_loss, occupied_prices, prev_price_cents

    def convert_to_decimal(obj):
        """Recursively convert numeric types to Decimal."""
        if isinstance(obj, list):
            return [convert_to_decimal(i) for i in obj]
        elif isinstance(obj, dict):
            return {k: convert_to_decimal(v) for k, v in obj.items()}
        elif isinstance(obj, float) or isinstance(obj, int):
            return Decimal(str(obj))
        else:
            return obj

    if os.path.exists(state_file):
        try:
            with open(state_file, "r") as f:
                state = json.load(f)
            buy_orders = convert_to_decimal(state.get("buy_orders", []))
            sell_orders = convert_to_decimal(state.get("sell_orders", []))
            positions = convert_to_decimal(state.get("positions", []))
            budget = Decimal(str(state.get("budget", '1000000')))
            total_profit_loss = Decimal(str(state.get("total_profit_loss", '0.0')))
            occupied_prices = set(convert_to_decimal(state.get("occupied_prices", [])))
            prev_price_cents = state.get("prev_price_cents", None)
            logging.info("Bot state loaded successfully.")
        except (ValueError, json.JSONDecodeError) as e:
            logging.error(f"Failed to load state: {e}. Resetting state to defaults.")
            # Initialize default values
            buy_orders = []
            sell_orders = []
            positions = []
            occupied_prices = set()
            budget = Decimal('1000000')
            total_profit_loss = Decimal('0.0')
            prev_price_cents = None
    else:
        # Initialize default values if no state file exists
        buy_orders = []
        sell_orders = []
        positions = []
        occupied_prices = set()
        budget = Decimal('1000000')
        total_profit_loss = Decimal('0.0')
        prev_price_cents = None



async def log_trade(timestamp, action, price, quantity, budget, profit_loss):
    """Log trade details to the database."""
    try:
        async with async_session_maker() as session:
            # Add trade record to the database
            trade = Trade(
                timestamp=datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S"),
                action=action,
                ticker=ticker,
                price=price,
                quantity=quantity,
                profit_loss=round(profit_loss, 2),
                budget=round(budget, 2)
            )
            session.add(trade)
            await session.commit()
            logging.info(f"Logged trade: {action} {quantity} {ticker} at ${price}")
    except Exception as e:
        logging.error(f"Failed to log trade: {e}")

def is_market_open():
    """Check if the market is currently open based on futures trading hours."""
    tz = pytz.timezone('US/Eastern')
    now = datetime.now(tz)
    current_weekday = now.weekday()
    current_time = now.time()

    # Debug log
    logging.debug(f"Checking market open status - Time: {now}, Weekday: {current_weekday}")

    if current_weekday == 6:  # Sunday
        if current_time >= datetime_time(18, 0):
            logging.debug("Market is open (Sunday evening).")
            return True
        else:
            logging.debug("Market is closed (Sunday before 6 PM).")
            return False
    elif current_weekday == 4:  # Friday
        if current_time < datetime_time(17, 0):
            logging.debug("Market is open (Friday before 5 PM).")
            return True
        else:
            logging.debug("Market is closed (Friday after 5 PM).")
            return False
    elif current_weekday in {0, 1, 2, 3}:  # Monday to Thursday
        logging.debug("Market is open (Monday to Thursday).")
        return True
    else:  # Saturday
        logging.debug("Market is closed (Saturday).")
        return False

async def fetch_latest_data(session):
    """Fetch the latest price and timestamp using aiohttp."""
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}?interval=1m&range=1d"
    async with session.get(url) as response:
        data = await response.json()
        try:
            result = data['chart']['result'][0]
            timestamp = result['timestamp'][-1]
            current_time = datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d %H:%M:%S")
            current_price = result['indicators']['quote'][0]['close'][-1]
            if current_price is None:
                logging.info("No data available. Market might be closed.")
                return None, None
            return Decimal(str(current_price)), current_time
        except (KeyError, IndexError, TypeError) as e:
            logging.error(f"Failed to parse data: {e}")
            return None, None

def calculate_price_levels(current_price_cents):
    """Calculate the 10 nearest multiples of price increments below the current price."""
    price_increment_cents = int(price_increment * 100)
    nearest_multiple_cents = (current_price_cents // price_increment_cents) * price_increment_cents
    potential_buy_prices_cents = [
        nearest_multiple_cents - (i * price_increment_cents) for i in range(10)
    ]
    return potential_buy_prices_cents

def cancel_outdated_buy_orders(potential_buy_prices_cents, current_time):
    """Cancel buy orders that are no longer among the 10 nearest price levels."""
    global buy_orders, occupied_prices
    for order in list(buy_orders):
        order_price_cents = int(round(order[0] * 100))
        if order_price_cents not in potential_buy_prices_cents:
            buy_orders.remove(order)
            occupied_prices.remove(order[0])
            logging.info(
                f"Time: {current_time} - Cancelled buy limit order at ${order[0]} "
                "as it's no longer among the 10 nearest price levels due to price increase."
            )

def remove_unoccupied_prices(potential_buy_prices_cents, current_time):
    """Remove price levels from occupied_prices that are no longer among the 10 nearest."""
    global occupied_prices
    for price in list(occupied_prices):
        price_cents = int(round(Decimal(price) * 100))
        if price_cents not in potential_buy_prices_cents:
            if all(int(round(Decimal(order[0]) * 100)) != price_cents for order in buy_orders) and \
               all(int(round(Decimal(order[0]) * 100)) != price_cents + int(price_increment * 100) for order in sell_orders):
                occupied_prices.remove(price)
                logging.info(
                    f"Time: {current_time} - Removed price level ${price} from occupied_prices "
                    "as it's no longer among the 10 nearest and has no active orders."
                )

def place_buy_orders(potential_buy_prices_cents, current_price_cents, current_time):
    """Place new buy limit orders for the 10 nearest price levels if not already occupied."""
    global buy_orders, occupied_prices, budget
    price_increment_cents = int(price_increment * 100)
    for buy_price_cents in potential_buy_prices_cents:
        buy_price = Decimal(buy_price_cents) / 100  # Convert back to dollars
        if buy_price not in occupied_prices and len(occupied_prices) < 10 and budget >= buy_price:
            quantity = Decimal('0.1')
            buy_orders.append((buy_price, quantity))
            occupied_prices.add(buy_price)
            logging.info(
                f"Time: {current_time} - Setting buy limit order at ${buy_price} "
                f"for {quantity} unit(s)"
            )

async def execute_buy_orders(current_price, current_time):
    """Execute buy orders if conditions are met."""
    global buy_orders, sell_orders, positions, budget, occupied_prices
    for order in list(buy_orders):
        order_price = order[0]
        order_quantity = order[1]
        if current_price <= order_price and budget >= order_price * order_quantity:
            budget -= order_price * order_quantity
            buy_orders.remove(order)
            positions.append({'buy_price': order_price, 'quantity': order_quantity})
            logging.info(
                f"Time: {current_time} - Executed buy order at ${order_price} "
                f"for {order_quantity} unit(s). Remaining budget: ${budget:.2f}"
            )
            await log_trade(current_time, 'Buy', float(order_price), float(order_quantity), float(budget), 0.0)
            # Set corresponding sell order
            sell_price = order_price + price_increment
            sell_orders.append((sell_price, order_quantity))
            logging.info(
                f"Time: {current_time} - Setting sell limit order at ${sell_price} "
                f"for {order_quantity} unit(s)"
            )
            # occupied_prices remains the same since the price level is still occupied by the sell order

async def execute_sell_orders(current_price, current_time):
    """Execute sell orders if conditions are met."""
    global sell_orders, positions, budget, occupied_prices, total_profit_loss
    for order in list(sell_orders):
        order_price = order[0]
        order_quantity = order[1]
        if current_price >= order_price:
            budget += order_price * order_quantity
            sell_orders.remove(order)
            original_buy_price = order_price - price_increment
            logging.info(
                f"Time: {current_time} - Executed sell order at ${order_price} "
                f"for {order_quantity} unit(s). Updated budget: ${budget:.2f}"
            )
            # Calculate profit/loss for this trade
            position = next(
                (pos for pos in positions if pos['buy_price'] == original_buy_price and pos['quantity'] == order_quantity),
                None
            )
            if position:
                profit_loss = (order_price - position['buy_price']) * order_quantity
                total_profit_loss += profit_loss
                positions.remove(position)
            else:
                profit_loss = Decimal('0.0')  # This should not happen
            await log_trade(current_time, 'Sell', float(order_price), float(order_quantity), float(budget), float(profit_loss))
            # Remove the price level from occupied_prices
            occupied_prices.remove(float(original_buy_price))
            logging.info(
                f"Time: {current_time} - Price level ${original_buy_price} is now unoccupied."
            )

def print_status(current_time, current_price):
    """Print the current status of orders and positions."""
    print(f"\nTime: {current_time} - Current Price: ${current_price:.2f}")
    print("Active Buy Orders:")
    for order in sorted(buy_orders, key=lambda x: x[0], reverse=True):
        print(f"  Buy at ${order[0]:.2f} for {order[1]} unit(s)")
    print("Active Sell Orders:")
    for order in sorted(sell_orders, key=lambda x: x[0]):
        print(f"  Sell at ${order[0]:.2f} for {order[1]} unit(s)")
    print(f"Occupied Price Levels: {[float(price) for price in sorted(occupied_prices)]}")
    print(f"Total Realized Profit/Loss: ${total_profit_loss:.2f}\n")



async def main():
    """Main function to run the trading bot."""
    global prev_price_cents

    # Load state from storage
    load_state()

    async with aiohttp.ClientSession() as http_session:
        while True:
            try:
                # Check if market is open
                if not is_market_open():
                    print("Market is closed. Waiting for market to open...")
                    await asyncio.sleep(60)
                    continue

                current_price, current_time = await fetch_latest_data(http_session)
                if current_price is None:
                    await asyncio.sleep(15)
                    continue

                # Normalize prices to cents to avoid floating-point issues
                current_price_cents = int(round(current_price * 100))
                price_increment_cents = int(price_increment * 100)

                # Determine if the price has increased or decreased
                if prev_price_cents is not None:
                    price_moved_up = current_price_cents > prev_price_cents
                else:
                    price_moved_up = False  # On first run

                prev_price_cents = current_price_cents  # Update previous price

                # Calculate potential buy prices
                potential_buy_prices_cents = calculate_price_levels(current_price_cents)

                # Cancel outdated buy orders
                if price_moved_up:
                    cancel_outdated_buy_orders(potential_buy_prices_cents, current_time)

                # Remove unoccupied prices
                remove_unoccupied_prices(potential_buy_prices_cents, current_time)

                # Place new buy orders
                place_buy_orders(potential_buy_prices_cents, current_price_cents, current_time)

                # Execute orders
                await execute_buy_orders(current_price, current_time)
                await execute_sell_orders(current_price, current_time)

                # Print status
                print_status(current_time, current_price)

                # Save state periodically (after significant actions)
                save_state()

                await asyncio.sleep(15)

            except Exception as e:
                logging.error(f"An error occurred: {e}")
                await asyncio.sleep(15)

if __name__ == "__main__":
    asyncio.run(main())
