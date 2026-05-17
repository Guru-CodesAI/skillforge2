"""Trust Score router."""
from fastapi import APIRouter, Depends
from app.core.auth import get_current_user
from app.core.database import supabase_admin
from app.services.trust_service import trust_service
import structlog

log = structlog.get_logger()
router = APIRouter()


@router.get("/score")
async def get_trust_score(current_user: dict = Depends(get_current_user)):
    """Get the current user's trust score, computing if absent."""
    user_id = current_user["id"]

    # Pre-fetch GitHub profile to compute the multi-factor breakdown dynamically
    gh_result = (
        supabase_admin
        .from_("github_profiles")
        .select("*")
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )

    gh_data = gh_result.data
    if gh_data:
        langs = gh_data.get("languages_json") or {}
        gh_data["top_languages"] = sorted(langs, key=lambda x: langs[x], reverse=True)[:6]
        gh_data["days_since_active"] = 30  # Default estimate
        gh_data["account_age_days"] = 365  # Default estimate

    # Compute fresh breakdown
    trust_data = trust_service.calculate(gh_data, current_user)

    # Check for cached score
    result = (
        supabase_admin
        .from_("trust_scores")
        .select("*")
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )

    if result.data:
        # Return DB record enriched with dynamic breakdown
        return {
            **result.data,
            "breakdown": trust_data["breakdown"],
        }

    # No score yet — persist and return
    try:
        stored = supabase_admin.from_("trust_scores").upsert({
            "user_id": user_id,
            "score": trust_data["score"],
            "label": trust_data["label"],
            "explanation": trust_data["explanation"],
            "confidence": trust_data["confidence"],
        }, on_conflict="user_id").execute()

        if stored.data:
            return {
                **stored.data[0],
                "breakdown": trust_data["breakdown"],
            }
    except Exception as e:
        log.warning("Failed to persist trust score", error=str(e))

    return {
        "user_id": user_id,
        **trust_data,
    }
