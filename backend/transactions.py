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


@router.post("/add", response_model=TransactionResponse)
async def add_stock(transaction: TransactionCreate):
    """
    Endpoint to add a stock manually to the user's portfolio.
    """
    # Validate user existence
    user_query = select(User).where(User.id == transaction.user_id)
    user = await database.fetch_one(user_query)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    # Ensure a valid purchase price is provided
    if transaction.price is None or transaction.price <= 0:
        raise HTTPException(status_code=400, detail="Invalid purchase price")

    # Calculate total cost of the new stock addition
    total_cost = round_to_two_decimals(transaction.price * transaction.quantity)

    # Check if the user has sufficient budget
    if user["budget"] < total_cost:
        raise HTTPException(status_code=400, detail="Insufficient funds")

    # Deduct the total cost from the user's budget
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
        # Update existing stock
        new_quantity = existing_stock["quantity"] + transaction.quantity
        new_total_cost = round_to_two_decimals(existing_stock["total_cost"] + total_cost)
        new_purchase_price = round_to_two_decimals(new_total_cost / new_quantity)  # Weighted average
        await database.execute(
            update(UserStock)
            .where((UserStock.user_id == transaction.user_id) & (UserStock.ticker == transaction.ticker))
            .values(quantity=new_quantity, total_cost=new_total_cost, purchase_price=new_purchase_price)
        )
    else:
        # Add a new stock to the user's portfolio
        await database.execute(
            insert(UserStock).values(
                user_id=transaction.user_id,
                ticker=transaction.ticker,
                quantity=transaction.quantity,
                purchase_price=transaction.price,
                total_cost=total_cost,
            )
        )

    # Record the transaction in the transaction table
    transaction_id = await database.execute(
        insert(Transaction).values(
            user_id=transaction.user_id,
            ticker=transaction.ticker,
            transaction_type="buy", 
            quantity=transaction.quantity,
            price=transaction.price,
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
        price=transaction.price,
        total_cost=total_cost,
        timestamp=datetime.utcnow(),
    )



@router.post("/remove", response_model=TransactionResponse)
async def sell_stock(transaction: TransactionCreate):
    """
    Endpoint to sell a stock.
    """
    user_query = select(User).where(User.id == transaction.user_id)
    user = await database.fetch_one(user_query)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    stock_query = select(UserStock).where(
        (UserStock.user_id == transaction.user_id) & (UserStock.ticker == transaction.ticker)
    )
    existing_stock = await database.fetch_one(stock_query)

    if not existing_stock or existing_stock["quantity"] < transaction.quantity:
        raise HTTPException(status_code=400, detail="Not enough shares to sell")

    # Validate the provided selling price
    if transaction.price <= 0:
        raise HTTPException(status_code=400, detail="Invalid selling price provided")

    total_sale_value = round_to_two_decimals(transaction.price * transaction.quantity)

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
            price=transaction.price,  # Use the price provided by the user
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
        price=transaction.price,  # Return the user's provided price
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
