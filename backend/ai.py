from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx
import os
import logging
from dotenv import load_dotenv
from slowapi import Limiter
from slowapi.util import get_remote_address

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
async def generate_content(request: MessageRequest):
    """
    Generate content using the Gemini 1.5 Flash API.
    :param request: The input text prompt for the AI.
    :return: Generated content from the API.
    """
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [
            {"parts": [{"text": request.message}]}
        ]
    }

    logging.info(f"Received request: {request.message}")

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{GEMINI_API_URL}?key={API_KEY}", 
                json=payload, 
                headers=headers
            )
            response_data = response.json()

        # Log the raw response for debugging
        logging.info(f"Gemini API response: {response_data}")

        # Check for errors in the response
        if response.status_code != 200:
            error_message = response_data.get("error", {}).get("message", "Unknown error")
            logging.error(f"Error from Gemini API: {error_message}")
            raise HTTPException(
                status_code=response.status_code,
                detail=error_message
            )

        response_text = (
            response_data.get("content", {})
            .get("candidates", [{}])[0]
            .get("parts", [{}])[0]
            .get("text", "No meaningful response received.")
        )

        return {"content": response_text}
    except Exception as e:
        logging.exception("Error communicating with the Gemini API")
        raise HTTPException(status_code=500, detail=f"Error communicating with the Gemini API: {str(e)}")
