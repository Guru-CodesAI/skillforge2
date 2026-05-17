-- ============================================================
-- SkillForge Database Schema
-- Supabase PostgreSQL with Row Level Security
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── users ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
    id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name               VARCHAR(100) NOT NULL,
    email              VARCHAR(254) UNIQUE NOT NULL,
    role               VARCHAR(20) NOT NULL DEFAULT 'user'
                       CHECK (role IN ('user', 'admin', 'suspended')),
    github_username    VARCHAR(39) UNIQUE,
    experience_level   VARCHAR(20)
                       CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    bio                VARCHAR(400),
    avatar_url         TEXT,
    skills             TEXT[] DEFAULT '{}',
    looking_for        TEXT[] DEFAULT '{}',
    hackathon_interests TEXT[] DEFAULT '{}',
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── github_profiles ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.github_profiles (
    id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id            UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    repo_count         INTEGER NOT NULL DEFAULT 0 CHECK (repo_count >= 0),
    stars              INTEGER NOT NULL DEFAULT 0 CHECK (stars >= 0),
    forks              INTEGER NOT NULL DEFAULT 0 CHECK (forks >= 0),
    commits            INTEGER NOT NULL DEFAULT 0 CHECK (commits >= 0),
    languages_json     JSONB NOT NULL DEFAULT '{}',
    verification_score NUMERIC(5,2) NOT NULL DEFAULT 0
                       CHECK (verification_score >= 0 AND verification_score <= 100),
    last_active        TIMESTAMPTZ,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── trust_scores ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trust_scores (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    score        NUMERIC(4,2) NOT NULL DEFAULT 0
                 CHECK (score >= 0 AND score <= 10),
    label        VARCHAR(20) NOT NULL DEFAULT 'Unverified'
                 CHECK (label IN ('Elite', 'Trusted', 'Verified', 'Unverified', 'Suspicious')),
    explanation  TEXT,
    confidence   NUMERIC(4,3) DEFAULT 0.0
                 CHECK (confidence >= 0 AND confidence <= 1),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── matches ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.matches (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id              UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    matched_user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    compatibility_score  NUMERIC(6,4) NOT NULL DEFAULT 0
                         CHECK (compatibility_score >= 0 AND compatibility_score <= 1),
    shared_skills        TEXT[] DEFAULT '{}',
    recommendation_reason TEXT,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, matched_user_id)
);

-- ── admin_logs ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_logs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id    UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action      VARCHAR(200) NOT NULL,
    target_user UUID,
    details     JSONB DEFAULT '{}',
    timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── security_logs ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.security_logs (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ip_address   INET,
    endpoint     VARCHAR(200),
    attack_type  VARCHAR(100),
    blocked      BOOLEAN DEFAULT TRUE,
    details      JSONB DEFAULT '{}',
    timestamp    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_email             ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role              ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_github            ON public.users(github_username);
CREATE INDEX IF NOT EXISTS idx_github_user_id          ON public.github_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_trust_user_id           ON public.trust_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_matches_user_id         ON public.matches(user_id);
CREATE INDEX IF NOT EXISTS idx_matches_matched_user_id ON public.matches(matched_user_id);
CREATE INDEX IF NOT EXISTS idx_matches_score           ON public.matches(compatibility_score DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_timestamp    ON public.admin_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_security_logs_timestamp ON public.security_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_security_logs_ip        ON public.security_logs(ip_address);

-- ── Auto-update updated_at ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_updated_at ON public.users;
CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS github_profiles_updated_at ON public.github_profiles;
CREATE TRIGGER github_profiles_updated_at
    BEFORE UPDATE ON public.github_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trust_scores_updated_at ON public.trust_scores;
CREATE TRIGGER trust_scores_updated_at
    BEFORE UPDATE ON public.trust_scores
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
