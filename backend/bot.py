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
# We'll store sells as (price, quantity, position_id) to link to a unique position
sell_orders = []        
positions_dict = {}     # {position_id: {'buy_price': Decimal, 'quantity': Decimal}}
occupied_prices = set() # Track price levels that are occupied (either buy or sell)
prev_price_cents = None
total_profit_loss = Decimal('0.0')
position_id_counter = 0  # To assign unique IDs to each position

# Database setup with asynchronous engine
DATABASE_URL = "sqlite+aiosqlite:///stock_manager.db"
engine = create_async_engine(DATABASE_URL, echo=False)
async_session_maker = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

def save_state():
    global buy_orders, sell_orders, positions_dict, budget, total_profit_loss, occupied_prices, prev_price_cents, position_id_counter

    def convert_decimals(obj):
        """Recursively convert Decimal objects to float."""
        if isinstance(obj, Decimal):
            return float(obj)
        elif isinstance(obj, dict):
            return {k: convert_decimals(v) for k, v in obj.items()}
        elif isinstance(obj, (list, tuple)):
            return [convert_decimals(i) for i in obj]
        elif isinstance(obj, set):
            return [convert_decimals(i) for i in obj]
        else:
            return obj

    # Convert the positions_dict keys (position_id) to string if needed
    positions_out = {str(k): v for k, v in positions_dict.items()}

    state = {
        "buy_orders": convert_decimals(buy_orders),
        "sell_orders": convert_decimals(sell_orders),
        "positions_dict": convert_decimals(positions_out),
        "budget": float(budget),
        "total_profit_loss": float(total_profit_loss),
        "occupied_prices": convert_decimals(list(occupied_prices)),
        "prev_price_cents": prev_price_cents,
        "position_id_counter": position_id_counter
    }

    try:
        import tempfile
        with tempfile.NamedTemporaryFile("w", delete=False) as tmp_file:
            json.dump(state, tmp_file)
            tmp_filename = tmp_file.name
        os.replace(tmp_filename, state_file)  # Atomically replace the old file
    except Exception as e:
        logging.error(f"Failed to save state: {e}")


def load_state():
    global buy_orders, sell_orders, positions_dict, budget, total_profit_loss, occupied_prices, prev_price_cents, position_id_counter

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
            positions_loaded = convert_to_decimal(state.get("positions_dict", {}))
            # convert position keys back to int
            positions_dict = {int(k): v for k, v in positions_loaded.items()}
            budget = Decimal(str(state.get("budget", '1000000')))
            total_profit_loss = Decimal(str(state.get("total_profit_loss", '0.0')))
            occupied_prices = set(convert_to_decimal(state.get("occupied_prices", [])))
            prev_price_cents = state.get("prev_price_cents", None)
            position_id_counter = state.get("position_id_counter", 0)
            logging.info("Bot state loaded successfully.")
        except (ValueError, json.JSONDecodeError) as e:
            logging.error(f"Failed to load state: {e}. Resetting state to defaults.")
            reset_state()
    else:
        # Initialize default values if no state file exists
        reset_state()

def reset_state():
    global buy_orders, sell_orders, positions_dict, occupied_prices, budget, total_profit_loss, prev_price_cents, position_id_counter
    buy_orders = []
    sell_orders = []
    positions_dict = {}
    occupied_prices = set()
    budget = Decimal('1000000')
    total_profit_loss = Decimal('0.0')
    prev_price_cents = None
    position_id_counter = 0


async def log_trade(timestamp, action, price, quantity, budget, profit_loss):
    """Log trade details to the database."""
    try:
        async with async_session_maker() as session:
            trade = Trade(
                timestamp=datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S"),
                action=action,
                ticker=ticker,
                price=Decimal(str(price)),
                quantity=Decimal(str(quantity)),
                profit_loss=Decimal(str(round(profit_loss, 2))),
                budget=Decimal(str(round(budget, 2)))
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

    # Sunday: open at 6 PM
    if current_weekday == 6:
        return current_time >= datetime_time(18, 0)
    # Monday-Thursday: 24 hours, except brief maintenance break usually not considered here
    elif current_weekday in {0, 1, 2, 3}:
        return True
    # Friday: closes at 5 PM
    elif current_weekday == 4:
        return current_time < datetime_time(17, 0)
    # Saturday: closed
    else:
        return False

async def fetch_latest_data(session):
    """Fetch the latest price and timestamp using aiohttp."""
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}?interval=1m&range=1d"
    async with session.get(url) as response:
        data = await response.json()
        try:
            result = data['chart']['result'][0]
            # Check if 'timestamp' key exists and is not empty
            if 'timestamp' not in result or not result['timestamp']:
                logging.info("No timestamp data available. Possibly the market is closed.")
                return None, None

            timestamp = result['timestamp'][-1]
            quote = result['indicators']['quote'][0]
            if 'close' not in quote or not quote['close']:
                logging.info("No close price data available.")
                return None, None

            current_price = quote['close'][-1]
            if current_price is None:
                logging.info("Close price is None. Market might be closed or data unavailable.")
                return None, None

            current_time = datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d %H:%M:%S")
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
            if order[0] in occupied_prices:
                occupied_prices.remove(order[0])


def remove_unoccupied_prices(potential_buy_prices_cents, current_time):
    """Remove price levels from occupied_prices that are no longer among the 10 nearest."""
    global occupied_prices
    for price in list(occupied_prices):
        price_cents = int(round(Decimal(price) * 100))
        # Check if this price is used by any buy or sell orders
        buy_exists = any(int(round(Decimal(o[0])*100)) == price_cents for o in buy_orders)
        sell_exists = any(int(round(Decimal(o[0])*100)) == price_cents for o in sell_orders)
        if price_cents not in potential_buy_prices_cents and not buy_exists and not sell_exists:
            occupied_prices.remove(price)
            logging.info(
                f"Time: {current_time} - Removed price level ${price} from occupied_prices "
                "as it's no longer among the 10 nearest and has no active orders."
            )

def get_lowest_sell_price():
    """Return the lowest sell order price if any sells exist."""
    if sell_orders:
        return min(s[0] for s in sell_orders)
    return None

def place_buy_orders(potential_buy_prices_cents, current_price_cents, current_time):
    """Place new buy limit orders for the 10 nearest price levels if not already occupied."""
    global buy_orders, occupied_prices, budget, sell_orders
    price_increment_cents = int(price_increment * 100)
    lowest_sell = get_lowest_sell_price()

    for buy_price_cents in potential_buy_prices_cents:
        buy_price = Decimal(buy_price_cents) / 100
        # Only add a new buy if we have room
        if buy_price not in occupied_prices and len(occupied_prices) < 10 and budget >= buy_price:
            # Check against existing sells to avoid being too close
            if lowest_sell is not None:
                # If new buy would be >= (lowest_sell - 10), skip
                if buy_price >= (lowest_sell - Decimal('10')):
                    logging.info(
                        f"Time: {current_time} - Skipping new buy at ${buy_price} since it's too close to sell orders."
                    )
                    continue

            quantity = Decimal('0.1')
            buy_orders.append((buy_price, quantity))
            occupied_prices.add(buy_price)
            logging.info(
                f"Time: {current_time} - Setting buy limit order at ${buy_price} "
                f"for {quantity} unit(s)"
            )

async def execute_buy_orders(current_price, current_time):
    global buy_orders, sell_orders, positions_dict, budget, occupied_prices, position_id_counter

    for order in list(buy_orders):
        order_price = order[0]
        order_quantity = order[1]

        if current_price <= order_price and budget >= order_price * order_quantity:
            # Execute the buy
            budget -= order_price * order_quantity
            buy_orders.remove(order)
            if order_price in occupied_prices:
                occupied_prices.remove(order_price)  # Remove the executed buy price

            # Create a unique position ID
            position_id_counter += 1
            pos_id = position_id_counter
            positions_dict[pos_id] = {'buy_price': order_price, 'quantity': order_quantity}

            logging.info(
                f"Time: {current_time} - Executed buy order at ${order_price} "
                f"for {order_quantity} unit(s). Remaining budget: ${budget:.2f}"
            )
            await log_trade(current_time, 'Buy', float(order_price), float(order_quantity), float(budget), 0.0)

            # Set corresponding sell order if not already present
            sell_price = order_price + price_increment
            if not any(s[0] == sell_price for s in sell_orders):
                sell_orders.append((sell_price, order_quantity, pos_id))
                occupied_prices.add(sell_price)
                logging.info(
                    f"Time: {current_time} - Setting sell limit order at ${sell_price} "
                    f"for {order_quantity} unit(s)"
                )
            else:
                logging.info(
                    f"Time: {current_time} - Skipping duplicate sell order at ${sell_price}."
                )

            # Add a new buy order 100 points below the executed buy price
            new_buy_price = order_price - Decimal('100')
            if new_buy_price > 0 and new_buy_price not in occupied_prices and budget >= new_buy_price * order_quantity:
                buy_orders.append((new_buy_price, order_quantity))
                occupied_prices.add(new_buy_price)
                logging.info(
                    f"Time: {current_time} - Setting new buy limit order at ${new_buy_price} "
                    f"for {order_quantity} unit(s)"
                )



async def execute_sell_orders(current_price, current_time):
    global sell_orders, positions_dict, budget, occupied_prices, total_profit_loss

    for order in list(sell_orders):
        order_price = order[0]
        order_quantity = order[1]
        pos_id = order[2]

        if current_price >= order_price:
            # Execute the sell
            budget += order_price * order_quantity
            sell_orders.remove(order)
            if order_price in occupied_prices:
                occupied_prices.remove(order_price)

            position = positions_dict.get(pos_id, None)
            if position:
                profit_loss = (order_price - position['buy_price']) * order_quantity
                total_profit_loss += profit_loss
                del positions_dict[pos_id]
            else:
                # Should not happen, but handle gracefully
                profit_loss = Decimal('0.0')
                logging.warning(
                    f"Time: {current_time} - No matching position found for sell at ${order_price} "
                    f"with position ID {pos_id}. This should not happen."
                )

            logging.info(
                f"Time: {current_time} - Executed sell order at ${order_price} "
                f"for {order_quantity} unit(s). Updated budget: ${budget:.2f}, Profit/Loss: ${profit_loss:.2f}"
            )
            await log_trade(current_time, 'Sell', float(order_price), float(order_quantity), float(budget), float(profit_loss))


def check_and_add_new_buy(current_price, current_time):
    global buy_orders, sell_orders, positions_dict, occupied_prices, budget

    highest_buy_price = max([o[0] for o in buy_orders], default=None)
    if highest_buy_price is None:
        return  # No buy orders placed yet

    # Condition 1: Price moved away more than $10
    if current_price > highest_buy_price + Decimal('10'):
        # Calculate the new buy price
        new_buy_price = (current_price // Decimal('10')) * Decimal('10')

        # Check if a buy was already executed at this price level
        if any(pos['buy_price'] == new_buy_price for pos in positions_dict.values()):
            logging.info(
                f"Time: {current_time} - Skipping new buy at ${new_buy_price} as it was already executed."
            )
            return

        # Check if there's an overlapping or conflicting sell order
        if any(
            abs(sell_order[0] - new_buy_price) < price_increment
            for sell_order in sell_orders
        ):
            logging.info(
                f"Time: {current_time} - Skipping new buy at ${new_buy_price} "
                "due to conflict with existing sell orders."
            )
            return

        # Place the new buy order if all conditions are satisfied
        if new_buy_price > 0 and new_buy_price not in occupied_prices and budget >= new_buy_price * Decimal('0.1'):
            buy_orders.append((new_buy_price, Decimal('0.1')))
            occupied_prices.add(new_buy_price)
            logging.info(
                f"Time: {current_time} - Price ran away, added new buy at ${new_buy_price}"
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
    print(f"Total Realized Profit/Loss: ${total_profit_loss:.2f}")
    print(f"Open Positions: {len(positions_dict)}")

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

                current_price_cents = int(round(current_price * 100))
                if prev_price_cents is not None:
                    price_moved_up = current_price_cents > prev_price_cents
                else:
                    price_moved_up = False

                prev_price_cents = current_price_cents

                potential_buy_prices_cents = calculate_price_levels(current_price_cents)

                # Cancel outdated buy orders if price moved up
                ##if price_moved_up:
                    ##cancel_outdated_buy_orders(potential_buy_prices_cents, current_time)

                remove_unoccupied_prices(potential_buy_prices_cents, current_time)
                place_buy_orders(potential_buy_prices_cents, current_price_cents, current_time)
                check_and_add_new_buy(current_price, current_time)
                await execute_buy_orders(current_price, current_time)
                await execute_sell_orders(current_price, current_time) 

                print_status(current_time, current_price)

                # Save state
                save_state()

                await asyncio.sleep(15)

            except Exception as e:
                logging.error(f"An error occurred: {e}")
                await asyncio.sleep(15)

if __name__ == "__main__":
    asyncio.run(main())
