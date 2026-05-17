import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Zap, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { authService } from '@/services/api';
import ParticleBackground from '@/components/ParticleBackground';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      await authService.forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || 'Failed to send reset email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-900 flex items-center justify-center px-4 relative">
      <ParticleBackground />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-neon-blue/4 blur-3xl pointer-events-none" />

      <motion.div
        className="w-full max-w-md z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">SkillForge</span>
          </Link>
        </div>

        <div className="glass-card neon-border-blue p-8">
          {!sent ? (
            <>
              <div className="text-center mb-8">
                <div className="w-14 h-14 rounded-2xl bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-7 h-7 text-neon-blue" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Reset your password</h1>
                <p className="text-white/40 text-sm">
                  Enter your email and we'll send you a secure reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <div>
                  <label className="input-label" htmlFor="email">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      id="email"
                      type="email"
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

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-400/10 border border-red-400/20 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                <motion.button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3.5"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  {isLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Sending...</>
                  ) : (
                    'Send Reset Link'
                  )}
                </motion.button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <motion.div
                className="w-16 h-16 rounded-full bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center mx-auto mb-6"
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <CheckCircle2 className="w-8 h-8 text-neon-blue" />
              </motion.div>
              <h2 className="text-xl font-bold text-white mb-3">Check your inbox</h2>
              <p className="text-white/40 text-sm mb-8">
                We sent a password reset link to{' '}
                <span className="text-white font-medium">{email}</span>.
                It expires in 60 minutes.
              </p>
              <p className="text-xs text-white/30">
                Didn't receive it? Check spam, or{' '}
                <button onClick={() => setSent(false)} className="text-neon-blue hover:underline">
                  try again
                </button>.
              </p>
            </div>
          )}
        </div>

        <Link
          to="/login"
          className="flex items-center justify-center gap-2 mt-6 text-sm text-white/40 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>
      </motion.div>
    </div>
  );
}
