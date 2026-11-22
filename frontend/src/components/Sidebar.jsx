import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FolderOpen,
  Files,
  UploadCloud,
  QrCode,
  Share2,
  Star,
  Activity,
  BarChart3,
  HardDrive,
  Settings,
  LogOut,
  ShieldCheck,
  Zap,
  Brain,
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { name: 'My Collections', path: '/dashboard/collections', icon: FolderOpen },
    { name: 'Upload Files', path: '/dashboard/upload', icon: UploadCloud },
    { name: 'All Files', path: '/dashboard/files', icon: Files },
    { name: 'QR Codes', path: '/dashboard/qr', icon: QrCode },
    { name: 'Favorites', path: '/dashboard/favorites', icon: Star },
    { name: 'Analytics', path: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Storage', path: '/dashboard/storage', icon: HardDrive },
    { name: 'AI Organizer', path: '/dashboard/ai', icon: Brain },
    { name: 'Settings', path: '/dashboard/settings', icon: Settings },
  ];

  const storageUsedMB = Math.round((user?.storageUsed || 0) / (1024 * 1024));
  const storageQuotaMB = Math.round((user?.storageQuota || 5 * 1024 * 1024 * 1024) / (1024 * 1024));
  const storagePercent = Math.min(100, Math.round((storageUsedMB / (storageQuotaMB || 1)) * 100));

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 glass-panel border-r border-white/5 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:static lg:h-full lg:translate-x-0 shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-3.5 space-y-4 overflow-y-auto">
          {/* Main Navigation Links */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Workspace
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/dashboard'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-600/20 to-indigo-600/20 text-purple-300 border border-purple-500/30 shadow-glow-primary'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Admin Navigation (if role === admin) */}
          {isAdmin && (
            <div className="space-y-1 pt-4 border-t border-white/5">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-rose-400 mb-2">
                Administration
              </p>
              <NavLink
                to="/admin"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'text-slate-400 hover:text-rose-300 hover:bg-white/5'
                  }`
                }
              >
                <ShieldCheck className="w-4 h-4 text-rose-400" />
                <span>Admin Console</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* Storage Widget & User Card */}
        <div className="p-4 border-t border-white/5 space-y-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-900/30 via-slate-900/60 to-slate-900/40 border border-purple-500/20">
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <span className="text-slate-300 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-cyan-400" /> Storage
              </span>
              <span className="text-purple-400">{storagePercent}%</span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 transition-all duration-500"
                style={{ width: `${storagePercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>{storageUsedMB} MB of {storageQuotaMB} MB</span>
              <button
                onClick={() => navigate('/pricing')}
                className="text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1"
              >
                Upgrade <Zap className="w-3 h-3 text-amber-400" />
              </button>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
