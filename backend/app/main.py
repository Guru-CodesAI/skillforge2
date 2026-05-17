# ============================================================
# SkillForge Backend – FastAPI Application Entry Point
# ============================================================
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from contextlib import asynccontextmanager
import structlog
import time

from app.core.config import settings
from app.middleware.security import SecurityHeadersMiddleware, RequestSanitizationMiddleware
from app.middleware.logging import RequestLoggingMiddleware
from app.routers import auth, profile, github, matches, admin, trust, dashboard

# ── Structured Logging ─────────────────────────────────────────
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

log = structlog.get_logger()

# ── Rate Limiter ───────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)

# ── Lifespan (startup / shutdown) ─────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    if not settings.supabase_configured:
        log.warning(
            "\n" + "═" * 60 + "\n"
            "  ⚠️  Supabase is NOT configured.\n"
            "  The API server started but database calls will fail.\n"
            "  Edit backend/.env and set:\n"
            "    SUPABASE_URL=https://YOUR_PROJECT.supabase.co\n"
            "    SUPABASE_ANON_KEY=...\n"
            "    SUPABASE_SERVICE_ROLE_KEY=...\n"
            "    SUPABASE_JWT_SECRET=...\n"
            "  Get these from: Supabase Dashboard → Settings → API\n"
            + "═" * 60
        )
    else:
        log.info("SkillForge API started", supabase=settings.SUPABASE_URL)
    yield
    # Shutdown (nothing to clean up)


# ── FastAPI App ────────────────────────────────────────────────
app = FastAPI(
    title="SkillForge API",
    description="AI-Powered Hackathon Teammate Finder – Production API",
    version="1.0.0",
    docs_url="/api/docs" if settings.DEBUG else None,
    redoc_url="/api/redoc" if settings.DEBUG else None,
    openapi_url="/api/openapi.json" if settings.DEBUG else None,
    lifespan=lifespan,
)

# ── Rate Limiting ──────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── Middleware Stack ───────────────────────────────────────────
# Order matters: outermost runs first on request, last on response

# 1. Security Headers (outermost)
app.add_middleware(SecurityHeadersMiddleware)

# 2. Request Sanitization
app.add_middleware(RequestSanitizationMiddleware)

# 3. Request Logging
app.add_middleware(RequestLoggingMiddleware)

# 4. GZip compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

# 5. CORS (innermost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-CSRF-Token", "Accept"],
    expose_headers=["X-Request-ID"],
    max_age=600,
)

# ── Routers ───────────────────────────────────────────────────
app.include_router(auth.router,      prefix="/api/auth",    tags=["Authentication"])
app.include_router(profile.router,   prefix="/api",         tags=["Profile"])
app.include_router(github.router,    prefix="/api/github",  tags=["GitHub"])
app.include_router(matches.router,   prefix="/api",         tags=["Matching"])
app.include_router(admin.router,     prefix="/api/admin",   tags=["Admin"])
app.include_router(trust.router,     prefix="/api/trust",   tags=["Trust"])
app.include_router(dashboard.router, prefix="/api",         tags=["Dashboard"])

# ── Health Check ──────────────────────────────────────────────
@app.get("/api/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": "SkillForge API",
        "version": "1.0.0",
        "supabase_configured": settings.supabase_configured,
        "debug": settings.DEBUG,
    }

# ── Global Error Handlers ─────────────────────────────────────
@app.exception_handler(404)
async def not_found_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=404,
        content={"detail": "Resource not found", "path": str(request.url.path)},
    )

@app.exception_handler(500)
async def server_error_handler(request: Request, exc: Exception):
    log.error("Unhandled server error", path=str(request.url.path), error=str(exc))
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Our team has been notified."},
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    log.error("Global exception", error=str(exc), path=str(request.url.path))
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred."},
    )
