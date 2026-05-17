"""
Trust Scoring System
Generates a 0–10 trust score based on:
  - Repository quality (40%)
  - Commit consistency (25%)
  - Account age (20%)
  - Profile completeness (15%)

Labels: Elite (8.5+), Trusted (7+), Verified (5+), Unverified (<5), Suspicious (<2)
"""
from typing import Dict, Optional, Tuple
import structlog

log = structlog.get_logger()

TRUST_THRESHOLDS = [
    (8.5, "Elite",       "Top 5% of verified developers. Exceptional GitHub history."),
    (7.0, "Trusted",     "Highly active developer with verified skills and consistent history."),
    (5.0, "Verified",    "Verified developer with solid GitHub presence."),
    (3.0, "Unverified",  "Limited GitHub history. Consider verifying more skills."),
    (0.0, "Suspicious",  "Insufficient or suspicious account signals. Proceed carefully."),
]


class TrustScoreService:

    def calculate(
        self,
        github_data: Optional[Dict],
        user_profile: Dict,
    ) -> Dict:
        """
        Calculates multi-factor trust score.
        Returns score, label, explanation, and breakdown.
        """
        if not github_data:
            return self._no_github_score()

        breakdown = {
            "repo_quality":            self._score_repo_quality(github_data),
            "commit_consistency":      self._score_commit_consistency(github_data),
            "account_age":             self._score_account_age(github_data),
            "profile_completeness":    self._score_profile_completeness(user_profile),
            "verification_confidence": self._score_verification_confidence(github_data),
        }

        # Weighted sum → 0–10 scale
        weighted = (
            breakdown["repo_quality"]            * 0.30 +
            breakdown["commit_consistency"]       * 0.25 +
            breakdown["account_age"]              * 0.20 +
            breakdown["profile_completeness"]     * 0.15 +
            breakdown["verification_confidence"]  * 0.10
        )
        score = round(weighted * 10, 2)  # normalize to 0–10

        label, explanation = self._get_label(score)
        confidence = min(breakdown["verification_confidence"] + 0.1, 1.0)

        return {
            "score": score,
            "label": label,
            "explanation": explanation,
            "confidence": round(confidence, 2),
            "breakdown": breakdown,
        }

    def _score_repo_quality(self, gh: Dict) -> float:
        """Score based on stars, forks, and repo count. 0.0–1.0"""
        repo_count = gh.get("repo_count", 0)
        stars = gh.get("stars", 0)
        forks = gh.get("forks", 0)

        repo_score = min(repo_count / 15, 1.0)
        star_score = min(stars / 30, 1.0)
        fork_score = min(forks / 10, 1.0)

        return round(repo_score * 0.5 + star_score * 0.3 + fork_score * 0.2, 3)

    def _score_commit_consistency(self, gh: Dict) -> float:
        """Score based on activity recency and commit volume. 0.0–1.0"""
        days_since_active = gh.get("days_since_active", 999)
        commits = gh.get("commits", 0)

        if days_since_active <= 7:
            recency = 1.0
        elif days_since_active <= 30:
            recency = 0.85
        elif days_since_active <= 90:
            recency = 0.6
        elif days_since_active <= 180:
            recency = 0.35
        else:
            recency = 0.1

        commit_score = min(commits / 500, 1.0)
        return round(recency * 0.6 + commit_score * 0.4, 3)

    def _score_account_age(self, gh: Dict) -> float:
        """Score based on account age. Older = more credible. 0.0–1.0"""
        age_days = gh.get("account_age_days", 0)
        if age_days >= 1825:   # 5+ years
            return 1.0
        if age_days >= 730:    # 2+ years
            return 0.8
        if age_days >= 365:    # 1+ year
            return 0.6
        if age_days >= 90:     # 3+ months
            return 0.4
        return 0.15  # brand new account

    def _score_profile_completeness(self, user: Dict) -> float:
        """Score profile field completion. 0.0–1.0"""
        fields_present = [
            bool(user.get("name")),
            bool(user.get("bio")),
            bool(user.get("github_username")),
            bool(user.get("experience_level")),
            bool(user.get("skills") and len(user.get("skills", [])) >= 3),
        ]
        return round(sum(fields_present) / len(fields_present), 3)

    def _score_verification_confidence(self, gh: Dict) -> float:
        """Derived from GitHub's own verification_score (0–100 → 0.0–1.0)."""
        raw = gh.get("verification_score", 0)
        return round(min(raw / 100, 1.0), 3)

    def _get_label(self, score: float) -> Tuple[str, str]:
        for threshold, label, explanation in TRUST_THRESHOLDS:
            if score >= threshold:
                return label, explanation
        return "Suspicious", "Very low trust signals detected."

    def _no_github_score(self) -> Dict:
        return {
            "score": 1.5,
            "label": "Unverified",
            "explanation": "GitHub account not connected. Connect GitHub to boost your Trust Score significantly.",
            "confidence": 0.1,
            "breakdown": {
                "repo_quality": 0.0,
                "commit_consistency": 0.0,
                "account_age": 0.0,
                "profile_completeness": 0.3,
                "verification_confidence": 0.0,
            },
        }


# Singleton
trust_service = TrustScoreService()
