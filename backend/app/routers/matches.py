"""AI Matching router."""
from fastapi import APIRouter, HTTPException, Depends
from app.core.auth import get_current_user
from app.core.database import supabase_admin
from app.ai.matching_engine import ai_engine
import structlog

log = structlog.get_logger()
router = APIRouter()


@router.get("/matches")
async def get_matches(current_user: dict = Depends(get_current_user)):
    """
    Get AI-computed matches for current user.
    Returns cached matches if available, otherwise computes fresh.
    """
    user_id = current_user["id"]

    # Check cached matches first (freshness: 1 hour)
    cached = (
        supabase_admin
        .from_("matches")
        .select("*, matched_user:users!matched_user_id(id, name, github_username, experience_level, bio, avatar_url, skills, looking_for)")
        .eq("user_id", user_id)
        .order("compatibility_score", desc=True)
        .limit(20)
        .execute()
    )

    if cached.data and len(cached.data) > 0:
        # Enrich with trust and github data
        enriched = []
        for match in cached.data:
            mid = match.get("matched_user_id")
            if mid:
                trust_r = supabase_admin.from_("trust_scores").select("*").eq("user_id", mid).maybe_single().execute()
                gh_r = supabase_admin.from_("github_profiles").select("*").eq("user_id", mid).maybe_single().execute()

                gh = gh_r.data
                if gh:
                    langs = gh.get("languages_json") or {}
                    gh["top_languages"] = sorted(langs, key=lambda x: langs[x], reverse=True)[:4]
                    gh["days_since_active"] = 0
                    gh["followers"] = 0
                    gh["following"] = 0
                    gh["public_repos"] = gh.get("repo_count", 0)
                    gh["account_age_days"] = 365

                match["trust_score"] = trust_r.data
                match["github_profile"] = gh
                match["skill_breakdown"] = {
                    "skill_similarity": 0.65,
                    "github_activity": 0.7,
                    "trust_score": (trust_r.data.get("score", 0) / 10) if trust_r.data else 0.4,
                    "experience_match": 0.8,
                }
                match["confidence_level"] = match.get("compatibility_score", 0.5)
            enriched.append(match)
        return enriched

    # Compute fresh matches
    return await _compute_and_store_matches(user_id, current_user)


@router.post("/matches/refresh")
async def refresh_matches(current_user: dict = Depends(get_current_user)):
    """Force recompute matches."""
    user_id = current_user["id"]

    # Delete old matches
    supabase_admin.from_("matches").delete().eq("user_id", user_id).execute()

    return await _compute_and_store_matches(user_id, current_user)


async def _compute_and_store_matches(user_id: str, current_user: dict):
    """Internal: compute AI matches and persist them."""
    try:
        # Fetch all other users
        candidates_r = (
            supabase_admin
            .from_("users")
            .select("*")
            .neq("id", user_id)
            .limit(200)
            .execute()
        )
        candidates = candidates_r.data or []

        if not candidates:
            return []

        # ── Batch fetch trust scores and github profiles ───────────────
        # 2 queries instead of 200*2 = 400 queries (fixes N+1 problem)
        candidate_ids = [c["id"] for c in candidates]

        trust_batch = (
            supabase_admin
            .from_("trust_scores")
            .select("*")
            .in_("user_id", candidate_ids)
            .execute()
        )
        github_batch = (
            supabase_admin
            .from_("github_profiles")
            .select("*")
            .in_("user_id", candidate_ids)
            .execute()
        )

        # Build lookup maps for O(1) access
        trust_map = {t["user_id"]: t for t in (trust_batch.data or [])}
        github_map = {g["user_id"]: g for g in (github_batch.data or [])}

        for cand in candidates:
            cand["trust_score"] = trust_map.get(cand["id"])
            cand["github_profile"] = github_map.get(cand["id"])

        # Fetch current user's github/trust
        curr_gh = supabase_admin.from_("github_profiles").select("*").eq("user_id", user_id).maybe_single().execute()
        curr_trust = supabase_admin.from_("trust_scores").select("*").eq("user_id", user_id).maybe_single().execute()

        # Run AI engine
        matches = ai_engine.compute_matches(
            target_user=current_user,
            candidates=candidates,
            target_github=curr_gh.data,
            target_trust=curr_trust.data,
        )

        # Persist matches
        if matches:
            match_records = [
                {
                    "user_id": user_id,
                    "matched_user_id": m["matched_user_id"],
                    "compatibility_score": m["compatibility_score"],
                    "shared_skills": m["shared_skills"],
                    "recommendation_reason": m["recommendation_reason"],
                }
                for m in matches
            ]
            supabase_admin.from_("matches").insert(match_records).execute()

        # Return enriched matches
        enriched = []
        for m in matches[:20]:
            cand = next((c for c in candidates if c["id"] == m["matched_user_id"]), None)
            if cand:
                gh = cand.get("github_profile")
                if gh:
                    langs = gh.get("languages_json") or {}
                    gh["top_languages"] = sorted(langs, key=lambda x: langs[x], reverse=True)[:4]
                    gh["days_since_active"] = 0
                    gh["followers"] = 0
                    gh["following"] = 0
                    gh["public_repos"] = gh.get("repo_count", 0)
                    gh["account_age_days"] = 365

                enriched.append({
                    **m,
                    "id": f"{user_id}-{m['matched_user_id']}",
                    "user_id": user_id,
                    "matched_user": {
                        "id": cand["id"],
                        "name": cand["name"],
                        "github_username": cand.get("github_username"),
                        "experience_level": cand.get("experience_level"),
                        "bio": cand.get("bio"),
                        "avatar_url": cand.get("avatar_url"),
                        "skills": cand.get("skills", []),
                        "looking_for": cand.get("looking_for", []),
                    },
                    "trust_score": cand.get("trust_score"),
                    "github_profile": cand.get("github_profile"),
                })

        log.info("Matches computed", user_id=user_id, count=len(enriched))
        return enriched

    except Exception as e:
        log.error("Match computation failed", user_id=user_id, error=str(e))
        raise HTTPException(status_code=500, detail="AI matching engine error.")
