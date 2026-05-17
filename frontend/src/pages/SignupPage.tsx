import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Zap, Github, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { authService } from '@/services/api';
import ParticleBackground from '@/components/ParticleBackground';
import toast from 'react-hot-toast';

const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One number', test: (p: string) => /\d/.test(p) },
  { label: 'One special character', test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
];

function sanitizeInput(str: string): string {
  return str.replace(/[<>"'`]/g, '');
}

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const passwordStrength = PASSWORD_RULES.filter((r) => r.test(password)).length;
  const strengthColors = ['', '#FF4DFF', '#FF7A00', '#8B5CF6', '#00D4FF'];
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanName = sanitizeInput(name.trim());
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || cleanName.length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (passwordStrength < 3) {
      setError('Password is too weak. Please follow the requirements.');
      return;
    }

    setIsLoading(true);
    try {
      await authService.signup({ name: cleanName, email: cleanEmail, password });
      setSuccess(true);
      toast.success('Account created! Please check your email to verify.');
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Signup failed.';
      if (msg.includes('already registered')) {
        setError('An account with this email already exists. Please sign in.');
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-primary-900 flex items-center justify-center px-4">
        <ParticleBackground />
        <motion.div
          className="w-full max-w-md text-center z-10 glass-card p-10"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            className="w-16 h-16 rounded-full bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center mx-auto mb-6"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <CheckCircle2 className="w-8 h-8 text-neon-blue" />
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-3">Verify your email</h2>
          <p className="text-white/50 mb-8">
            We sent a verification link to <span className="text-white">{email}</span>.
            Click it to activate your account.
          </p>
          <Link to="/login" className="btn-primary inline-flex mx-auto">
            Back to Login
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-900 flex items-center justify-center px-4 relative py-8">
      <ParticleBackground />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-neon-purple/4 blur-3xl pointer-events-none" />

      <motion.div
        className="w-full max-w-md z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
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
          <h1 className="text-2xl font-bold text-white mt-6 mb-1">Create your account</h1>
          <p className="text-white/40 text-sm">Join the AI-powered hackathon network</p>
        </div>

        <div className="glass-card neon-border-blue p-8">
          {/* GitHub OAuth */}
          <button
            type="button"
            onClick={() => authService.loginWithGitHub()}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white transition-all duration-200 mb-6 font-medium text-sm"
          >
            <Github className="w-5 h-5" />
            Continue with GitHub
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-white/30 text-xs">or fill in details</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Name */}
            <div>
              <label className="input-label" htmlFor="name">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field pl-10"
                  placeholder="Alex Chen"
                  required
                  disabled={isLoading}
                  maxLength={100}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="input-label" htmlFor="email">Email Address</label>
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
              <label className="input-label" htmlFor="password">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10 pr-10"
                  placeholder="Create a strong password"
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

              {/* Password strength */}
              {password && (
                <div className="mt-3">
                  <div className="flex gap-1 mb-2">
                    {[1,2,3,4].map((i) => (
                      <div
                        key={i}
                        className="flex-1 h-1 rounded-full transition-all duration-300"
                        style={{
                          background: i <= passwordStrength ? strengthColors[passwordStrength] : 'rgba(255,255,255,0.08)'
                        }}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {PASSWORD_RULES.map((rule) => (
                      <div key={rule.label} className="flex items-center gap-1.5 text-xs">
                        <div className={`w-3 h-3 rounded-full flex items-center justify-center transition-all ${rule.test(password) ? 'bg-neon-blue/20' : 'bg-white/5'}`}>
                          {rule.test(password) && <div className="w-1.5 h-1.5 rounded-full bg-neon-blue" />}
                        </div>
                        <span className={rule.test(password) ? 'text-neon-blue' : 'text-white/30'}>
                          {rule.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <motion.div
                className="flex items-center gap-2 p-3 rounded-xl bg-red-400/10 border border-red-400/20 text-red-400 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}

            <p className="text-xs text-white/30">
              By creating an account you agree to our{' '}
              <a href="#" className="text-neon-blue hover:underline">Terms of Service</a>{' '}
              and{' '}
              <a href="#" className="text-neon-blue hover:underline">Privacy Policy</a>.
            </p>

            <motion.button
              type="submit"
              disabled={isLoading || passwordStrength < 3}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </motion.button>
          </form>
        </div>

        <p className="text-center text-sm text-white/40 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-neon-blue hover:text-neon-cyan transition-colors font-medium">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
