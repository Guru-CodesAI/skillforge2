"""Profile router – secure CRUD for user profiles."""
from fastapi import APIRouter, HTTPException, Depends, status
from app.core.auth import get_current_user
from app.core.database import supabase_admin
from app.models.schemas import ProfileUpdateRequest
import structlog

log = structlog.get_logger()
router = APIRouter()


@router.get("/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Get authenticated user's full profile."""
    return current_user


@router.get("/profile/{user_id}")
async def get_public_profile(user_id: str, _: dict = Depends(get_current_user)):
    """
    Get another user's public profile.
    Parameterized query – safe from SQL injection.
    """
    # Validate UUID format to prevent injection
    import re
    uuid_pattern = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
    if not uuid_pattern.match(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID format.")

    result = (
        supabase_admin
        .from_("users")
        .select("id, name, github_username, experience_level, bio, avatar_url, skills, looking_for, hackathon_interests, created_at, role")
        .eq("id", user_id)   # ← parameterized
        .maybe_single()
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="User not found.")

    # Exclude sensitive fields from public view
    profile = result.data
    profile.pop("email", None)  # Never expose email publicly
    return profile


@router.patch("/profile")
async def update_profile(
    body: ProfileUpdateRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Update current user's profile.
    Only allows whitelisted fields – never allows role/id changes.
    """
    user_id = current_user["id"]

    # Whitelist update fields – NEVER allow role, id, email changes here
    allowed_fields = {
        "name", "bio", "github_username", "experience_level",
        "skills", "looking_for", "hackathon_interests",
    }

    updates = {
        k: v for k, v in body.model_dump(exclude_none=True).items()
        if k in allowed_fields  # strict whitelist
    }

    if not updates:
        raise HTTPException(status_code=400, detail="No valid fields to update.")

    try:
        result = (
            supabase_admin
            .from_("users")
            .update(updates)
            .eq("id", user_id)   # ← parameterized
            .execute()
        )

        if not result.data:
            raise HTTPException(status_code=404, detail="Profile not found.")

        log.info("Profile updated", user_id=user_id, fields=list(updates.keys()))
        return result.data[0]

    except HTTPException:
        raise
    except Exception as e:
        log.error("Profile update failed", user_id=user_id, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to update profile.")


@router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    """Returns aggregated stats for the dashboard."""
    user_id = current_user["id"]

    try:
        # Profile completion
        fields = ["name", "bio", "github_username", "experience_level", "skills"]
        completed = sum(1 for f in fields if current_user.get(f))
        profile_completion = round((completed / len(fields)) * 100)

        # GitHub verification status
        gh_result = (
            supabase_admin
            .from_("github_profiles")
            .select("verification_score")
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )

        # Trust score
        trust_result = (
            supabase_admin
            .from_("trust_scores")
            .select("score, label")
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )

        # Match count
        match_result = (
            supabase_admin
            .from_("matches")
            .select("compatibility_score")
            .eq("user_id", user_id)
            .execute()
        )

        matches = match_result.data or []
        top_score = max((m["compatibility_score"] for m in matches), default=0)

        return {
            "profile_completion": profile_completion,
            "github_verified": bool(gh_result.data),
            "trust_score": trust_result.data.get("score", 0) if trust_result.data else 0,
            "trust_label": trust_result.data.get("label", "Unverified") if trust_result.data else "Unverified",
            "total_matches": len(matches),
            "top_compatibility": top_score,
            "active_hackathons": 0,
            "skill_count": len(current_user.get("skills") or []),
        }

    except Exception as e:
        log.error("Dashboard stats error", user_id=user_id, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to fetch dashboard stats.")
