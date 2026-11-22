import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HardDrive, Image, Video, Music, FileText, Archive,
  Code, File, Trash2, AlertTriangle, TrendingUp, Zap
} from 'lucide-react'
import { analyticsAPI, fileAPI } from '../services/api'
import { useToast } from '../context/ToastContext'

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

const CATEGORY_CONFIG = {
  image:    { label: 'Images',    icon: Image,    color: '#8B5CF6', bg: 'from-purple-600/20 to-purple-600/5' },
  video:    { label: 'Videos',    icon: Video,    color: '#3B82F6', bg: 'from-blue-600/20 to-blue-600/5' },
  audio:    { label: 'Audio',     icon: Music,    color: '#06B6D4', bg: 'from-cyan-600/20 to-cyan-600/5' },
  document: { label: 'Documents', icon: FileText, color: '#10B981', bg: 'from-emerald-600/20 to-emerald-600/5' },
  archive:  { label: 'Archives',  icon: Archive,  color: '#F59E0B', bg: 'from-amber-600/20 to-amber-600/5' },
  code:     { label: 'Code',      icon: Code,     color: '#EC4899', bg: 'from-pink-600/20 to-pink-600/5' },
  other:    { label: 'Other',     icon: File,     color: '#6B7280', bg: 'from-gray-600/20 to-gray-600/5' },
}

const PLANS = {
  free:       { label: 'Free',       quota: 1 * 1024 * 1024 * 1024 },      // 1 GB
  pro:        { label: 'Pro',        quota: 50 * 1024 * 1024 * 1024 },     // 50 GB
  enterprise: { label: 'Enterprise', quota: 1000 * 1024 * 1024 * 1024 },   // 1 TB
}

export default function StorageManagementPage() {
  const { showToast } = useToast()
  const [storageData, setStorageData] = useState(null)
  const [largestFiles, setLargestFiles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [storageRes, filesRes] = await Promise.allSettled([
          analyticsAPI.getStorageBreakdown?.() || analyticsAPI.getOverview(),
          fileAPI.getAllFiles?.({ limit: 10, sortBy: 'size', sortOrder: 'desc' }),
        ])

        if (storageRes.status === 'fulfilled') {
          setStorageData(storageRes.value?.data || null)
        }
        if (filesRes.status === 'fulfilled') {
          setLargestFiles(filesRes.value?.data?.files?.slice(0, 10) || [])
        }
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const totalUsed = storageData?.storageUsed || storageData?.storage?.used || 0
  const plan = 'free'
  const quota = PLANS[plan].quota
  const usedPercent = Math.min((totalUsed / quota) * 100, 100)
  const categoryBreakdown = storageData?.categoryBreakdown || storageData?.fileCategories || {}

  const handleDeleteFile = async (file) => {
    if (!window.confirm(`Delete "${file.originalName}"?`)) return
    try {
      await fileAPI.deleteFile(file._id)
      setLargestFiles(prev => prev.filter(f => f._id !== file._id))
      showToast('File deleted', 'success')
    } catch {
      showToast('Failed to delete file', 'error')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <HardDrive className="w-6 h-6 text-purple-400" />
            Storage Management
          </h1>
          <p className="text-gray-400 text-sm mt-1">Monitor and manage your storage usage</p>
        </div>
        <Link
          to="/pricing"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-xl transition-all text-sm"
        >
          <Zap className="w-4 h-4" />
          Upgrade Plan
        </Link>
      </div>

      {/* Storage Overview Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="text-3xl font-bold text-white">{formatBytes(totalUsed)}</div>
            <div className="text-gray-400 text-sm mt-1">
              of {formatBytes(quota)} used · {PLANS[plan].label} Plan
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-gray-200">{formatBytes(quota - totalUsed)}</div>
            <div className="text-gray-500 text-sm">remaining</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative h-4 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${usedPercent}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={`h-full rounded-full ${
              usedPercent > 90 ? 'bg-red-500' :
              usedPercent > 75 ? 'bg-amber-500' :
              'bg-gradient-to-r from-purple-500 to-blue-500'
            }`}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>{usedPercent.toFixed(1)}% used</span>
          <span>{(100 - usedPercent).toFixed(1)}% free</span>
        </div>

        {usedPercent > 80 && (
          <div className={`mt-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${
            usedPercent > 90 ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
          }`}>
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {usedPercent > 90
              ? 'Storage critically full! Upgrade now or delete files to continue uploading.'
              : 'Storage is getting full. Consider upgrading or cleaning up old files.'}
          </div>
        )}
      </motion.div>

      {/* Category Breakdown */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Usage by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Object.entries(CATEGORY_CONFIG).map(([key, cfg], idx) => {
            const catData = categoryBreakdown[key] || {}
            const catSize = catData.totalSize || catData.size || 0
            const catCount = catData.count || 0
            const catPercent = totalUsed > 0 ? (catSize / totalUsed) * 100 : 0
            const Icon = cfg.icon

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
                className={`bg-gradient-to-br ${cfg.bg} border border-white/10 rounded-xl p-4`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 rounded-lg" style={{ backgroundColor: cfg.color + '25' }}>
                    <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                  </div>
                  <span className="text-sm font-medium text-white">{cfg.label}</span>
                </div>
                <div className="text-xl font-bold text-white mb-0.5">{formatBytes(catSize)}</div>
                <div className="text-xs text-gray-400">{catCount} file{catCount !== 1 ? 's' : ''}</div>
                <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${catPercent}%` }}
                    transition={{ duration: 0.8, delay: idx * 0.06 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: cfg.color }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">{catPercent.toFixed(1)}%</div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Largest Files */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            Largest Files
          </h2>
          <Link to="/dashboard/files" className="text-purple-400 hover:text-purple-300 text-sm transition-colors">
            View all →
          </Link>
        </div>

        {largestFiles.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No files uploaded yet.{' '}
            <Link to="/dashboard/upload" className="text-purple-400 hover:underline">Upload now</Link>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            {largestFiles.map((file, idx) => {
              const catCfg = CATEGORY_CONFIG[file.category] || CATEGORY_CONFIG.other
              const Icon = catCfg.icon
              const filePercent = totalUsed > 0 ? ((file.size || 0) / totalUsed) * 100 : 0

              return (
                <div
                  key={file._id}
                  className="flex items-center gap-4 px-4 py-3 border-b border-white/5 last:border-b-0 hover:bg-white/5 group transition-colors"
                >
                  <div className="text-gray-600 text-xs w-5 text-right">{idx + 1}</div>
                  <div className="p-2 rounded-lg" style={{ backgroundColor: catCfg.color + '20' }}>
                    <Icon className="w-4 h-4" style={{ color: catCfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white font-medium truncate">{file.originalName}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden max-w-32">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${filePercent}%`, backgroundColor: catCfg.color }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{filePercent.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-300 font-medium">{formatBytes(file.size)}</div>
                  <button
                    onClick={() => handleDeleteFile(file)}
                    className="p-1.5 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Upgrade CTA */}
      {plan === 'free' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Need more storage?</h3>
            <p className="text-gray-400 text-sm">
              Upgrade to Pro for 50 GB or Enterprise for 1 TB of secure cloud storage.
            </p>
          </div>
          <Link
            to="/pricing"
            className="flex-shrink-0 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-purple-500/25"
          >
            See Plans →
          </Link>
        </motion.div>
      )}
    </div>
  )
}
