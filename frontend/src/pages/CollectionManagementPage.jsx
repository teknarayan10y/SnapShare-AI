import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { collectionAPI, fileAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { FileCard } from '../components/FileCard';
import { FilePreviewModal } from '../components/FilePreviewModal';
import { QRShareModal } from '../components/QRShareModal';
import { FindMyPhotosModal } from '../components/FindMyPhotosModal';
import { PhotobookModal } from '../components/PhotobookModal';
import {
  FolderOpen,
  Plus,
  QrCode,
  Share2,
  Trash2,
  Copy,
  Archive,
  Search,
  Filter,
  ArrowLeft,
  Grid,
  List,
  UploadCloud,
  Lock,
  Globe,
  Download,
  Calendar,
  Layers,
  Sparkles,
  Camera,
  BookOpen,
} from 'lucide-react';

export const CollectionManagementPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [collections, setCollections] = useState([]);
  const [currentCollection, setCurrentCollection] = useState(null);
  const [files, setFiles] = useState([]);
  const [fileSortBy, setFileSortBy] = useState('name_asc');
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // Modals
  const [previewFile, setPreviewFile] = useState(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [showFindMyPhotos, setShowFindMyPhotos] = useState(false);
  const [showPhotobook, setShowPhotobook] = useState(false);
  const [selectedFileIds, setSelectedFileIds] = useState(new Set());

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (id) {
        // Fetch single collection with its files
        const res = await collectionAPI.getById(id);
        if (res.data.success) {
          setCurrentCollection(res.data.collection);
          setFiles(res.data.files);
        }
      } else {
        // Fetch all collections
        const res = await collectionAPI.getAll();
        if (res.data.success) {
          setCollections(res.data.collections);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to fetch collection data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCollection = async (collId) => {
    if (!window.confirm('Are you sure you want to delete this collection and all its files? This cannot be undone.')) {
      return;
    }
    try {
      await collectionAPI.delete(collId);
      toast.success('Collection deleted successfully');
      if (id) {
        navigate('/dashboard/collections');
      } else {
        setCollections((prev) => prev.filter((c) => c._id !== collId));
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete collection');
    }
  };

  const handleDuplicateCollection = async (collId) => {
    try {
      const res = await collectionAPI.duplicate(collId);
      if (res.data.success) {
        toast.success('Collection duplicated!');
        setCollections((prev) => [res.data.collection, ...prev]);
      }
    } catch (err) {
      toast.error('Failed to duplicate collection');
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('Delete this file permanently?')) return;
    try {
      await fileAPI.delete(fileId);
      toast.success('File deleted');
      setFiles((prev) => prev.filter((f) => f._id !== fileId));
    } catch (err) {
      toast.error('Failed to delete file');
    }
  };

  const handleToggleFavorite = async (fileId) => {
    try {
      const res = await fileAPI.toggleFavorite(fileId);
      if (res.data.success) {
        setFiles((prev) =>
          prev.map((f) => (f._id === fileId ? { ...f, isFavorite: res.data.file.isFavorite } : f))
        );
      }
    } catch (err) {
      toast.error('Could not update favorite');
    }
  };

  const handleToggleSelect = (fileId) => {
    setSelectedFileIds((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
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

  // Filtered and naturally sorted files
  const filteredFiles = files
    .filter((f) => {
      const matchesSearch =
        f.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.metadata?.aiTags || []).some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        categoryFilter === 'all' || (f.metadata?.aiCategory || 'other') === categoryFilter;

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
      if (fileSortBy === 'size') {
        return (b.fileSize || 0) - (a.fileSize || 0);
      }
      return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
    });

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

  // ================= VIEW A: SINGLE COLLECTION DETAILS =================
  if (id && currentCollection) {
    return (
      <div className="space-y-8 animate-in fade-in pb-16">
        {/* Navigation Breadcrumb */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
          <Link
            to="/dashboard/collections"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors py-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Collections
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowFindMyPhotos(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-xs font-bold transition-all shadow-glow-primary"
            >
              <Camera className="w-3.5 h-3.5 text-purple-400" /> Find My Photos
            </button>
            <button
              onClick={() => setShowPhotobook(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" /> Photobook
            </button>
            <button
              onClick={() => setShareModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-glow-primary transition-all"
            >
              <QrCode className="w-4 h-4" /> Share & QR Code
            </button>
            <Link
              to={`/dashboard/upload?collectionId=${currentCollection._id}`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl glass-card hover:border-purple-500/40 text-slate-200 text-xs font-semibold"
            >
              <UploadCloud className="w-4 h-4" /> Upload Files
            </Link>
            <button
              onClick={() => handleDeleteCollection(currentCollection._id)}
              className="p-2 rounded-xl glass-card hover:border-red-500/40 text-slate-400 hover:text-red-400"
              title="Delete Collection"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Collection Cover & Header Banner */}
        <div className="relative rounded-3xl overflow-hidden glass-panel border border-white/10 shadow-2xl">
          {currentCollection.coverImage ? (
            <div className="h-44 sm:h-52 w-full overflow-hidden relative">
              <img
                src={currentCollection.coverImage}
                alt="Cover"
                className="w-full h-full object-cover opacity-50 blur-xs"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#080B14] via-[#080B14]/70 to-transparent" />
            </div>
          ) : (
            <div className="h-24 sm:h-28 w-full relative overflow-hidden bg-gradient-to-r from-purple-900/30 via-indigo-950/40 to-slate-900/50">
              <div className="absolute -top-12 -left-12 w-48 h-48 bg-purple-500/15 rounded-full blur-2xl" />
              <div className="absolute top-0 right-0 w-64 h-32 bg-indigo-500/15 rounded-full blur-2xl" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#080B14] via-[#080B14]/40 to-transparent" />
            </div>
          )}

          <div className={`p-6 sm:p-8 space-y-4 relative ${currentCollection.coverImage ? '-mt-16 sm:-mt-20' : 'pt-4 sm:pt-6'}`}>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="uppercase text-[10px] font-extrabold px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 tracking-wider shadow-sm">
                {currentCollection.category}
              </span>
              <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 flex items-center gap-1.5 shadow-sm">
                {currentCollection.accessType === 'public' ? (
                  <>
                    <Globe className="w-3.5 h-3.5 text-cyan-400" /> Public
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-amber-400" /> Password Protected
                  </>
                )}
              </span>
              {currentCollection.eventDate && (
                <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />{' '}
                  {new Date(currentCollection.eventDate).toLocaleDateString()}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">{currentCollection.title}</h1>
            {currentCollection.description && (
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                {currentCollection.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-3 text-xs font-medium text-slate-400 border-t border-white/5">
              <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-purple-400" /> {files.length} Files Total</span>
              <span className="flex items-center gap-1.5">{formatBytes(currentCollection.totalSize || 0)}</span>
              <span className="flex items-center gap-1.5"><QrCode className="w-3.5 h-3.5 text-cyan-400" /> {currentCollection.scanCount || 0} QR Scans</span>
              <span className="flex items-center gap-1.5"><Download className="w-3.5 h-3.5 text-emerald-400" /> {currentCollection.downloadCount || 0} Downloads</span>
            </div>
          </div>
        </div>

        {/* Search, Category Filter & Bulk Action Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-card p-4 rounded-2xl border border-white/5">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search collection files..."
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
              <option value="all" className="bg-slate-900">All Categories</option>
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
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none"
            >
              <option value="name_asc" className="bg-slate-900">Name: 1 → 45 (A–Z)</option>
              <option value="name_desc" className="bg-slate-900">Name: 45 → 1 (Z–A)</option>
              <option value="newest" className="bg-slate-900">Newest Upload</option>
              <option value="oldest" className="bg-slate-900">Oldest Upload</option>
              <option value="size" className="bg-slate-900">File Size</option>
            </select>
          </div>

          {/* View toggle & Select All */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handleSelectAll}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold glass-card hover:border-purple-500/40 text-slate-300"
            >
              {selectedFileIds.size === filteredFiles.length && filteredFiles.length > 0
                ? 'Deselect All'
                : 'Select All'}
            </button>
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

        {/* Files Grid */}
        {filteredFiles.length > 0 ? (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4'
                : 'space-y-2'
            }
          >
            {filteredFiles.map((file) => (
              <FileCard
                key={file._id}
                file={file}
                isSelected={selectedFileIds.has(file._id)}
                onToggleSelect={handleToggleSelect}
                onPreview={(f) => setPreviewFile(f)}
                onDelete={handleDeleteFile}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center glass-panel rounded-3xl space-y-3">
            <Layers className="w-10 h-10 text-slate-600 mx-auto" />
            <h4 className="text-sm font-bold text-slate-300">No files found</h4>
            <p className="text-xs text-slate-500">
              {files.length === 0
                ? 'This collection is currently empty. Upload files to get started!'
                : 'No files match your search criteria.'}
            </p>
            {files.length === 0 && (
              <Link
                to={`/dashboard/upload?collectionId=${currentCollection._id}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold shadow-glow-primary"
              >
                <UploadCloud className="w-4 h-4" /> Upload First File
              </Link>
            )}
          </div>
        )}

        {/* Modals */}
        <FilePreviewModal
          file={previewFile}
          isOpen={!!previewFile}
          onClose={() => setPreviewFile(null)}
        />
        <QRShareModal
          collection={currentCollection}
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
        />
        <FindMyPhotosModal
          isOpen={showFindMyPhotos}
          collectionId={currentCollection?._id}
          token={localStorage.getItem('snapshare_token')}
          onClose={() => setShowFindMyPhotos(false)}
        />
        <PhotobookModal
          isOpen={showPhotobook}
          collectionId={currentCollection?._id}
          onClose={() => setShowPhotobook(false)}
        />
      </div>
    );
  }

  // ================= VIEW B: ALL USER COLLECTIONS LIST =================
  return (
    <div className="space-y-8 animate-in fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">My Collections</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Organize, share, duplicate, and generate dynamic QR codes for your vaults.
          </p>
        </div>
        <Link
          to="/dashboard/collections/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-glow-primary transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Create Collection
        </Link>
      </div>

      {/* Grid of collections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collections.map((coll) => (
          <div
            key={coll._id}
            className="rounded-3xl glass-card border border-white/5 overflow-hidden flex flex-col justify-between hover:border-purple-500/30 transition-all group"
          >
            {/* Cover image or gradient header */}
            <div className="h-32 w-full bg-slate-900 relative overflow-hidden">
              {coll.coverImage ? (
                <img
                  src={coll.coverImage}
                  alt={coll.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-purple-900/40 to-cyan-900/40 flex items-center justify-center">
                  <FolderOpen className="w-10 h-10 text-purple-400/40" />
                </div>
              )}
              <div className="absolute top-3 left-3">
                <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-purple-300 border border-purple-500/30">
                  {coll.category}
                </span>
              </div>
            </div>

            <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors truncate">
                  {coll.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                  {coll.description || 'No description provided.'}
                </p>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                <span>{coll.totalFiles || 0} Files • {formatBytes(coll.totalSize || 0)}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setCurrentCollection(coll);
                      setShareModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg glass-card hover:border-purple-500/40 text-purple-400"
                    title="QR Code & Sharing"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDuplicateCollection(coll._id)}
                    className="p-1.5 rounded-lg glass-card hover:border-purple-500/40 text-slate-400"
                    title="Duplicate"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCollection(coll._id)}
                    className="p-1.5 rounded-lg glass-card hover:border-red-500/40 text-slate-400 hover:text-red-400"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <Link
                    to={`/dashboard/collections/${coll._id}`}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-glow-primary"
                  >
                    Manage
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}

        {collections.length === 0 && (
          <div className="col-span-full p-12 text-center glass-panel rounded-3xl space-y-3">
            <FolderOpen className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No collections yet</h3>
            <p className="text-xs text-slate-400">
              Create your first collection to upload files and generate shareable QR codes.
            </p>
            <Link
              to="/dashboard/collections/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold shadow-glow-primary"
            >
              <Plus className="w-4 h-4" /> Create First Collection
            </Link>
          </div>
        )}
      </div>

      {/* Share Modal */}
      <QRShareModal
        collection={currentCollection}
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
      />
    </div>
  );
};
