"""
Pydantic validation schemas – enforces strict input validation on all API endpoints.
Never trust raw user input.
"""
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
from enum import Enum
import re


class ExperienceLevel(str, Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"
    expert = "expert"


class UserRole(str, Enum):
    user = "user"
    admin = "admin"


# ── Auth Schemas ──────────────────────────────────────────────
class SignupRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)

    @field_validator("name")
    @classmethod
    def sanitize_name(cls, v: str) -> str:
        # Strip dangerous characters
        cleaned = re.sub(r'[<>"\'`\\;]', '', v.strip())
        if len(cleaned) < 2:
            raise ValueError("Name contains invalid characters.")
        return cleaned

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if not re.search(r'[A-Z]', v):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not re.search(r'\d', v):
            raise ValueError("Password must contain at least one number.")
        if not re.search(r'[!@#$%^&*()_+\-=\[\]{};:\'",.<>/?]', v):
            raise ValueError("Password must contain at least one special character.")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ChangePasswordRequest(BaseModel):
    new_password: str = Field(..., min_length=8, max_length=128)


# ── Profile Schemas ───────────────────────────────────────────
class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    bio: Optional[str] = Field(None, max_length=400)
    github_username: Optional[str] = Field(None, max_length=39, pattern=r'^[a-zA-Z0-9-]*$')
    experience_level: Optional[ExperienceLevel] = None
    skills: Optional[List[str]] = Field(None, max_length=12)
    looking_for: Optional[List[str]] = Field(None, max_length=12)
    hackathon_interests: Optional[List[str]] = Field(None, max_length=10)

    @field_validator("bio", mode="before")
    @classmethod
    def sanitize_bio(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        return re.sub(r'[<>"\'`]', '', v)

    @field_validator("skills", "looking_for", "hackathon_interests", mode="before")
    @classmethod
    def sanitize_list(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        if v is None:
            return v
        return [re.sub(r'[<>"\'`\\;]', '', str(skill))[:50] for skill in v]


# ── GitHub Schemas ────────────────────────────────────────────
class GitHubAnalyzeRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=39, pattern=r'^[a-zA-Z0-9-]+$')


class GitHubProfileResponse(BaseModel):
    id: str
    user_id: str
    repo_count: int
    stars: int
    forks: int
    commits: int
    languages_json: dict
    verification_score: float
    last_active: str
    top_languages: List[str]
    account_age_days: int
    followers: int
    following: int
    public_repos: int
    avatar_url: Optional[str] = None


# ── Trust Score Schemas ───────────────────────────────────────
class TrustScoreResponse(BaseModel):
    id: str
    user_id: str
    score: float
    label: str
    explanation: str
    confidence: float
    breakdown: dict


# ── Match Schemas ─────────────────────────────────────────────
class MatchResponse(BaseModel):
    id: str
    user_id: str
    matched_user_id: str
    compatibility_score: float
    shared_skills: List[str]
    recommendation_reason: str
    confidence_level: float
    skill_breakdown: dict


# ── Admin Schemas ─────────────────────────────────────────────
class AdminUserUpdate(BaseModel):
    role: Optional[UserRole] = None
    name: Optional[str] = Field(None, min_length=2, max_length=100)

    @field_validator("name", mode="before")
    @classmethod
    def sanitize_admin_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        return re.sub(r'[<>"\'`\\;]', '', str(v))
