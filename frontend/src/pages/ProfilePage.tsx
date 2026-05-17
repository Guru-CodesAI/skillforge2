import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Github, Star, GitFork, Code2, Shield, MapPin,
  Calendar, Link2, Edit3, Loader2, CheckCircle2, ExternalLink
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import ScoreRing from '@/components/ScoreRing';
import { profileService, githubService, trustService } from '@/services/api';
import { useUser } from '@/store/authStore';

export default function ProfilePage() {
  const { id } = useParams();
  const currentUser = useUser();
  const isOwnProfile = !id || id === currentUser?.id;

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', id],
    queryFn: () => isOwnProfile ? profileService.getProfile() : profileService.getPublicProfile(id!),
    staleTime: 1000 * 60 * 5,
  });

  const { data: ghProfile } = useQuery({
    queryKey: ['github-profile', id],
    queryFn: githubService.getGitHubProfile,
    enabled: isOwnProfile,
  });

  const { data: trust } = useQuery({
    queryKey: ['trust-score', id],
    queryFn: trustService.getTrustScore,
    enabled: isOwnProfile,
  });

  if (profileLoading) {
    return (
      <div className="flex min-h-screen bg-primary-900">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-neon-blue animate-spin" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-primary-900">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        {/* Hero Section */}
        <motion.div
          className="relative glass-card neon-border-blue overflow-hidden mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/5 via-transparent to-neon-purple/5 pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-neon-blue/8 to-transparent" />

          <div className="relative p-8">
            <div className="flex flex-col md:flex-row items-start gap-6">
              {/* Avatar */}
              <div className="relative">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.name}
                    className="w-24 h-24 rounded-2xl object-cover ring-2 ring-neon-blue/30"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-neon-blue/40 to-neon-purple/40 flex items-center justify-center text-3xl font-bold text-white">
                    {profile?.name?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                )}
                {trust && (
                  <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-lg bg-primary-900 border border-neon-blue/30 text-xs font-semibold text-neon-blue">
                    {trust.label}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-white mb-1">{profile?.name}</h1>
                    {profile?.github_username && (
                      <a
                        href={`https://github.com/${profile.github_username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-sm text-white/40 hover:text-neon-blue transition-colors"
                      >
                        <Github className="w-3.5 h-3.5" />
                        @{profile.github_username}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {profile?.experience_level && (
                        <span className="badge-blue capitalize">{profile.experience_level}</span>
                      )}
                      {profile?.role === 'admin' && (
                        <span className="badge-purple">Admin</span>
                      )}
                      {ghProfile && (
                        <span className="badge-green">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          GitHub Verified
                        </span>
                      )}
                    </div>
                  </div>

                  {isOwnProfile && (
                    <button className="btn-secondary flex items-center gap-2 text-sm">
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit Profile
                    </button>
                  )}
                </div>

                {profile?.bio && (
                  <p className="text-white/50 text-sm mt-4 max-w-2xl leading-relaxed">
                    {profile.bio}
                  </p>
                )}
              </div>

              {/* Trust Score Ring */}
              {trust && (
                <div className="shrink-0">
                  <ScoreRing
                    score={trust.score}
                    max={10}
                    size={110}
                    label="Trust Score"
                    sublabel={trust.label}
                  />
                </div>
              )}
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Skills */}
          <div className="lg:col-span-2 space-y-6">
            {profile?.skills && profile.skills.length > 0 && (
              <motion.div
                className="glass-card p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-neon-blue" />
                  Skills I Offer
                </h2>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <span key={skill} className="px-3 py-1.5 rounded-lg bg-neon-blue/5 border border-neon-blue/15 text-neon-blue text-xs font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {profile?.looking_for && profile.looking_for.length > 0 && (
              <motion.div
                className="glass-card p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <h2 className="font-semibold text-white mb-4">Looking For</h2>
                <div className="flex flex-wrap gap-2">
                  {profile.looking_for.map((skill) => (
                    <span key={skill} className="px-3 py-1.5 rounded-lg bg-neon-purple/5 border border-neon-purple/15 text-neon-purple text-xs font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* GitHub Stats */}
            {ghProfile && (
              <motion.div
                className="glass-card p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <Github className="w-4 h-4 text-white/60" />
                  GitHub Statistics
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Repos', value: ghProfile.repo_count, icon: Code2, color: '#00D4FF' },
                    { label: 'Stars', value: ghProfile.stars, icon: Star, color: '#FFD700' },
                    { label: 'Forks', value: ghProfile.forks, icon: GitFork, color: '#8B5CF6' },
                    { label: 'Followers', value: ghProfile.followers, icon: Shield, color: '#00FFF7' },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="text-center p-3 rounded-xl bg-white/3 border border-white/5">
                      <Icon className="w-4 h-4 mx-auto mb-1.5" style={{ color }} />
                      <p className="text-xl font-bold text-white">{value.toLocaleString()}</p>
                      <p className="text-xs text-white/30">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Language breakdown */}
                <div className="mt-5">
                  <p className="text-sm text-white/50 mb-3">Language Distribution</p>
                  <div className="space-y-2">
                    {Object.entries(ghProfile.languages_json || {})
                      .sort(([,a],[,b]) => b - a)
                      .slice(0, 5)
                      .map(([lang, bytes]) => {
                        const total = Object.values(ghProfile.languages_json || {}).reduce((a, b) => a + b, 0);
                        const pct = total > 0 ? (bytes / total) * 100 : 0;
                        return (
                          <div key={lang} className="flex items-center gap-3">
                            <span className="text-xs text-white/50 w-20 shrink-0">{lang}</span>
                            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full rounded-full bg-gradient-to-r from-neon-blue to-neon-purple"
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                              />
                            </div>
                            <span className="text-xs font-mono text-white/30 w-10 text-right">
                              {pct.toFixed(1)}%
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* Trust Breakdown */}
            {trust && trust.breakdown && (
              <motion.div
                className="glass-card p-5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="font-semibold text-white mb-4 flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-neon-blue" />
                  Trust Breakdown
                </h2>
                <div className="space-y-3">
                  {Object.entries(trust.breakdown || {}).map(([key, val]) => {
                    const labels: Record<string, string> = {
                      repo_quality: 'Repo Quality',
                      commit_consistency: 'Commit Consistency',
                      account_age: 'Account Age',
                      profile_completeness: 'Profile Complete',
                      verification_confidence: 'Verification',
                    };
                    return (
                      <div key={key}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-white/50">{labels[key] ?? key}</span>
                          <span className="text-white/70 font-mono">{(val * 10).toFixed(1)}</span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-neon-blue to-neon-cyan rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${val * 100}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-white/30 mt-4 italic">{trust.explanation}</p>
              </motion.div>
            )}

            {/* Hackathon Interests */}
            {profile?.hackathon_interests && profile.hackathon_interests.length > 0 && (
              <motion.div
                className="glass-card p-5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
              >
                <h2 className="font-semibold text-white mb-3 text-sm">Hackathon Interests</h2>
                <div className="flex flex-wrap gap-1.5">
                  {profile.hackathon_interests.map((interest) => (
                    <span key={interest} className="px-2.5 py-1 rounded-lg bg-neon-magenta/5 border border-neon-magenta/15 text-neon-magenta text-xs">
                      {interest}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
