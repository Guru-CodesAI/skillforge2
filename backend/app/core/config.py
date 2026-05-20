"""
SkillForge Backend Configuration
All secrets loaded from environment – NEVER hardcoded.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import os


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # App
    APP_NAME: str = "SkillForge"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Supabase – use defaults so the app boots before .env is configured.
    # Real values MUST be set before any API call that touches the database.
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_ANON_KEY: str = ""

    # Found in Supabase Dashboard → Settings → API → JWT Settings → JWT Secret
    SUPABASE_JWT_SECRET: str = ""

    # GitHub API
    GITHUB_TOKEN: str = ""          # Optional – increases rate limit to 5000/hr

    # JWT Settings
    JWT_SECRET: str = "dev-secret-change-in-production-minimum-32-chars"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://skillforge.vercel.app",
        "https://skillforge2-nine.vercel.app",
    ]

    # Rate Limiting
    RATE_LIMIT_LOGIN: str = "5/minute"
    RATE_LIMIT_API: str = "100/hour"
    RATE_LIMIT_GITHUB: str = "10/minute"

    # Redis (optional, for caching)
    REDIS_URL: str = "redis://localhost:6379"

    # Security
    BCRYPT_ROUNDS: int = 12

    @property
    def is_production(self) -> bool:
        return not self.DEBUG

    @property
    def supabase_configured(self) -> bool:
        """True only when real (non-placeholder) Supabase keys are set."""
        return bool(
            self.SUPABASE_URL
            and self.SUPABASE_SERVICE_ROLE_KEY
            and "YOUR_PROJECT_ID" not in self.SUPABASE_URL
            and "placeholder" not in self.SUPABASE_URL
        )


# Singleton instance
settings = Settings()
