"""
Dashboard stats router.
Aggregates profile completion, trust score, match count, and GitHub status
into a single lightweight response for the frontend dashboard.
"""
from fastapi import APIRouter, Depends, HTTPException
from app.core.auth import get_current_user
from app.core.database import supabase_admin
import structlog

log = structlog.get_logger()
router = APIRouter()


@router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    """
    Returns a consolidated stats payload for the user dashboard.
    Single DB round-trip design – fetches trust, github, and match counts together.
    """
    user_id = current_user["id"]

    try:
        # Parallel-ish fetches (Supabase Python SDK is sync but fast)
        trust_r = (
            supabase_admin
            .from_("trust_scores")
            .select("score, label")
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )
        github_r = (
            supabase_admin
            .from_("github_profiles")
            .select("id, verification_score")
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )
        matches_r = (
            supabase_admin
            .from_("matches")
            .select("compatibility_score")
            .eq("user_id", user_id)
            .order("compatibility_score", desc=True)
            .limit(50)
            .execute()
        )

        trust = trust_r.data or {}
        github = github_r.data
        matches = matches_r.data or []

        # Profile completion (out of 5 tracked fields)
        completion_fields = [
            bool(current_user.get("name")),
            bool(current_user.get("bio")),
            bool(current_user.get("github_username")),
            bool(current_user.get("experience_level")),
            bool(current_user.get("skills") and len(current_user.get("skills", [])) >= 3),
        ]
        profile_completion = round((sum(completion_fields) / len(completion_fields)) * 100)

        top_score = matches[0]["compatibility_score"] if matches else 0.0

        return {
            "profile_completion": profile_completion,
            "github_verified": bool(github),
            "trust_score": trust.get("score", 0),
            "trust_label": trust.get("label", "Unverified"),
            "total_matches": len(matches),
            "top_compatibility": round(top_score * 100, 1),
            "active_hackathons": 0,   # Future feature
            "skill_count": len(current_user.get("skills") or []),
        }

    except Exception as e:
        log.error("Dashboard stats error", user_id=user_id, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to load dashboard stats.")
