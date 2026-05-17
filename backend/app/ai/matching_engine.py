"""
AI Matching Engine
Uses TF-IDF vectorization + Cosine Similarity for skill matching,
then applies weighted scoring:
  - 40% skill similarity (TF-IDF cosine)
  - 25% GitHub activity score
  - 20% trust score
  - 15% experience level match

Returns ranked matches with explanations.
"""
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from typing import List, Dict, Optional, Tuple
import structlog

log = structlog.get_logger()

# Experience level numeric mapping (for distance calculation)
EXPERIENCE_MAP = {
    "beginner": 1,
    "intermediate": 2,
    "advanced": 3,
    "expert": 4,
}

# Matching weights
WEIGHTS = {
    "skill_similarity": 0.40,
    "github_activity":  0.25,
    "trust_score":      0.20,
    "experience_match": 0.15,
}


class AIMatchingEngine:
    """
    TF-IDF + Cosine Similarity matching engine.
    Handles edge cases: empty vectors, missing profiles, cold-start users.
    """

    def compute_matches(
        self,
        target_user: Dict,
        candidates: List[Dict],
        target_github: Optional[Dict] = None,
        target_trust: Optional[Dict] = None,
    ) -> List[Dict]:
        """
        Returns ranked list of match objects for the target user.
        """
        if not candidates:
            return []

        results = []
        target_skill_doc = self._build_skill_document(target_user)
        target_exp = EXPERIENCE_MAP.get(target_user.get("experience_level", ""), 2)
        target_trust_score = (target_trust.get("score", 0) / 10) if target_trust else 0

        for candidate in candidates:
            if candidate["id"] == target_user["id"]:
                continue  # Don't match with yourself

            try:
                match = self._compute_single_match(
                    target_user=target_user,
                    target_skill_doc=target_skill_doc,
                    target_exp=target_exp,
                    target_trust_score=target_trust_score,
                    target_github=target_github,
                    candidate=candidate,
                )
                if match:
                    results.append(match)
            except Exception as e:
                log.warning("Match computation failed for candidate", id=candidate.get("id"), error=str(e))
                continue

        # Sort by compatibility score descending
        results.sort(key=lambda x: x["compatibility_score"], reverse=True)
        return results[:20]  # Return top 20

    def _compute_single_match(
        self,
        target_user: Dict,
        target_skill_doc: str,
        target_exp: int,
        target_trust_score: float,
        target_github: Optional[Dict],
        candidate: Dict,
    ) -> Optional[Dict]:
        """Compute match for a single candidate."""
        candidate_skill_doc = self._build_skill_document(candidate)

        # ── Skill Similarity (TF-IDF Cosine) ─────────────────
        skill_sim = self._tfidf_similarity(target_skill_doc, candidate_skill_doc)

        # ── Shared Skills ─────────────────────────────────────
        target_skills = set(s.lower() for s in (target_user.get("skills") or []))
        cand_skills = set(s.lower() for s in (candidate.get("skills") or []))
        shared = list(target_skills & cand_skills)

        # Bonus: target's "looking for" matches candidate's skills
        looking_for = set(s.lower() for s in (target_user.get("looking_for") or []))
        looking_match = len(looking_for & cand_skills) / max(len(looking_for), 1)
        skill_sim = min(skill_sim + looking_match * 0.2, 1.0)  # bonus

        # ── GitHub Activity ───────────────────────────────────
        cand_github = candidate.get("github_profile")
        github_score = self._score_github_activity(cand_github)

        # ── Trust Score ───────────────────────────────────────
        cand_trust = candidate.get("trust_score")
        trust_score = (cand_trust.get("score", 0) / 10) if cand_trust else 0.0

        # ── Experience Match ──────────────────────────────────
        cand_exp = EXPERIENCE_MAP.get(candidate.get("experience_level", ""), 2)
        exp_diff = abs(target_exp - cand_exp)
        exp_score = max(0, 1.0 - exp_diff * 0.25)

        # ── Weighted Composite Score ──────────────────────────
        breakdown = {
            "skill_similarity": round(skill_sim, 3),
            "github_activity":  round(github_score, 3),
            "trust_score":      round(trust_score, 3),
            "experience_match": round(exp_score, 3),
        }

        composite = (
            skill_sim   * WEIGHTS["skill_similarity"] +
            github_score * WEIGHTS["github_activity"] +
            trust_score  * WEIGHTS["trust_score"] +
            exp_score    * WEIGHTS["experience_match"]
        )

        # Filter out very low matches
        if composite < 0.1:
            return None

        confidence = self._calculate_confidence(
            skill_sim, github_score, trust_score, has_github=bool(cand_github)
        )

        reason = self._generate_reason(
            candidate, shared, skill_sim, github_score, trust_score, cand_github
        )

        return {
            "matched_user_id": candidate["id"],
            "compatibility_score": round(composite, 4),
            "confidence_level": round(confidence, 3),
            "shared_skills": shared[:8],
            "recommendation_reason": reason,
            "skill_breakdown": breakdown,
        }

    def _build_skill_document(self, user: Dict) -> str:
        """
        Builds a combined text document from skills, looking_for, and interests.
        Used as TF-IDF input.
        """
        parts = []
        parts.extend(user.get("skills") or [])
        parts.extend(user.get("looking_for") or [])
        parts.extend(user.get("hackathon_interests") or [])
        if user.get("experience_level"):
            parts.append(user["experience_level"])
        if user.get("bio"):
            parts.append(user["bio"])
        return " ".join(parts).lower() if parts else "developer"

    def _tfidf_similarity(self, doc1: str, doc2: str) -> float:
        """Compute cosine similarity between two skill documents."""
        if not doc1.strip() or not doc2.strip():
            return 0.0
        try:
            vectorizer = TfidfVectorizer(
                ngram_range=(1, 2),
                min_df=1,
                stop_words="english",
                max_features=500,
            )
            tfidf_matrix = vectorizer.fit_transform([doc1, doc2])
            similarity = cosine_similarity(tfidf_matrix[0], tfidf_matrix[1])[0][0]
            return float(np.clip(similarity, 0.0, 1.0))
        except Exception:
            return 0.0

    def _score_github_activity(self, github: Optional[Dict]) -> float:
        """Normalize GitHub activity into 0–1 score."""
        if not github:
            return 0.0
        ver_score = github.get("verification_score", 0)
        return float(np.clip(ver_score / 100, 0.0, 1.0))

    def _calculate_confidence(
        self,
        skill_sim: float,
        github_score: float,
        trust_score: float,
        has_github: bool,
    ) -> float:
        """How confident is this match? Based on data completeness."""
        base = (skill_sim + trust_score) / 2
        if has_github:
            base += 0.15
        if skill_sim > 0.5:
            base += 0.1
        return min(base, 1.0)

    def _generate_reason(
        self,
        candidate: Dict,
        shared: List[str],
        skill_sim: float,
        github_score: float,
        trust_score: float,
        github: Optional[Dict],
    ) -> str:
        """Generate a human-readable AI match explanation."""
        name = candidate.get("name", "This developer")
        reasons = []

        if shared:
            top_skills = ", ".join(shared[:3])
            reasons.append(f"Strong skill overlap in {top_skills}")

        if skill_sim > 0.6:
            reasons.append("highly complementary technical profiles")
        elif skill_sim > 0.35:
            reasons.append("compatible skill sets")

        if github and github.get("days_since_active", 999) <= 30:
            reasons.append("recently active on GitHub")

        if trust_score >= 0.7:
            reasons.append("high trust score")
        elif trust_score >= 0.5:
            reasons.append("verified profile")

        if github and github.get("stars", 0) > 20:
            reasons.append(f"{github['stars']} GitHub stars")

        if reasons:
            return f"{name}: {'. '.join(reasons[:3]).capitalize()}."
        return f"{name} matches your hackathon profile based on AI skill analysis."


# Singleton
ai_engine = AIMatchingEngine()
