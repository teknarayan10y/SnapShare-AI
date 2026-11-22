import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Search, Grid3X3, List, FolderOpen, X } from 'lucide-react'
import FileCard from '../components/FileCard'
import FilePreviewModal from '../components/FilePreviewModal'
import { fileAPI } from '../services/api'
import { useToast } from '../context/ToastContext'

export default function FavoritesPage() {
  const { showToast } = useToast()
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('grid')
  const [previewFile, setPreviewFile] = useState(null)

  const fetchFavorites = async () => {
    setLoading(true)
    try {
      const res = await fileAPI.getFavorites()
      setFiles(res.data.files || [])
    } catch {
      setFiles([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFavorites()
  }, [])

  const handleToggleFavorite = async (file) => {
    try {
      await fileAPI.toggleFavorite(file._id)
      // Remove from favorites list
      setFiles(prev => prev.filter(f => f._id !== file._id))
      showToast('Removed from favorites', 'info')
    } catch {
      showToast('Failed to update favorite', 'error')
    }
  }

  const handleDelete = async (file) => {
    if (!window.confirm(`Delete "${file.originalName}"?`)) return
    try {
      await fileAPI.deleteFile(file._id)
      setFiles(prev => prev.filter(f => f._id !== file._id))
      showToast('File deleted', 'success')
    } catch {
      showToast('Failed to delete', 'error')
    }
  }

  const filtered = files.filter(f =>
    f.originalName?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Heart className="w-6 h-6 text-pink-400 fill-pink-400" />
            Favorites
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {files.length > 0 ? `${files.length} favorited file${files.length !== 1 ? 's' : ''}` : 'No favorites yet'}
          </p>
        </div>
        <Link
          to="/dashboard/files"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 font-medium rounded-xl transition-colors text-sm"
        >
          ← All Files
        </Link>
      </div>

      {/* Search + View */}
      {files.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search favorites..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500 transition-colors"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
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
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white/5 rounded-xl animate-pulse h-40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-24"
        >
          <Heart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">
            {searchQuery ? 'No matches found' : 'No favorites yet'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchQuery
              ? 'Try a different search term.'
              : 'Heart any file to add it to your favorites.'}
          </p>
          {!searchQuery && (
            <Link
              to="/dashboard/files"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-colors"
            >
              Browse All Files
            </Link>
          )}
        </motion.div>
      ) : (
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4'
            : 'flex flex-col gap-2'
        }>
          <AnimatePresence>
            {filtered.map((file, idx) => (
              <motion.div
                key={file._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.04 }}
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
      )}

      {/* Preview Modal */}
      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  )
}
