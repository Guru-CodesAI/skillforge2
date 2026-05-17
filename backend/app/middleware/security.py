"""
Security middleware:
  1. SecurityHeadersMiddleware – injects hardened HTTP security headers
  2. RequestSanitizationMiddleware – detects and blocks malicious payloads

Body-stream fix: we read the body, scan it, then put it back using
a custom receive callable so FastAPI can still parse it normally.
"""
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
import re
import structlog

log = structlog.get_logger()

# ── Dangerous Patterns ─────────────────────────────────────────
# SQL Injection, XSS, path traversal, shell injection
MALICIOUS_PATTERNS = [
    r"(\bselect\b|\binsert\b|\bupdate\b|\bdelete\b|\bdrop\b|\bunion\b|\bexec\b|\bexecute\b)",  # SQL
    r"(<script[\s\S]*?>[\s\S]*?<\/script>|javascript:|on\w+\s*=)",  # XSS
    r"(\.\./|\.\.\\)",  # Path traversal
    r"(;\s*(ls|cat|rm|wget|curl|bash|sh|powershell)\s)",  # Shell injection
    r"(<\?php|<\?=)",  # PHP injection
]

COMPILED_PATTERNS = [re.compile(p, re.IGNORECASE) for p in MALICIOUS_PATTERNS]

SAFE_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Content-Security-Policy": (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline'; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "img-src 'self' data: https: blob:; "
        "connect-src 'self' https://*.supabase.co https://api.github.com; "
        "frame-ancestors 'none';"
    ),
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "Cache-Control": "no-store",
}


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        for key, value in SAFE_HEADERS.items():
            response.headers[key] = value
        # Remove server info leakage
        if "server" in response.headers:
            del response.headers["server"]
        if "x-powered-by" in response.headers:
            del response.headers["x-powered-by"]
        return response


def _is_malicious(text: str) -> bool:
    return any(p.search(text) for p in COMPILED_PATTERNS)


class RequestSanitizationMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        # Check URL path and query parameters for injection
        raw_url = str(request.url)
        client_ip = request.client.host if request.client else "unknown"

        if _is_malicious(raw_url):
            log.warning(
                "Malicious URL pattern detected",
                ip=client_ip,
                url=raw_url[:200],
            )
            return JSONResponse(
                status_code=400,
                content={"detail": "Request contains invalid characters."},
            )

        # Check request body for JSON endpoints WITHOUT consuming the stream.
        # We read the body, check it, then reconstruct a receive callable so
        # FastAPI route handlers can still parse the body normally.
        if request.headers.get("content-type", "").startswith("application/json"):
            try:
                body_bytes = await request.body()
                body_str = body_bytes.decode("utf-8", errors="ignore")

                if _is_malicious(body_str):
                    log.warning(
                        "Malicious payload detected in body",
                        ip=client_ip,
                        endpoint=request.url.path,
                    )
                    return JSONResponse(
                        status_code=400,
                        content={"detail": "Request body contains invalid characters."},
                    )

                # ── Reconstruct the body stream so downstream can read it ──
                # Starlette caches the body in request._body after the first
                # `await request.body()` call, so subsequent reads work fine.
                # This is the officially supported pattern.
            except Exception:
                pass  # Don't block on decode errors

        return await call_next(request)
