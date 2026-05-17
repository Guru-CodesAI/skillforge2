import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  Github, Zap, Shield, Brain, Users, Star, GitFork,
  Code2, ChevronRight, CheckCircle2, ArrowRight,
  Activity, TrendingUp, Lock, Globe, Terminal, Sparkles
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import ParticleBackground from '@/components/ParticleBackground';
import ScoreRing from '@/components/ScoreRing';

// ── Animated Headline ─────────────────────────────────────────
const ROTATING_WORDS = ['Smarter Teams', 'Better Code', 'Real Skills', 'AI Matching', 'Hackathon Wins'];

// ── Feature Data ──────────────────────────────────────────────
const FEATURES = [
  {
    icon: Github,
    title: 'GitHub Verification',
    desc: 'Real skill verification via GitHub API. No fake claims – every skill is backed by actual commit history and repository analysis.',
    color: '#00D4FF',
    badge: 'AI-Powered',
  },
  {
    icon: Brain,
    title: 'AI Compatibility Matching',
    desc: 'TF-IDF + Cosine Similarity engine analyzes skill vectors, activity patterns, and trust scores to find your ideal teammates.',
    color: '#8B5CF6',
    badge: 'ML Engine',
  },
  {
    icon: Shield,
    title: 'Trust Score System',
    desc: '10-point scoring across repository quality, commit consistency, account age, and profile completeness. Verified or flagged.',
    color: '#FF4DFF',
    badge: 'Zero Bias',
  },
  {
    icon: Activity,
    title: 'Activity Analysis',
    desc: 'Track coding consistency, contribution frequency, and recency. Surface active developers who deliver results.',
    color: '#00FFF7',
    badge: 'Real-Time',
  },
  {
    icon: Lock,
    title: 'Enterprise Security',
    desc: 'JWT auth, Row-Level Security, CSRF protection, rate limiting, and XSS prevention baked in at every layer.',
    color: '#00D4FF',
    badge: 'Production-Grade',
  },
  {
    icon: Globe,
    title: 'Global Talent Pool',
    desc: 'Connect with developers across timezones with complementary skills. Build diverse, high-performance hackathon teams.',
    color: '#8B5CF6',
    badge: 'Worldwide',
  },
];

const TESTIMONIALS = [
  {
    name: 'Aisha Okonkwo',
    role: 'Full-Stack Dev · ETHGlobal Winner',
    avatar: 'AO',
    text: 'SkillForge matched me with a backend engineer who had the exact Rust skills I lacked. We shipped in 24 hours and won $50k.',
    score: 9.4,
    color: '#00D4FF',
  },
  {
    name: 'Marcus Chen',
    role: 'ML Engineer · MLH Fellow',
    avatar: 'MC',
    text: 'The GitHub verification actually works. I could see real commit history, not just word-of-mouth. Found my co-founder here.',
    score: 8.8,
    color: '#8B5CF6',
  },
  {
    name: 'Priya Nair',
    role: 'DevOps Engineer · HackMIT',
    avatar: 'PN',
    text: 'AI suggested teammates I\'d never have found manually. Compatibility score was 94% – they weren\'t wrong.',
    score: 9.1,
    color: '#FF4DFF',
  },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Create Profile', desc: 'Sign up and connect your GitHub account for instant skill verification.' },
  { step: '02', title: 'AI Analysis', desc: 'Our engine analyzes your repos, commits, languages, and activity patterns.' },
  { step: '03', title: 'Get Matched', desc: 'Receive AI-ranked teammates with compatibility scores and skill breakdowns.' },
  { step: '04', title: 'Build & Win', desc: 'Form your dream team and dominate your next hackathon.' },
];

export default function LandingPage() {
  const [wordIndex, setWordIndex] = useState(0);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 600], [0, -80]);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((i) => (i + 1) % ROTATING_WORDS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-primary-900 overflow-x-hidden">
      <ParticleBackground />
      <Navbar />

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 grid-pattern">
        {/* Radial glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-neon-blue/5 blur-3xl" />
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-neon-purple/5 blur-3xl" />
        </div>

        <motion.div
          className="relative z-10 text-center px-6 max-w-6xl mx-auto"
          style={{ y: heroY }}
        >
          {/* Badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-neon-blue/20 bg-neon-blue/5 text-neon-blue text-sm font-medium mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Hackathon Teammate Finder
            <span className="w-1.5 h-1.5 rounded-full bg-neon-blue animate-pulse" />
          </motion.div>

          {/* Headline */}
          <motion.h1
            className="text-5xl md:text-7xl font-bold text-white mb-4 leading-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
          >
            Build{' '}
            <span className="relative inline-block">
              <AnimatePresence mode="wait">
                <motion.span
                  key={wordIndex}
                  className="gradient-text"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                >
                  {ROTATING_WORDS[wordIndex]}
                </motion.span>
              </AnimatePresence>
            </span>
          </motion.h1>

          <motion.p
            className="text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            SkillForge uses AI and GitHub verification to match you with
            the{' '}
            <span className="text-white/80 font-medium">perfect hackathon teammates</span>
            {' '}— based on real skills, not profiles.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Link
              to="/signup"
              className="btn-primary flex items-center gap-2 text-base px-8 py-4 w-full sm:w-auto justify-center"
            >
              <Zap className="w-5 h-5" />
              Start Finding Teammates
              <ChevronRight className="w-4 h-4" />
            </Link>
            <a
              href="#features"
              className="btn-secondary flex items-center gap-2 text-base px-8 py-4 w-full sm:w-auto justify-center"
            >
              <Terminal className="w-4 h-4" />
              See How It Works
            </a>
          </motion.div>

          {/* Social Proof */}
          <motion.div
            className="flex items-center justify-center gap-6 mt-12 text-sm text-white/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              GitHub Verified
            </span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-neon-blue" />
              AI-Matched Teams
            </span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-neon-purple" />
              Zero Fake Profiles
            </span>
          </motion.div>

          {/* Hero Demo Card */}
          <motion.div
            className="relative mt-20 max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
          >
            <div className="glass-card neon-border-blue p-6 rounded-2xl">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="ml-3 text-xs text-white/30 font-mono">skillforge — ai-match-engine</span>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { label: 'Match Score', value: '94%', sublabel: 'Compatibility', color: '#00D4FF' },
                  { label: 'Trust Score', value: '9.2', sublabel: 'Elite Tier', color: '#8B5CF6' },
                  { label: 'Shared Skills', value: '7', sublabel: 'Verified Skills', color: '#FF4DFF' },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    className="p-4 rounded-xl bg-white/3 border border-white/5 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 + i * 0.15 }}
                  >
                    <p className="text-xs text-white/30 mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                    <p className="text-xs text-white/20 mt-1">{stat.sublabel}</p>
                  </motion.div>
                ))}
              </div>
              <div className="mt-4 p-3 rounded-lg bg-white/3 border border-white/5">
                <p className="text-xs text-white/30 font-mono">
                  <span className="text-neon-blue">AI: </span>
                  "Strong complementary skill set — Python backend meets React frontend. Similar hackathon cadence detected. High confidence match."
                </p>
              </div>
            </div>
            {/* Glow effect under card */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-12 bg-neon-blue/10 blur-2xl rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* ── Features ────────────────────────────────────────── */}
      <section id="features" className="py-32 relative">
        <div className="section-container">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="badge-blue mb-4 inline-flex">Platform Features</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Everything you need to{' '}
              <span className="gradient-text">build winning teams</span>
            </h2>
            <p className="text-white/40 max-w-xl mx-auto">
              Production-grade AI matching with enterprise security. No fake claims, no wasted time.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  className="glass-card-hover p-6 group"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110"
                    style={{ background: `${feature.color}15`, border: `1px solid ${feature.color}25` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: feature.color }} />
                  </div>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-white text-base">{feature.title}</h3>
                    <span className="text-[10px] font-mono text-white/30 bg-white/5 px-2 py-0.5 rounded-md">
                      {feature.badge}
                    </span>
                  </div>
                  <p className="text-sm text-white/40 leading-relaxed">{feature.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-neon-purple/3 to-transparent pointer-events-none" />
        <div className="section-container">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="badge-purple mb-4 inline-flex">How It Works</span>
            <h2 className="text-4xl font-bold text-white">
              From profile to team in{' '}
              <span className="gradient-text">4 steps</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6 relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-8 left-1/4 right-1/4 h-px bg-gradient-to-r from-neon-blue/20 via-neon-purple/40 to-neon-magenta/20" />

            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.step}
                className="text-center relative"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-blue/10 to-neon-purple/10 border border-white/10 flex items-center justify-center mx-auto mb-4 relative z-10">
                  <span className="text-2xl font-black gradient-text">{step.step}</span>
                </div>
                <h3 className="font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-white/40">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust Score Showcase ──────────────────────────────── */}
      <section id="trust" className="py-24">
        <div className="section-container">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="badge-blue mb-4 inline-flex">Trust Score System</span>
              <h2 className="text-4xl font-bold text-white mb-6">
                Know exactly who you're{' '}
                <span className="gradient-text">building with</span>
              </h2>
              <p className="text-white/40 mb-8 leading-relaxed">
                Our multi-factor Trust Score analyzes every developer's GitHub footprint to give you
                a verified, unbiased picture of their capabilities.
              </p>

              <div className="space-y-4">
                {[
                  { label: 'Repository Quality', value: 88, color: '#00D4FF' },
                  { label: 'Commit Consistency', value: 75, color: '#8B5CF6' },
                  { label: 'Account Age', value: 92, color: '#00FFF7' },
                  { label: 'Profile Completeness', value: 85, color: '#FF4DFF' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-4">
                    <span className="text-sm text-white/60 w-44 shrink-0">{item.label}</span>
                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: item.color }}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${item.value}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                      />
                    </div>
                    <span className="text-sm font-mono text-white/40 w-10 text-right">{item.value}%</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Score Ring Demo */}
            <motion.div
              className="flex justify-center gap-8 flex-wrap"
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              {[
                { score: 9.2, label: 'Elite', sublabel: 'Top 5% Tier', color: '#00D4FF' },
                { score: 7.5, label: 'Trusted', sublabel: 'Verified Tier', color: '#8B5CF6' },
                { score: 5.8, label: 'Verified', sublabel: 'Standard Tier', color: '#00FFF7' },
              ].map((ring) => (
                <ScoreRing
                  key={ring.label}
                  score={ring.score}
                  max={10}
                  size={130}
                  color={ring.color}
                  label={ring.label}
                  sublabel={ring.sublabel}
                />
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────── */}
      <section id="testimonials" className="py-24">
        <div className="section-container">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="badge-purple mb-4 inline-flex">Success Stories</span>
            <h2 className="text-4xl font-bold text-white">
              Teams that{' '}
              <span className="gradient-text">shipped and won</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                className="glass-card p-6"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                    style={{ background: `${t.color}30`, border: `1px solid ${t.color}40` }}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{t.name}</p>
                    <p className="text-xs text-white/40">{t.role}</p>
                  </div>
                  <div className="ml-auto">
                    <ScoreRing score={t.score} max={10} size={44} strokeWidth={4} color={t.color} />
                  </div>
                </div>
                <p className="text-sm text-white/60 italic leading-relaxed">"{t.text}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="py-32">
        <div className="section-container">
          <motion.div
            className="relative glass-card neon-border-blue p-12 md:p-20 text-center rounded-3xl overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/5 via-transparent to-neon-purple/5 pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-px bg-gradient-to-r from-transparent via-neon-blue/50 to-transparent" />

            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center mx-auto mb-6"
            >
              <Zap className="w-8 h-8 text-white" />
            </motion.div>

            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Ready to find your{' '}
              <span className="gradient-text">perfect team?</span>
            </h2>
            <p className="text-white/40 mb-10 max-w-lg mx-auto text-lg">
              Join thousands of developers building teams with verified skills and AI-powered matching.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup" className="btn-primary flex items-center gap-2 px-10 py-4 text-base justify-center">
                <Github className="w-5 h-5" />
                Sign Up Free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/login" className="btn-secondary flex items-center gap-2 px-10 py-4 text-base justify-center">
                Already have an account? Sign in
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-12">
        <div className="section-container flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-white">SkillForge</span>
          </div>
          <p className="text-sm text-white/30">
            © 2025 SkillForge. AI-Powered Hackathon Teammate Matching Platform.
          </p>
          <div className="flex gap-6 text-sm text-white/30">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Security</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
