import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, Zap, Github, AlertCircle, Loader2 } from 'lucide-react';
import { authService } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import ParticleBackground from '@/components/ParticleBackground';
import toast from 'react-hot-toast';

// Simple rate limiter: max 5 attempts per minute
const loginAttempts: number[] = [];
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60_000;

function isRateLimited(): boolean {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  const recent = loginAttempts.filter((t) => t > windowStart);
  if (recent.length >= MAX_ATTEMPTS) return true;
  loginAttempts.push(now);
  return false;
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { initialize } = useAuthStore();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';
  const expired = new URLSearchParams(location.search).get('expired');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side rate limiting
    if (isRateLimited()) {
      setError('Too many login attempts. Please wait 60 seconds before trying again.');
      return;
    }

    // Basic input validation
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      await authService.login({ email: email.trim().toLowerCase(), password });
      await initialize();
      toast.success('Welcome back to SkillForge!');
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Login failed.';
      if (msg.includes('Invalid login')) {
        setError('Invalid email or password. Please try again.');
      } else if (msg.includes('Email not confirmed')) {
        setError('Please verify your email before logging in.');
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGitHubLogin = async () => {
    try {
      await authService.loginWithGitHub();
    } catch {
      toast.error('GitHub login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-primary-900 flex items-center justify-center px-4 relative">
      <ParticleBackground />

      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-neon-blue/4 blur-3xl" />
      </div>

      <motion.div
        className="w-full max-w-md z-10"
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">SkillForge</span>
          </Link>
          <h1 className="text-2xl font-bold text-white mt-6 mb-1">Welcome back</h1>
          <p className="text-white/40 text-sm">Sign in to find your next team</p>
        </div>

        {/* Session expired warning */}
        {expired && (
          <motion.div
            className="flex items-center gap-2 p-3 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 text-sm mb-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            Your session expired. Please sign in again.
          </motion.div>
        )}

        {/* Card */}
        <div className="glass-card neon-border-blue p-8">
          {/* GitHub OAuth */}
          <motion.button
            type="button"
            onClick={handleGitHubLogin}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white transition-all duration-200 mb-6 font-medium text-sm"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <Github className="w-5 h-5" />
            Continue with GitHub
          </motion.button>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-white/30 text-xs">or email</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Email */}
            <div>
              <label className="input-label" htmlFor="email">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10"
                  placeholder="you@example.com"
                  required
                  disabled={isLoading}
                  maxLength={254}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="input-label mb-0" htmlFor="password">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-neon-blue hover:text-neon-cyan transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10 pr-10"
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  maxLength={128}
                />
                <button
                  type="button"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                className="flex items-center gap-2 p-3 rounded-xl bg-red-400/10 border border-red-400/20 text-red-400 text-sm"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3.5"
              whileHover={{ scale: isLoading ? 1 : 1.01 }}
              whileTap={{ scale: isLoading ? 1 : 0.99 }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </motion.button>
          </form>
        </div>

        <p className="text-center text-sm text-white/40 mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-neon-blue hover:text-neon-cyan transition-colors font-medium">
            Create one free
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
