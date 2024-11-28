from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func  # Import func from SQLAlchemy
from database import get_db  # Ensure this is the correct import
from models import Trade
import logging
from datetime import datetime, timedelta



router = APIRouter()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Helper function to serialize trades
def serialize_trade(trade):
    return {
        "id": trade.id,
        "timestamp": trade.timestamp.isoformat() if trade.timestamp else None,
        "action": trade.action,
        "ticker": trade.ticker,
        "price": trade.price,
        "quantity": trade.quantity,
        "profit_loss": trade.profit_loss,
        "budget": trade.budget,
    }

@router.get("/")
async def get_trades(db: AsyncSession = Depends(get_db)):
    """
    Endpoint to fetch all trades.
    """
    try:
        query = select(Trade)

        logger.info(f"Executing query: {query}")

        result = await db.execute(query)
        trades = result.scalars().all()

        return {
            "trades": [serialize_trade(trade) for trade in trades],
        }
    except Exception as e:
        logger.error(f"Error fetching trades: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching trades: {str(e)}")

@router.get("/summary")
async def get_trade_summary(db: AsyncSession = Depends(get_db)):
    """
    Endpoint to fetch a summary of trading statistics.
    """
    try:
        total_trades = await db.execute(select(func.count()).select_from(Trade))
        total_trades = total_trades.scalar()

        total_realized_profit = await db.execute(
            select(func.sum(Trade.profit_loss)).where(Trade.profit_loss > 0)
        )
        total_realized_profit = total_realized_profit.scalar() or 0.0

        starting_budget = await db.execute(
            select(func.max(Trade.budget))
        )
        starting_budget = starting_budget.scalar() or 0.0

        ending_budget = await db.execute(
            select(func.min(Trade.budget))
        )
        ending_budget = ending_budget.scalar() or 0.0

        budget_used = starting_budget - ending_budget

        last_24h_profit = await db.execute(
            select(func.sum(Trade.profit_loss)).where(
                Trade.timestamp >= datetime.now() - timedelta(days=1)
            )
        )
        last_24h_profit = last_24h_profit.scalar() or 0.0

        return {
            "total_trades": total_trades,
            "total_realized_profit": round(total_realized_profit, 2),
            "starting_budget": round(starting_budget, 2),
            "ending_budget": round(ending_budget, 2),
            "budget_used": round(budget_used, 2),
            "last_24h_profit": round(last_24h_profit, 2),
        }
    except Exception as e:
        logger.error(f"Error fetching trade summary: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching trade summary: {str(e)}")