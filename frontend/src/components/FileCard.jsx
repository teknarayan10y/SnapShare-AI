import React from 'react';
import {
  FileText,
  FileCode,
  Music,
  Video,
  Archive,
  Image as ImageIcon,
  Download,
  Eye,
  Star,
  Trash2,
  Check,
  Mic,
} from 'lucide-react';

export const FileCard = ({
  file,
  onPreview,
  onDownload,
  onDelete,
  onToggleFavorite,
  isSelected,
  onToggleSelect,
  showActions = true,
}) => {
  const category = file.metadata?.aiCategory || 'other';

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getCategoryIcon = () => {
    switch (category) {
      case 'image':
        return <ImageIcon className="w-5 h-5 text-purple-400" />;
      case 'video':
        return <Video className="w-5 h-5 text-rose-400" />;
      case 'audio':
        return <Music className="w-5 h-5 text-cyan-400" />;
      case 'document':
        return <FileText className="w-5 h-5 text-amber-400" />;
      case 'code':
        return <FileCode className="w-5 h-5 text-emerald-400" />;
      case 'archive':
        return <Archive className="w-5 h-5 text-orange-400" />;
      default:
        return <FileText className="w-5 h-5 text-slate-400" />;
    }
  };

  const downloadUrl = file.downloadUrl || `/api/files/${file._id}/download`;
  const thumbnailUrl = file.cloudinaryUrl || (file.thumbnailKey ? `/uploads/${file.thumbnailKey}` : null);

  return (
    <div
      className={`group relative rounded-2xl glass-card overflow-hidden border transition-all duration-200 ${
        isSelected
          ? 'border-purple-500 bg-purple-900/10 shadow-glow-primary'
          : 'border-white/5 hover:border-purple-500/30'
      }`}
    >
      {/* Selection Checkbox */}
      {onToggleSelect && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(file._id);
          }}
          className={`absolute top-2.5 left-2.5 z-20 w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
            isSelected
              ? 'bg-purple-600 text-white shadow-glow-primary'
              : 'bg-black/40 text-transparent hover:text-white/40 border border-white/20'
          }`}
        >
          <Check className="w-3.5 h-3.5 stroke-[3]" />
        </button>
      )}

      {/* Favorite Toggle Button */}
      {onToggleFavorite && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(file._id);
          }}
          className={`absolute top-2.5 right-2.5 z-20 p-1.5 rounded-lg transition-all ${
            file.isFavorite
              ? 'text-amber-400 bg-amber-400/10 border border-amber-400/20'
              : 'text-slate-400 hover:text-amber-400 bg-black/40 opacity-0 group-hover:opacity-100'
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${file.isFavorite ? 'fill-amber-400' : ''}`} />
        </button>
      )}

      {/* Thumbnail or Visual Icon Header */}
      <div
        onClick={() => onPreview && onPreview(file)}
        className="relative h-36 w-full bg-[#080B14] flex items-center justify-center overflow-hidden cursor-pointer"
      >
        {category === 'image' && (thumbnailUrl || downloadUrl) ? (
          <img
            src={thumbnailUrl || downloadUrl}
            alt={file.originalName}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
            {getCategoryIcon()}
          </div>
        )}

        {/* Voice Note badge indicator */}
        {file.voiceNote?.url && (
          <div className="absolute bottom-2 left-2 z-10 px-2 py-0.5 rounded-full bg-purple-950/80 border border-purple-500/40 text-[10px] text-purple-200 font-medium flex items-center gap-1 backdrop-blur-md">
            <Mic className="w-2.5 h-2.5 text-purple-400" />
            <span>Voice Note</span>
          </div>
        )}

        {/* Hover quick preview button overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 backdrop-blur-xs flex items-center justify-center gap-2 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPreview && onPreview(file);
            }}
            className="p-2 rounded-xl bg-purple-600/80 hover:bg-purple-600 text-white shadow-glow-primary transition-all"
            title="Preview"
          >
            <Eye className="w-4 h-4" />
          </button>
          <a
            href={downloadUrl}
            download={file.originalName}
            onClick={(e) => e.stopPropagation()}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* File Info Body */}
      <div className="p-3.5 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <h4
            onClick={() => onPreview && onPreview(file)}
            className="text-xs font-bold text-slate-200 truncate group-hover:text-purple-300 cursor-pointer transition-colors"
            title={file.originalName}
          >
            {file.originalName}
          </h4>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="uppercase font-semibold text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/5">
            {file.fileExtension}
          </span>
          <span>{formatBytes(file.fileSize)}</span>
        </div>

        {/* Action icons bar */}
        {showActions && (
          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-slate-400">
            <span className="text-[10px] text-slate-500">
              {file.downloadCount > 0 ? `${file.downloadCount} downloads` : 'Ready'}
            </span>

            <div className="flex items-center gap-1">
              <a
                href={downloadUrl}
                download={file.originalName}
                className="p-1 hover:text-purple-400 transition-colors"
                title="Download file"
              >
                <Download className="w-3.5 h-3.5" />
              </a>
              {onDelete && (
                <button
                  onClick={() => onDelete(file._id)}
                  className="p-1 hover:text-red-400 transition-colors"
                  title="Delete file"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileCard;
