import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User, Github, Shield, Bell, Trash2, Loader2,
  Save, Github as GithubIcon, Eye, EyeOff, Lock, CheckCircle2
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { profileService, githubService, authService } from '@/services/api';
import { useUser, useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'github', label: 'GitHub', icon: Github },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'danger', label: 'Danger Zone', icon: Trash2 },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [githubUsername, setGithubUsername] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [password, setPassword] = useState({ current: '', new: '', confirm: '' });
  const [profileForm, setProfileForm] = useState({ name: '', bio: '', experience_level: '' });
  const user = useUser();
  const { logout, initialize } = useAuthStore();
  const navigate = useNavigate();

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await profileService.updateProfile({
        name: profileForm.name || user?.name,
        bio: profileForm.bio || user?.bio,
        experience_level: (profileForm.experience_level || user?.experience_level) as any,
      });
      await initialize();
      toast.success('Profile updated successfully!');
    } catch {
      toast.error('Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAnalyzeGitHub = async () => {
    const username = githubUsername || user?.github_username;
    if (!username) {
      toast.error('Please enter a GitHub username.');
      return;
    }
    setIsAnalyzing(true);
    try {
      await githubService.analyzeProfile(username);
      toast.success('GitHub profile analyzed and trust score updated!');
    } catch {
      toast.error('Failed to analyze GitHub profile. Check the username and try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleChangePassword = async () => {
    if (password.new !== password.confirm) {
      toast.error('New passwords do not match.');
      return;
    }
    if (password.new.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    setIsSaving(true);
    try {
      await authService.updatePassword(password.new);
      toast.success('Password changed successfully!');
      setPassword({ current: '', new: '', confirm: '' });
    } catch {
      toast.error('Failed to change password.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you absolutely sure? This action cannot be undone. All your data will be permanently deleted.'
    );
    if (!confirmed) return;
    toast.error('Account deletion requires admin approval. Please contact support.');
  };

  return (
    <div className="flex min-h-screen bg-primary-900">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Settings</h1>
          <p className="text-white/40 text-sm">Manage your account, security, and preferences</p>
        </div>

        <div className="flex gap-6">
          {/* Tab Sidebar */}
          <div className="w-48 shrink-0">
            <nav className="glass-card p-2 space-y-1">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeTab === id
                      ? id === 'danger'
                        ? 'bg-red-400/10 text-red-400 border border-red-400/20'
                        : 'bg-neon-blue/10 text-neon-blue border border-neon-blue/20'
                      : 'text-white/40 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="glass-card p-8 space-y-6">
                  <h2 className="text-lg font-semibold text-white">Profile Information</h2>

                  <div className="flex items-center gap-5 pb-6 border-b border-white/5">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-blue/40 to-neon-purple/40 flex items-center justify-center text-2xl font-bold text-white">
                      {user?.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{user?.name}</p>
                      <p className="text-sm text-white/40">{user?.email}</p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="input-label">Full Name</label>
                      <input
                        type="text"
                        value={profileForm.name || user?.name || ''}
                        onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
                        className="input-field"
                        placeholder={user?.name}
                        maxLength={100}
                      />
                    </div>
                    <div>
                      <label className="input-label">Bio</label>
                      <textarea
                        value={profileForm.bio || user?.bio || ''}
                        onChange={(e) => setProfileForm((p) => ({ ...p, bio: e.target.value }))}
                        className="input-field resize-none h-24"
                        placeholder="Tell teammates about yourself..."
                        maxLength={400}
                      />
                    </div>
                    <div>
                      <label className="input-label">Experience Level</label>
                      <select
                        value={profileForm.experience_level || user?.experience_level || ''}
                        onChange={(e) => setProfileForm((p) => ({ ...p, experience_level: e.target.value }))}
                        className="input-field appearance-none"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                        <option value="expert">Expert</option>
                      </select>
                    </div>
                  </div>

                  <motion.button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="btn-primary flex items-center gap-2"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </motion.button>
                </div>
              )}

              {/* GitHub Tab */}
              {activeTab === 'github' && (
                <div className="glass-card p-8 space-y-6">
                  <h2 className="text-lg font-semibold text-white">GitHub Integration</h2>

                  <div className="p-4 rounded-xl bg-neon-blue/5 border border-neon-blue/15">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-neon-blue" />
                      <span className="text-sm font-medium text-neon-blue">GitHub Analysis Benefits</span>
                    </div>
                    <ul className="text-xs text-white/40 space-y-1 ml-6">
                      <li>• Verified skill badges on your profile</li>
                      <li>• Higher Trust Score (+3–4 points)</li>
                      <li>• Better AI match suggestions</li>
                      <li>• Activity graph on dashboard</li>
                    </ul>
                  </div>

                  <div>
                    <label className="input-label">GitHub Username</label>
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <GithubIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                          type="text"
                          value={githubUsername || user?.github_username || ''}
                          onChange={(e) => setGithubUsername(e.target.value.trim().replace(/[^a-zA-Z0-9-]/g, ''))}
                          className="input-field pl-10"
                          placeholder="your-github-username"
                          maxLength={39}
                        />
                      </div>
                      <motion.button
                        onClick={handleAnalyzeGitHub}
                        disabled={isAnalyzing}
                        className="btn-primary flex items-center gap-2 shrink-0"
                        whileHover={{ scale: 1.01 }}
                      >
                        {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Github className="w-4 h-4" />}
                        {isAnalyzing ? 'Analyzing...' : 'Analyze'}
                      </motion.button>
                    </div>
                    <p className="text-xs text-white/30 mt-2">
                      We analyze public repositories, commits, stars, and language usage only. No private data accessed.
                    </p>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="glass-card p-8 space-y-6">
                  <h2 className="text-lg font-semibold text-white">Security Settings</h2>

                  <div>
                    <h3 className="text-sm font-medium text-white/70 mb-4">Change Password</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="input-label">Current Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                          <input
                            type={showCurrentPw ? 'text' : 'password'}
                            value={password.current}
                            onChange={(e) => setPassword((p) => ({ ...p, current: e.target.value }))}
                            className="input-field pl-10 pr-10"
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                            onClick={() => setShowCurrentPw(!showCurrentPw)}
                          >
                            {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="input-label">New Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                          <input
                            type={showNewPw ? 'text' : 'password'}
                            value={password.new}
                            onChange={(e) => setPassword((p) => ({ ...p, new: e.target.value }))}
                            className="input-field pl-10 pr-10"
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                            onClick={() => setShowNewPw(!showNewPw)}
                          >
                            {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="input-label">Confirm New Password</label>
                        <input
                          type="password"
                          value={password.confirm}
                          onChange={(e) => setPassword((p) => ({ ...p, confirm: e.target.value }))}
                          className="input-field"
                          placeholder="••••••••"
                        />
                      </div>
                      <motion.button
                        onClick={handleChangePassword}
                        disabled={isSaving}
                        className="btn-primary flex items-center gap-2"
                        whileHover={{ scale: 1.01 }}
                      >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                        Update Password
                      </motion.button>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="glass-card p-8 space-y-5">
                  <h2 className="text-lg font-semibold text-white">Notification Preferences</h2>
                  {[
                    { label: 'New AI matches found', sub: 'Get notified when new compatible teammates are discovered', key: 'matches' },
                    { label: 'Profile view alerts', sub: 'When someone views your profile', key: 'views' },
                    { label: 'Trust score updates', sub: 'When your trust score changes significantly', key: 'trust' },
                    { label: 'Hackathon reminders', sub: 'Alerts for upcoming hackathons you\'re interested in', key: 'hackathons' },
                    { label: 'Security alerts', sub: 'Login from new devices or suspicious activity', key: 'security' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-start justify-between p-4 rounded-xl bg-white/3 border border-white/5">
                      <div>
                        <p className="text-sm font-medium text-white">{item.label}</p>
                        <p className="text-xs text-white/40 mt-0.5">{item.sub}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer ml-4 shrink-0">
                        <input type="checkbox" defaultChecked={item.key !== 'views'} className="sr-only peer" />
                        <div className="w-10 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-neon-blue" />
                      </label>
                    </div>
                  ))}
                </div>
              )}

              {/* Danger Zone Tab */}
              {activeTab === 'danger' && (
                <div className="glass-card p-8 border border-red-400/20">
                  <h2 className="text-lg font-semibold text-red-400 mb-6 flex items-center gap-2">
                    <Trash2 className="w-5 h-5" />
                    Danger Zone
                  </h2>
                  <div className="space-y-4">
                    <div className="p-5 rounded-xl bg-red-400/5 border border-red-400/15">
                      <h3 className="font-medium text-white mb-1">Delete Account</h3>
                      <p className="text-sm text-white/40 mb-4">
                        Permanently delete your account and all associated data. This action cannot be undone.
                      </p>
                      <button
                        onClick={handleDeleteAccount}
                        className="btn-danger flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete My Account
                      </button>
                    </div>
                    <div className="p-5 rounded-xl bg-amber-400/5 border border-amber-400/15">
                      <h3 className="font-medium text-white mb-1">Sign Out All Sessions</h3>
                      <p className="text-sm text-white/40 mb-4">
                        Sign out from all devices and revoke all active sessions.
                      </p>
                      <button
                        onClick={async () => { await logout(); navigate('/login'); }}
                        className="px-5 py-2.5 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 text-sm font-medium hover:bg-amber-400/20 transition-all"
                      >
                        Sign Out Everywhere
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
