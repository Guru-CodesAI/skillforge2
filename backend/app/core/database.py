"""
Supabase client factory – truly lazy initialization.

Clients are created on FIRST USE, not at import time.
This means the app boots cleanly even before .env is configured,
and you'll get a clear error message at the API call level rather
than a cryptic crash at startup.
"""
from supabase import create_client, Client
from app.core.config import settings
import structlog

log = structlog.get_logger()

_supabase_admin: Client | None = None
_supabase_anon: Client | None = None


def _get_admin() -> Client:
    global _supabase_admin
    if _supabase_admin is None:
        _supabase_admin = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY,
        )
    return _supabase_admin


def _get_anon() -> Client:
    global _supabase_anon
    if _supabase_anon is None:
        _supabase_anon = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_ANON_KEY,
        )
    return _supabase_anon


class _LazyClient:
    """
    Proxy that forwards Supabase Client method calls to a lazily-created
    real client. All existing code using `supabase_admin.from_(...)` etc.
    continues to work without any changes.
    """

    def __init__(self, factory):
        object.__setattr__(self, "_factory", factory)

    def _client(self) -> Client:
        return object.__getattribute__(self, "_factory")()

    # ── Core Supabase methods used throughout the codebase ───────
    def from_(self, table: str):
        return self._client().from_(table)

    def table(self, table: str):
        return self._client().table(table)

    @property
    def auth(self):
        return self._client().auth

    @property
    def storage(self):
        return self._client().storage

    def rpc(self, *args, **kwargs):
        return self._client().rpc(*args, **kwargs)

    # Generic fallback for any other attribute
    def __getattr__(self, name: str):
        return getattr(self._client(), name)


# Module-level exports used throughout all routers
# These are lazy proxies – the real Supabase Client is created on first use
supabase_admin: Client = _LazyClient(_get_admin)  # type: ignore[assignment]
supabase_anon: Client = _LazyClient(_get_anon)    # type: ignore[assignment]
