"""GitHub verification router."""
from fastapi import APIRouter, HTTPException, Depends, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.core.auth import get_current_user
from app.core.database import supabase_admin
from app.models.schemas import GitHubAnalyzeRequest
from app.services.github_service import github_engine
from app.services.trust_service import trust_service
from datetime import datetime, timezone
import structlog

log = structlog.get_logger()
limiter = Limiter(key_func=get_remote_address)
router = APIRouter()


@router.post("/analyze")
@limiter.limit("10/minute")
async def analyze_github(
    request: Request,
    body: GitHubAnalyzeRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Analyze a GitHub profile and store results.
    Rate limited to 10/minute to respect GitHub API limits.
    """
    user_id = current_user["id"]
    username = body.username.strip()  # Already validated by Pydantic pattern

    try:
        # Run GitHub analysis
        log.info("GitHub analysis started", user_id=user_id, username=username)
        gh_data = await github_engine.analyze(username)

        # Upsert github_profiles (parameterized via Supabase client – safe)
        supabase_admin.from_("github_profiles").upsert({
            "user_id": user_id,
            "repo_count": gh_data["repo_count"],
            "stars": gh_data["stars"],
            "forks": gh_data["forks"],
            "commits": gh_data["commits"],
            "languages_json": gh_data["languages_json"],
            "verification_score": gh_data["verification_score"],
            "last_active": gh_data["last_active"],
        }, on_conflict="user_id").execute()

        # Update user's github_username and avatar
        supabase_admin.from_("users").update({
            "github_username": username,
            "avatar_url": gh_data.get("avatar_url"),
        }).eq("id", user_id).execute()

        # Recalculate trust score
        updated_user = {**current_user, "github_username": username}
        trust_data = trust_service.calculate(gh_data, updated_user)

        supabase_admin.from_("trust_scores").upsert({
            "user_id": user_id,
            "score": trust_data["score"],
            "label": trust_data["label"],
            "explanation": trust_data["explanation"],
            "confidence": trust_data["confidence"],
        }, on_conflict="user_id").execute()

        log.info("GitHub analysis complete", user_id=user_id, score=trust_data["score"])
        return {
            **gh_data,
            "trust_score": trust_data,
        }

    except ValueError as e:
        # GitHub API errors (not found, rate limit, etc.)
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        log.error("GitHub analysis failed", user_id=user_id, error=str(e))
        raise HTTPException(status_code=500, detail="GitHub analysis failed. Please try again.")


@router.get("/profile")
async def get_github_profile(current_user: dict = Depends(get_current_user)):
    """Get stored GitHub profile for current user."""
    user_id = current_user["id"]

    result = (
        supabase_admin
        .from_("github_profiles")
        .select("*")
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )

    if not result.data:
        return None

    # Add top_languages (sorted from languages_json)
    gh = result.data
    languages = gh.get("languages_json") or {}
    gh["top_languages"] = sorted(languages, key=lambda x: languages[x], reverse=True)[:6]
    gh["days_since_active"] = 0  # Computed on demand
    gh["followers"] = 0
    gh["following"] = 0
    gh["public_repos"] = gh["repo_count"]
    gh["account_age_days"] = 365  # Default
    return gh
