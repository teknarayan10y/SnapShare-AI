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
  MemoryStick,
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
} from 'lucide-react';

export const AdminDashboard = () => {
  const { showToast, toast } = useToast();
  const notify = (msg, type = 'success') => {
    if (toast?.[type]) toast[type](msg);
    else if (showToast) showToast(msg, type);
  };

  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');

  const fetchOverview = async () => {
    try {
      const res = await adminAPI.getOverview();
      if (res.data.success) setOverview(res.data);
    } catch (err) {
      console.error('Admin overview error:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await adminAPI.getUsers({ search: userSearch });
      if (res.data.success) setUsers(res.data.users);
    } catch (err) {
      console.error('Admin users error:', err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await adminAPI.getAuditLogs({ limit: 40 });
      if (res.data.success) setAuditLogs(res.data.logs);
    } catch (err) {
      console.error('Admin audit log error:', err);
    }
  };

  const loadAll = async () => {
    setRefreshing(true);
    await Promise.all([fetchOverview(), fetchUsers(), fetchAuditLogs()]);
    setRefreshing(false);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadAll();
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
  }, [userSearch, activeTab]);

  const handleToggleUser = async (userId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      await adminAPI.updateUser(userId, { isActive: newStatus });
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, isActive: newStatus } : u))
      );
      notify(newStatus ? 'User account reactivated' : 'User account suspended', 'info');
      fetchOverview();
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
      notify(`Role updated to ${newRole.toUpperCase()} successfully!`, 'success');
      fetchOverview();
    } catch (err) {
      notify('Failed to change user role', 'error');
    }
  };

  const handleChangePlan = async (userId, currentPlan) => {
    const planOptions = ['free', 'pro', 'enterprise'];
    const nextPlan = planOptions[(planOptions.indexOf(currentPlan) + 1) % planOptions.length];
    try {
      await adminAPI.updateUser(userId, { plan: nextPlan });
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, plan: nextPlan } : u))
      );
      notify(`User subscription upgraded to ${nextPlan.toUpperCase()}`, 'success');
      fetchOverview();
    } catch (err) {
      notify('Failed to change subscription plan', 'error');
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(userSearch.toLowerCase());
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && u.isActive) ||
        (statusFilter === 'suspended' && !u.isActive);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, userSearch, roleFilter, statusFilter]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-rose-400 font-mono tracking-widest uppercase animate-pulse">
          Initializing Secure Admin Console...
        </p>
      </div>
    );
  }

  const stats = overview?.stats || {};
  const health = overview?.systemHealth || {};
  const logs = auditLogs.length > 0 ? auditLogs : overview?.recentAuditLogs || [];
  const cloudinaryInfo = overview?.cloudinary || {};

  const memPercent = health.totalMemoryBytes
    ? Math.round(((health.totalMemoryBytes - health.freeMemoryBytes) / health.totalMemoryBytes) * 100)
    : 0;

  const tabs = [
    { id: 'overview', label: 'Command Center', icon: Zap },
    { id: 'users', label: `Users (${users.length})`, icon: Users },
    { id: 'audit', label: 'Security Logs', icon: Terminal },
    { id: 'health', label: 'Hardware & Cloud', icon: Cpu },
  ];

  return (
    <div className="space-y-8 animate-in fade-in pb-16 max-w-7xl mx-auto">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-rose-950/40 via-purple-950/30 to-[#080B14] border border-rose-500/20 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600 via-purple-600 to-cyan-500 p-[1.5px] shadow-glow-primary">
              <div className="w-full h-full bg-[#080B14] rounded-[14px] flex items-center justify-center">
                <ShieldCheck className="w-7 h-7 text-rose-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  SnapShare <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-purple-400">Master Console</span>
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  ROOT PRIVILEGES
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live Node.js Cluster · MongoDB Connected · Universal Object Storage Ready
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Cloudinary Live Badge */}
            <div className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
              cloudinaryInfo.isConfigured
                ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
            }`}>
              <Cloud className="w-4 h-4" />
              {cloudinaryInfo.isConfigured ? (
                <span>Cloudinary Connected <span className="opacity-60 text-[10px]">({cloudinaryInfo.cloudName})</span></span>
              ) : (
                <span>Storage: Local Mode</span>
              )}
            </div>

            <button
              onClick={loadAll}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition-all active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-rose-400' : ''}`} />
              Sync Metrics
            </button>
          </div>
        </div>
      </div>

      {/* Futuristic Navigation Tabs */}
      <div className="flex gap-2 p-1.5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-rose-600 to-purple-600 text-white shadow-lg shadow-rose-900/40'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: Platform Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Registered Users', value: stats.totalUsers || 0, icon: Users, gradient: 'from-purple-500/20 to-purple-500/5', color: 'text-purple-400' },
              { label: 'Total Collections', value: stats.totalCollections || 0, icon: FolderOpen, gradient: 'from-cyan-500/20 to-cyan-500/5', color: 'text-cyan-400' },
              { label: 'Cloud Files', value: stats.totalFiles || 0, icon: Files, gradient: 'from-amber-500/20 to-amber-500/5', color: 'text-amber-400' },
              { label: 'Storage Consumed', value: formatBytes(stats.totalStorageConsumption || 0), icon: HardDrive, gradient: 'from-rose-500/20 to-rose-500/5', color: 'text-rose-400' },
              { label: 'Total Downloads', value: stats.totalDownloads || 0, icon: Download, gradient: 'from-emerald-500/20 to-emerald-500/5', color: 'text-emerald-400' },
              { label: 'Active Subs', value: stats.activeSubscriptions || 0, icon: CreditCard, gradient: 'from-indigo-500/20 to-indigo-500/5', color: 'text-indigo-400' },
            ].map((card, idx) => {
              const Icon = card.icon;
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl bg-gradient-to-br ${card.gradient} border border-white/10 space-y-2 backdrop-blur-sm transition-transform hover:-translate-y-1 duration-200`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-400 truncate">{card.label}</span>
                    <Icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-white">{card.value}</p>
                </div>
              );
            })}
          </div>

          {/* Quick Storage & Cloudinary Status Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cloudinary Universal Storage Panel */}
            <div className="lg:col-span-2 glass-panel p-6 sm:p-7 rounded-3xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                    <Cloud className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Universal Cloud Storage Engine</h3>
                    <p className="text-xs text-slate-400">Stores Images, Videos, Audio, PDFs, Office Documents & Archives</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                  cloudinaryInfo.isConfigured
                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                }`}>
                  {cloudinaryInfo.isConfigured ? 'CLOUDINARY ACTIVE' : 'LOCAL FALLBACK'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {[
                  { name: 'Images', formats: 'JPG, PNG, WEBP, GIF, SVG', color: 'text-purple-400' },
                  { name: 'Videos', formats: 'MP4, MOV, WEBM, MKV', color: 'text-rose-400' },
                  { name: 'Audio', formats: 'MP3, WAV, AAC, FLAC', color: 'text-cyan-400' },
                  { name: 'Documents', formats: 'PDF, DOCX, XLSX, ZIP, CODE', color: 'text-emerald-400' },
                ].map((item, i) => (
                  <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                    <span className={`text-xs font-bold ${item.color}`}>{item.name}</span>
                    <p className="text-[10px] text-slate-400 truncate">{item.formats}</p>
                  </div>
                ))}
              </div>

              {!cloudinaryInfo.isConfigured && (
                <div className="p-3 rounded-xl bg-purple-900/20 border border-purple-500/30 text-xs text-purple-300 flex items-center justify-between">
                  <span>To connect Cloudinary, enter your API credentials in <code className="font-mono bg-black/40 px-1.5 py-0.5 rounded text-white">backend/.env</code></span>
                  <a
                    href="https://cloudinary.com/console"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 font-bold text-cyan-400 hover:underline shrink-0 ml-3"
                  >
                    Cloudinary Console <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            {/* Quick Actions Panel */}
            <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/10 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-rose-400" />
                Quick Admin Actions
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => setActiveTab('users')}
                  className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-slate-200 font-semibold flex items-center justify-between transition-colors"
                >
                  <span>Manage User Roles & Permissions</span>
                  <Users className="w-4 h-4 text-purple-400" />
                </button>
                <button
                  onClick={() => setActiveTab('audit')}
                  className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-slate-200 font-semibold flex items-center justify-between transition-colors"
                >
                  <span>Inspect Audit & Access Logs</span>
                  <Terminal className="w-4 h-4 text-cyan-400" />
                </button>
                <button
                  onClick={() => setActiveTab('health')}
                  className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-slate-200 font-semibold flex items-center justify-between transition-colors"
                >
                  <span>Check Node & Memory Diagnostics</span>
                  <Cpu className="w-4 h-4 text-emerald-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Recent Audit Logs Terminal Stream */}
          <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Live Platform Activity Stream</h3>
              </div>
              <button
                onClick={() => setActiveTab('audit')}
                className="text-xs font-semibold text-rose-400 hover:underline"
              >
                View all logs →
              </button>
            </div>

            <div className="space-y-2 font-mono text-xs max-h-64 overflow-y-auto pr-1">
              {logs.slice(0, 8).map((log, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5 hover:border-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span className="font-bold text-purple-300">{log.action}</span>
                    <span className="text-slate-400 text-[11px] truncate">
                      {log.userId?.email ? `by ${log.userId.email}` : 'System Agent'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0 ml-4 font-sans">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
              {logs.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-6 font-sans">No security events logged yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Advanced User Management */}
      {activeTab === 'users' && (
        <div className="space-y-5">
          {/* Controls Bar: Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name or email address..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-all"
              />
            </div>

            <div className="flex gap-2 items-center flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Filter className="w-3.5 h-3.5" />
                <span>Role:</span>
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-rose-500"
              >
                <option value="all" className="bg-[#111827]">All Roles</option>
                <option value="admin" className="bg-[#111827]">Admins Only</option>
                <option value="user" className="bg-[#111827]">Standard Users</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-rose-500"
              >
                <option value="all" className="bg-[#111827]">All Statuses</option>
                <option value="active" className="bg-[#111827]">Active</option>
                <option value="suspended" className="bg-[#111827]">Suspended</option>
              </select>
            </div>
          </div>

          {/* User Table */}
          <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-white/[0.04] text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-white/5">
                    <th className="text-left p-4">User Details</th>
                    <th className="text-left p-4">Role (Click to Toggle)</th>
                    <th className="text-left p-4">Plan</th>
                    <th className="text-right p-4">Storage Used</th>
                    <th className="text-center p-4">Status</th>
                    <th className="text-center p-4">Access Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredUsers.map((u) => (
                    <tr key={u._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatar || `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(u.name)}`}
                            alt={u.name}
                            className="w-9 h-9 rounded-full object-cover border border-white/10 shrink-0"
                          />
                          <div>
                            <p className="font-bold text-white text-sm">{u.name}</p>
                            <p className="text-slate-400 text-xs font-mono">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role Toggle Pill */}
                      <td className="p-4">
                        <button
                          onClick={() => handleChangeRole(u._id, u.role)}
                          title="Click to toggle between Admin and User role"
                          className={`group px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            u.role === 'admin'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 shadow-glow-primary'
                              : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'
                          }`}
                        >
                          <ShieldCheck className={`w-3.5 h-3.5 ${u.role === 'admin' ? 'text-rose-400' : 'text-slate-500'}`} />
                          <span className="uppercase tracking-wider">{u.role}</span>
                          <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity text-slate-400">⇄</span>
                        </button>
                      </td>

                      {/* Plan Switcher */}
                      <td className="p-4">
                        <button
                          onClick={() => handleChangePlan(u._id, u.plan)}
                          title="Click to cycle plan (Free -> Pro -> Enterprise)"
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase bg-purple-500/10 text-purple-300 border border-purple-500/20 hover:bg-purple-500/20 transition-all"
                        >
                          {u.plan}
                        </button>
                      </td>

                      <td className="p-4 text-right font-mono text-slate-300">
                        {formatBytes(u.storageUsed || 0)}
                      </td>

                      <td className="p-4 text-center">
                        {u.isActive ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-400 font-semibold text-xs">
                            <XCircle className="w-3.5 h-3.5" /> Suspended
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleToggleUser(u._id, u.isActive)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            u.isActive
                              ? 'bg-red-500/10 hover:bg-red-500/25 text-red-400 border border-red-500/20'
                              : 'bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {u.isActive ? 'Suspend' : 'Reactivate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-slate-500 space-y-2">
                        <UserX className="w-8 h-8 mx-auto text-slate-600" />
                        <p className="text-sm font-semibold">No users matching search filters</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Full Audit Log */}
      {activeTab === 'audit' && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">System Security & Audit Trail</h3>
              <p className="text-xs text-slate-400">Cryptographic audit records of all user and administrative actions</p>
            </div>
            <button
              onClick={fetchAuditLogs}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 border border-white/10"
            >
              Refresh Logs
            </button>
          </div>

          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1 font-mono text-xs">
            {auditLogs.map((log, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-black/40 border border-white/5 hover:border-purple-500/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {log.action}
                  </span>
                  <span className="text-slate-300 text-xs font-sans">
                    {log.resourceType}: <span className="font-mono text-slate-400">{log.resourceId?.slice(-8) || 'N/A'}</span>
                  </span>
                  <span className="text-slate-400 text-xs font-sans truncate">
                    by {log.userId?.email || 'System'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-500 font-sans">
                  {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                  <span>{new Date(log.timestamp).toLocaleString()}</span>
                </div>
              </div>
            ))}
            {auditLogs.length === 0 && (
              <p className="text-xs text-slate-500 py-12 text-center font-sans">No audit records logged yet.</p>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Hardware & Cloud Infrastructure */}
      {activeTab === 'health' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Node.js Server Runtime */}
          <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/10 space-y-5">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white">Server & V8 Runtime</h3>
            </div>
            <div className="space-y-3 text-xs">
              {[
                { label: 'Node.js Version', value: health.nodeVersion || 'N/A' },
                { label: 'Operating Platform', value: `${health.platform || 'N/A'} (${health.arch || 'N/A'})` },
                { label: 'CPU Processor Cores', value: `${health.cpuCount || 'N/A'} Virtual Cores` },
                { label: 'System Uptime', value: `${Math.floor((health.uptimeSeconds || 0) / 3600)}h ${Math.floor(((health.uptimeSeconds || 0) % 3600) / 60)}m ${Math.floor((health.uptimeSeconds || 0) % 60)}s` },
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-slate-400 font-medium">{item.label}</span>
                  <span className="font-bold text-white font-mono">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Memory & Cloud Diagnostic */}
          <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/10 space-y-5">
            <div className="flex items-center gap-2">
              <MemoryStick className="w-5 h-5 text-purple-400" />
              <h3 className="text-base font-bold text-white">System Memory & Storage Health</h3>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-2">
                  <span className="text-slate-400">Physical Host RAM Usage</span>
                  <span className="text-purple-400 font-mono">{memPercent}% Allocated</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-rose-500 rounded-full transition-all duration-500"
                    style={{ width: `${memPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                  <span>Free: {formatBytes(health.freeMemoryBytes || 0)}</span>
                  <span>Total: {formatBytes(health.totalMemoryBytes || 0)}</span>
                </div>
              </div>

              {/* Cloudinary Integration Status */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Cloud className="w-4 h-4 text-cyan-400" />
                    Cloudinary Universal Object Storage
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    cloudinaryInfo.isConfigured ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {cloudinaryInfo.isConfigured ? 'CONNECTED' : 'LOCAL BACKUP'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {cloudinaryInfo.isConfigured
                    ? `Ready to stream all file binaries (images, videos, audio, documents, archives, code) directly from cloud CDN.`
                    : `Running on local storage folder (backend/uploads). To enable Cloudinary globally, set keys in backend/.env.`}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
