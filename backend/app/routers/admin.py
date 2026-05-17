"""Admin router – all endpoints require admin role."""
from fastapi import APIRouter, HTTPException, Depends, Query
from app.core.auth import require_admin
from app.core.database import supabase_admin
from app.models.schemas import AdminUserUpdate
from datetime import datetime, timezone
import re
import structlog

log = structlog.get_logger()
router = APIRouter()

UUID_PATTERN = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')


def validate_uuid(uid: str) -> str:
    if not UUID_PATTERN.match(uid):
        raise HTTPException(status_code=400, detail="Invalid ID format.")
    return uid


@router.get("/users")
async def list_users(
    page: int = Query(1, ge=1, le=1000),
    search: str = Query("", max_length=100),
    admin: dict = Depends(require_admin),
):
    """List all users with optional search. Admin only."""
    page_size = 50
    offset = (page - 1) * page_size

    query = (
        supabase_admin
        .from_("users")
        .select("id, name, email, role, github_username, experience_level, created_at")
        .order("created_at", desc=True)
        .range(offset, offset + page_size - 1)
    )

    if search.strip():
        # Supabase uses parameterized ilike – safe
        clean_search = re.sub(r'[%_<>"\'`]', '', search.strip())
        query = query.ilike("name", f"%{clean_search}%")

    result = query.execute()
    return result.data or []


@router.patch("/user/{user_id}")
async def update_user(
    user_id: str,
    body: AdminUserUpdate,
    admin: dict = Depends(require_admin),
):
    """Update user role or name. Admin only. Logged."""
    user_id = validate_uuid(user_id)

    # Prevent self-demotion
    if user_id == admin["id"] and body.role == "user":
        raise HTTPException(status_code=400, detail="Admins cannot demote themselves.")

    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update.")

    try:
        result = (
            supabase_admin
            .from_("users")
            .update(updates)
            .eq("id", user_id)
            .execute()
        )

        # Audit log
        _log_admin_action(admin["id"], f"updated_user:{list(updates.keys())}", user_id)
        log.info("Admin updated user", admin_id=admin["id"], target=user_id, fields=list(updates.keys()))
        return result.data[0] if result.data else {}

    except Exception as e:
        log.error("Admin user update failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to update user.")


@router.delete("/user/{user_id}")
async def delete_user(user_id: str, admin: dict = Depends(require_admin)):
    """
    Soft delete user (sets role to 'suspended').
    Full delete requires explicit admin approval for audit trail.
    """
    user_id = validate_uuid(user_id)

    if user_id == admin["id"]:
        raise HTTPException(status_code=400, detail="Cannot delete your own account.")

    try:
        # Soft delete: mark as suspended, don't actually delete
        supabase_admin.from_("users").update({"role": "suspended"}).eq("id", user_id).execute()
        _log_admin_action(admin["id"], "soft_deleted_user", user_id)
        log.info("User soft-deleted", admin_id=admin["id"], target=user_id)
        return {"message": "User account suspended successfully."}
    except Exception as e:
        log.error("Delete user failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to delete user.")


@router.get("/logs")
async def get_admin_logs(admin: dict = Depends(require_admin)):
    """Get audit logs. Admin only."""
    result = (
        supabase_admin
        .from_("admin_logs")
        .select("*")
        .order("timestamp", desc=True)
        .limit(100)
        .execute()
    )
    return result.data or []


@router.get("/security-logs")
async def get_security_logs(admin: dict = Depends(require_admin)):
    """Get security event logs. Admin only."""
    result = (
        supabase_admin
        .from_("security_logs")
        .select("*")
        .order("timestamp", desc=True)
        .limit(100)
        .execute()
    )
    return result.data or []


@router.get("/stats")
async def get_platform_stats(admin: dict = Depends(require_admin)):
    """Get platform-wide statistics. Admin only."""
    try:
        total = supabase_admin.from_("users").select("id", count="exact").execute()
        verified = supabase_admin.from_("github_profiles").select("id", count="exact").execute()
        flagged = supabase_admin.from_("trust_scores").select("id", count="exact").lte("score", 2).execute()
        matches_today = supabase_admin.from_("matches").select("id", count="exact").execute()

        return {
            "total_users": total.count or 0,
            "verified_count": verified.count or 0,
            "flagged_count": flagged.count or 0,
            "matches_today": matches_today.count or 0,
        }
    except Exception as e:
        log.error("Platform stats error", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to fetch platform stats.")


def _log_admin_action(admin_id: str, action: str, target_user: str):
    """Record admin action in audit log. Non-blocking."""
    try:
        supabase_admin.from_("admin_logs").insert({
            "admin_id": admin_id,
            "action": action,
            "target_user": target_user,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }).execute()
    except Exception as e:
        log.warning("Failed to write audit log", error=str(e))
