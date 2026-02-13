"""FastAPI dependencies for session validation and user extraction."""
from fastapi import Depends, Request, HTTPException
from sqlalchemy.orm import Session
from supertokens_python.recipe.session import SessionContainer
from supertokens_python.recipe.session.asyncio import get_session as st_get_session

from dependencies import get_db  # Your existing DB dependency
from auth import ensure_user_from_session_async, validate_admin_only
import db_models


async def get_session(request: Request) -> SessionContainer:
    """
    Extract SuperTokens session from HTTP request.
    The request object contains cookies/headers with session tokens.
    Use this as a dependency in your route handlers.
    """
    session = await st_get_session(request)
    if session is None:
        raise HTTPException(status_code=401, detail="Unauthorized: No valid session")

    return session


async def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Get current authenticated user from SuperTokens session.
    Ensures user exists in local database.
    Validates admin-only access.

    Use this as a dependency in your protected route handlers.

    Example:
        @router.get("/dashboard")
        async def dashboard(current_user = Depends(get_current_user)):
            return {"user": current_user.email}
    """
    session = await get_session(request)

    # Validate that user has admin access
    validate_admin_only(session)

    # Get or create user in local database
    # We only need the user object, not the user_id
    _, user = await ensure_user_from_session_async(db, session, db_models)

    return user


async def get_current_user_id(
    request: Request,
    db: Session = Depends(get_db)
) -> int:
    """
    Get just the current user's local ID from session.
    Lighter weight if you only need the user ID.

    Example:
        @router.get("/my-data")
        async def my_data(user_id: int = Depends(get_current_user_id)):
            return {"user_id": user_id}
    """
    session = await get_session(request)
    validate_admin_only(session)

    # Get or create user in local database
    # We only need the user_id, not the user object
    user_id, _ = await ensure_user_from_session_async(db, session, db_models)
    return user_id
