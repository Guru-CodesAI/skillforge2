import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, Search, Settings, Shield,
  LogOut, Zap, ChevronRight, User, Bell
} from 'lucide-react';
import { useAuthStore, useIsAdmin, useUser } from '@/store/authStore';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Search,          label: 'Discover',  href: '/discover'  },
  { icon: User,            label: 'Profile',   href: '/profile'   },
  { icon: Settings,        label: 'Settings',  href: '/settings'  },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const isAdmin = useIsAdmin();
  const user = useUser();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 min-h-screen bg-primary-900/50 backdrop-blur-xl border-r border-white/5 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold gradient-text">SkillForge</span>
        </Link>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
          <div className="relative">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user.name} className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-neon-blue/40 to-neon-purple/40 flex items-center justify-center text-sm font-bold text-white">
                {user?.name?.[0]?.toUpperCase() ?? 'U'}
              </div>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-primary-900" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name ?? 'User'}</p>
            <p className="text-xs text-white/40 truncate">{user?.email}</p>
          </div>
          {isAdmin && (
            <span className="badge-purple text-[10px]">Admin</span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map(({ icon: Icon, label, href }) => {
          const isActive = location.pathname === href || location.pathname.startsWith(href + '/');
          return (
            <Link key={href} to={href}>
              <motion.div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-neon-blue/10 text-neon-blue border border-neon-blue/20'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-neon-blue' : ''}`} />
                {label}
                {isActive && (
                  <ChevronRight className="w-3.5 h-3.5 ml-auto text-neon-blue" />
                )}
              </motion.div>
            </Link>
          );
        })}

        {/* Admin Link */}
        {isAdmin && (
          <Link to="/admin">
            <motion.div
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 mt-4 ${
                location.pathname === '/admin'
                  ? 'bg-neon-purple/10 text-neon-purple border border-neon-purple/20'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
              whileHover={{ x: 2 }}
            >
              <Shield className="w-4.5 h-4.5" />
              Admin Panel
            </motion.div>
          </Link>
        )}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-white/5">
        <motion.button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-400/70 hover:text-red-400 hover:bg-red-400/5 transition-all duration-200"
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.98 }}
        >
          <LogOut className="w-4.5 h-4.5" />
          Sign Out
        </motion.button>
      </div>
    </aside>
  );
}
