import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { analyticsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FileCard } from '../components/FileCard';
import { FilePreviewModal } from '../components/FilePreviewModal';
import { QRShareModal } from '../components/QRShareModal';
import {
  FolderOpen,
  Files,
  HardDrive,
  QrCode,
  Scan,
  Download,
  UploadCloud,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Sparkles,
  PieChart,
} from 'lucide-react';

export const DashboardOverview = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState(null);
  const [shareCollection, setShareCollection] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await analyticsAPI.getDashboard();
        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

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
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-400">Loading your SnapShare dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {
    totalCollections: 0,
    totalFiles: 0,
    storageUsed: 0,
    storageQuota: 5368709120,
    activeQRCodes: 0,
    totalScans: 0,
    totalDownloads: 0,
  };

  const storageUsedMB = Math.round(stats.storageUsed / (1024 * 1024));
  const storageQuotaMB = Math.round(stats.storageQuota / (1024 * 1024));
  const storagePercent = Math.min(100, Math.round((stats.storageUsed / (stats.storageQuota || 1)) * 100));

  return (
    <div className="space-y-8 animate-in fade-in pb-12">
      {/* Top Banner / Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 shadow-xl relative overflow-hidden">
        <div className="space-y-1 z-10">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            Universal Cloud Vault
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Welcome back, {user?.name || 'Creator'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Monitor collection performance, generate dynamic QR codes, and manage your cloud storage.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10 shrink-0">
          <Link
            to="/dashboard/upload"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-glow-primary transition-all"
          >
            <UploadCloud className="w-4 h-4" /> Quick Upload
          </Link>
          <Link
            to="/dashboard/collections/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass-card hover:border-purple-500/40 text-slate-200 text-xs font-semibold transition-all"
          >
            <Plus className="w-4 h-4" /> New Collection
          </Link>
        </div>
      </div>

      {/* 6 OVERVIEW METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Collections */}
        <div className="p-4 rounded-2xl glass-card border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Collections</span>
            <FolderOpen className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">{stats.totalCollections}</p>
          <p className="text-[10px] text-slate-400">Organized vaults</p>
        </div>

        {/* Total Uploaded Files */}
        <div className="p-4 rounded-2xl glass-card border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Total Files</span>
            <Files className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">{stats.totalFiles}</p>
          <p className="text-[10px] text-slate-400">Across all collections</p>
        </div>

        {/* Storage Used */}
        <div className="p-4 rounded-2xl glass-card border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Storage</span>
            <HardDrive className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">{formatBytes(stats.storageUsed)}</p>
          <p className="text-[10px] text-purple-400 font-semibold">{storagePercent}% of {formatBytes(stats.storageQuota)}</p>
        </div>

        {/* Active QR Codes */}
        <div className="p-4 rounded-2xl glass-card border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Active QRs</span>
            <QrCode className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">{stats.activeQRCodes}</p>
          <p className="text-[10px] text-emerald-400">Dynamic & live</p>
        </div>

        {/* Total Scans */}
        <div className="p-4 rounded-2xl glass-card border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Total Scans</span>
            <Scan className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">{stats.totalScans}</p>
          <p className="text-[10px] text-slate-400">Smartphone scans</p>
        </div>

        {/* Total Downloads */}
        <div className="p-4 rounded-2xl glass-card border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Downloads</span>
            <Download className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">{stats.totalDownloads}</p>
          <p className="text-[10px] text-slate-400">Files & bulk ZIPs</p>
        </div>
      </div>

      {/* STORAGE & FILE-TYPE DISTRIBUTION SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Storage Bar & Visual Meter */}
        <div className="lg:col-span-6 glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm font-bold text-white">Storage Capacity Utilization</h3>
            </div>
            <Link to="/dashboard/storage" className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1">
              Manage <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span>{storageUsedMB} MB Used</span>
              <span>{storageQuotaMB} MB Free Tier Quota</span>
            </div>
            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 rounded-full transition-all duration-500 shadow-glow-primary"
                style={{ width: `${storagePercent}%` }}
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-white/5">
            <span>Fast multi-cloud storage powered by S3 & R2</span>
            <Link to="/pricing" className="text-cyan-400 hover:text-cyan-300 font-bold">
              Upgrade Storage →
            </Link>
          </div>
        </div>

        {/* File Type Distribution */}
        <div className="lg:col-span-6 glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Content Category Distribution</h3>
            </div>
            <span className="text-xs text-slate-400">{data?.distribution?.length || 0} Categories</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(data?.distribution || []).map((item, idx) => (
              <div key={idx} className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                <p className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">
                  {item.category}
                </p>
                <p className="text-base font-extrabold text-white">{item.count} files</p>
                <p className="text-[10px] text-slate-400">{formatBytes(item.totalBytes)}</p>
              </div>
            ))}
            {(!data?.distribution || data.distribution.length === 0) && (
              <p className="col-span-full text-xs text-slate-500 py-3 text-center">
                Upload files to view category distribution breakdown.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* RECENT COLLECTIONS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-bold text-white">Recent Collections</h3>
          </div>
          <Link to="/dashboard/collections" className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1">
            View All Collections <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(data?.recentCollections || []).map((c) => (
            <div
              key={c._id}
              className="p-5 rounded-3xl glass-card border border-white/5 space-y-4 hover:border-purple-500/30 transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                    {c.category}
                  </span>
                  <span className="text-slate-400">{c.totalFiles || 0} files</span>
                </div>
                <h4 className="text-base font-bold text-white truncate">{c.title}</h4>
                <p className="text-xs text-slate-400 line-clamp-2">{c.description || 'No description provided'}</p>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 text-slate-400">
                  <span className="flex items-center gap-1">
                    <Scan className="w-3.5 h-3.5 text-amber-400" /> {c.scanCount || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Download className="w-3.5 h-3.5 text-rose-400" /> {c.downloadCount || 0}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShareCollection(c)}
                    className="p-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30"
                    title="Share & QR Code"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                  <Link
                    to={`/dashboard/collections/${c._id}`}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 font-semibold"
                  >
                    Manage
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {(!data?.recentCollections || data.recentCollections.length === 0) && (
            <div className="col-span-full p-8 rounded-3xl glass-panel text-center space-y-3">
              <FolderOpen className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">No collections created yet</p>
              <Link
                to="/dashboard/collections/new"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold"
              >
                <Plus className="w-4 h-4" /> Create First Collection
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* RECENT UPLOADS GRID */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Files className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Recent Uploads</h3>
          </div>
          <Link to="/dashboard/upload" className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1">
            Upload More <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {(data?.recentFiles || []).map((file) => (
            <FileCard
              key={file._id}
              file={file}
              onPreview={(f) => setPreviewFile(f)}
              showActions={false}
            />
          ))}

          {(!data?.recentFiles || data.recentFiles.length === 0) && (
            <div className="col-span-full p-8 rounded-3xl glass-panel text-center space-y-2">
              <UploadCloud className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs font-semibold text-slate-400">No files uploaded yet</p>
            </div>
          )}
        </div>
      </div>

      {/* File Preview Modal */}
      <FilePreviewModal
        file={previewFile}
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
      />

      {/* QR Share Modal */}
      <QRShareModal
        collection={shareCollection}
        isOpen={!!shareCollection}
        onClose={() => setShareCollection(null)}
      />
    </div>
  );
};
