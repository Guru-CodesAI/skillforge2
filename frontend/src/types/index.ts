// ============================================================
// SkillForge Type Definitions
// ============================================================

export type UserRole = 'user' | 'admin';
export type TrustLabel = 'Elite' | 'Trusted' | 'Verified' | 'Unverified' | 'Suspicious';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

// ── User ─────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  github_username?: string;
  experience_level?: ExperienceLevel;
  bio?: string;
  avatar_url?: string;
  skills?: string[];
  looking_for?: string[];
  hackathon_interests?: string[];
  created_at: string;
  updated_at: string;
}

// ── GitHub Profile ────────────────────────────────────────────
export interface GitHubProfile {
  id: string;
  user_id: string;
  repo_count: number;
  stars: number;
  forks: number;
  commits: number;
  languages_json: Record<string, number>;
  verification_score: number;
  last_active: string;
  top_languages: string[];
  account_age_days: number;
  followers: number;
  following: number;
  public_repos: number;
  avatar_url?: string;
}

// ── Trust Score ───────────────────────────────────────────────
export interface TrustScore {
  id: string;
  user_id: string;
  score: number;
  label: TrustLabel;
  explanation: string;
  confidence: number;
  breakdown: {
    repo_quality: number;
    commit_consistency: number;
    account_age: number;
    profile_completeness: number;
    verification_confidence: number;
  };
}

// ── Match ─────────────────────────────────────────────────────
export interface Match {
  id: string;
  user_id: string;
  matched_user_id: string;
  compatibility_score: number;
  shared_skills: string[];
  recommendation_reason: string;
  confidence_level: number;
  matched_user: User;
  trust_score?: TrustScore;
  github_profile?: GitHubProfile;
  skill_breakdown: {
    skill_similarity: number;
    github_activity: number;
    trust_score: number;
    experience_match: number;
  };
}

// ── Auth ──────────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  access_token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  name: string;
  email: string;
  password: string;
}

// ── Admin ─────────────────────────────────────────────────────
export interface AdminLog {
  id: string;
  admin_id: string;
  action: string;
  target_user: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

export interface SecurityLog {
  id: string;
  ip_address: string;
  endpoint: string;
  attack_type: string;
  blocked: boolean;
  timestamp: string;
}

// ── API Response ──────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: 'success' | 'error';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
}

// ── Dashboard Analytics ───────────────────────────────────────
export interface DashboardStats {
  profile_completion: number;
  github_verified: boolean;
  trust_score: number;
  trust_label: TrustLabel;
  total_matches: number;
  top_compatibility: number;
  active_hackathons: number;
  skill_count: number;
}

export interface SkillAnalytics {
  skill: string;
  proficiency: number;
  github_evidence: number;
  matches_count: number;
}

export interface ActivityDataPoint {
  date: string;
  commits: number;
  prs: number;
  reviews: number;
}
