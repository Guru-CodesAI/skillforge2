import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Zap, Github, Shield, Activity, Star, Code2, GitFork,
  RefreshCw, ArrowRight, TrendingUp, Users, ChevronRight, Loader2,
  AlertCircle, Brain, CheckCircle2
} from 'lucide-react';
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import Sidebar from '@/components/Sidebar';
import ScoreRing from '@/components/ScoreRing';
import TeammateCard from '@/components/TeammateCard';
import { dashboardService, matchingService, githubService, trustService } from '@/services/api';
import { useUser } from '@/store/authStore';

// Mock activity data for visualization
const generateActivityData = () =>
  Array.from({ length: 14 }, (_, i) => ({
    date: new Date(Date.now() - (13 - i) * 24 * 3600000).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    commits: Math.floor(Math.random() * 8) + 1,
    prs: Math.floor(Math.random() * 3),
  }));

const StatCard = ({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color: string;
}) => (
  <motion.div
    className="glass-card-hover p-5"
    whileHover={{ y: -3 }}
  >
    <div className="flex items-start justify-between mb-3">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
        <Icon className="w-4.5 h-4.5" style={{ color }} />
      </div>
    </div>
    <p className="text-2xl font-bold text-white mb-0.5">{value}</p>
    <p className="text-xs text-white/50">{label}</p>
    {sub && <p className="text-xs text-white/25 mt-0.5">{sub}</p>}
  </motion.div>
);

export default function DashboardPage() {
  const user = useUser();
  const activityData = React.useMemo(() => generateActivityData(), []);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardService.getStats,
    staleTime: 1000 * 60 * 3,
  });

  const { data: matches, isLoading: matchesLoading, refetch: refetchMatches, isRefetching } = useQuery({
    queryKey: ['matches'],
    queryFn: matchingService.getMatches,
    staleTime: 1000 * 60 * 5,
  });

  const { data: githubProfile } = useQuery({
    queryKey: ['github-profile'],
    queryFn: githubService.getGitHubProfile,
    staleTime: 1000 * 60 * 10,
  });

  const { data: trustScore } = useQuery({
    queryKey: ['trust-score'],
    queryFn: trustService.getTrustScore,
    staleTime: 1000 * 60 * 10,
  });

  const profileCompletion = stats?.profile_completion ?? 0;
  const topMatches = matches?.slice(0, 3) ?? [];

  return (
    <div className="flex min-h-screen bg-primary-900">
      <Sidebar />

      <main className="flex-1 p-8 overflow-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold text-white mb-1">
            Good morning, <span className="gradient-text">{user?.name?.split(' ')[0] ?? 'Developer'}</span> 👋
          </h1>
          <p className="text-white/40 text-sm">Your AI-powered teammate dashboard</p>
        </motion.div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-card p-5 shimmer h-24 rounded-2xl" />
            ))
          ) : (
            <>
              <StatCard icon={TrendingUp} label="Top Match" value={`${((stats?.top_compatibility ?? 0) * 100).toFixed(0)}%`} sub="Compatibility" color="#00D4FF" />
              <StatCard icon={Users} label="AI Matches Found" value={stats?.total_matches ?? 0} sub="This week" color="#8B5CF6" />
              <StatCard icon={Code2} label="Verified Skills" value={stats?.skill_count ?? 0} sub="From GitHub" color="#00FFF7" />
              <StatCard icon={Activity} label="Hackathons" value={stats?.active_hackathons ?? 0} sub="Active" color="#FF4DFF" />
            </>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Profile Completion */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white text-sm">Profile Strength</h2>
              <span className="text-xs text-white/40">{profileCompletion}%</span>
            </div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mb-3">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-neon-blue to-neon-purple"
                initial={{ width: 0 }}
                animate={{ width: `${profileCompletion}%` }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              />
            </div>
            <div className="space-y-2">
              {[
                { label: 'GitHub Connected', done: !!githubProfile },
                { label: 'Bio Added', done: !!(user?.bio) },
                { label: 'Skills Listed', done: (user?.skills?.length ?? 0) > 0 },
                { label: 'Experience Set', done: !!(user?.experience_level) },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className={`w-3.5 h-3.5 ${item.done ? 'text-neon-blue' : 'text-white/20'}`} />
                  <span className={item.done ? 'text-white/60' : 'text-white/25'}>{item.label}</span>
                </div>
              ))}
            </div>
            {profileCompletion < 100 && (
              <Link to="/settings" className="btn-secondary w-full text-center text-xs py-2 mt-4 flex items-center justify-center gap-1.5">
                Complete Profile <ChevronRight className="w-3 h-3" />
              </Link>
            )}
          </div>

          {/* Trust Score */}
          <div className="glass-card p-6 flex flex-col items-center">
            <h2 className="font-semibold text-white text-sm w-full mb-4">Trust Score</h2>
            {trustScore ? (
              <>
                <ScoreRing
                  score={trustScore.score}
                  max={10}
                  size={130}
                  color={trustScore.score >= 8 ? '#00D4FF' : trustScore.score >= 6 ? '#8B5CF6' : '#FF4DFF'}
                  label={trustScore.label}
                  sublabel={`${(trustScore.confidence * 100).toFixed(0)}% confidence`}
                />
                <p className="text-xs text-white/30 text-center mt-4 leading-relaxed">
                  {trustScore.explanation}
                </p>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 gap-3">
                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <Shield className="w-7 h-7 text-white/20" />
                </div>
                <p className="text-xs text-white/30 text-center">Connect GitHub to get your Trust Score</p>
                <Link to="/settings" className="badge-blue text-xs cursor-pointer">
                  + Connect GitHub
                </Link>
              </div>
            )}
          </div>

          {/* GitHub Stats */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white text-sm">GitHub Analytics</h2>
              {githubProfile ? (
                <span className="badge-green text-[10px]"><CheckCircle2 className="w-2.5 h-2.5" />Verified</span>
              ) : (
                <span className="badge-amber text-[10px]">Not connected</span>
              )}
            </div>
            {githubProfile ? (
              <div className="space-y-4">
                {[
                  { icon: Code2, label: 'Repositories', value: githubProfile.repo_count, color: '#00D4FF' },
                  { icon: Star, label: 'Total Stars', value: githubProfile.stars, color: '#FFD700' },
                  { icon: GitFork, label: 'Forks', value: githubProfile.forks, color: '#8B5CF6' },
                  { icon: Activity, label: 'Commits (Est.)', value: githubProfile.commits, color: '#00FFF7' },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-white/50">
                      <Icon className="w-3.5 h-3.5" style={{ color }} />
                      {label}
                    </div>
                    <span className="text-sm font-semibold text-white font-mono">{value.toLocaleString()}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-white/5">
                  <p className="text-xs text-white/30 mb-2">Top Languages</p>
                  <div className="flex flex-wrap gap-1.5">
                    {githubProfile.top_languages.slice(0, 4).map((lang) => (
                      <span key={lang} className="px-2 py-0.5 rounded-md bg-neon-blue/5 border border-neon-blue/15 text-neon-blue text-[11px]">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 gap-3">
                <Github className="w-10 h-10 text-white/10" />
                <p className="text-xs text-white/30 text-center">
                  Connect your GitHub account to see analytics and boost your trust score
                </p>
                <Link to="/settings" className="btn-primary text-xs py-1.5 px-4">
                  Connect GitHub
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Activity Graph */}
        <div className="glass-card p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-white">Coding Activity (14 Days)</h2>
            <span className="text-xs text-white/30 font-mono">commits · PRs</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={activityData}>
              <defs>
                <linearGradient id="commitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00D4FF" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#00D4FF" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="prGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#1E2A3A', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8, color: '#E2E8F0', fontSize: 12 }}
                cursor={{ stroke: 'rgba(0,212,255,0.2)' }}
              />
              <Area type="monotone" dataKey="commits" stroke="#00D4FF" fill="url(#commitGrad)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="prs" stroke="#8B5CF6" fill="url(#prGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* AI Recommendations */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-neon-purple" />
              <h2 className="font-semibold text-white">AI Recommended Teammates</h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => refetchMatches()}
                disabled={isRefetching}
                className="btn-ghost text-xs flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <Link to="/discover" className="btn-secondary text-xs flex items-center gap-1.5">
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {matchesLoading || isRefetching ? (
            <div className="grid md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-2xl shimmer h-64" />
              ))}
            </div>
          ) : topMatches.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-4">
              {topMatches.map((match, i) => (
                <TeammateCard key={match.id} match={match} index={i} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Brain className="w-12 h-12 text-white/10 mx-auto mb-4" />
              <p className="text-white/30 text-sm">
                Complete your profile and connect GitHub to get AI matches.
              </p>
              <Link to="/onboarding" className="btn-primary mt-4 inline-flex">
                Complete Setup
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
