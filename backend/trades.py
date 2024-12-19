from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import func
from datetime import datetime, timedelta
from database import get_db
from models import Trade
import logging

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
async def get_trades(
    page: int = 1,
    limit: int = 10,
    chart_data: bool = False,
    db: AsyncSession = Depends(get_db)
):
    """
    Fetch either:
    - Paginated trades with `page` and `limit`.
    - Profit/loss chart data when `chart_data=true`.

    Query Parameters:
    - page (int): Page number for pagination (default: 1).
    - limit (int): Number of records per page (default: 10).
    - chart_data (bool): If true, returns profit/loss over time instead of paginated trades.
    """
    try:
        if chart_data:
            # Return aggregated daily profit/loss data
            query = (
                select(
                    func.date(Trade.timestamp).label("day"),
                    func.sum(Trade.profit_loss).label("total_profit_loss")
                )
                .where(Trade.profit_loss != None)
                .group_by(func.date(Trade.timestamp))
                .order_by("day")
            )
            result = await db.execute(query)
            daily_data = result.all()

            return {
                "success": True,
                "data": [
                    {"timestamp": row.day, "profit_loss": row.total_profit_loss} for row in daily_data
                ],
            }
        else:
            # Default: Paginated trades
            if page < 1 or limit < 1:
                raise HTTPException(status_code=400, detail="Page and limit must be greater than 0")

            offset = (page - 1) * limit
            query = select(Trade).order_by(Trade.timestamp.desc()).offset(offset).limit(limit)
            result = await db.execute(query)
            trades = result.scalars().all()

            total_count_query = select(func.count()).select_from(Trade)
            total_count_result = await db.execute(total_count_query)
            total_count = total_count_result.scalar()

            return {
                "success": True,
                "trades": [serialize_trade(trade) for trade in trades],
                "total": total_count,
                "page": page,
                "limit": limit,
            }

    except Exception as e:
        logger.exception("Error fetching trades")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary")
async def get_trade_summary(db: AsyncSession = Depends(get_db)):
    """
    Endpoint to fetch a summary of trading statistics.
    """
    try:
        # Total number of trades
        total_trades = (await db.execute(select(func.count()).select_from(Trade))).scalar()

        # Total realized profit (where profit_loss > 0)
        total_realized_profit = (await db.execute(
            select(func.sum(Trade.profit_loss)).where(Trade.profit_loss > 0)
        )).scalar() or 0.0

        # Starting budget (assumed to be the maximum budget encountered)
        starting_budget = (await db.execute(select(func.max(Trade.budget)))).scalar() or 0.0

        # Ending budget (assumed to be the minimum budget encountered)
        ending_budget = (await db.execute(select(func.min(Trade.budget)))).scalar() or 0.0

        # Budget used is the difference between starting and ending
        budget_used = starting_budget - ending_budget

        # Profit in the last 24 hours
        last_24h_profit = (await db.execute(
            select(func.sum(Trade.profit_loss)).where(
                Trade.timestamp >= datetime.now() - timedelta(days=1)
            )
        )).scalar() or 0.0

        return {
            "total_trades": total_trades,
            "total_realized_profit": round(total_realized_profit, 2),
            "starting_budget": round(starting_budget, 2),
            "ending_budget": round(ending_budget, 2),
            "budget_used": round(budget_used, 2),
            "last_24h_profit": round(last_24h_profit, 2),
        }

    except Exception as e:
        logger.exception("Error fetching trade summary")
        raise HTTPException(status_code=500, detail=f"Error fetching trade summary: {str(e)}")
