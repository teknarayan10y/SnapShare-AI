import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import {
  BarChart3,
  Scan,
  Eye,
  Download,
  Smartphone,
  Monitor,
  Tablet,
  TrendingUp,
  FolderOpen,
  Calendar,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AnalyticsDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const res = await analyticsAPI.getDashboard();
      if (res.data.success) setData(res.data);
    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stats = data?.stats || {};
  const distribution = data?.distribution || [];
  const dailyActivity = data?.dailyActivity || [];
  const deviceBreakdown = data?.deviceBreakdown || [];
  const recentCollections = data?.recentCollections || [];

  const maxDailyCount = Math.max(...dailyActivity.map((d) => d.count), 1);

  const deviceIcons = { desktop: Monitor, mobile: Smartphone, tablet: Tablet, unknown: Monitor };

  const categoryColors = {
    image: 'bg-purple-500',
    video: 'bg-rose-500',
    audio: 'bg-cyan-500',
    document: 'bg-amber-500',
    archive: 'bg-orange-500',
    code: 'bg-emerald-500',
    other: 'bg-slate-500',
  };

  return (
    <div className="space-y-8 animate-in fade-in pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Analytics Dashboard</h1>
          <p className="text-xs text-slate-400">Privacy-compliant performance tracking across all your collections.</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl glass-card hover:border-purple-500/40 text-xs font-semibold text-slate-300"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-purple-400' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl glass-card border border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Scans</span>
            <Scan className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-extrabold text-white">{stats.totalScans || 0}</p>
          <p className="text-[11px] text-amber-400">QR code interactions</p>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Views</span>
            <Eye className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-3xl font-extrabold text-white">{stats.totalViews || 0}</p>
          <p className="text-[11px] text-cyan-400">Unique page visits</p>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Downloads</span>
            <Download className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-3xl font-extrabold text-white">{stats.totalDownloads || 0}</p>
          <p className="text-[11px] text-rose-400">Files & ZIP archives</p>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Collections</span>
            <FolderOpen className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-3xl font-extrabold text-white">{stats.totalCollections || 0}</p>
          <p className="text-[11px] text-purple-400">Active vaults</p>
        </div>
      </div>

      {/* Daily Activity Chart + Device Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Bar Chart: Daily Upload Activity */}
        <div className="lg:col-span-8 glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm font-bold text-white">7-Day Upload Activity</h3>
            </div>
            <span className="text-xs text-slate-400">Files uploaded per day</span>
          </div>

          {dailyActivity.length > 0 ? (
            <div className="flex items-end justify-between gap-2 h-40">
              {dailyActivity.map((day, idx) => {
                const barHeight = Math.max(8, Math.round((day.count / maxDailyCount) * 100));
                const date = new Date(day._id);
                const label = date.toLocaleDateString('en', { weekday: 'short' });
                return (
                  <div key={idx} className="flex flex-col items-center gap-1 flex-1">
                    <span className="text-[10px] font-mono text-slate-400">{day.count}</span>
                    <div
                      className="w-full bg-gradient-to-t from-purple-600 to-indigo-400 rounded-t-lg transition-all hover:from-purple-500 hover:to-cyan-400 cursor-default"
                      style={{ height: `${barHeight}%` }}
                      title={`${day.count} files on ${day._id}`}
                    />
                    <span className="text-[10px] text-slate-500">{label}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-xs text-slate-500">
              <div className="text-center space-y-2">
                <BarChart3 className="w-8 h-8 text-slate-700 mx-auto" />
                <p>Upload files to see activity chart</p>
              </div>
            </div>
          )}
        </div>

        {/* Device Breakdown */}
        <div className="lg:col-span-4 glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Device Breakdown</h3>
          </div>

          {deviceBreakdown.length > 0 ? (
            <div className="space-y-3">
              {deviceBreakdown.map((item, idx) => {
                const Icon = deviceIcons[item.device] || Monitor;
                const totalEvents = deviceBreakdown.reduce((acc, d) => acc + d.count, 0);
                const pct = Math.round((item.count / (totalEvents || 1)) * 100);
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 font-semibold text-slate-200">
                        <Icon className="w-3.5 h-3.5 text-cyan-400" />
                        {item.device.charAt(0).toUpperCase() + item.device.slice(1)}
                      </span>
                      <span className="text-slate-400">{item.count} visits ({pct}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Smartphone className="w-10 h-10 text-slate-700 mx-auto" />
              <p className="text-xs text-slate-500 mt-2">No visitor data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* File Category Distribution */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-purple-400" />
          <h3 className="text-sm font-bold text-white">Content Category Distribution</h3>
        </div>

        {distribution.length > 0 ? (
          <div className="space-y-3">
            {distribution.map((item, idx) => {
              const totalFiles = distribution.reduce((acc, d) => acc + d.count, 0);
              const pct = Math.round((item.count / (totalFiles || 1)) * 100);
              const colorClass = categoryColors[item.category] || 'bg-slate-500';
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-200 capitalize">{item.category}</span>
                    <span className="text-slate-400">
                      {item.count} files • {formatBytes(item.totalBytes)} • {pct}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colorClass} rounded-full transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-500 py-4">Upload files to see category distribution.</p>
        )}
      </div>

      {/* Top Performing Collections Table */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Collection Performance</h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/5 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="text-left pb-3 font-bold">Collection</th>
                <th className="text-right pb-3 font-bold">Scans</th>
                <th className="text-right pb-3 font-bold">Views</th>
                <th className="text-right pb-3 font-bold">Downloads</th>
                <th className="text-right pb-3 font-bold">Files</th>
                <th className="text-right pb-3 font-bold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recentCollections.map((c) => (
                <tr key={c._id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 font-semibold text-slate-200 max-w-xs truncate pr-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                      {c.title}
                    </div>
                  </td>
                  <td className="py-3 text-right text-amber-400 font-mono">{c.scanCount || 0}</td>
                  <td className="py-3 text-right text-cyan-400 font-mono">{c.viewsCount || 0}</td>
                  <td className="py-3 text-right text-rose-400 font-mono">{c.downloadCount || 0}</td>
                  <td className="py-3 text-right text-slate-300 font-mono">{c.totalFiles || 0}</td>
                  <td className="py-3 text-right">
                    <Link
                      to={`/dashboard/collections/${c._id}`}
                      className="text-purple-400 hover:text-purple-300 flex items-center gap-0.5 justify-end"
                    >
                      View <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
              {recentCollections.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No collection analytics data yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
