from fastapi import APIRouter, HTTPException, Request, Query, Depends
from pydantic import BaseModel
import httpx
import os
import logging
from dotenv import load_dotenv
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.ext.asyncio import AsyncSession

# Import your models, database, schemas, and portfolio logic
from models import User, UserStock  # Replace with the actual path
from database import get_db  # Replace with your actual dependency for AsyncSession
from schemas import MessageRequest  # Your Pydantic model for requests
from portfolio import get_user_portfolio  # Your portfolio function

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

# Configure rate limiting
limiter = Limiter(key_func=get_remote_address)

# Create a router
router = APIRouter()

# API key and Gemini endpoint
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise ValueError("GEMINI_API_KEY is not set. Please configure it in the .env file.")

GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent"

# Base URL for portfolio backend API
BASE_URL = "http://localhost:8000/api/portfolio"

# --- Utility Endpoint ---
@router.get("/validate-config", tags=["utility"], summary="Validate environment configuration")
async def validate_config():
    if not API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not set.")
    return {"status": "success", "message": "All configurations are valid."}

# --- Main AI Endpoint ---
@router.post("/generate-answer", summary="Generate AI content or modify portfolio")
@limiter.limit("10/minute")  # Limit to 10 requests per minute
async def generate_content(
    request: Request,
    message_request: MessageRequest,
    user_id: int = Query(...),
    session: AsyncSession = Depends(get_db),
):
    """
    Handles the user message:
    - If it contains 'add shares' or 'sell/remove', modifies the portfolio and records transactions.
    - Otherwise, queries the Gemini API for a generated response based on the user's portfolio.
    """
    user_message = message_request.message.lower()

    # Determine if it's an add or remove command
    if "add" in user_message and "shares" in user_message:
        # Add stock command
        try:
            ticker, quantity, price = parse_add_command(user_message)
            response_message = await add_stock_and_record(user_id, ticker, quantity, price)
        except Exception as e:
            logging.exception("Error handling add command")
            response_message = f"Failed to add stock: {str(e)}"

    elif "sell" in user_message or "remove" in user_message:
        # Remove stock command
        try:
            ticker = parse_remove_command(user_message)
            response_message = await remove_stock_and_record(user_id, ticker)
        except Exception as e:
            logging.exception("Error handling remove command")
            response_message = f"Failed to remove stock: {str(e)}"

    else:
        # No direct command detected, generate AI response
        prompt = await format_prompt(user_message, user_id, session)
        response_message = await generate_gemini_response(prompt)

    return {"content": response_message}


# --- Helper Functions ---

def parse_add_command(message: str):
    """
    Parses a message like 'Add 10 shares of AAPL at $150'.
    Expected format: "add [quantity] shares of [ticker] at $[price]"
    """
    parts = message.split()
    # Example: ["add", "10", "shares", "of", "AAPL", "at", "$150"]
    # ticker is at index 4, quantity at index 1, price at index 6 (strip '$')
    if len(parts) < 7:
        raise ValueError("Invalid add command format.")
    ticker = parts[4].upper()
    quantity = int(parts[1])
    price_str = parts[6].strip('$')
    price = float(price_str)
    return ticker, quantity, price

def parse_remove_command(message: str):
    """
    Parses a message like 'Remove AAPL' or 'Sell TSLA'.
    Expected format: "remove [ticker]" or "sell [ticker]"
    """
    parts = message.split()
    if len(parts) < 2:
        raise ValueError("Invalid remove command format.")
    return parts[1].upper()


async def add_stock_and_record(user_id: int, ticker: str, quantity: int, price: float):
    """
    Calls the backend to add a stock and then records the transaction.
    """
    async with httpx.AsyncClient() as client:
        # Add the stock to the portfolio
        add_response = await client.post(
            f"{BASE_URL}/add",
            json={"user_id": user_id, "ticker": ticker, "quantity": quantity, "purchase_price": price},
        )
        add_response.raise_for_status()

        # Record the 'buy' transaction
        transaction_response = await client.post(
            f"http://localhost:8000/api/transactions/add",
            json={
                "user_id": user_id,
                "ticker": ticker,
                "transaction_type": "buy",
                "quantity": quantity,
                "price": price,
            },
        )
        transaction_response.raise_for_status()

    return f"Successfully added {quantity} shares of {ticker} at ${price:.2f} each. Transaction recorded."


async def remove_stock_and_record(user_id: int, ticker: str):
    """
    Calls the backend to remove a stock and then records the transaction.
    """
    async with httpx.AsyncClient() as client:
        # Remove the stock from the portfolio
        remove_response = await client.delete(
            f"{BASE_URL}/remove",
            params={"user_id": user_id, "ticker": ticker},
        )
        remove_response.raise_for_status()

        # Record the 'sell' transaction (assuming selling all)
        transaction_response = await client.post(
            f"http://localhost:8000/api/transactions/remove",
            json={
                "user_id": user_id,
                "ticker": ticker,
                "transaction_type": "sell",
                "quantity": 0,  # For removing all shares
                "price": 0,     # If not needed, can be left as 0
            },
        )
        transaction_response.raise_for_status()

    return f"Successfully removed all shares of {ticker} from your portfolio. Transaction recorded."


async def format_prompt(user_message: str, user_id: int, session: AsyncSession) -> str:
    """
    Formats the prompt to include AI behavior instructions and portfolio data.
    """
    portfolio_response = await get_user_portfolio(user_id, session)

    portfolio_summary = "\n".join(
        f"{entry.ticker}: {entry.quantity} shares @ ${entry.purchase_price:.2f}, "
        f"current price: ${entry.current_price:.2f}, total value: ${entry.current_value:.2f}"
        for entry in portfolio_response.portfolio
    )

    total_value = portfolio_response.total_portfolio_value

    base_instructions = (
        "You are a professional financial advisor specializing in portfolio management. "
        "Your goal is to help the user optimize their portfolio and make informed financial decisions. "
        "Always respond in a clear, concise, and professional manner. Use examples where applicable. "
        "Be positive and avoid financial jargon unless absolutely necessary."
    )

    additional_context = (
        f"\n\nHere is the user's current portfolio:\n"
        f"{portfolio_summary}\n"
        f"Total Portfolio Value: ${total_value:.2f}"
    )

    guidelines = (
        "\n\nGuidelines for your responses:\n"
        "- Provide actionable advice tailored to the user's portfolio.\n"
        "- Break down complex topics into simple, understandable parts.\n"
        "- If unsure about a topic, politely suggest consulting a financial professional.\n"
        "- Conclude your responses with a brief summary or next steps."
    )

    return (
        f"{base_instructions}{additional_context}{guidelines}\n\n"
        f"User message: {user_message}"
    )


async def generate_gemini_response(prompt: str) -> str:
    """
    Sends the prompt to the Gemini API and returns the generated response.
    """
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [
            {"parts": [{"text": prompt}]}
        ]
    }

    logging.info(f"Generated prompt: {prompt}")

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{GEMINI_API_URL}?key={API_KEY}",
                json=payload,
                headers=headers,
            )
            response_data = response.json()

        logging.info(f"Gemini API response: {response_data}")

        if response.status_code != 200:
            error_message = response_data.get("error", {}).get("message", "Unknown error")
            logging.error(f"Error from Gemini API: {error_message}")
            raise HTTPException(status_code=response.status_code, detail=error_message)

        candidates = response_data.get("candidates", [])
        if candidates and candidates[0].get("content") and candidates[0]["content"].get("parts"):
            return candidates[0]["content"]["parts"][0]["text"]
        else:
            return "No meaningful response received."

    except Exception as e:
        logging.exception("Error communicating with the Gemini API")
        raise HTTPException(status_code=500, detail=f"Error communicating with the Gemini API: {str(e)}")
