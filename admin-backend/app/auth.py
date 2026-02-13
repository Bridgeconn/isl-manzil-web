"""Authentication and authorization functions for admin-only app."""
from typing import Optional, Tuple, Any, Dict
from sqlalchemy.orm import Session
from supertokens_python.recipe.session import SessionContainer
from supertokens_python.asyncio import get_user

from custom_exceptions import PermissionException


def validate_admin_only(session: SessionContainer):
    """
    Validate that the user is an admin.
    Since this is an admin-only app, all authenticated users are admins by default.
    This is a placeholder for role-based checks if you add roles later.
    """
    # For admin-only app, if user has a valid session, they're authorized
    user_id = session.get_user_id()
    if not user_id:
        raise PermissionException(
            detail="Access denied: User not authenticated"
        )


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
    session: SessionContainer,
    db_models
) -> Tuple[int, Any]:
    """
    - Fetch Supertokens user via get_user(user_id)
    - Extract email from loginMethods
    - Upsert into local user table
    - Return (local_user_id, local_user_row)
    """
    st_user_id = session.get_user_id()
    su_user = await get_user(st_user_id)
    email = _extract_email_from_su_user(su_user)

    # Check if user exists locally
    user = db.query(db_models.User).filter_by(st_user_id=st_user_id).first()

    if user:
        # Update email if changed
        if email and user.email != email:
            user.email = email
            db.add(user)
            db.commit()
            db.refresh(user)
        return user.id, user

    # Create new user if doesn't exist
    user = db_models.User(st_user_id=st_user_id, email=email)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user.id, user
