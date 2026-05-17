"""
JWT verification and user authentication dependency.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from app.core.config import settings
from app.core.database import supabase_admin
import structlog

log = structlog.get_logger()
bearer_scheme = HTTPBearer(auto_error=True)


async def verify_jwt_token(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    """
    Verifies JWT from Supabase, returns user payload.
    NEVER trusts the frontend token without backend verification.
    """
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired authentication token.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Supabase JWTs are signed with the JWT secret (not service role key)
        # Try SUPABASE_JWT_SECRET first, fall back to SERVICE_ROLE_KEY for compatibility
        jwt_secret = settings.SUPABASE_JWT_SECRET or settings.SUPABASE_SERVICE_ROLE_KEY
        payload = jwt.decode(
            token,
            jwt_secret,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
        user_id: str = payload.get("sub")
        if not user_id:
            raise credentials_exception

        return {"user_id": user_id, "email": payload.get("email"), "payload": payload}

    except JWTError as e:
        log.warning("JWT verification failed", error=str(e))
        raise credentials_exception


async def get_current_user(token_data: dict = Depends(verify_jwt_token)) -> dict:
    """
    Fetches the full user record from DB using verified JWT.
    If the user record does not exist yet (e.g. from GitHub OAuth or client-side signup),
    automatically initializes it using JWT metadata.
    """
    user_id = token_data["user_id"]

    try:
        result = (
            supabase_admin
            .from_("users")
            .select("*")
            .eq("id", user_id)  # ← parameterized, safe
            .maybe_single()
            .execute()
        )
        if result is None or not result.data:
            # Dynamically create the database record in public.users on-the-fly!
            payload = token_data.get("payload", {})
            user_metadata = payload.get("user_metadata", {})
            name = user_metadata.get("name") or payload.get("name") or (token_data["email"].split("@")[0] if token_data.get("email") else "Developer")
            
            try:
                new_user = {
                    "id": user_id,
                    "name": name,
                    "email": token_data.get("email") or f"{user_id}@github.temp",
                    "role": "user"
                }
                insert_result = (
                    supabase_admin
                    .from_("users")
                    .insert(new_user)
                    .execute()
                )
                if insert_result.data:
                    log.info("Dynamically created missing user record from response", user_id=user_id, email=new_user["email"])
                    return insert_result.data[0]
                
                log.info("Dynamically created missing user record (fallback)", user_id=user_id, email=new_user["email"])
                return new_user
            except Exception as insert_err:
                log.error("Failed to dynamically create user record", error=str(insert_err))
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User account not found and initialization failed.",
                )
        return result.data
    except Exception as e:
        log.error("Database error fetching user", error=str(e))
        raise HTTPException(status_code=500, detail="Authentication service error.")


async def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """Admin-only guard."""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required.",
        )
    return current_user
