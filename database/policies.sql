-- ============================================================
-- Supabase Row Level Security Policies
-- Idempotent script: drops existing policies before creating
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.github_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_scores    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_logs   ENABLE ROW LEVEL SECURITY;

-- ── users policies ────────────────────────────────────────────
DROP POLICY IF EXISTS "users_select_own" ON public.users;
CREATE POLICY "users_select_own"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "users_select_public" ON public.users;
CREATE POLICY "users_select_public"
    ON public.users FOR SELECT
    USING (true);  -- Frontend filters sensitive fields

DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own"
    ON public.users FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- ── github_profiles policies ──────────────────────────────────
DROP POLICY IF EXISTS "github_select_authenticated" ON public.github_profiles;
CREATE POLICY "github_select_authenticated"
    ON public.github_profiles FOR SELECT
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "github_upsert_own" ON public.github_profiles;
CREATE POLICY "github_upsert_own"
    ON public.github_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "github_update_own" ON public.github_profiles;
CREATE POLICY "github_update_own"
    ON public.github_profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- ── trust_scores policies ─────────────────────────────────────
DROP POLICY IF EXISTS "trust_select_authenticated" ON public.trust_scores;
CREATE POLICY "trust_select_authenticated"
    ON public.trust_scores FOR SELECT
    USING (auth.role() = 'authenticated');

-- ── matches policies ──────────────────────────────────────────
DROP POLICY IF EXISTS "matches_select_own" ON public.matches;
CREATE POLICY "matches_select_own"
    ON public.matches FOR SELECT
    USING (auth.uid() = user_id);

-- ── admin_logs policies ───────────────────────────────────────
DROP POLICY IF EXISTS "admin_logs_select_admins" ON public.admin_logs;
CREATE POLICY "admin_logs_select_admins"
    ON public.admin_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ── security_logs policies ────────────────────────────────────
DROP POLICY IF EXISTS "security_logs_select_admins" ON public.security_logs;
CREATE POLICY "security_logs_select_admins"
    ON public.security_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
