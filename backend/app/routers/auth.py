"""
Auth router – wraps Supabase Auth operations.
Rate limited: 5 login attempts/minute.
"""
from fastapi import APIRouter, HTTPException, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.models.schemas import SignupRequest, LoginRequest, ForgotPasswordRequest
from app.core.database import supabase_admin
from app.core.auth import get_current_user
from fastapi import Depends
import structlog

log = structlog.get_logger()
limiter = Limiter(key_func=get_remote_address)
router = APIRouter()


@router.post("/signup", status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
async def signup(request: Request, body: SignupRequest):
    """
    Create user account via Supabase Auth.
    Uses Supabase's built-in email verification.
    """
    try:
        result = supabase_admin.auth.admin.create_user({
            "email": body.email,
            "password": body.password,
            "email_confirm": False,
            "user_metadata": {"name": body.name},
        })

        if result.user:
            # Create user record in our users table
            supabase_admin.from_("users").insert({
                "id": result.user.id,
                "name": body.name,
                "email": body.email,
                "role": "user",
            }).execute()

            log.info("User registered", email=body.email)
            return {"message": "Account created. Please check your email to verify.", "user_id": result.user.id}

    except Exception as e:
        msg = str(e).lower()
        if "already registered" in msg or "unique" in msg:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists.",
            )
        log.error("Signup failed", error=str(e))
        raise HTTPException(status_code=500, detail="Account creation failed.")


@router.post("/login")
@limiter.limit("5/minute")
async def login(request: Request, body: LoginRequest):
    """
    Login – returns session tokens.
    Limited to 5 attempts/minute per IP (brute-force protection).
    """
    try:
        result = supabase_admin.auth.sign_in_with_password({
            "email": body.email,
            "password": body.password,
        })

        if not result.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )

        log.info("User logged in", email=body.email)
        return {
            "access_token": result.session.access_token,
            "refresh_token": result.session.refresh_token,
            "expires_in": result.session.expires_in,
            "user": {
                "id": result.user.id,
                "email": result.user.email,
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        msg = str(e).lower()
        if "invalid login" in msg or "invalid credentials" in msg:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )
        log.error("Login error", error=str(e))
        raise HTTPException(status_code=500, detail="Login service error.")


@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """Revoke session server-side."""
    try:
        supabase_admin.auth.admin.sign_out(current_user["id"])
        log.info("User logged out", user_id=current_user["id"])
        return {"message": "Logged out successfully."}
    except Exception:
        # Still return success – client will clear local session
        return {"message": "Logged out."}


@router.post("/forgot-password")
@limiter.limit("3/minute")
async def forgot_password(request: Request, body: ForgotPasswordRequest):
    """Triggers Supabase password reset email."""
    try:
        supabase_admin.auth.reset_password_for_email(body.email)
        # Always return success to prevent email enumeration
        return {"message": "If an account exists, a reset email has been sent."}
    except Exception:
        return {"message": "If an account exists, a reset email has been sent."}
