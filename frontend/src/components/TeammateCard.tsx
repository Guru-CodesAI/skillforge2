import React from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Github, Star, GitFork, Code2, Shield, Users,
  ExternalLink, MessageSquare, Zap
} from 'lucide-react';
import type { Match } from '@/types';
import ScoreRing from './ScoreRing';

interface TeammatecardProps {
  match: Match;
  index?: number;
}

const TRUST_COLORS: Record<string, string> = {
  Elite: 'text-neon-blue border-neon-blue/20 bg-neon-blue/10',
  Trusted: 'text-neon-cyan border-neon-cyan/20 bg-neon-cyan/10',
  Verified: 'text-green-400 border-green-400/20 bg-green-400/10',
  Unverified: 'text-amber-400 border-amber-400/20 bg-amber-400/10',
  Suspicious: 'text-red-400 border-red-400/20 bg-red-400/10',
};

export default function TeammateCard({ match, index = 0 }: TeammatecardProps) {
  const user = match.matched_user;
  const trust = match.trust_score;
  const gh = match.github_profile;
  const trustColorClass = trust ? (TRUST_COLORS[trust.label] ?? TRUST_COLORS.Unverified) : TRUST_COLORS.Unverified;

  return (
    <motion.div
      className="glass-card-hover p-5 group cursor-pointer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
      whileHover={{ y: -4 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.name}
              className="w-11 h-11 rounded-full object-cover ring-2 ring-neon-blue/20"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-neon-blue/40 to-neon-purple/40 flex items-center justify-center text-white font-bold text-lg">
              {user.name[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <h3 className="font-semibold text-white text-sm">{user.name}</h3>
            {user.github_username && (
              <a
                href={`https://github.com/${user.github_username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-white/40 hover:text-neon-blue transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Github className="w-3 h-3" />
                @{user.github_username}
              </a>
            )}
          </div>
        </div>

        {/* Trust Badge */}
        {trust && (
          <span className={`badge text-[10px] border ${trustColorClass}`}>
            <Shield className="w-2.5 h-2.5" />
            {trust.label}
          </span>
        )}
      </div>

      {/* Compatibility Score */}
      <div className="flex items-center justify-between mb-4 p-3 rounded-xl bg-white/3 border border-white/5">
        <div>
          <p className="text-xs text-white/40 mb-0.5">Compatibility</p>
          <p className="text-2xl font-bold gradient-text-blue">
            {(match.compatibility_score * 100).toFixed(0)}%
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-neon-blue" />
          <span className="text-xs text-white/50 font-mono">
            {(match.confidence_level * 100).toFixed(0)}% conf.
          </span>
        </div>
      </div>

      {/* Skill Breakdown */}
      <div className="space-y-2 mb-4">
        {Object.entries(match.skill_breakdown).map(([key, val]) => {
          const labels: Record<string, string> = {
            skill_similarity: 'Skill Match',
            github_activity: 'GitHub Activity',
            trust_score: 'Trust',
            experience_match: 'Experience',
          };
          return (
            <div key={key} className="flex items-center gap-2">
              <span className="text-xs text-white/40 w-24 shrink-0">{labels[key]}</span>
              <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-neon-blue to-neon-purple rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${val * 100}%` }}
                  transition={{ delay: index * 0.08 + 0.3, duration: 0.8 }}
                />
              </div>
              <span className="text-xs font-mono text-white/50 w-8 text-right">
                {(val * 100).toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Shared Skills */}
      {match.shared_skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {match.shared_skills.slice(0, 4).map((skill) => (
            <span key={skill} className="px-2 py-0.5 rounded-md bg-neon-blue/5 border border-neon-blue/15 text-neon-blue text-[11px] font-medium">
              {skill}
            </span>
          ))}
          {match.shared_skills.length > 4 && (
            <span className="text-xs text-white/30 self-center">
              +{match.shared_skills.length - 4} more
            </span>
          )}
        </div>
      )}

      {/* GitHub Stats */}
      {gh && (
        <div className="flex items-center gap-4 text-xs text-white/30 mb-4 font-mono">
          <span className="flex items-center gap-1">
            <Star className="w-3 h-3" />{gh.stars}
          </span>
          <span className="flex items-center gap-1">
            <GitFork className="w-3 h-3" />{gh.forks}
          </span>
          <span className="flex items-center gap-1">
            <Code2 className="w-3 h-3" />{gh.repo_count} repos
          </span>
        </div>
      )}

      {/* AI Reason */}
      <p className="text-xs text-white/40 italic mb-4 line-clamp-2">
        "{match.recommendation_reason}"
      </p>

      {/* Actions */}
      <div className="flex gap-2">
        <Link
          to={`/profile/${match.matched_user_id}`}
          className="flex-1 btn-secondary text-center text-xs py-2 flex items-center justify-center gap-1.5"
        >
          <ExternalLink className="w-3 h-3" />
          View Profile
        </Link>
        <button 
          className="flex-1 btn-primary text-xs py-2 flex items-center justify-center gap-1.5"
          onClick={(e) => {
            e.stopPropagation();
            if (user.github_username) {
              toast.success(`Connection request sent to ${user.name}!`);
              setTimeout(() => {
                window.open(`https://github.com/${user.github_username}`, '_blank');
              }, 1000);
            } else {
              toast.error(`Unable to connect: ${user.name} has not linked their GitHub account.`);
            }
          }}
        >
          <MessageSquare className="w-3 h-3" />
          Connect
        </button>
      </div>
    </motion.div>
  );
}
