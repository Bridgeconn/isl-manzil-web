"""Authentication and authorization functions."""
import os
from typing import Optional, Tuple, Any, Dict, TypedDict
from fastapi import Depends, HTTPException, Header, Request
from sqlalchemy.orm import Session
from supertokens_python.recipe.session import SessionContainer
from supertokens_python.recipe.session.framework.fastapi import verify_session
from supertokens_python.asyncio import get_user
from dependencies import logger, get_db
import db_models
from custom_exceptions import PermissionException

# Cache for API keys
_VALID_API_KEYS_CACHE = None

def load_api_keys() -> Dict[str, Dict[str, Any]]:
    """Load API keys from environment variable"""
    global _VALID_API_KEYS_CACHE
    
    # Return cached version if already loaded
    if _VALID_API_KEYS_CACHE is not None:
        return _VALID_API_KEYS_CACHE
    
    api_keys_str = os.getenv("VALID_API_KEYS", "")
    
    if not api_keys_str:
        logger.warning("No API keys configured in environment")
        _VALID_API_KEYS_CACHE = {}
        return {}
    
    # Split by comma if multiple keys
    keys = [k.strip() for k in api_keys_str.split(",")]
    
    # Create dictionary
    result = {
        key: {"name": f"API Key {i+1}", "active": True}
        for i, key in enumerate(keys)
    }
    
    _VALID_API_KEYS_CACHE = result
    return result


class AuthContext(TypedDict):
    auth_type: str
    session: Optional[SessionContainer]


async def verify_session_or_api_key(
    request: Request,
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
) -> Dict[str, Any]:
    """
    Accept requests that have EITHER:
    1. Valid API key (for external apps) OR
    2. Valid session (for logged-in web users)
    """
    
    # Load keys from environment
    VALID_API_KEYS = load_api_keys()
    
    # Check API key first
    if x_api_key:
        if x_api_key in VALID_API_KEYS and VALID_API_KEYS[x_api_key]["active"]:
            return {"auth_type": "api_key", "session": None}
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    # No API key, check if there's a session cookie
    auth_header = request.headers.get("authorization")
    cookies = request.cookies
    
    if auth_header or "sAccessToken" in cookies or "sRefreshToken" in cookies:
        try:
            from supertokens_python.recipe.session.asyncio import get_session
            session = await get_session(request)
            if session:
                return {"auth_type": "session", "session": session}
        except Exception:
            pass
    
    # Neither API key nor valid session
    raise HTTPException(status_code=401, detail="Unauthorized")


# ============= Session dependency =============

_verify_session = verify_session()


async def verify_session_with_approval(
    db: Session = Depends(get_db),
    session: SessionContainer = Depends(_verify_session)
) -> SessionContainer:
    """
    Verify session and ensure user exists in database.
    No approval check - only SuperTokens roles matter.
    Use this in all protected routes.
    """
    # Ensure user exists in database
    await ensure_user_from_session_async(db, session)
    
    return session


# ============= Role Validators =============

def validate_admin_only(session: SessionContainer):
    """Validate that the user is an admin."""
    payload = session.get_access_token_payload()
    roles = payload.get("st-role", {}).get("v", [])

    if not any(role in roles for role in ["admin"]):
        logger.error("Access denied: You dont have permission to access the API")
        raise PermissionException(
            detail="Access denied: You dont have permission to access the API"
        )


def validate_admin_editor(session: SessionContainer):
    """Validate the user is admin or editor."""
    payload = session.get_access_token_payload()
    roles = payload.get("st-role", {}).get("v", [])

    if not any(role in roles for role in ["admin", "editor"]):
        logger.error("Access denied: You dont have permission to access the API")
        raise PermissionException(
            detail="Access denied: You dont have permission to access the API"
        )


def validate_all_roles(session: SessionContainer):
    """Validate the user roles."""
    payload = session.get_access_token_payload()
    roles = payload.get("st-role", {}).get("v", [])

    if not any(role in roles for role in ["admin", "editor","reporter"]):
        logger.error("Access denied: You dont have permission to access the API")
        raise PermissionException(
            detail="Access denied: You dont have permission to access the API"
        )


# ============= User extraction =============

def _extract_email_from_su_user(su_user: Any) -> Optional[str]:
    """
    Extract email from Supertokens user object.
    Works across different Supertokens CDI shapes by reading su_user.loginMethods.
    Returns email or None if not found.
    """
    if su_user is None:
        return None

    # Try attribute first
    login_methods = (
        getattr(su_user, "login_methods", None)
        or getattr(su_user, "loginMethods", None)
    )

    # Fallback to JSON
    if login_methods is None and hasattr(su_user, "to_json"):
        data: Dict[str, Any] = su_user.to_json()
        login_methods = data.get("loginMethods") or data.get("login_methods")

    email: Optional[str] = None
    if isinstance(login_methods, list):
        for lm in login_methods:
            # lm may be dict-like or an object
            get = lm.get if isinstance(lm, dict) else (lambda k, obj=lm: getattr(obj, k, None))

            if email is None:
                email = get("email")

            if email:
                break

    return email


async def ensure_user_from_session_async(
    db: Session,
    session: SessionContainer
) -> Tuple[int, db_models.User]:
    """
    - Fetch Supertokens user via get_user(user_id)
    - Extract email from loginMethods
    - Upsert into local user table
    - Return (local_user_id, local_user_row)
    
    Note: Roles are stored in SuperTokens, not in the User table.
    """
    st_user_id = session.get_user_id()
    su_user = await get_user(st_user_id)
    email = _extract_email_from_su_user(su_user)
    
    user = db.query(db_models.User).filter_by(st_user_id=st_user_id).first()
    
    if user:
        changed = False
        if email and user.email != email:
            user.email = email
            changed = True
        if changed:
            db.add(user)
            db.commit()
            db.refresh(user)
        return user.id, user

    # Create if not exists
    user = db_models.User(st_user_id=st_user_id, email=email)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user.id, user