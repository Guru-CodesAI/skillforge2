import { apiClient } from './axiosClient';
import { supabase } from './supabase';
import type {
  User,
  GitHubProfile,
  TrustScore,
  Match,
  DashboardStats,
  AdminLog,
  SignupCredentials,
  LoginCredentials,
} from '@/types';

// ── Auth Services ─────────────────────────────────────────────
export const authService = {
  async signup(credentials: SignupCredentials) {
    const { data, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: { name: credentials.name },
      },
    });
    if (error) throw error;
    return data;
  },

  async login(credentials: LoginCredentials) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });
    if (error) throw error;
    return data;
  },

  async loginWithGitHub() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'read:user user:email public_repo',
      },
    });
    if (error) throw error;
    return data;
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async forgotPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
    return data;
  },

  async updatePassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return data;
  },
};

// ── Profile Services ──────────────────────────────────────────
export const profileService = {
  async getProfile(): Promise<User> {
    const { data } = await apiClient.get<User>('/profile');
    return data;
  },

  async updateProfile(updates: Partial<User>): Promise<User> {
    const { data } = await apiClient.patch<User>('/profile', updates);
    return data;
  },

  async getPublicProfile(userId: string): Promise<User> {
    const { data } = await apiClient.get<User>(`/profile/${userId}`);
    return data;
  },
};

// ── GitHub Services ───────────────────────────────────────────
export const githubService = {
  async analyzeProfile(username: string): Promise<GitHubProfile> {
    const { data } = await apiClient.post<GitHubProfile>('/github/analyze', { username });
    return data;
  },

  async getGitHubProfile(): Promise<GitHubProfile | null> {
    try {
      const { data } = await apiClient.get<GitHubProfile>('/github/profile');
      return data;
    } catch {
      return null;
    }
  },
};

// ── Trust Score Services ──────────────────────────────────────
export const trustService = {
  async getTrustScore(): Promise<TrustScore | null> {
    try {
      const { data } = await apiClient.get<TrustScore>('/trust/score');
      return data;
    } catch {
      return null;
    }
  },
};

// ── Matching Services ─────────────────────────────────────────
export const matchingService = {
  async getMatches(): Promise<Match[]> {
    const { data } = await apiClient.get<Match[]>('/matches');
    return data;
  },

  async refreshMatches(): Promise<Match[]> {
    const { data } = await apiClient.post<Match[]>('/matches/refresh');
    return data;
  },
};

// ── Dashboard Services ────────────────────────────────────────
export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const { data } = await apiClient.get<DashboardStats>('/dashboard/stats');
    return data;
  },
};

// ── Admin Services ────────────────────────────────────────────
export const adminService = {
  async getAllUsers(page = 1, search?: string) {
    const { data } = await apiClient.get('/admin/users', { page, search });
    return data;
  },

  async updateUser(userId: string, updates: Partial<User>) {
    const { data } = await apiClient.patch<User>(`/admin/user/${userId}`, updates);
    return data;
  },

  async deleteUser(userId: string) {
    const { data } = await apiClient.delete(`/admin/user/${userId}`);
    return data;
  },

  async getAdminLogs(): Promise<AdminLog[]> {
    const { data } = await apiClient.get<AdminLog[]>('/admin/logs');
    return data;
  },

  async getSecurityLogs() {
    const { data } = await apiClient.get('/admin/security-logs');
    return data;
  },

  async getPlatformStats() {
    const { data } = await apiClient.get('/admin/stats');
    return data;
  },
};
