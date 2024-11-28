from fastapi import APIRouter, HTTPException, Response, status, Depends
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from schemas import UserCreate, UserLogin, BudgetUpdate
from models import User, UserStock
import hashlib

router = APIRouter()

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


@router.post("/register")
async def register_user(user: UserCreate, db: AsyncSession = Depends(get_db)):
    print(f"[REGISTER] Attempt to register user: {user.username}")
    hashed_password = hash_password(user.password)

    # Check if the user already exists
    stmt = select(User).where(User.username == user.username)
    result = await db.execute(stmt)
    existing_user = result.scalar_one_or_none()

    if existing_user:
        print(f"[REGISTER ERROR] Username already taken for user: {user.username}")
        raise HTTPException(status_code=400, detail="Username already taken")

    # Create and add the new user
    new_user = User(username=user.username, password=hashed_password, budget=user.budget)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    print(f"[REGISTER SUCCESS] User registered with ID: {new_user.id}")
    return {"message": "User registered successfully", "user_id": new_user.id}


@router.post("/login")
async def login_user(user: UserLogin, db: AsyncSession = Depends(get_db)):
    print(f"[LOGIN] Attempt to login user: {user.username}")

    # Query the user by username
    stmt = select(User).where(User.username == user.username)
    result = await db.execute(stmt)
    db_user = result.scalar_one_or_none()

    if not db_user or hash_password(user.password) != db_user.password:
        print(f"[LOGIN ERROR] Invalid username or password for user: {user.username}")
        raise HTTPException(status_code=401, detail="Invalid username or password")

    print(f"[LOGIN SUCCESS] User logged in with ID: {db_user.id}")
    return {"message": "Login successful", "user_id": db_user.id}


@router.get("/budget")
async def view_budget(user_id: int, db: AsyncSession = Depends(get_db)):
    print(f"[VIEW BUDGET] Attempt to view budget for user ID: {user_id}")

    # Query the user by ID
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    db_user = result.scalar_one_or_none()

    if not db_user:
        print(f"[VIEW BUDGET ERROR] User not found with ID: {user_id}")
        raise HTTPException(status_code=404, detail="User not found")

    print(f"[VIEW BUDGET SUCCESS] Budget for user ID {user_id}: {db_user.budget}")
    return {"budget": db_user.budget}


@router.put("/budget")
async def update_budget(budget_update: BudgetUpdate, user_id: int, db: AsyncSession = Depends(get_db)):
    print(f"[UPDATE BUDGET] Attempt to update budget for user ID: {user_id} to {budget_update.new_budget}")

    # Query the user by ID
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    db_user = result.scalar_one_or_none()

    if not db_user:
        print(f"[UPDATE BUDGET ERROR] User not found with ID: {user_id}")
        raise HTTPException(status_code=404, detail="User not found")

    # Update the user's budget
    db_user.budget = budget_update.new_budget
    await db.commit()

    print(f"[UPDATE BUDGET SUCCESS] Budget updated for user ID {user_id} to {budget_update.new_budget}")
    return {"message": "Budget updated successfully", "new_budget": budget_update.new_budget}


@router.post("/logout")
async def logout_user(response: Response):
    print("[LOGOUT] User logged out")
    response.status_code = status.HTTP_200_OK
    return {"message": "User logged out successfully."}


@router.get("/me")
async def get_current_user(username: str, db: AsyncSession = Depends(get_db)):
    print(f"[GET CURRENT USER] Received request to fetch user with username: {username}")

    # Query the user by username
    stmt = select(User).where(User.username == username)
    result = await db.execute(stmt)
    db_user = result.scalar_one_or_none()

    if not db_user:
        print(f"[GET CURRENT USER ERROR] No user found with username: {username}")
        raise HTTPException(status_code=404, detail="User not found")

    # Query the user's portfolio
    portfolio_stmt = select(UserStock).where(UserStock.user_id == db_user.id)
    portfolio_result = await db.execute(portfolio_stmt)
    portfolio = portfolio_result.scalars().all()

    # Log success and user details
    print(f"[GET CURRENT USER SUCCESS] Retrieved user with username: {username}")
    print(f"User Details: ID={db_user.id}, Username={db_user.username}, Budget={db_user.budget}, Portfolio Items Count={len(portfolio)}")

    # Prepare portfolio data
    portfolio_data = [
        {
            "ticker": stock.ticker,  # Use `ticker` instead of `stock_id`
            "quantity": stock.quantity,
            "purchase_price": stock.purchase_price,
            "total_cost": stock.total_cost
        } for stock in portfolio
    ]

    # Return user data along with portfolio
    return {
        "id": db_user.id,
        "username": db_user.username,
        "budget": db_user.budget,
        "portfolio": portfolio_data
    }
