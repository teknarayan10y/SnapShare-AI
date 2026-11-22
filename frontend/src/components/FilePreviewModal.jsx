import React, { useState } from 'react';
import VoiceNoteWidget from './VoiceNoteWidget';
import {
  X,
  Download,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  FileCode,
  Music,
  Video,
  Archive,
  Image as ImageIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

export const FilePreviewModal = ({
  file,
  isOpen,
  onClose,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
  isPublic = false,
}) => {
  if (!isOpen || !file) return null;

  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const resetView = () => {
    setZoom(1);
    setRotation(0);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const category = file.metadata?.aiCategory || file.category || 'other';
  const downloadUrl = file.downloadUrl || `/api/files/${file._id}/download`;
  const mediaSource = file.cloudinaryUrl || downloadUrl;
  const imageSource = mediaSource;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-5xl max-h-[90vh] glass-panel rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#080B14]/80">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
              {category === 'image' && <ImageIcon className="w-5 h-5" />}
              {category === 'video' && <Video className="w-5 h-5" />}
              {category === 'audio' && <Music className="w-5 h-5" />}
              {category === 'document' && <FileText className="w-5 h-5" />}
              {category === 'code' && <FileCode className="w-5 h-5" />}
              {category === 'archive' && <Archive className="w-5 h-5" />}
            </div>
            <div className="truncate">
              <h3 className="text-sm sm:text-base font-bold text-white truncate">{file.originalName}</h3>
              <p className="text-xs text-slate-400">
                {formatBytes(file.fileSize)} • {file.fileExtension?.toUpperCase()} • {file.mimeType}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Image control tools */}
            {category === 'image' && (
              <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/5 mr-2">
                <button
                  onClick={handleZoomIn}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={handleZoomOut}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={handleRotate}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                  title="Rotate 90deg"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>
            )}

            <a
              href={downloadUrl}
              download={file.originalName}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-glow-primary transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </a>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="relative flex-1 overflow-auto p-4 sm:p-8 flex items-center justify-center min-h-[350px] bg-[#05070D]">
          {/* Navigation Arrows */}
          {hasPrev && (
            <button
              onClick={() => {
                resetView();
                onPrev();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2.5 rounded-full glass-card hover:bg-purple-600/30 text-white transition-all"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {hasNext && (
            <button
              onClick={() => {
                resetView();
                onNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2.5 rounded-full glass-card hover:bg-purple-600/30 text-white transition-all"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* 1. Image Viewer */}
          {category === 'image' && (
            <div className="overflow-hidden flex items-center justify-center transition-all">
              <img
                src={imageSource}
                alt={file.originalName}
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transition: 'transform 0.2s ease-out',
                }}
                className="max-h-[65vh] max-w-full rounded-xl object-contain shadow-2xl"
              />
            </div>
          )}

          {/* 2. Video Player */}
          {category === 'video' && (
            <div className="w-full max-w-3xl rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/10">
              <video
                controls
                autoPlay
                className="w-full max-h-[60vh] object-contain"
                src={mediaSource}
              >
                Your browser does not support HTML5 video preview.
              </video>
            </div>
          )}

          {/* 3. Audio Player */}
          {category === 'audio' && (
            <div className="w-full max-w-md p-8 glass-panel rounded-3xl border border-purple-500/20 text-center space-y-6">
              <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-tr from-purple-600 to-cyan-500 p-[1px] shadow-glow-primary">
                <div className="w-full h-full bg-[#0B0F19] rounded-[23px] flex items-center justify-center">
                  <Music className="w-10 h-10 text-cyan-400 animate-pulse" />
                </div>
              </div>
              <div>
                <h4 className="text-lg font-bold text-white truncate">{file.originalName}</h4>
                <p className="text-xs text-purple-400 mt-1">High-Fidelity Audio Stream</p>
              </div>
              <audio controls className="w-full rounded-xl" src={mediaSource}>
                Your browser does not support audio playback.
              </audio>
            </div>
          )}

          {/* 4. PDF Previewer */}
          {category === 'document' && file.fileExtension === 'pdf' && (
            <div className="w-full h-[65vh] rounded-2xl overflow-hidden border border-white/10 bg-slate-900">
              <iframe
                src={`${mediaSource}#toolbar=1`}
                title={file.originalName}
                className="w-full h-full border-none"
              />
            </div>
          )}

          {/* 5. Document Non-PDF */}
          {category === 'document' && file.fileExtension !== 'pdf' && (
            <div className="text-center space-y-4 max-w-md p-8 glass-panel rounded-3xl border border-white/10">
              <FileText className="w-16 h-16 mx-auto text-cyan-400" />
              <h4 className="text-lg font-bold text-white">{file.originalName}</h4>
              <p className="text-xs text-slate-400">
                Safe browser preview is optimized for PDF. You can download this document directly to inspect or edit in your local office suite.
              </p>
              <a
                href={downloadUrl}
                download={file.originalName}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-glow-primary transition-all"
              >
                <Download className="w-4 h-4" /> Download Document
              </a>
            </div>
          )}

          {/* 6. Code & Text */}
          {category === 'code' && (
            <div className="w-full max-w-3xl max-h-[60vh] overflow-auto p-6 rounded-2xl bg-[#090D16] border border-white/10 font-mono text-xs text-purple-200">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/5 text-[11px] text-slate-400">
                <span>Language: {file.fileExtension.toUpperCase()}</span>
                <span>Read-Only Preview</span>
              </div>
              <pre className="whitespace-pre-wrap leading-relaxed">
                {file.metadata?.aiDescription || `// Source file: ${file.originalName}\n// Click download to view complete source repository.`}
              </pre>
            </div>
          )}

          {/* 7. Archive */}
          {category === 'archive' && (
            <div className="text-center space-y-4 max-w-md p-8 glass-panel rounded-3xl border border-white/10">
              <Archive className="w-16 h-16 mx-auto text-amber-400" />
              <h4 className="text-lg font-bold text-white">{file.originalName}</h4>
              <p className="text-xs text-slate-400">
                Secure compressed package ({formatBytes(file.fileSize)}). To maintain absolute host isolation, archives are not automatically extracted server-side.
              </p>
              <a
                href={downloadUrl}
                download={file.originalName}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-glow-primary transition-all"
              >
                <Download className="w-4 h-4" /> Download Archive
              </a>
            </div>
          )}
        </div>

        {/* Voice Memory Note Widget */}
        <div className="px-6 py-3 border-t border-white/10 bg-[#070A12]/90">
          <VoiceNoteWidget file={file} isPublic={isPublic} />
        </div>

        {/* Modal Footer / AI Insights */}
        {file.metadata && (
          <div className="px-6 py-3 border-t border-white/10 bg-[#080B14]/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-300">AI Tags:</span>
              {(file.metadata.aiTags || []).map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px]"
                >
                  #{tag}
                </span>
              ))}
            </div>
            {file.metadata.aiDescription && (
              <span className="text-slate-400 italic text-[11px] truncate max-w-md">
                "{file.metadata.aiDescription}"
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FilePreviewModal;
