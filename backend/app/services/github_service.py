"""
GitHub Verification Engine
Analyzes a developer's GitHub profile to extract:
  - Repository quality metrics
  - Language distribution
  - Commit activity and consistency
  - Account age and reputation
  - Activity recency score

Generates a verification_score (0–100) and trust indicators.
"""
import httpx
import asyncio
from datetime import datetime, timezone
from typing import Dict, List, Tuple, Optional
from app.core.config import settings
import structlog

log = structlog.get_logger()

GITHUB_API = "https://api.github.com"
HEADERS = {
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
}
if settings.GITHUB_TOKEN:
    HEADERS["Authorization"] = f"Bearer {settings.GITHUB_TOKEN}"


class GitHubVerificationEngine:

    async def analyze(self, username: str) -> Dict:
        """
        Full GitHub profile analysis.
        Returns structured data ready for DB insertion.
        """
        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                # Fetch in parallel for speed
                user_task = client.get(f"{GITHUB_API}/users/{username}", headers=HEADERS)
                repos_task = client.get(
                    f"{GITHUB_API}/users/{username}/repos",
                    headers=HEADERS,
                    params={"per_page": 100, "sort": "pushed", "type": "owner"},
                )
                user_resp, repos_resp = await asyncio.gather(user_task, repos_task)

                if user_resp.status_code == 404:
                    raise ValueError(f"GitHub user '{username}' not found.")
                if user_resp.status_code == 403:
                    raise ValueError("GitHub API rate limit exceeded. Try again later.")

                user_resp.raise_for_status()
                repos_resp.raise_for_status()

                user_data = user_resp.json()
                repos_data = repos_resp.json()

                return self._process(user_data, repos_data)

            except httpx.TimeoutException:
                raise ValueError("GitHub API request timed out. Please try again.")
            except httpx.HTTPStatusError as e:
                raise ValueError(f"GitHub API error: {e.response.status_code}")

    def _process(self, user: Dict, repos: List[Dict]) -> Dict:
        """Process raw GitHub API data into structured analytics."""
        now = datetime.now(timezone.utc)

        # Account age
        created_at = datetime.fromisoformat(user["created_at"].replace("Z", "+00:00"))
        account_age_days = (now - created_at).days

        # Filter out forks for quality analysis
        owned_repos = [r for r in repos if not r.get("fork", False)]

        # Stars and forks
        total_stars = sum(r.get("stargazers_count", 0) for r in owned_repos)
        total_forks = sum(r.get("forks_count", 0) for r in owned_repos)

        # Language distribution (by repo count, not bytes – simpler without extra API calls)
        languages: Dict[str, int] = {}
        for repo in owned_repos:
            lang = repo.get("language")
            if lang:
                languages[lang] = languages.get(lang, 0) + 1

        # Top languages
        top_languages = sorted(languages, key=lambda x: languages[x], reverse=True)[:6]

        # Activity recency (last push across any repo)
        push_dates = []
        for repo in repos:
            pushed_at = repo.get("pushed_at")
            if pushed_at:
                try:
                    push_dates.append(datetime.fromisoformat(pushed_at.replace("Z", "+00:00")))
                except ValueError:
                    pass

        last_active = max(push_dates, default=created_at)
        days_since_active = (now - last_active).days

        # Estimated commits (approximation – full commit history requires paginated API)
        estimated_commits = min(user.get("public_gists", 0) + len(owned_repos) * 15, 5000)

        # Verification score calculation
        verification_score = self._calculate_verification_score(
            repo_count=len(owned_repos),
            stars=total_stars,
            forks=total_forks,
            languages=languages,
            account_age_days=account_age_days,
            days_since_active=days_since_active,
            followers=user.get("followers", 0),
        )

        return {
            "github_username": user["login"],
            "repo_count": len(owned_repos),
            "stars": total_stars,
            "forks": total_forks,
            "commits": estimated_commits,
            "languages_json": languages,
            "top_languages": top_languages,
            "verification_score": round(verification_score, 2),
            "last_active": last_active.isoformat(),
            "account_age_days": account_age_days,
            "followers": user.get("followers", 0),
            "following": user.get("following", 0),
            "public_repos": user.get("public_repos", 0),
            "avatar_url": user.get("avatar_url"),
            "days_since_active": days_since_active,
        }

    def _calculate_verification_score(
        self,
        repo_count: int,
        stars: int,
        forks: int,
        languages: Dict[str, int],
        account_age_days: int,
        days_since_active: int,
        followers: int,
    ) -> float:
        """
        Weighted score 0–100:
          - 30% repository volume
          - 25% community signals (stars + forks + followers)
          - 25% activity recency
          - 20% diversity (language breadth)
        """
        score = 0.0

        # Repository volume (30 pts)
        repo_score = min(repo_count / 20, 1.0) * 30
        score += repo_score

        # Community signals (25 pts)
        community_raw = (
            min(stars / 50, 1.0) * 0.4 +
            min(forks / 20, 1.0) * 0.3 +
            min(followers / 50, 1.0) * 0.3
        )
        score += community_raw * 25

        # Activity recency (25 pts) – penalise inactivity
        if days_since_active <= 7:
            activity_score = 25
        elif days_since_active <= 30:
            activity_score = 20
        elif days_since_active <= 90:
            activity_score = 15
        elif days_since_active <= 180:
            activity_score = 8
        else:
            activity_score = 2
        score += activity_score

        # Language diversity (20 pts)
        lang_count = len(languages)
        diversity_score = min(lang_count / 5, 1.0) * 20
        score += diversity_score

        return min(score, 100.0)


# Singleton
github_engine = GitHubVerificationEngine()
