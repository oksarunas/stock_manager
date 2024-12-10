from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import requests
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Create a router for AI endpoints
router = APIRouter()

# Load the API key from environment variables
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise ValueError("GEMINI_API_KEY is not set. Please configure it in the .env file.")

GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent"

# Define a Pydantic model for the request body
class MessageRequest(BaseModel):
    message: str

@router.post("/generate-answer")
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

    try:
        response = requests.post(
            f"{GEMINI_API_URL}?key={API_KEY}", 
            json=payload, 
            headers=headers
        )
        response_data = response.json()

        # Check for errors in the response
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=response_data.get("error", {}).get("message", "Unknown error")
            )
        
        return {"content": response_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error communicating with the Gemini API: {str(e)}")
