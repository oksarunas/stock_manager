from fastapi import APIRouter, HTTPException, Request, Query, Depends
from pydantic import BaseModel
import httpx
import os
import logging
from dotenv import load_dotenv
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models import User, UserStock  # Replace with the actual path to your models
from database import get_db  # Replace with your actual dependency for AsyncSession
from schemas import MessageRequest  # Import your Pydantic model
from portfolio import get_user_portfolio  # Import your portfolio function


# Load environment variables from .env file
load_dotenv()

# Create a router for AI endpoints
router = APIRouter()

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

# Configure rate limiting
limiter = Limiter(key_func=get_remote_address)

# Load the API key from environment variables
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise ValueError("GEMINI_API_KEY is not set. Please configure it in the .env file.")

GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent"

# Define a Pydantic model for the request body
class MessageRequest(BaseModel):
    message: str

@router.get("/validate-config", tags=["utility"], summary="Validate environment configuration")
async def validate_config():
    """
    Validate if necessary environment variables are set.
    """
    if not API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not set.")
    return {"status": "success", "message": "All configurations are valid."}

@router.post("/generate-answer", summary="Generate AI content", description="Uses Gemini API to generate text based on a given prompt.")
@limiter.limit("10/minute")  # Limit to 10 requests per minute
async def generate_content(
    request: Request,
    message_request: MessageRequest,
    user_id: int = Query(...),  # Assume user ID is passed as a query parameter
    session: AsyncSession = Depends(get_db),
):
    """
    Generate content using the Gemini 1.5 Flash API with portfolio context.
    """
    # Format the prompt with portfolio data
    prompt = await format_prompt(message_request.message, user_id, session)

    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [
            {"parts": [{"text": prompt}]}
        ]
    }

    logging.info(f"Received request: {message_request.message}")
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

        # Extract the generated text
        candidates = response_data.get("candidates", [])
        if candidates and candidates[0].get("content") and candidates[0]["content"].get("parts"):
            generated_text = candidates[0]["content"]["parts"][0]["text"]
        else:
            generated_text = "No meaningful response received."

        return {"content": generated_text}
    except Exception as e:
        logging.exception("Error communicating with the Gemini API")
        raise HTTPException(status_code=500, detail=f"Error communicating with the Gemini API: {str(e)}")


async def format_prompt(user_message: str, user_id: int, session: AsyncSession) -> str:
    """
    Formats the prompt to include default AI behavior instructions and portfolio data.
    """
    # Fetch user portfolio data
    portfolio_response = await get_user_portfolio(user_id, session)

    # Generate a summary of the portfolio
    portfolio_summary = "\n".join(
        f"{entry.ticker}: {entry.quantity} shares @ ${entry.purchase_price:.2f}, "
        f"current price: ${entry.current_price:.2f}, total value: ${entry.current_value:.2f}"
        for entry in portfolio_response.portfolio
    )

    total_value = portfolio_response.total_portfolio_value

    base_instructions = (
        f"You are a professional financial advisor specializing in portfolio management. "
        f"Your goal is to help the user optimize their portfolio and make informed financial decisions. "
        f"Always respond in a clear, concise, and professional manner. Use examples where applicable. "
        f"Be positive and avoid financial jargon unless absolutely necessary."
    )

    additional_context = (
        f"\n\nHere is the user's current portfolio:\n"
        f"{portfolio_summary}\n"
        f"Total Portfolio Value: ${total_value:.2f}"
    )

    guidelines = (
        f"\n\nGuidelines for your responses:\n"
        f"- Provide actionable advice tailored to the user's portfolio.\n"
        f"- Break down complex topics into simple, understandable parts.\n"
        f"- If unsure about a topic, politely suggest consulting a financial professional.\n"
        f"- Conclude your responses with a brief summary or next steps."
    )

    return (
        f"{base_instructions}{additional_context}{guidelines}\n\n"
        f"User message: {user_message}"
    )
