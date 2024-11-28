from fastapi import APIRouter, HTTPException
from sqlalchemy import insert, select, update
from models import User, UserStock, Transaction
from database import database
import yfinance as yf
from schemas import TransactionResponse, TransactionCreate
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
from typing import List


router = APIRouter()


# Helper function to round to two decimal places
def round_to_two_decimals(value):
    return float(Decimal(value).quantize(Decimal("0.00"), rounding=ROUND_HALF_UP))


@router.post("/buy", response_model=TransactionResponse)
async def buy_stock(transaction: TransactionCreate):
    """
    Endpoint to buy a stock.
    """
    user_query = select(User).where(User.id == transaction.user_id)
    user = await database.fetch_one(user_query)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        ticker_data = yf.Ticker(transaction.ticker)
        price_data = ticker_data.history(period="1d")
        current_price = round_to_two_decimals(price_data["Close"].iloc[-1])  # Ensure price is rounded
    except Exception:
        raise HTTPException(status_code=404, detail="Could not fetch stock price")

    total_cost = round_to_two_decimals(current_price * transaction.quantity)
    if user["budget"] < total_cost:
        raise HTTPException(status_code=400, detail="Insufficient funds")

    # Update user's budget
    new_budget = round_to_two_decimals(user["budget"] - total_cost)
    await database.execute(
        update(User).where(User.id == transaction.user_id).values(budget=new_budget)
    )

    # Check if the stock already exists in the user's portfolio
    stock_query = select(UserStock).where(
        (UserStock.user_id == transaction.user_id) & (UserStock.ticker == transaction.ticker)
    )
    existing_stock = await database.fetch_one(stock_query)

    if existing_stock:
        new_quantity = existing_stock["quantity"] + transaction.quantity
        new_total_cost = round_to_two_decimals(existing_stock["total_cost"] + total_cost)
        new_purchase_price = round_to_two_decimals(new_total_cost / new_quantity)  # Weighted average
        await database.execute(
            update(UserStock)
            .where((UserStock.user_id == transaction.user_id) & (UserStock.ticker == transaction.ticker))
            .values(quantity=new_quantity, total_cost=new_total_cost, purchase_price=new_purchase_price)
        )
    else:
        await database.execute(
            insert(UserStock).values(
                user_id=transaction.user_id,
                ticker=transaction.ticker,
                quantity=transaction.quantity,
                purchase_price=current_price,
                total_cost=total_cost,
            )
        )

    transaction_id = await database.execute(
        insert(Transaction).values(
            user_id=transaction.user_id,
            ticker=transaction.ticker,
            transaction_type="buy",
            quantity=transaction.quantity,
            price=current_price,
            total_cost=total_cost,
            timestamp=datetime.utcnow(),
        )
    )

    return TransactionResponse(
        id=transaction_id,
        user_id=transaction.user_id,
        ticker=transaction.ticker,
        transaction_type="buy",
        quantity=transaction.quantity,
        price=current_price,
        total_cost=total_cost,
        timestamp=datetime.utcnow(),
    )


@router.post("/sell", response_model=TransactionResponse)
async def sell_stock(transaction: TransactionCreate):
    """
    Endpoint to sell a stock.
    """
    user_query = select(User).where(User.id == transaction.user_id)
    user = await database.fetch_one(user_query)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        ticker_data = yf.Ticker(transaction.ticker)
        price_data = ticker_data.history(period="1d")
        current_price = round_to_two_decimals(price_data["Close"].iloc[-1])  # Ensure price is rounded
    except Exception:
        raise HTTPException(status_code=404, detail="Could not fetch stock price")

    stock_query = select(UserStock).where(
        (UserStock.user_id == transaction.user_id) & (UserStock.ticker == transaction.ticker)
    )
    existing_stock = await database.fetch_one(stock_query)

    if not existing_stock or existing_stock["quantity"] < transaction.quantity:
        raise HTTPException(status_code=400, detail="Not enough shares to sell")

    total_sale_value = round_to_two_decimals(current_price * transaction.quantity)

    # Update user's budget
    new_budget = round_to_two_decimals(user["budget"] + total_sale_value)
    await database.execute(
        update(User).where(User.id == transaction.user_id).values(budget=new_budget)
    )

    new_quantity = existing_stock["quantity"] - transaction.quantity
    if new_quantity == 0:
        # Remove stock from portfolio
        await database.execute(
            UserStock.delete().where(
                (UserStock.user_id == transaction.user_id) & (UserStock.ticker == transaction.ticker)
            )
        )
    else:
        # Update portfolio
        new_total_cost = round_to_two_decimals(existing_stock["total_cost"] - (existing_stock["purchase_price"] * transaction.quantity))
        await database.execute(
            update(UserStock)
            .where((UserStock.user_id == transaction.user_id) & (UserStock.ticker == transaction.ticker))
            .values(quantity=new_quantity, total_cost=new_total_cost)
        )

    transaction_id = await database.execute(
        insert(Transaction).values(
            user_id=transaction.user_id,
            ticker=transaction.ticker,
            transaction_type="sell",
            quantity=transaction.quantity,
            price=current_price,
            total_cost=total_sale_value,
            timestamp=datetime.utcnow(),
        )
    )

    return TransactionResponse(
        id=transaction_id,
        user_id=transaction.user_id,
        ticker=transaction.ticker,
        transaction_type="sell",
        quantity=transaction.quantity,
        price=current_price,
        total_cost=total_sale_value,
        timestamp=datetime.utcnow(),
    )


@router.get("/{user_id}", response_model=List[TransactionResponse])
async def get_user_transactions(user_id: int):
    """
    Fetch all transactions for a specific user.
    """
    stmt = select(Transaction).where(Transaction.user_id == user_id).order_by(Transaction.timestamp.desc())
    transactions = await database.fetch_all(stmt)
    return transactions
