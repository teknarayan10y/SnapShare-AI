import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { publicAPI, downloadAPI } from '../services/api';
import { FileCard } from '../components/FileCard';
import { FilePreviewModal } from '../components/FilePreviewModal';
import { FindMyPhotosModal } from '../components/FindMyPhotosModal';
import { PhotobookModal } from '../components/PhotobookModal';
import {
  QrCode,
  Download,
  Search,
  Filter,
  Grid,
  List,
  Lock,
  Globe,
  Folder,
  Calendar,
  Users,
  CheckCircle2,
  AlertCircle,
  Archive,
  Share2,
  Eye,
  ArrowRight,
  Layers,
  Shield,
  Clock,
  MessageCircle,
  Send,
  Copy,
  Check,
  Camera,
  BookOpen,
} from 'lucide-react';

export const PublicCollectionPage = () => {
  const { shareToken } = useParams();
  const navigate = useNavigate();

  const [collection, setCollection] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProtected, setIsProtected] = useState(false);
  const [unlockToken, setUnlockToken] = useState('');
  const [password, setPassword] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [error, setError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedFileIds, setSelectedFileIds] = useState(new Set());
  const [previewFile, setPreviewFile] = useState(null);
  const [previewIndex, setPreviewIndex] = useState(0);

  const [downloading, setDownloading] = useState(false);
  const [downloadJobId, setDownloadJobId] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [fileSortBy, setFileSortBy] = useState('name_asc');
  const [copied, setCopied] = useState(false);
  const [showFindMyPhotos, setShowFindMyPhotos] = useState(false);
  const [showPhotobook, setShowPhotobook] = useState(false);

  // Record QR scan on first load if ?scan=true
  const isScan = window.location.search.includes('scan=true');

  useEffect(() => {
    fetchPublicCollection();
  }, [shareToken, unlockToken]);

  const fetchPublicCollection = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await publicAPI.getCollection(shareToken, isScan, unlockToken);
      if (res.data.success) {
        setCollection(res.data.collection);
        setIsProtected(res.data.isProtected);
        if (!res.data.isProtected) {
          setFiles(res.data.files || []);
        }
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Collection not found or link has expired.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPassword = async (e) => {
    e.preventDefault();
    setVerifying(true);
    setVerifyError('');
    try {
      const res = await publicAPI.verifyPassword(shareToken, password);
      if (res.data.success) {
        setUnlockToken(res.data.unlockToken);
        setIsProtected(false);
      }
    } catch (err) {
      setVerifyError(err.response?.data?.error || 'Incorrect password. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleToggleSelect = (fileId) => {
    setSelectedFileIds((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) next.delete(fileId);
      else next.add(fileId);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedFileIds.size === filteredFiles.length) {
      setSelectedFileIds(new Set());
    } else {
      setSelectedFileIds(new Set(filteredFiles.map((f) => f._id)));
    }
  };

  const handleBulkDownload = async (fileIds = null) => {
    if (!collection.allowDownloads) return;
    setDownloading(true);
    setDownloadProgress(0);

    try {
      const targetFileIds = fileIds || (selectedFileIds.size > 0 ? Array.from(selectedFileIds) : null);
      const res = await downloadAPI.prepare(collection.id, targetFileIds);
      if (res.data.success) {
        const jobId = res.data.jobId;
        setDownloadJobId(jobId);

        // Poll job status
        const poll = setInterval(async () => {
          try {
            const statusRes = await downloadAPI.getJobStatus(jobId);
            const job = statusRes.data.job;
            setDownloadProgress(job.progress || 0);

            if (job.status === 'completed') {
              clearInterval(poll);
              window.location.href = `/api/downloads/${jobId}/file`;
              setDownloading(false);
            } else if (job.status === 'failed') {
              clearInterval(poll);
              setDownloading(false);
            }
          } catch {
            clearInterval(poll);
            setDownloading(false);
          }
        }, 800);
      }
    } catch (err) {
      setDownloading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: collection?.title,
          text: `Check out "${collection?.title}" on SnapShare!`,
          url: window.location.href,
        });
      } catch {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const filteredFiles = files
    .filter((f) => {
      const matchesSearch = f.originalName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || (f.metadata?.aiCategory || 'other') === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      const nameA = a.originalName || '';
      const nameB = b.originalName || '';
      if (fileSortBy === 'name_asc') {
        return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
      }
      if (fileSortBy === 'name_desc') {
        return nameB.localeCompare(nameA, undefined, { numeric: true, sensitivity: 'base' });
      }
      if (fileSortBy === 'newest') {
        return new Date(b.uploadedAt || b.createdAt || 0) - new Date(a.uploadedAt || a.createdAt || 0);
      }
      if (fileSortBy === 'oldest') {
        return new Date(a.uploadedAt || a.createdAt || 0) - new Date(b.uploadedAt || b.createdAt || 0);
      }
      return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
    });

  const handlePreview = (file) => {
    const idx = filteredFiles.findIndex((f) => f._id === file._id);
    setPreviewIndex(idx);
    setPreviewFile(file);
  };

  const handleNext = () => {
    const nextIdx = (previewIndex + 1) % filteredFiles.length;
    setPreviewIndex(nextIdx);
    setPreviewFile(filteredFiles[nextIdx]);
  };

  const handlePrev = () => {
    const prevIdx = (previewIndex - 1 + filteredFiles.length) % filteredFiles.length;
    setPreviewIndex(prevIdx);
    setPreviewFile(filteredFiles[prevIdx]);
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // ============ LOADING STATE ============
  if (loading) {
    return (
      <div className="min-h-screen bg-[#080B14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-semibold">Loading shared collection...</p>
        </div>
      </div>
    );
  }

  // ============ ERROR STATE ============
  if (error) {
    return (
      <div className="min-h-screen bg-[#080B14] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-5 glass-panel p-10 rounded-3xl border border-red-500/20">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
          <h2 className="text-xl font-extrabold text-white">Collection Not Available</h2>
          <p className="text-sm text-slate-400 leading-relaxed">{error}</p>
          <a href="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-bold">
            Visit SnapShare Home <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  // ============ PASSWORD UNLOCK GATE ============
  if (isProtected && collection) {
    return (
      <div className="min-h-screen bg-[#080B14] flex items-center justify-center px-4">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[500px] h-[400px] bg-purple-700/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-md w-full text-center space-y-6 glass-panel p-10 rounded-3xl border border-purple-500/30 shadow-glow-primary relative z-10">
          {/* Lock Icon */}
          <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500/20 to-purple-600/20 border border-amber-500/30 flex items-center justify-center">
            <Lock className="w-8 h-8 text-amber-400" />
          </div>

          {/* Collection Header */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-2">
              Password Protected Collection
            </div>
            <h2 className="text-2xl font-extrabold text-white">{collection.title}</h2>
            {collection.description && (
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">{collection.description}</p>
            )}
            <div className="flex items-center justify-center gap-4 mt-3 text-xs text-slate-400">
              <span>{collection.totalFiles} files</span>
              <span>•</span>
              <span>{formatBytes(collection.totalSize || 0)}</span>
            </div>
          </div>

          {/* Password Form */}
          <form onSubmit={handleVerifyPassword} className="space-y-4 text-left">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Enter Collection Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Collection password"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:border-purple-500 focus:outline-none"
              />
            </div>

            {verifyError && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                {verifyError}
              </div>
            )}

            <button
              type="submit"
              disabled={verifying}
              className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-glow-primary transition-all flex items-center justify-center gap-2"
            >
              {verifying ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>Unlock Collection <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-[11px] text-slate-500">
            Shared by <strong className="text-slate-300">{collection.owner?.name}</strong> via SnapShare
          </p>
        </div>
      </div>
    );
  }

  // ============ MAIN PUBLIC COLLECTION VIEW ============
  return (
    <div className="min-h-screen bg-[#080B14] text-slate-100 pb-16">
      {/* Background Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-purple-700/15 via-indigo-600/10 to-cyan-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Collection Header Banner */}
      <div className="relative">
        {collection?.coverImage && (
          <div className="h-56 sm:h-72 w-full overflow-hidden relative">
            <img
              src={collection.coverImage}
              alt="Cover"
              className="w-full h-full object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#080B14]/60 to-[#080B14]" />
          </div>
        )}

        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${collection?.coverImage ? '-mt-24 relative z-10' : 'pt-16'}`}>
          {/* Branding strip */}
          <div className="flex items-center justify-between mb-6">
            <a
              href="/"
              className="flex items-center gap-2 text-sm font-bold text-white hover:text-purple-300 transition-colors"
            >
              <QrCode className="w-5 h-5 text-purple-400" />
              SnapShare
            </a>

            {collection?.owner?.branding?.enabled && (
              <div className="flex items-center gap-2">
                {collection.owner.branding.logoUrl && (
                  <img
                    src={collection.owner.branding.logoUrl}
                    alt="Brand Logo"
                    className="h-8 object-contain"
                  />
                )}
                <span className="text-xs font-bold text-slate-200">
                  {collection.owner.branding.companyName}
                </span>
              </div>
            )}
          </div>

          {/* Collection Info */}
          <div className="glass-panel rounded-3xl border border-white/10 p-6 sm:p-10 shadow-2xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="space-y-3 flex-1">
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                    <Globe className="w-3 h-3" /> Public Collection
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/5 text-slate-300 border border-white/10">
                    <Folder className="w-3 h-3" /> {collection?.category}
                  </span>
                  {collection?.eventDate && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/5 text-slate-300 border border-white/10">
                      <Calendar className="w-3 h-3" />
                      {new Date(collection.eventDate).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
                  {collection?.title}
                </h1>

                {collection?.description && (
                  <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
                    {collection.description}
                  </p>
                )}

                {/* Stats Row */}
                <div className="flex flex-wrap items-center gap-5 text-xs font-medium text-slate-400 pt-2 border-t border-white/5">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-purple-400" />
                    {collection?.totalFiles || 0} Files
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Archive className="w-4 h-4 text-cyan-400" />
                    {formatBytes(collection?.totalSize || 0)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-amber-400" />
                    Shared by {collection?.owner?.name}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-400" />
                    {new Date(collection?.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* CTA Buttons */}
              {collection?.allowDownloads && (
                <div className="flex flex-col gap-2 sm:w-56 shrink-0">
                  {/* Feature 1: Find My Photos */}
                  <button
                    onClick={() => setShowFindMyPhotos(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold text-xs transition-all shadow-glow-primary"
                  >
                    <Camera className="w-3.5 h-3.5 text-purple-400" />
                    Find My Photos (Selfie)
                  </button>

                  {/* Feature 6: Curated Photobook */}
                  <button
                    onClick={() => setShowPhotobook(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold text-xs transition-all"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                    View Photobook
                  </button>

                  {/* Download All ZIP */}
                  <button
                    onClick={() => handleBulkDownload(null)}
                    disabled={downloading}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-glow-primary transition-all"
                  >
                    {downloading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Preparing ZIP... {downloadProgress}%
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" /> Download All (ZIP)
                      </>
                    )}
                  </button>

                  {/* Download Selected */}
                  {selectedFileIds.size > 0 && (
                    <button
                      onClick={() => handleBulkDownload(Array.from(selectedFileIds))}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl glass-card hover:border-purple-500/40 text-slate-200 font-semibold text-xs"
                    >
                      <Download className="w-3.5 h-3.5" /> Download Selected ({selectedFileIds.size})
                    </button>
                  )}

                  {/* Share & Copy Link */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopyLink}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl glass-card hover:border-purple-500/40 text-slate-300 text-xs font-semibold"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied' : 'Copy Link'}
                    </button>
                    <button
                      onClick={handleNativeShare}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl glass-card hover:border-purple-500/40 text-slate-300 text-xs font-semibold"
                    >
                      <Share2 className="w-3.5 h-3.5" /> Share
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Files Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-card p-4 rounded-2xl border border-white/5">
          <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-48">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none"
            >
              <option value="all" className="bg-slate-900">All Types</option>
              <option value="image" className="bg-slate-900">Images</option>
              <option value="video" className="bg-slate-900">Videos</option>
              <option value="audio" className="bg-slate-900">Audio</option>
              <option value="document" className="bg-slate-900">Documents</option>
              <option value="archive" className="bg-slate-900">Archives</option>
              <option value="code" className="bg-slate-900">Code</option>
            </select>

            {/* Sort Selector */}
            <select
              value={fileSortBy}
              onChange={(e) => setFileSortBy(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none"
            >
              <option value="name_asc" className="bg-slate-900">Name: 1 → 45 (A–Z)</option>
              <option value="name_desc" className="bg-slate-900">Name: 45 → 1 (Z–A)</option>
              <option value="newest" className="bg-slate-900">Newest Upload</option>
              <option value="oldest" className="bg-slate-900">Oldest Upload</option>
            </select>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handleSelectAll}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold glass-card hover:border-purple-500/40 text-slate-300"
            >
              {selectedFileIds.size === filteredFiles.length && filteredFiles.length > 0
                ? 'Deselect All'
                : 'Select All'}
            </button>
            <span className="text-xs text-slate-500">{filteredFiles.length} files</span>

            <div className="flex items-center p-1 rounded-xl bg-white/5 border border-white/5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg ${viewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg ${viewMode === 'list' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Download ZIP progress bar */}
        {downloading && (
          <div className="p-4 rounded-2xl glass-card border border-purple-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-purple-300 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                Preparing archive for download...
              </span>
              <span className="text-white font-mono">{downloadProgress}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Files Grid */}
        {filteredFiles.length > 0 ? (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4'
                : 'space-y-2'
            }
          >
            {filteredFiles.map((file) => (
              <FileCard
                key={file._id}
                file={file}
                isSelected={selectedFileIds.has(file._id)}
                onToggleSelect={collection?.allowDownloads ? handleToggleSelect : undefined}
                onPreview={handlePreview}
                showActions={collection?.allowDownloads}
              />
            ))}
          </div>
        ) : (
          <div className="p-16 text-center glass-panel rounded-3xl space-y-3">
            <Layers className="w-12 h-12 text-slate-600 mx-auto" />
            <h4 className="text-sm font-bold text-white">No files found</h4>
            <p className="text-xs text-slate-500">
              {files.length === 0
                ? 'This collection has no files yet.'
                : 'No files match your search filters.'}
            </p>
          </div>
        )}

        {/* Share Footer */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            Shared securely via SnapShare • Files end-to-end validated
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`https://api.whatsapp.com/send?text=Check out "${collection?.title}" on SnapShare: ${window.location.href}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-600/30"
            >
              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
            </a>
            <a
              href={`https://t.me/share/url?url=${window.location.href}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600/20 text-sky-300 border border-sky-500/20 hover:bg-sky-600/30"
            >
              <Send className="w-3.5 h-3.5" /> Telegram
            </a>
            <a href="/" className="text-purple-400 hover:text-purple-300 font-bold">
              Powered by SnapShare →
            </a>
          </div>
        </div>
      </div>

      {/* Find My Photos Modal */}
      <FindMyPhotosModal
        isOpen={showFindMyPhotos}
        onClose={() => setShowFindMyPhotos(false)}
        collectionId={collection?._id}
      />

      {/* Photobook Modal */}
      <PhotobookModal
        isOpen={showPhotobook}
        onClose={() => setShowPhotobook(false)}
        collectionId={collection?._id}
        isPublic={true}
      />

      {/* File Preview Modal */}
      <FilePreviewModal
        file={previewFile}
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        onNext={handleNext}
        onPrev={handlePrev}
        hasNext={previewIndex < filteredFiles.length - 1}
        hasPrev={previewIndex > 0}
        isPublic={true}
      />
    </div>
  );
};
