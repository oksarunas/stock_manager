import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from databases import Database
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database URL (async driver)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./stock_manager.db")

# Async engine
engine = create_async_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# Declarative base for models
Base = declarative_base()

# Async session maker
async_session_maker = sessionmaker(
    bind=engine, class_=AsyncSession, expire_on_commit=False
)

# Async database instance
database = Database(DATABASE_URL)

# Helper functions to connect and disconnect the database
async def connect_db():
    await database.connect()

async def disconnect_db():
    await database.disconnect()

# Dependency function to provide database sessions
async def get_db():
    async with async_session_maker() as session:
        yield session
