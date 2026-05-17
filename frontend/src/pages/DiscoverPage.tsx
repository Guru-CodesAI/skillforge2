import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, Filter, Brain, SlidersHorizontal, X, RefreshCw, Users } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import TeammateCard from '@/components/TeammateCard';
import { matchingService } from '@/services/api';
import type { Match } from '@/types';

const EXPERIENCE_OPTIONS = ['All', 'beginner', 'intermediate', 'advanced', 'expert'];
const TRUST_OPTIONS = ['All', 'Elite', 'Trusted', 'Verified'];
const SKILL_OPTIONS = [
  'React','TypeScript','Python','Rust','Go','Node.js','FastAPI','ML',
  'Docker','AWS','Solidity','Web3','PostgreSQL','GraphQL',
];

export default function DiscoverPage() {
  const [search, setSearch] = useState('');
  const [experienceFilter, setExperienceFilter] = useState('All');
  const [trustFilter, setTrustFilter] = useState('All');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [minScore, setMinScore] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'compatibility' | 'trust' | 'activity'>('compatibility');

  const { data: matches, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['all-matches'],
    queryFn: matchingService.getMatches,
    staleTime: 1000 * 60 * 5,
  });

  const filtered = useMemo(() => {
    if (!matches) return [];
    let result: Match[] = [...matches];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((m) =>
        m.matched_user.name.toLowerCase().includes(q) ||
        m.matched_user.github_username?.toLowerCase().includes(q) ||
        m.shared_skills.some((s) => s.toLowerCase().includes(q))
      );
    }

    // Experience
    if (experienceFilter !== 'All') {
      result = result.filter((m) => m.matched_user.experience_level === experienceFilter);
    }

    // Trust
    if (trustFilter !== 'All') {
      result = result.filter((m) => m.trust_score?.label === trustFilter);
    }

    // Skills
    if (selectedSkills.length > 0) {
      result = result.filter((m) =>
        selectedSkills.some((skill) => m.shared_skills.includes(skill))
      );
    }

    // Min score
    if (minScore > 0) {
      result = result.filter((m) => m.compatibility_score * 100 >= minScore);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'compatibility') return b.compatibility_score - a.compatibility_score;
      if (sortBy === 'trust') return (b.trust_score?.score ?? 0) - (a.trust_score?.score ?? 0);
      return 0;
    });

    return result;
  }, [matches, search, experienceFilter, trustFilter, selectedSkills, minScore, sortBy]);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const clearFilters = () => {
    setSearch('');
    setExperienceFilter('All');
    setTrustFilter('All');
    setSelectedSkills([]);
    setMinScore(0);
  };

  const activeFilterCount = [
    experienceFilter !== 'All',
    trustFilter !== 'All',
    selectedSkills.length > 0,
    minScore > 0,
  ].filter(Boolean).length;

  return (
    <div className="flex min-h-screen bg-primary-900">
      <Sidebar />

      <main className="flex-1 p-8 overflow-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-5 h-5 text-neon-purple" />
            <h1 className="text-2xl font-bold text-white">Discover Teammates</h1>
          </div>
          <p className="text-white/40 text-sm">
            {filtered.length} AI-matched developers found · Sorted by {sortBy}
          </p>
        </div>

        {/* Search + Controls */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, username, or skill..."
              className="input-field pl-10 w-full"
            />
            {search && (
              <button
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
                onClick={() => setSearch('')}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="input-field w-auto pr-8 appearance-none bg-white/5 cursor-pointer"
          >
            <option value="compatibility">Sort: Compatibility</option>
            <option value="trust">Sort: Trust Score</option>
            <option value="activity">Sort: Activity</option>
          </select>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary flex items-center gap-2 ${showFilters ? 'border-neon-blue/40 text-neon-blue' : ''}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-neon-blue text-black text-xs font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="btn-ghost flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <motion.div
            className="glass-card p-6 mb-6"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="input-label">Experience Level</p>
                <div className="flex flex-wrap gap-1.5">
                  {EXPERIENCE_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setExperienceFilter(opt)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
                        experienceFilter === opt
                          ? 'bg-neon-blue/15 text-neon-blue border border-neon-blue/30'
                          : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="input-label">Trust Level</p>
                <div className="flex flex-wrap gap-1.5">
                  {TRUST_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setTrustFilter(opt)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        trustFilter === opt
                          ? 'bg-neon-purple/15 text-neon-purple border border-neon-purple/30'
                          : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="input-label">Min Compatibility: {minScore}%</p>
                <input
                  type="range"
                  min={0}
                  max={90}
                  step={5}
                  value={minScore}
                  onChange={(e) => setMinScore(Number(e.target.value))}
                  className="w-full accent-neon-blue"
                />
              </div>

              <div>
                <p className="input-label">Required Skills</p>
                <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                  {SKILL_OPTIONS.map((skill) => (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className={`px-2 py-0.5 rounded text-xs transition-all ${
                        selectedSkills.includes(skill)
                          ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20'
                          : 'bg-white/3 text-white/30 border border-white/8 hover:bg-white/8'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="mt-4 text-xs text-red-400 hover:text-red-300 flex items-center gap-1.5 transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Clear all filters
              </button>
            )}
          </motion.div>
        )}

        {/* Results Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl shimmer h-72" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((match, i) => (
              <TeammateCard key={match.id} match={match} index={i} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Users className="w-14 h-14 text-white/10 mx-auto mb-4" />
            <p className="text-white/30 text-sm mb-2">No teammates found matching your filters.</p>
            <button onClick={clearFilters} className="btn-secondary text-sm mt-4">
              Clear Filters
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
