from fastapi import FastAPI, Response, Request
from database import database, engine  # Ensure this references your `engine`
from users import router as users_router
from portfolio import router as portfolio_router
from market import router as market_router
from transactions import router as transactions_router
from performance import router as performance_router
from scheduler import start_scheduler
from trades import router as trades_router
from models import Base  # Import Base for metadata
from fastapi.middleware.cors import CORSMiddleware
import os
import logging
from ai import router as ai_router

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

# Initialize the FastAPI app
app = FastAPI()

# Start the scheduler
start_scheduler()

# Dynamically set CORS origins for different environments
allow_origins = ["https://sarunaskarpovicius.site"]
if os.getenv("ENV") == "development":
    allow_origins.append("http://localhost:3000")  # Add localhost for development

# Validate environment variable
env = os.getenv("ENV")
if env not in ["development", "production"]:
    raise ValueError(f"Invalid ENV value: {env}. Must be 'development' or 'production'.")

# Set-Cookie endpoint for SameSite cookie
@app.get("/set-cookie")
def set_cookie(response: Response):
    response.set_cookie(
        key="TESTCOOKIESENABLED",
        value="true",
        samesite="None",  # Allows cross-site cookie sending
        secure=True       # Required when SameSite=None
    )
    return {"message": "Cookie set with SameSite=None and Secure=True"}

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Welcome to the Stock Manager API",
        "health_check": "/health",
        "documentation": "/docs"
    }

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_csp_header(request: Request, call_next):
    response = await call_next(request)
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' https://*.tradingview.com https://cdn.jsdelivr.net; "
        "frame-src 'self' https://s3.tradingview.com https://cdn.tradingview.com; "
        "connect-src 'self'; "
        "img-src 'self' data: https://*.tradingview.com https://cdn.jsdelivr.net; "
        "style-src 'self' 'unsafe-inline' https://*.tradingview.com https://cdn.jsdelivr.net; "
        "font-src 'self' https://*.tradingview.com https://cdn.jsdelivr.net;"
    )
    return response
# Middleware to log requests and responses
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logging.info(f"Incoming request: {request.method} {request.url}")
    response = await call_next(request)
    logging.info(f"Response status: {response.status_code}")
    return response

# Database setup
@app.on_event("startup")
async def startup():
    logging.info("Starting application...")

    # Use an async connection to create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    await database.connect()
    logging.info("Database connected successfully.")

@app.on_event("shutdown")
async def shutdown():
    logging.info("Shutting down application...")
    await database.disconnect()
    logging.info("Database disconnected.")

# Health check endpoint
@app.get("/health", tags=["health"])
async def health_check():
    try:
        # Check database connection
        if not database.is_connected:
            raise Exception("Database is not connected")

        # Indicate the scheduler is running (scheduler state is managed in `scheduler.py`)
        return {
            "status": "ok",
            "database": "connected",
            "scheduler": "running"
        }
    except Exception as e:
        return {"status": "error", "details": str(e)}

# Include routers from each module
app.include_router(users_router, prefix="/api/users", tags=["users"])
app.include_router(portfolio_router, prefix="/api/portfolio", tags=["portfolio"])
app.include_router(market_router, prefix="/api/market", tags=["market"])
app.include_router(transactions_router, prefix="/api/transactions", tags=["transactions"])
app.include_router(performance_router, prefix="/api/performance", tags=["performance"])
app.include_router(trades_router, prefix="/api/trades", tags=["trades"])
app.include_router(ai_router, prefix="/api/ai", tags=["ai"])