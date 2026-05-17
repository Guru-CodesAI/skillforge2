import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Shield, Users, Activity, AlertTriangle, Trash2,
  Edit3, Search, Ban, CheckCircle, MoreVertical, Loader2,
  TrendingUp, Eye, Clock, Server
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { adminService } from '@/services/api';
import toast from 'react-hot-toast';
import type { User } from '@/types';

const ADMIN_TABS = [
  { id: 'overview', label: 'Overview', icon: TrendingUp },
  { id: 'users', label: 'User Management', icon: Users },
  { id: 'security', label: 'Security Logs', icon: Shield },
  { id: 'audit', label: 'Audit Trail', icon: Activity },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: platformStats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminService.getPlatformStats,
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: () => adminService.getAllUsers(1, search),
    staleTime: 1000 * 30,
  });

  const { data: auditLogs } = useQuery({
    queryKey: ['admin-logs'],
    queryFn: adminService.getAdminLogs,
    enabled: activeTab === 'audit',
  });

  const { data: securityLogs } = useQuery({
    queryKey: ['security-logs'],
    queryFn: adminService.getSecurityLogs,
    enabled: activeTab === 'security',
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => adminService.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User removed successfully.');
    },
    onError: () => toast.error('Failed to remove user.'),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      adminService.updateUser(userId, { role: role as any }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User role updated.');
    },
  });

  const handleDelete = (userId: string, name: string) => {
    if (window.confirm(`Remove ${name}'s account? This action is logged.`)) {
      deleteMutation.mutate(userId);
    }
  };

  const StatCard = ({ icon: Icon, label, value, change, color }: {
    icon: React.ElementType; label: string; value: number | string; change?: string; color: string;
  }) => (
    <div className="glass-card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
          <Icon className="w-4.5 h-4.5" style={{ color }} />
        </div>
        {change && <span className="text-xs text-green-400">{change}</span>}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-white/40 mt-0.5">{label}</p>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-primary-900">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-neon-purple" />
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            <span className="badge-purple ml-2 text-[10px]">Admin Only</span>
          </div>
          <p className="text-white/40 text-sm">Platform moderation and management</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 glass-card p-1.5 w-fit">
          {ADMIN_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === id
                  ? 'bg-neon-purple/15 text-neon-purple border border-neon-purple/25'
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {statsLoading ? (
                Array.from({ length: 4 }).map((_, i) => <div key={i} className="rounded-2xl shimmer h-24" />)
              ) : (
                <>
                  <StatCard icon={Users} label="Total Users" value={platformStats?.total_users ?? 0} change="+12% this week" color="#00D4FF" />
                  <StatCard icon={CheckCircle} label="Verified Profiles" value={platformStats?.verified_count ?? 0} color="#00FFF7" />
                  <StatCard icon={AlertTriangle} label="Flagged Users" value={platformStats?.flagged_count ?? 0} color="#FF4DFF" />
                  <StatCard icon={Activity} label="Matches Today" value={platformStats?.matches_today ?? 0} change="+8%" color="#8B5CF6" />
                </>
              )}
            </div>

            {/* Quick actions */}
            <div className="glass-card p-6">
              <h2 className="font-semibold text-white mb-4">Quick Actions</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('users')}
                  className="p-4 rounded-xl bg-neon-blue/5 border border-neon-blue/15 text-left hover:bg-neon-blue/10 transition-all"
                >
                  <Users className="w-5 h-5 text-neon-blue mb-2" />
                  <p className="text-sm font-medium text-white">Manage Users</p>
                  <p className="text-xs text-white/30 mt-0.5">View and moderate user accounts</p>
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className="p-4 rounded-xl bg-neon-purple/5 border border-neon-purple/15 text-left hover:bg-neon-purple/10 transition-all"
                >
                  <Shield className="w-5 h-5 text-neon-purple mb-2" />
                  <p className="text-sm font-medium text-white">Security Logs</p>
                  <p className="text-xs text-white/30 mt-0.5">Review blocked attacks and threats</p>
                </button>
                <button
                  onClick={() => setActiveTab('audit')}
                  className="p-4 rounded-xl bg-neon-magenta/5 border border-neon-magenta/15 text-left hover:bg-neon-magenta/10 transition-all"
                >
                  <Activity className="w-5 h-5 text-neon-magenta mb-2" />
                  <p className="text-sm font-medium text-white">Audit Trail</p>
                  <p className="text-xs text-white/30 mt-0.5">Admin action history and logs</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-5">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  className="input-field pl-10 w-full"
                />
              </div>
            </div>

            <div className="glass-card overflow-hidden">
              <div className="p-4 border-b border-white/5">
                <h2 className="font-semibold text-white text-sm">User Management</h2>
              </div>
              <div className="overflow-x-auto">
                {usersLoading ? (
                  <div className="p-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-neon-blue mx-auto" />
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="text-left p-4 text-white/30 font-medium text-xs">User</th>
                        <th className="text-left p-4 text-white/30 font-medium text-xs">Role</th>
                        <th className="text-left p-4 text-white/30 font-medium text-xs">GitHub</th>
                        <th className="text-left p-4 text-white/30 font-medium text-xs">Joined</th>
                        <th className="text-left p-4 text-white/30 font-medium text-xs">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(Array.isArray(users) ? users : users?.data ?? []).map((u: User) => (
                        <motion.tr
                          key={u.id}
                          className="border-b border-white/5 hover:bg-white/3 transition-colors"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-blue/30 to-neon-purple/30 flex items-center justify-center text-xs font-bold text-white">
                                {u.name?.[0]?.toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-white">{u.name}</p>
                                <p className="text-xs text-white/30">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <select
                              value={u.role}
                              onChange={(e) => updateRoleMutation.mutate({ userId: u.id, role: e.target.value })}
                              className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white/70 cursor-pointer"
                            >
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="p-4">
                            {u.github_username ? (
                              <span className="badge-green text-[10px]">@{u.github_username}</span>
                            ) : (
                              <span className="text-xs text-white/20">Not connected</span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className="text-xs text-white/30 font-mono">
                              {new Date(u.created_at).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleDelete(u.id, u.name)}
                                className="p-1.5 rounded-lg text-red-400/50 hover:text-red-400 hover:bg-red-400/10 transition-all"
                                title="Remove user"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
                                title="View profile"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Security Logs Tab */}
        {activeTab === 'security' && (
          <div className="glass-card overflow-hidden">
            <div className="p-4 border-b border-white/5 flex items-center gap-2">
              <Shield className="w-4 h-4 text-neon-purple" />
              <h2 className="font-semibold text-white text-sm">Security Event Logs</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left p-4 text-white/30 font-medium text-xs">IP Address</th>
                    <th className="text-left p-4 text-white/30 font-medium text-xs">Endpoint</th>
                    <th className="text-left p-4 text-white/30 font-medium text-xs">Attack Type</th>
                    <th className="text-left p-4 text-white/30 font-medium text-xs">Status</th>
                    <th className="text-left p-4 text-white/30 font-medium text-xs">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {((securityLogs as any[]) ?? []).map((log: any, i: number) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                      <td className="p-4 font-mono text-xs text-white/60">{log.ip_address}</td>
                      <td className="p-4 font-mono text-xs text-neon-blue">{log.endpoint}</td>
                      <td className="p-4">
                        <span className="badge-red text-[10px]">{log.attack_type}</span>
                      </td>
                      <td className="p-4">
                        {log.blocked ? (
                          <span className="badge-green text-[10px]">Blocked</span>
                        ) : (
                          <span className="badge-amber text-[10px]">Detected</span>
                        )}
                      </td>
                      <td className="p-4 text-xs text-white/30 font-mono">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {(!securityLogs || (securityLogs as any[]).length === 0) && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-white/20 text-sm">
                        No security events logged. System is clean ✓
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Audit Trail Tab */}
        {activeTab === 'audit' && (
          <div className="glass-card overflow-hidden">
            <div className="p-4 border-b border-white/5 flex items-center gap-2">
              <Activity className="w-4 h-4 text-neon-magenta" />
              <h2 className="font-semibold text-white text-sm">Admin Audit Trail</h2>
            </div>
            <div className="divide-y divide-white/5">
              {((auditLogs ?? []) as any[]).map((log: any) => (
                <div key={log.id} className="p-4 flex items-center gap-4 hover:bg-white/3 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-neon-purple/10 border border-neon-purple/20 flex items-center justify-center shrink-0">
                    <Shield className="w-3.5 h-3.5 text-neon-purple" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/80">
                      <span className="font-medium text-white">Admin</span>
                      {' → '}
                      <span className="text-neon-purple">{log.action}</span>
                      {log.target_user && (
                        <> on user <span className="text-white">{log.target_user}</span></>
                      )}
                    </p>
                  </div>
                  <span className="text-xs text-white/25 font-mono shrink-0">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
              {(!auditLogs || (auditLogs as any[]).length === 0) && (
                <div className="p-8 text-center text-white/20 text-sm">
                  No audit events recorded yet.
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
