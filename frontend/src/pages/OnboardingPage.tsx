import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, User, Github, Code2, ChevronRight, ChevronLeft, Loader2, Check } from 'lucide-react';
import { profileService, githubService } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import ParticleBackground from '@/components/ParticleBackground';
import toast from 'react-hot-toast';

const EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'] as const;
const COMMON_SKILLS = [
  'JavaScript','TypeScript','Python','Rust','Go','Java','C++','Solidity',
  'React','Next.js','Vue','Svelte','Node.js','FastAPI','Django','Express',
  'PostgreSQL','MongoDB','Redis','GraphQL','Docker','Kubernetes','AWS','GCP',
  'Machine Learning','Deep Learning','LangChain','Web3','Figma','DevOps',
];
const HACKATHON_INTERESTS = [
  'Web3/Blockchain','AI/ML','HealthTech','FinTech','EdTech','ClimaTech',
  'Social Impact','Developer Tools','Gaming','AR/VR','Open Source',
];

const STEPS = [
  { id: 1, label: 'Profile', icon: User },
  { id: 2, label: 'Skills', icon: Code2 },
  { id: 3, label: 'GitHub', icon: Github },
  { id: 4, label: 'Done', icon: Check },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    bio: '',
    experience_level: 'intermediate' as typeof EXPERIENCE_LEVELS[number],
    skills: [] as string[],
    looking_for: [] as string[],
    hackathon_interests: [] as string[],
    github_username: '',
  });
  const [githubAnalyzing, setGithubAnalyzing] = useState(false);
  const [githubResult, setGithubResult] = useState<{ verified: boolean; message: string } | null>(null);
  const navigate = useNavigate();
  const { user, initialize } = useAuthStore();

  const toggleSkill = (skill: string, field: 'skills' | 'looking_for') => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(skill)
        ? prev[field].filter((s) => s !== skill)
        : [...prev[field], skill].slice(0, 12),
    }));
  };

  const toggleInterest = (interest: string) => {
    setForm((prev) => ({
      ...prev,
      hackathon_interests: prev.hackathon_interests.includes(interest)
        ? prev.hackathon_interests.filter((i) => i !== interest)
        : [...prev.hackathon_interests, interest],
    }));
  };

  const analyzeGitHub = async () => {
    if (!form.github_username.trim()) {
      toast.error('Please enter your GitHub username.');
      return;
    }
    setGithubAnalyzing(true);
    setGithubResult(null);
    try {
      await githubService.analyzeProfile(form.github_username.trim());
      setGithubResult({ verified: true, message: 'GitHub profile verified and analyzed!' });
      toast.success('GitHub profile successfully analyzed!');
    } catch {
      setGithubResult({ verified: false, message: 'Could not analyze profile. You can skip and add it later.' });
    } finally {
      setGithubAnalyzing(false);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await profileService.updateProfile({
        bio: form.bio,
        experience_level: form.experience_level,
        skills: form.skills,
        looking_for: form.looking_for,
        hackathon_interests: form.hackathon_interests,
        github_username: form.github_username,
      });
      await initialize();
      toast.success('Profile setup complete! Welcome to SkillForge.');
      navigate('/dashboard');
    } catch {
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-900 flex items-center justify-center px-4 relative py-8">
      <ParticleBackground />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-neon-purple/4 blur-3xl pointer-events-none" />

      <div className="w-full max-w-2xl z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">SkillForge</span>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = s.id === step;
              const isDone = s.id < step;
              return (
                <React.Fragment key={s.id}>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isActive ? 'bg-neon-blue/15 text-neon-blue border border-neon-blue/30' :
                    isDone ? 'bg-green-400/10 text-green-400 border border-green-400/20' :
                    'bg-white/5 text-white/30 border border-white/10'
                  }`}>
                    <Icon className="w-3.5 h-3.5" />
                    {s.label}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`w-6 h-px ${isDone ? 'bg-green-400/40' : 'bg-white/10'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          <p className="text-white/40 text-sm">
            Hi {user?.name?.split(' ')[0] ?? 'there'}! Let's set up your profile.
          </p>
        </div>

        <div className="glass-card neon-border-blue p-8">
          <AnimatePresence mode="wait">
            {/* Step 1: Basic Profile */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-xl font-bold text-white mb-6">Your Profile</h2>
                <div className="space-y-5">
                  <div>
                    <label className="input-label">Experience Level</label>
                    <div className="grid grid-cols-4 gap-2">
                      {EXPERIENCE_LEVELS.map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setForm((p) => ({ ...p, experience_level: level }))}
                          className={`py-2.5 rounded-xl text-xs font-medium capitalize transition-all ${
                            form.experience_level === level
                              ? 'bg-neon-blue/15 text-neon-blue border border-neon-blue/30'
                              : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="input-label" htmlFor="bio">Bio <span className="text-white/30">(optional)</span></label>
                    <textarea
                      id="bio"
                      value={form.bio}
                      onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value.slice(0, 400) }))}
                      className="input-field resize-none h-28"
                      placeholder="Tell teammates what you build, your experience, and what excites you about hackathons..."
                    />
                    <p className="text-right text-xs text-white/20 mt-1">{form.bio.length}/400</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Skills */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-xl font-bold text-white mb-2">Your Skills</h2>
                <p className="text-white/40 text-sm mb-6">Select up to 12 skills you have, and what you're looking for in teammates.</p>

                <div className="mb-6">
                  <p className="input-label">I can offer ({form.skills.length}/12)</p>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_SKILLS.map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill, 'skills')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          form.skills.includes(skill)
                            ? 'bg-neon-blue/15 text-neon-blue border border-neon-blue/30'
                            : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <p className="input-label">I'm looking for ({form.looking_for.length}/8)</p>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_SKILLS.map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill, 'looking_for')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          form.looking_for.includes(skill)
                            ? 'bg-neon-purple/15 text-neon-purple border border-neon-purple/30'
                            : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="input-label">Hackathon Interests</p>
                  <div className="flex flex-wrap gap-2">
                    {HACKATHON_INTERESTS.map((interest) => (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          form.hackathon_interests.includes(interest)
                            ? 'bg-neon-magenta/15 text-neon-magenta border border-neon-magenta/30'
                            : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: GitHub */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-xl font-bold text-white mb-2">GitHub Verification</h2>
                <p className="text-white/40 text-sm mb-8">Connect your GitHub to boost your Trust Score and verify your skills.</p>

                <div className="space-y-4">
                  <div>
                    <label className="input-label" htmlFor="github">GitHub Username</label>
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <Github className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                          id="github"
                          type="text"
                          value={form.github_username}
                          onChange={(e) => setForm((p) => ({ ...p, github_username: e.target.value.trim().replace(/[^a-zA-Z0-9-]/g, '') }))}
                          className="input-field pl-10"
                          placeholder="your-github-username"
                          maxLength={39}
                        />
                      </div>
                      <motion.button
                        type="button"
                        onClick={analyzeGitHub}
                        disabled={githubAnalyzing || !form.github_username}
                        className="btn-secondary px-5 shrink-0 text-sm"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {githubAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Analyze'}
                      </motion.button>
                    </div>
                  </div>

                  {githubResult && (
                    <motion.div
                      className={`p-4 rounded-xl border ${githubResult.verified ? 'bg-green-400/5 border-green-400/20 text-green-400' : 'bg-amber-400/5 border-amber-400/20 text-amber-400'} text-sm flex items-center gap-2`}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {githubResult.verified ? <Check className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                      {githubResult.message}
                    </motion.div>
                  )}

                  <div className="p-4 rounded-xl bg-white/3 border border-white/5">
                    <p className="text-xs text-white/30 font-mono">
                      <span className="text-neon-blue">AI analyzes:</span> repositories • commits • languages • stars • forks • activity recency • contribution history
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="btn-secondary flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}

            {step < 3 ? (
              <motion.button
                onClick={() => setStep(step + 1)}
                className="btn-primary flex items-center gap-2 ml-auto"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            ) : (
              <motion.button
                onClick={handleSubmit}
                disabled={isLoading}
                className="btn-primary flex items-center gap-2 ml-auto"
                whileHover={{ scale: 1.01 }}
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Saving...</>
                ) : (
                  <><Check className="w-4 h-4" />Complete Setup</>
                )}
              </motion.button>
            )}
          </div>

          {step < 3 && (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="w-full text-center text-xs text-white/20 hover:text-white/40 transition-colors mt-4"
            >
              Skip this step
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
