import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Files, Search, Filter, Grid3X3, List, Download, Heart,
  Star, Trash2, Eye, ChevronDown, X, RefreshCw, FolderOpen
} from 'lucide-react'
import FileCard from '../components/FileCard'
import FilePreviewModal from '../components/FilePreviewModal'
import { fileAPI } from '../services/api'
import { useToast } from '../context/ToastContext'

const CATEGORIES = ['all', 'image', 'video', 'audio', 'document', 'archive', 'code', 'other']
const SORT_OPTIONS = [
  { label: 'Name (1 → 45 / A–Z)', value: 'name_asc' },
  { label: 'Name (45 → 1 / Z–A)', value: 'name_desc' },
  { label: 'Newest First', value: 'createdAt_desc' },
  { label: 'Oldest First', value: 'createdAt_asc' },
  { label: 'Largest First', value: 'size_desc' },
  { label: 'Smallest First', value: 'size_asc' },
]

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export default function AllFilesPage() {
  const { showToast } = useToast()
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [sortBy, setSortBy] = useState('createdAt_desc')
  const [viewMode, setViewMode] = useState('grid')
  const [previewFile, setPreviewFile] = useState(null)
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchFiles = useCallback(async () => {
    setLoading(true)
    try {
      const [field, order] = sortBy.split('_')
      const params = {
        page,
        limit: 24,
        sortBy: field,
        sortOrder: order,
      }
      if (searchQuery) params.search = searchQuery
      if (category !== 'all') params.category = category

      const res = await fileAPI.getAllFiles(params)
      setFiles(res.data.files || [])
      setTotalPages(res.data.totalPages || 1)
      setTotal(res.data.total || 0)
    } catch (err) {
      // Fallback: try fetching from collections
      setFiles([])
    } finally {
      setLoading(false)
    }
  }, [page, sortBy, searchQuery, category])

  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  const handleToggleFavorite = async (file) => {
    try {
      await fileAPI.toggleFavorite(file._id)
      setFiles(prev =>
        prev.map(f => f._id === file._id ? { ...f, isFavorite: !f.isFavorite } : f)
      )
    } catch {
      showToast('Failed to update favorite', 'error')
    }
  }

  const handleDelete = async (file) => {
    if (!window.confirm(`Delete "${file.originalName}"? This cannot be undone.`)) return
    try {
      await fileAPI.deleteFile(file._id)
      setFiles(prev => prev.filter(f => f._id !== file._id))
      setTotal(t => t - 1)
      showToast('File deleted', 'success')
    } catch {
      showToast('Failed to delete file', 'error')
    }
  }

  const currentSort = SORT_OPTIONS.find(o => o.value === sortBy)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Files className="w-6 h-6 text-purple-400" />
            All Files
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {total > 0 ? `${total} file${total !== 1 ? 's' : ''} across all collections` : 'No files yet'}
          </p>
        </div>
        <Link
          to="/dashboard/upload"
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-colors text-sm"
        >
          + Upload Files
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500 transition-colors"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category filter */}
        <div className="flex gap-1 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => { setCategory(cat); setPage(1) }}
              className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-all ${
                category === cat
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="relative">
          <button
            onClick={() => setShowSortMenu(o => !o)}
            className="flex items-center gap-2 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-300 text-sm hover:bg-white/10 transition-colors whitespace-nowrap"
          >
            <Filter className="w-4 h-4" />
            {currentSort?.label}
            <ChevronDown className="w-4 h-4" />
          </button>
          <AnimatePresence>
            {showSortMenu && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute right-0 top-full mt-1 w-44 bg-[#1a1f35] border border-white/10 rounded-xl shadow-xl z-20 overflow-hidden"
              >
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setSortBy(opt.value); setShowSortMenu(false); setPage(1) }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      sortBy === opt.value ? 'bg-purple-600/30 text-purple-300' : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* View toggle */}
        <div className="flex gap-1 p-1 bg-white/5 border border-white/10 rounded-xl">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>

        <button onClick={fetchFiles} className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* File Grid / List */}
      {loading ? (
        <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6' : 'grid-cols-1'}`}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-white/5 rounded-xl animate-pulse" style={{ height: viewMode === 'grid' ? 160 : 72 }} />
          ))}
        </div>
      ) : files.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-24"
        >
          <FolderOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No files found</h3>
          <p className="text-gray-500 mb-6">
            {searchQuery || category !== 'all'
              ? 'Try adjusting your search or filter.'
              : 'Upload your first file to get started.'}
          </p>
          {!searchQuery && category === 'all' && (
            <Link
              to="/dashboard/upload"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-colors"
            >
              Upload Files
            </Link>
          )}
        </motion.div>
      ) : (
        <>
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4'
              : 'flex flex-col gap-2'
          }>
            <AnimatePresence>
              {files.map((file, idx) => (
                <motion.div
                  key={file._id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: idx * 0.03 }}
                >
                  <FileCard
                    file={file}
                    viewMode={viewMode}
                    onPreview={() => setPreviewFile(file)}
                    onToggleFavorite={() => handleToggleFavorite(file)}
                    onDelete={() => handleDelete(file)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-300 text-sm disabled:opacity-40 hover:bg-white/10 transition-colors"
              >
                ← Prev
              </button>
              <span className="text-gray-400 text-sm px-2">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-300 text-sm disabled:opacity-40 hover:bg-white/10 transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* File Preview Modal */}
      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  )
}
