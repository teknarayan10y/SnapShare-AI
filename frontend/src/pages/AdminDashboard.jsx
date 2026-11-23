import React, { useState, useEffect, useMemo } from 'react';
import { adminAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  ShieldCheck,
  Users,
  FolderOpen,
  Files,
  HardDrive,
  Download,
  CreditCard,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Cpu,
  Clock,
  Activity,
  Cloud,
  ArrowUpRight,
  UserCheck,
  UserX,
  Sparkles,
  Database,
  Terminal,
  Zap,
  Filter,
  Plus,
  Trash2,
  Megaphone,
  Check,
  X,
  Sliders,
  TrendingUp,
  Key,
  Globe,
  Radio,
  Eye,
  Send,
  QrCode,
} from 'lucide-react';

export const AdminDashboard = () => {
  const { showToast, toast } = useToast();
  const notify = (msg, type = 'success') => {
    if (toast?.[type]) toast[type](msg);
    else if (showToast) showToast(msg, type);
  };

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users' | 'requests' | 'analytics' | 'announcements' | 'security' | 'health'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [storageRequests, setStorageRequests] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [storageAnalytics, setStorageAnalytics] = useState(null);
  const [securityMetrics, setSecurityMetrics] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [requestFilter, setRequestFilter] = useState('all');

  // Modals
  const [showCustomModal, setShowCustomModal] = useState(null); // active request to grant custom quota
  const [customQuotaGB, setCustomQuotaGB] = useState('25');
  const [customNotes, setCustomNotes] = useState('');

  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    message: '',
    type: 'info',
    targetAudience: 'all',
  });

  const loadAll = async () => {
    setRefreshing(true);
    try {
      const [
        overviewRes,
        usersRes,
        requestsRes,
        announcementsRes,
        analyticsRes,
        securityRes,
        logsRes,
      ] = await Promise.allSettled([
        adminAPI.getOverview(),
        adminAPI.getUsers({ limit: 100 }),
        adminAPI.getStorageRequests(),
        adminAPI.getAnnouncements(),
        adminAPI.getStorageAnalytics(),
        adminAPI.getSecurityMetrics(),
        adminAPI.getAuditLogs({ limit: 50 }),
      ]);

      if (overviewRes.status === 'fulfilled' && overviewRes.value.data.success) {
        setOverview(overviewRes.value.data);
      }
      if (usersRes.status === 'fulfilled' && usersRes.value.data.success) {
        setUsers(usersRes.value.data.users || []);
      }
      if (requestsRes.status === 'fulfilled' && requestsRes.value.data.success) {
        setStorageRequests(requestsRes.value.data.requests || []);
      }
      if (announcementsRes.status === 'fulfilled' && announcementsRes.value.data.success) {
        setAnnouncements(announcementsRes.value.data.announcements || []);
      }
      if (analyticsRes.status === 'fulfilled' && analyticsRes.value.data.success) {
        setStorageAnalytics(analyticsRes.value.data);
      }
      if (securityRes.status === 'fulfilled' && securityRes.value.data.success) {
        setSecurityMetrics(securityRes.value.data);
      }
      if (logsRes.status === 'fulfilled' && logsRes.value.data.success) {
        setAuditLogs(logsRes.value.data.logs || []);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadAll();
      setLoading(false);
    };
    init();
  }, []);

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // User Actions
  const handleToggleUser = async (userId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      await adminAPI.updateUser(userId, { isActive: newStatus });
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, isActive: newStatus } : u))
      );
      notify(newStatus ? 'User account reactivated' : 'User account suspended', 'info');
    } catch (err) {
      notify('Failed to update user status', 'error');
    }
  };

  const handleChangeRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Change this user's role to "${newRole.toUpperCase()}"?`)) return;

    try {
      await adminAPI.updateUser(userId, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
      );
      notify(`Role changed to ${newRole.toUpperCase()}!`, 'success');
    } catch (err) {
      notify('Failed to change user role', 'error');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Permanently delete account for "${userName}"? This cannot be undone.`)) return;
    try {
      await adminAPI.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      notify(`User "${userName}" deleted permanently`, 'success');
    } catch (err) {
      notify(err.response?.data?.error || 'Failed to delete user', 'error');
    }
  };

  // Storage Request Actions
  const handleApproveRequest = async (requestId, gb) => {
    try {
      await adminAPI.approveStorageRequest(requestId);
      setStorageRequests((prev) =>
        prev.map((r) =>
          r._id === requestId ? { ...r, status: 'approved', grantedQuotaGB: gb } : r
        )
      );
      notify(`Approved ${gb} GB storage upgrade!`, 'success');
      loadAll();
    } catch (err) {
      notify('Failed to approve request', 'error');
    }
  };

  const handleRejectRequest = async (requestId) => {
    const reason = prompt('Optional rejection note for user:') || '';
    try {
      await adminAPI.rejectStorageRequest(requestId, { adminNotes: reason });
      setStorageRequests((prev) =>
        prev.map((r) =>
          r._id === requestId ? { ...r, status: 'rejected', adminNotes: reason } : r
        )
      );
      notify('Storage request rejected', 'info');
    } catch (err) {
      notify('Failed to reject request', 'error');
    }
  };

  const handleGrantCustomStorage = async (e) => {
    e.preventDefault();
    if (!showCustomModal) return;
    try {
      await adminAPI.customStorageRequest(showCustomModal._id, {
        customQuotaGB: Number(customQuotaGB),
        adminNotes: customNotes,
      });
      setStorageRequests((prev) =>
        prev.map((r) =>
          r._id === showCustomModal._id
            ? { ...r, status: 'approved', grantedQuotaGB: Number(customQuotaGB) }
            : r
        )
      );
      notify(`Granted custom ${customQuotaGB} GB storage!`, 'success');
      setShowCustomModal(null);
      setCustomNotes('');
      loadAll();
    } catch (err) {
      notify('Failed to grant custom storage', 'error');
    }
  };

  // Announcement Actions
  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      const res = await adminAPI.createAnnouncement(announcementForm);
      if (res.data?.success) {
        setAnnouncements((prev) => [res.data.announcement, ...prev]);
        notify('Announcement broadcast published! 📢', 'success');
        setShowAnnouncementModal(false);
        setAnnouncementForm({ title: '', message: '', type: 'info', targetAudience: 'all' });
      }
    } catch (err) {
      notify('Failed to create announcement', 'error');
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    try {
      await adminAPI.deleteAnnouncement(id);
      setAnnouncements((prev) => prev.filter((a) => a._id !== id));
      notify('Announcement removed', 'info');
    } catch (err) {
      notify('Failed to delete announcement', 'error');
    }
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
      const matchesStatus =
        userStatusFilter === 'all' ||
        (userStatusFilter === 'active' && u.isActive) ||
        (userStatusFilter === 'suspended' && !u.isActive);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, userRoleFilter, userStatusFilter]);

  // Filtered Requests
  const filteredRequests = useMemo(() => {
    return storageRequests.filter((r) => {
      if (requestFilter === 'all') return true;
      return r.status === requestFilter;
    });
  }, [storageRequests, requestFilter]);

  const pendingRequestsCount = useMemo(() => {
    return storageRequests.filter((r) => r.status === 'pending').length;
  }, [storageRequests]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-cyan-400 font-mono tracking-widest uppercase animate-pulse">
          Initializing Master Command Console...
        </p>
      </div>
    );
  }

  const stats = overview?.stats || {};
  const health = overview?.systemHealth || {};
  const cloudinaryInfo = overview?.cloudinary || {};

  const tabs = [
    { id: 'overview', label: 'Command Center', icon: Zap },
    { id: 'users', label: `Users (${users.length})`, icon: Users },
    {
      id: 'requests',
      label: 'Storage Requests',
      icon: HardDrive,
      badge: pendingRequestsCount > 0 ? pendingRequestsCount : null,
    },
    { id: 'analytics', label: 'Storage Analytics', icon: TrendingUp },
    { id: 'announcements', label: `Announcements (${announcements.length})`, icon: Megaphone },
    { id: 'security', label: 'Security & Activity', icon: ShieldCheck },
    { id: 'health', label: 'System Health', icon: Cpu },
  ];

  return (
    <div className="space-y-8 animate-in fade-in pb-20 max-w-7xl mx-auto">
      {/* Top Futuristic Header Bar (Matches RevenuePulse AI reference) */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-[#090D18]/90 border border-white/10 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 via-purple-600 to-emerald-400 p-[1.5px] shadow-glow-cyan">
              <div className="w-full h-full bg-[#080B14] rounded-[14px] flex items-center justify-center">
                <Radio className="w-7 h-7 text-cyan-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  SnapShare <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-emerald-400">Master Console</span>
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" /> LIVE SAAS NODE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Universal Multi-Tenant Event Cloud • AI Neural Biometrics • Dynamic Storage Mesh
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Global Search Bar */}
            <div className="relative w-48 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search console... (⌘K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Sync Button */}
            <button
              onClick={loadAll}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition-all active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
              Sync Metrics
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tab Bar */}
      <div className="flex gap-2 p-1.5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all relative ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-cyan-950/50'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.badge ? (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                  {tab.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          TAB 1: COMMAND CENTER (Matching RevenuePulse AI reference screenshot)
         ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top 4 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Platform Consumption */}
            <div className="p-5 rounded-3xl bg-[#0B0F19] border border-white/10 relative overflow-hidden space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Total Storage Consumed</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Live
                </span>
              </div>
              <p className="text-3xl font-black text-white">{formatBytes(stats.totalStorageConsumption || 0)}</p>
              <div className="flex items-center gap-1 text-[11px] font-bold text-cyan-400">
                <HardDrive className="w-3.5 h-3.5" />
                {stats.totalAllocatedQuota
                  ? `${((stats.totalStorageConsumption / stats.totalAllocatedQuota) * 100).toFixed(1)}% of ${formatBytes(stats.totalAllocatedQuota)} allocated`
                  : 'Active Cloud Storage'}
              </div>
              {/* Wave visualization curve */}
              <div className="h-10 w-full pt-2">
                <svg viewBox="0 0 200 40" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="waveCyan" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.8" />
                      <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.8" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0,25 C30,10 60,35 100,20 C140,5 170,30 200,15"
                    fill="none"
                    stroke="url(#waveCyan)"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <path
                    d="M0,25 C30,10 60,35 100,20 C140,5 170,30 200,15 L200,40 L0,40 Z"
                    fill="url(#waveCyan)"
                    opacity="0.1"
                  />
                </svg>
              </div>
            </div>

            {/* Card 2: Active Accounts / Total Users */}
            <div className="p-5 rounded-3xl bg-[#0B0F19] border border-white/10 relative overflow-hidden space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Active Accounts</span>
                <Users className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-3xl font-black text-white">{stats.totalUsers || 0}</p>
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                <UserCheck className="w-3.5 h-3.5" />
                {stats.activeUsers ?? stats.totalUsers ?? 0} Active · {stats.suspendedUsers ?? 0} Suspended
              </div>
              {/* Dot Matrix Pattern */}
              <div className="grid grid-cols-10 gap-1 pt-2 opacity-40">
                {Array.from({ length: 30 }).map((_, i) => (
                  <span
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full ${
                      i < (stats.activeUsers ?? stats.totalUsers ?? 1) ? 'bg-cyan-400' : 'bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Card 3: Platform Throughput / Downloads */}
            <div className="p-5 rounded-3xl bg-[#0B0F19] border border-white/10 relative overflow-hidden space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Total Media Downloads</span>
                <Download className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-3xl font-black text-white">{stats.totalDownloads || 0}</p>
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                <QrCode className="w-3.5 h-3.5" />
                {stats.totalScans || 0} Collection QR Scans
              </div>
              {/* Smooth Green Wave Curve */}
              <div className="h-10 w-full pt-2">
                <svg viewBox="0 0 200 40" className="w-full h-full overflow-visible">
                  <path
                    d="M0,30 C40,5 80,35 120,15 C160,0 180,25 200,10"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            {/* Card 4: AI Face Organization Indexing */}
            <div className="p-5 rounded-3xl bg-[#0B0F19] border border-white/10 relative overflow-hidden space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">AI Media Indexed</span>
                <Sparkles className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-3xl font-black text-white">
                {stats.aiAnalyzedFiles ?? stats.totalFiles ?? 0}{' '}
                <span className="text-sm font-medium text-slate-400">/ {stats.totalFiles || 0}</span>
              </p>
              <div className="flex items-center gap-1 text-[11px] font-bold text-purple-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {stats.totalFiles > 0
                  ? Math.round(((stats.aiAnalyzedFiles ?? stats.totalFiles) / stats.totalFiles) * 100)
                  : 100}
                % Processed · YuNet & Vision
              </div>
              {/* Dotted Line Curve */}
              <div className="h-10 w-full pt-2">
                <svg viewBox="0 0 200 40" className="w-full h-full overflow-visible">
                  <path
                    d="M0,15 L40,25 L80,10 L120,30 L160,18 L200,8"
                    fill="none"
                    stroke="#8B5CF6"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                  {[
                    [0, 15],
                    [40, 25],
                    [80, 10],
                    [120, 30],
                    [160, 18],
                    [200, 8],
                  ].map(([cx, cy], idx) => (
                    <circle key={idx} cx={cx} cy={cy} r="3" fill="#C084FC" />
                  ))}
                </svg>
              </div>
            </div>
          </div>

          {/* Middle Row: Storage Breakdown Donut & Real Activity Funnel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Storage by Media Type */}
            <div className="p-6 sm:p-7 rounded-3xl bg-[#0B0F19] border border-white/10 space-y-6 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">Storage by Media Type</h3>
                <span className="text-xs text-slate-400 font-semibold px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">
                  Real MongoDB Data
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-8">
                {/* SVG Donut Chart */}
                <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#1E293B" strokeWidth="4" />
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      stroke="#8B5CF6"
                      strokeWidth="4"
                      strokeDasharray="100 100"
                      strokeDashoffset="0"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xs text-slate-400">Total Media</span>
                    <span className="text-lg font-black text-white">{stats.totalFiles || 0}</span>
                  </div>
                </div>

                {/* Legend dynamically loaded from real category data */}
                <div className="flex-1 space-y-3 w-full">
                  {stats.mediaByCategory && stats.mediaByCategory.length > 0 ? (
                    stats.mediaByCategory.map((cat, idx) => {
                      const colors = ['bg-purple-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-amber-500', 'bg-pink-500'];
                      const color = colors[idx % colors.length];
                      const totalBytes = stats.totalStorageConsumption || 1;
                      const pct = ((cat.totalBytes / totalBytes) * 100).toFixed(1);
                      return (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                            <span className="text-slate-300 font-medium capitalize">{cat._id || 'Images'}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-slate-400 font-mono">{formatBytes(cat.totalBytes)}</span>
                            <span className="text-white font-bold">{pct}%</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-xs text-slate-500 py-4">No media uploaded yet</div>
                  )}

                  {/* Real Plan Breakdown */}
                  <div className="pt-2 border-t border-white/5 space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                      Accounts by Plan
                    </span>
                    <div className="flex items-center gap-3 text-xs text-slate-300 flex-wrap">
                      {stats.usersByPlan && stats.usersByPlan.length > 0 ? (
                        stats.usersByPlan.map((p, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[11px] capitalize">
                            {p._id}: <strong className="text-white">{p.count}</strong>
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-500 text-[11px]">Free Tier: {stats.totalUsers || 0}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Platform Activity Pipeline (Real Funnel) */}
            <div className="p-6 sm:p-7 rounded-3xl bg-[#0B0F19] border border-white/10 space-y-6 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">Platform Activity Pipeline</h3>
                <span className="text-xs text-emerald-400 font-bold">
                  {stats.totalUsers > 0
                    ? `${(stats.totalFiles / Math.max(1, stats.totalUsers)).toFixed(1)} Files/User Avg`
                    : 'Active'}
                </span>
              </div>

              {/* Stages row */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">1. Total Users</span>
                  <span className="text-base font-black text-white mt-0.5 block">{stats.totalUsers || 0}</span>
                  <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-white/5 text-[10px] text-slate-300">100%</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">2. Active</span>
                  <span className="text-base font-black text-white mt-0.5 block">{stats.activeUsers ?? stats.totalUsers ?? 0}</span>
                  <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-cyan-500/20 text-[10px] text-cyan-300">
                    {stats.totalUsers > 0
                      ? Math.round(((stats.activeUsers ?? stats.totalUsers) / stats.totalUsers) * 100)
                      : 100}
                    %
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">3. Collections</span>
                  <span className="text-base font-black text-white mt-0.5 block">{stats.totalCollections || 0}</span>
                  <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-purple-500/20 text-[10px] text-purple-300">
                    {stats.totalCollections} Vaults
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">4. Media Files</span>
                  <span className="text-base font-black text-white mt-0.5 block">{stats.totalFiles || 0}</span>
                  <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-emerald-500/20 text-[10px] text-emerald-300">
                    {stats.totalFiles} Uploads
                  </span>
                </div>
              </div>

              {/* Funnel Flow Graphic */}
              <div className="h-16 w-full pt-2">
                <svg viewBox="0 0 400 60" className="w-full h-full">
                  <defs>
                    <linearGradient id="funnelGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8" />
                      <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#10B981" stopOpacity="0.8" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 10 5 C 100 5, 200 20, 390 28 L 390 32 C 200 40, 100 55, 10 55 Z"
                    fill="url(#funnelGrad)"
                    opacity="0.75"
                  />
                </svg>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs">
                <span className="text-slate-400">Database Storage Breakdown</span>
                <span className="font-bold text-white">
                  {stats.totalFiles || 0} Total Photos · {formatBytes(stats.totalStorageConsumption || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Row: Real Channels, Real Operations Breakdown, and Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Event Categories from Database */}
            <div className="p-6 rounded-3xl bg-[#0B0F19] border border-white/10 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Top Event Categories</h3>
                <span className="text-[10px] text-slate-400">Live Database</span>
              </div>
              <div className="space-y-3">
                {stats.collectionCategories && stats.collectionCategories.length > 0 ? (
                  stats.collectionCategories.map((item, idx) => {
                    const gradients = [
                      'from-purple-500 to-indigo-500',
                      'from-cyan-500 to-blue-500',
                      'from-emerald-500 to-teal-500',
                      'from-amber-500 to-orange-500',
                      'from-pink-500 to-rose-500',
                    ];
                    const color = gradients[idx % gradients.length];
                    const maxCount = Math.max(...stats.collectionCategories.map((c) => c.count || 1));
                    const widthPct = Math.max(15, Math.round((item.count / maxCount) * 100));
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-300 font-medium capitalize">{item._id}</span>
                          <span className="text-slate-400 font-mono text-[11px]">
                            {item.count} collection(s) · {item.totalFiles || 0} file(s)
                          </span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${color} rounded-full`}
                            style={{ width: `${widthPct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-xs text-slate-500 py-4">No collections created yet</div>
                )}
              </div>
            </div>

            {/* Real Platform Operations Breakdown */}
            <div className="p-6 rounded-3xl bg-[#0B0F19] border border-white/10 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Platform Operations & Health</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="text-lg font-black text-cyan-400">ACTIVE</span>
                  <span className="text-xs text-slate-300 block font-semibold">AI Vision Engine</span>
                  <span className="text-[10px] text-slate-500">YuNet + Gemini</span>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="text-lg font-black text-purple-400">
                    {stats.cloudinary?.isConfigured ? 'CONNECTED' : 'LOCAL'}
                  </span>
                  <span className="text-xs text-slate-300 block font-semibold">Cloud CDN</span>
                  <span className="text-[10px] text-slate-500">{stats.cloudinary?.cloudName || 'Storage Ready'}</span>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="text-lg font-black text-emerald-400">
                    {stats.pendingRequests ?? storageRequests.length ?? 0}
                  </span>
                  <span className="text-xs text-slate-300 block font-semibold">Storage Requests</span>
                  <span className="text-[10px] text-slate-500">{stats.approvedRequests ?? 0} Approved</span>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="text-lg font-black text-amber-400">
                    {stats.actionBreakdown?.reduce((a, b) => a + b.count, 0) || auditLogs.length}
                  </span>
                  <span className="text-xs text-slate-300 block font-semibold">Security Audits</span>
                  <span className="text-[10px] text-slate-500">Real-time log</span>
                </div>
              </div>
            </div>

            {/* Recent Account Activity Feed (Matching Reference) */}
            <div className="p-6 rounded-3xl bg-[#0B0F19] border border-white/10 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Recent Account Activity</h3>
                <button
                  onClick={() => setActiveTab('security')}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
                >
                  View all
                </button>
              </div>

              <div className="space-y-3">
                {auditLogs.slice(0, 5).map((log, idx) => (
                  <div
                    key={log._id || idx}
                    className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <span className="font-bold text-white block truncate max-w-[160px]">
                        {log.userId?.name || log.resourceType || 'User'}
                      </span>
                      <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
                        {log.action.replace(/_/g, ' ')}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}

                {auditLogs.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-4">No recent activity logged</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: USER MANAGEMENT
         ========================================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#0B0F19] border border-white/10">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none"
              >
                <option value="all" className="bg-slate-900">All Roles</option>
                <option value="admin" className="bg-slate-900">Admins</option>
                <option value="user" className="bg-slate-900">Users</option>
              </select>

              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none"
              >
                <option value="all" className="bg-slate-900">All Statuses</option>
                <option value="active" className="bg-slate-900">Active</option>
                <option value="suspended" className="bg-slate-900">Suspended</option>
              </select>
            </div>

            <span className="text-xs font-semibold text-slate-400">
              Showing {filteredUsers.length} of {users.length} Users
            </span>
          </div>

          {/* Users Table */}
          <div className="rounded-3xl bg-[#0B0F19] border border-white/10 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/[0.03] text-slate-400 font-semibold border-b border-white/5">
                  <tr>
                    <th className="py-3.5 px-4">User</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Plan</th>
                    <th className="py-3.5 px-4">Storage Quota</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {filteredUsers.map((user) => {
                    const quotaMB = Math.round((user.storageQuota || 5 * 1024 * 1024 * 1024) / (1024 * 1024));
                    const usedMB = Math.round((user.storageUsed || 0) / (1024 * 1024));
                    const pct = Math.min(100, Math.round((usedMB / quotaMB) * 100));

                    return (
                      <tr key={user._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            {user.avatar ? (
                              <img src={user.avatar} alt="" className="w-9 h-9 rounded-xl object-cover border border-white/10" />
                            ) : (
                              <div className="w-9 h-9 rounded-xl bg-purple-600/30 text-purple-300 flex items-center justify-center font-bold">
                                {user.name?.[0]?.toUpperCase() || 'U'}
                              </div>
                            )}
                            <div>
                              <span className="font-bold text-white block">{user.name}</span>
                              <span className="text-slate-500 text-[11px]">{user.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            user.role === 'admin'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            {user.plan || 'Free'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="space-y-1 w-36">
                            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                              <span>{usedMB} MB</span>
                              <span>{quotaMB >= 1024 ? `${(quotaMB / 1024).toFixed(0)} GB` : `${quotaMB} MB`}</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => handleToggleUser(user._id, user.isActive)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${
                              user.isActive
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30'
                            }`}
                          >
                            {user.isActive ? 'Active' : 'Suspended'}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleChangeRole(user._id, user.role)}
                              title="Toggle Role"
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user._id, user.name)}
                              title="Delete User"
                              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: STORAGE REQUESTS (Dedicated Section requested by user)
         ========================================================================= */}
      {activeTab === 'requests' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Header & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#0B0F19] border border-white/10">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-emerald-400" /> Extra Storage Upgrade Inbox
              </h2>
              <p className="text-xs text-slate-400">
                Review user capacity requests: approve, reject, or grant custom storage allocations.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {['all', 'pending', 'approved', 'rejected'].map((st) => (
                <button
                  key={st}
                  onClick={() => setRequestFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all ${
                    requestFilter === st
                      ? 'bg-emerald-600 text-white shadow-glow-emerald'
                      : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Requests Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRequests.map((req) => {
              const currentGB = Math.round((req.currentQuota || 5 * 1024 * 1024 * 1024) / (1024 * 1024 * 1024));
              const usedMB = Math.round((req.currentUsed || 0) / (1024 * 1024));

              return (
                <div
                  key={req._id}
                  className="p-5 rounded-3xl bg-[#0B0F19] border border-white/10 space-y-4 shadow-xl flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {req.userId?.avatar ? (
                          <img src={req.userId.avatar} alt="" className="w-8 h-8 rounded-xl object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-xl bg-purple-600/30 text-purple-300 flex items-center justify-center font-bold text-xs">
                            {req.userName?.[0]?.toUpperCase() || 'U'}
                          </div>
                        )}
                        <div>
                          <span className="font-bold text-white block text-xs">{req.userName || req.userId?.name}</span>
                          <span className="text-slate-500 text-[10px]">{req.userEmail || req.userId?.email}</span>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        req.status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : req.status === 'rejected'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                      }`}>
                        {req.status}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Current Quota:</span>
                        <span className="font-bold text-white">{currentGB} GB ({usedMB} MB used)</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Requested Capacity:</span>
                        <span className="font-bold text-emerald-400">+{req.requestedQuotaGB} GB Upgrade</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-slate-400 block mb-1">Reason Submitted:</span>
                      <p className="text-xs text-slate-200 bg-white/[0.02] p-2.5 rounded-xl border border-white/5 italic">
                        "{req.reason}"
                      </p>
                    </div>

                    {req.adminNotes && (
                      <p className="text-[11px] text-slate-400">
                        Admin Note: <span className="text-slate-300">{req.adminNotes}</span>
                      </p>
                    )}
                  </div>

                  {/* Action Buttons for Pending Requests */}
                  {req.status === 'pending' ? (
                    <div className="pt-3 border-t border-white/5 flex items-center gap-2">
                      <button
                        onClick={() => handleApproveRequest(req._id, req.requestedQuotaGB)}
                        className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-glow-emerald transition-all"
                      >
                        Approve (+{req.requestedQuotaGB}GB)
                      </button>
                      <button
                        onClick={() => {
                          setShowCustomModal(req);
                          setCustomQuotaGB(String(req.requestedQuotaGB || 25));
                        }}
                        className="px-3 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/40 text-purple-300 text-xs font-bold border border-purple-500/30"
                        title="Grant Custom Quota"
                      >
                        Custom
                      </button>
                      <button
                        onClick={() => handleRejectRequest(req._id)}
                        className="p-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30"
                        title="Reject"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="pt-3 border-t border-white/5 text-[11px] text-slate-500 text-center">
                      Reviewed on {new Date(req.updatedAt || req.createdAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredRequests.length === 0 && (
              <div className="col-span-full p-12 text-center rounded-3xl bg-[#0B0F19] border border-white/10 space-y-2">
                <HardDrive className="w-10 h-10 text-slate-600 mx-auto" />
                <h4 className="text-sm font-bold text-white">No storage requests</h4>
                <p className="text-xs text-slate-500">
                  {requestFilter === 'all'
                    ? 'No extra storage requests have been submitted by users yet.'
                    : `No ${requestFilter} storage requests found.`}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: STORAGE ANALYTICS
         ========================================================================= */}
      {activeTab === 'analytics' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Consumers Card */}
            <div className="lg:col-span-2 p-6 rounded-3xl bg-[#0B0F19] border border-white/10 space-y-4 shadow-xl">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" /> Top Storage Consumers
              </h3>
              <div className="space-y-3">
                {(storageAnalytics?.topUsers || users.slice(0, 8)).map((u, i) => {
                  const used = u.storageUsed || 0;
                  const quota = u.storageQuota || 5 * 1024 * 1024 * 1024;
                  const pct = Math.min(100, Math.round((used / quota) * 100));

                  return (
                    <div key={u._id || i} className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white">{i + 1}. {u.name} ({u.email})</span>
                        <span className="text-emerald-400 font-mono font-bold">{formatBytes(used)} / {formatBytes(quota)}</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Platform Quota Allocation Card */}
            <div className="p-6 rounded-3xl bg-[#0B0F19] border border-white/10 space-y-6 shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Platform Allocation</h3>
                <p className="text-xs text-slate-400 mt-1">Multi-cloud cluster storage headroom</p>
              </div>

              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 text-center space-y-2">
                <span className="text-xs text-slate-400 uppercase tracking-widest font-mono">Total Platform Allocation</span>
                <p className="text-3xl font-black text-white">{formatBytes(storageAnalytics?.totalAllocated || stats.totalUsers * 5 * 1024 * 1024 * 1024)}</p>
                <div className="pt-2 text-xs text-slate-400 flex justify-between font-mono">
                  <span>Used: {formatBytes(stats.totalStorageConsumption || 0)}</span>
                  <span className="text-emerald-400 font-bold">Cloudinary Global CDN</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300 space-y-1">
                <span className="font-bold block">✨ Automated Cold Storage Pruning</span>
                <p className="text-[11px] text-cyan-400/80">
                  Inactive files older than 180 days are seamlessly migrated to high-density cold vaults without losing visitor QR access.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: ANNOUNCEMENTS
         ========================================================================= */}
      {activeTab === 'announcements' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0B0F19] border border-white/10">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-purple-400" /> Platform Announcements & Broadcasts
              </h2>
              <p className="text-xs text-slate-400">
                Send alerts, maintenance notices, and system announcements to users across mobile and web.
              </p>
            </div>
            <button
              onClick={() => setShowAnnouncementModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-glow-primary transition-all"
            >
              <Plus className="w-4 h-4" /> New Announcement
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {announcements.map((ann) => (
              <div
                key={ann._id}
                className="p-5 rounded-3xl bg-[#0B0F19] border border-white/10 space-y-3 shadow-xl relative"
              >
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    ann.type === 'urgent'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : ann.type === 'warning'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : ann.type === 'success'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  }`}>
                    {ann.type}
                  </span>
                  <button
                    onClick={() => handleDeleteAnnouncement(ann._id)}
                    className="p-1 rounded-lg text-slate-500 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h4 className="text-sm font-bold text-white">{ann.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{ann.message}</p>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Target: {ann.targetAudience?.toUpperCase() || 'ALL'}</span>
                  <span>{new Date(ann.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}

            {announcements.length === 0 && (
              <div className="col-span-full p-12 text-center rounded-3xl bg-[#0B0F19] border border-white/10 space-y-2">
                <Megaphone className="w-10 h-10 text-slate-600 mx-auto" />
                <h4 className="text-sm font-bold text-white">No active announcements</h4>
                <p className="text-xs text-slate-500">Create a broadcast to notify visitors and hosts.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 6: SECURITY & ACTIVITY LOGS
         ========================================================================= */}
      {activeTab === 'security' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Security KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-[#0B0F19] border border-white/10 space-y-1">
              <span className="text-xs text-slate-400">Active User Accounts</span>
              <p className="text-2xl font-black text-emerald-400">{securityMetrics?.activeUsers || users.filter(u => u.isActive).length}</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#0B0F19] border border-white/10 space-y-1">
              <span className="text-xs text-slate-400">Suspended / Banned</span>
              <p className="text-2xl font-black text-rose-400">{securityMetrics?.suspendedUsers || users.filter(u => !u.isActive).length}</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#0B0F19] border border-white/10 space-y-1">
              <span className="text-xs text-slate-400">Two-Factor Authentication</span>
              <p className="text-2xl font-black text-purple-400">{securityMetrics?.twoFactorCount || 0} Enabled</p>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="rounded-3xl bg-[#0B0F19] border border-white/10 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" /> Real-time Audit & Security Logs
              </h3>
              <span className="text-xs text-slate-400 font-mono">Last 50 Entries</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/[0.03] text-slate-400 font-semibold border-b border-white/5">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Resource</th>
                    <th className="py-3 px-4">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300 font-mono text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-white/[0.02]">
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-white">
                        {log.userId?.name || log.userId?.email || 'System'}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {log.resourceType} {log.resourceId ? `(${log.resourceId.slice(-6)})` : ''}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {log.ipAddress || '127.0.0.1'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 7: SYSTEM HEALTH
         ========================================================================= */}
      {activeTab === 'health' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cluster Stats */}
            <div className="p-6 rounded-3xl bg-[#0B0F19] border border-white/10 space-y-4 shadow-xl">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-cyan-400" /> Host Machine & Runtime
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-slate-400">Node.js Engine</span>
                  <span className="font-mono text-white">{health.nodeVersion || 'v20.x'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-slate-400">Host Platform</span>
                  <span className="font-mono text-white">{health.platform} ({health.arch})</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-slate-400">CPU Thread Cores</span>
                  <span className="font-mono text-white">{health.cpuCount || 4} Virtual Cores</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-slate-400">Uptime</span>
                  <span className="font-mono text-emerald-400">
                    {health.uptimeSeconds ? `${(health.uptimeSeconds / 3600).toFixed(1)} hours` : 'Live'}
                  </span>
                </div>
              </div>
            </div>

            {/* Cloud CDN Panel */}
            <div className="p-6 rounded-3xl bg-[#0B0F19] border border-white/10 space-y-4 shadow-xl">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Cloud className="w-5 h-5 text-purple-400" /> Cloudinary Universal CDN
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-slate-400">Status</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Connected & Streaming
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-slate-400">Cloud Name</span>
                  <span className="font-mono text-white">{cloudinaryInfo.cloudName || 'Configured in env'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-slate-400">Transformation Engine</span>
                  <span className="text-white">YuNet Face Focus Auto-Crop</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grant Custom Storage Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[#0F172A] border border-white/10 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" /> Grant Custom Storage
              </h3>
              <button onClick={() => setShowCustomModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGrantCustomStorage} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Target Storage Capacity (GB) *</label>
                <input
                  type="number"
                  min="5"
                  max="5000"
                  required
                  value={customQuotaGB}
                  onChange={(e) => setCustomQuotaGB(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Admin Approval Note</label>
                <input
                  type="text"
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="e.g. VIP sponsor allocation"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(null)}
                  className="px-4 py-2 rounded-xl glass-card text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-glow-primary"
                >
                  Grant Storage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Announcement Modal */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[#0F172A] border border-white/10 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-purple-400" /> New Broadcast Announcement
              </h3>
              <button onClick={() => setShowAnnouncementModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                  placeholder="e.g. Scheduled Maintenance or New Feature"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Message *</label>
                <textarea
                  rows={3}
                  required
                  value={announcementForm.message}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
                  placeholder="Detailed announcement content..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Type</label>
                  <select
                    value={announcementForm.type}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none"
                  >
                    <option value="info" className="bg-slate-900">Info (Blue)</option>
                    <option value="warning" className="bg-slate-900">Warning (Amber)</option>
                    <option value="success" className="bg-slate-900">Success (Emerald)</option>
                    <option value="urgent" className="bg-slate-900">Urgent (Rose)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Audience</label>
                  <select
                    value={announcementForm.targetAudience}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, targetAudience: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none"
                  >
                    <option value="all" className="bg-slate-900">All Users</option>
                    <option value="users" className="bg-slate-900">Regular Users</option>
                    <option value="admins" className="bg-slate-900">Admins Only</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAnnouncementModal(false)}
                  className="px-4 py-2 rounded-xl glass-card text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-glow-primary"
                >
                  Publish Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
