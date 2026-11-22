import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { collectionAPI, fileAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  UploadCloud,
  File,
  X,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  Plus,
  ArrowRight,
  Trash2,
  Layers,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  Archive,
  Code,
  Sparkles,
} from 'lucide-react';

export const FileUploadPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialCollectionId = searchParams.get('collectionId') || '';

  const [collections, setCollections] = useState([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState(initialCollectionId);
  const [newCollectionTitle, setNewCollectionTitle] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [queuedFiles, setQueuedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);

  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const res = await collectionAPI.getAll();
        if (res.data.success) {
          setCollections(res.data.collections);
          if (!selectedCollectionId && res.data.collections.length > 0) {
            setSelectedCollectionId(res.data.collections[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to load collections:', err);
      }
    };
    fetchCollections();
  }, []);

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getCategory = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const images = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'heic', 'bmp', 'tiff'];
    const videos = ['mp4', 'mov', 'mkv', 'webm', 'avi', 'm4v'];
    const audio = ['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a', 'wma'];
    const documents = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'rtf'];
    const archives = ['zip', 'rar', '7z', 'tar', 'gz'];
    const code = ['html', 'css', 'js', 'jsx', 'ts', 'tsx', 'json', 'xml', 'md', 'sql', 'py', 'java', 'c', 'cpp', 'php'];

    if (images.includes(ext)) return 'image';
    if (videos.includes(ext)) return 'video';
    if (audio.includes(ext)) return 'audio';
    if (documents.includes(ext)) return 'document';
    if (archives.includes(ext)) return 'archive';
    if (code.includes(ext)) return 'code';
    return 'other';
  };

  const addFilesToQueue = (fileList) => {
    const newItems = Array.from(fileList).map((file) => {
      let previewUrl = null;
      if (file.type.startsWith('image/')) {
        previewUrl = URL.createObjectURL(file);
      }

      return {
        id: Math.random().toString(36).substring(2, 9),
        file,
        name: file.name,
        size: file.size,
        category: getCategory(file.name),
        previewUrl,
        status: 'ready', // 'ready', 'uploading', 'done', 'error'
        progress: 0,
      };
    });

    setQueuedFiles((prev) => [...prev, ...newItems]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToQueue(e.dataTransfer.files);
    }
  };

  const removeFile = (id) => {
    setQueuedFiles((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleCreateCollection = async (e) => {
    e.preventDefault();
    if (!newCollectionTitle) return;
    try {
      const res = await collectionAPI.create({ title: newCollectionTitle });
      if (res.data.success) {
        toast.success(`Collection "${newCollectionTitle}" created!`);
        setCollections((prev) => [res.data.collection, ...prev]);
        setSelectedCollectionId(res.data.collection._id);
        setShowCreateModal(false);
        setNewCollectionTitle('');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create collection');
    }
  };

  const handleUploadAll = async () => {
    if (!selectedCollectionId) {
      return toast.warning('Please select or create a destination collection first.');
    }
    if (queuedFiles.length === 0) {
      return toast.warning('No files selected in queue.');
    }

    setUploading(true);
    setOverallProgress(5);

    try {
      const formData = new FormData();
      formData.append('collectionId', selectedCollectionId);

      queuedFiles.forEach((item) => {
        formData.append('files', item.file);
      });

      const res = await fileAPI.upload(formData, (percent) => {
        setOverallProgress(percent);
      });

      if (res.data.success) {
        toast.success(`Successfully uploaded ${res.data.files.length} files!`);
        // Navigate to the collection page to view & generate QR
        navigate(`/dashboard/collections/${selectedCollectionId}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed. Please check file sizes.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Universal File Uploader</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            High-speed multipart upload engine with automated SHA-256 duplicate validation and WebP thumbnails.
          </p>
        </div>

        {/* Destination Collection Selector */}
        <div className="flex items-center gap-2">
          <select
            value={selectedCollectionId}
            onChange={(e) => setSelectedCollectionId(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-white focus:border-purple-500 focus:outline-none"
          >
            {collections.map((c) => (
              <option key={c._id} value={c._id} className="bg-slate-900 text-white">
                📁 {c.title}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowCreateModal(true)}
            className="p-2.5 rounded-xl glass-card hover:border-purple-500/40 text-purple-400"
            title="Create New Collection"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Drag & Drop Main Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`p-10 sm:p-16 rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center space-y-4 ${
          isDragOver
            ? 'border-purple-500 bg-purple-950/30 scale-[1.01] shadow-glow-primary'
            : 'border-white/10 glass-panel hover:border-purple-500/40'
        }`}
      >
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-purple-600/30 to-cyan-500/30 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-glow-primary">
          <UploadCloud className="w-8 h-8" />
        </div>

        <div>
          <h3 className="text-lg font-bold text-white">
            Drag and drop files or folders here
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            Supports 4K photos, cinema video, documents, audio, and archives up to 500 MB per file.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-glow-primary transition-all"
          >
            Select Files
          </button>
          <button
            onClick={() => folderInputRef.current?.click()}
            className="px-5 py-2.5 rounded-xl glass-card hover:border-purple-500/40 text-slate-200 text-xs font-semibold transition-all"
          >
            Select Folder
          </button>
        </div>

        {/* Hidden standard HTML inputs */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => addFilesToQueue(e.target.files)}
        />
        <input
          ref={folderInputRef}
          type="file"
          // @ts-ignore
          webkitdirectory="true"
          directory="true"
          multiple
          className="hidden"
          onChange={(e) => addFilesToQueue(e.target.files)}
        />
      </div>

      {/* Queued Files Preview Grid */}
      {queuedFiles.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-400" />
              <h3 className="text-base font-bold text-white">
                Queue ({queuedFiles.length} files • {formatBytes(queuedFiles.reduce((acc, curr) => acc + curr.size, 0))})
              </h3>
            </div>
            <button
              onClick={() => setQueuedFiles([])}
              className="text-xs text-red-400 hover:text-red-300 font-semibold"
            >
              Clear All
            </button>
          </div>

          {/* Overall Progress Bar during upload */}
          {uploading && (
            <div className="p-4 rounded-2xl glass-card space-y-2 border border-purple-500/30">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-purple-300 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                  Streaming files to secure cloud storage...
                </span>
                <span className="text-white font-mono">{overallProgress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 transition-all duration-300"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Files List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {queuedFiles.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-2xl glass-card border border-white/5 flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  {item.previewUrl ? (
                    <img
                      src={item.previewUrl}
                      alt={item.name}
                      className="w-10 h-10 rounded-xl object-cover shrink-0 border border-white/10"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0">
                      {item.category === 'video' && <Video className="w-5 h-5 text-rose-400" />}
                      {item.category === 'audio' && <Music className="w-5 h-5 text-cyan-400" />}
                      {item.category === 'document' && <FileText className="w-5 h-5 text-amber-400" />}
                      {item.category === 'code' && <Code className="w-5 h-5 text-emerald-400" />}
                      {item.category === 'archive' && <Archive className="w-5 h-5 text-orange-400" />}
                      {item.category === 'other' && <File className="w-5 h-5 text-slate-400" />}
                    </div>
                  )}

                  <div className="truncate">
                    <p className="text-xs font-bold text-white truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-400">{formatBytes(item.size)}</p>
                  </div>
                </div>

                <button
                  disabled={uploading}
                  onClick={() => removeFile(item.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Submit Action */}
          <div className="pt-4 flex justify-end">
            <button
              onClick={handleUploadAll}
              disabled={uploading}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-sm shadow-glow-primary transition-all flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Uploading Assets ({overallProgress}%)
                </>
              ) : (
                <>
                  Publish & Generate QR <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Quick Create Collection Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Create Destination Collection</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCollection} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Collection Title</label>
                <input
                  type="text"
                  required
                  value={newCollectionTitle}
                  onChange={(e) => setNewCollectionTitle(e.target.value)}
                  placeholder="e.g. Design Assets 2026"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl glass-card text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-glow-primary"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
