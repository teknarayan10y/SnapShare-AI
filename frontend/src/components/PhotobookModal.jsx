import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Printer,
  Sparkles,
  X,
  Heart,
} from 'lucide-react';
import { aiAPI, publicAPI } from '../services/api';

export const PhotobookModal = ({ isOpen, onClose, collectionId, isPublic = false }) => {
  const [loading, setLoading] = useState(true);
  const [book, setBook] = useState(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchBook();
    }
  }, [isOpen, collectionId]);

  const fetchBook = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = isPublic
        ? await publicAPI.getPhotobook(collectionId)
        : await aiAPI.getPhotobook(collectionId);

      if (res.data?.success) {
        setBook(res.data.photobook);
        setPageIndex(0);
      } else {
        setError('Could not generate photobook layout');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load photobook');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const pages = book?.pages || [];
  const currentPage = pages[pageIndex] || null;
  const currentLayout = currentPage ? (currentPage.type || currentPage.layoutType) : null;
  const coverPhotoUrl = currentPage ? (currentPage.photos?.[0]?.url || currentPage.heroImage || '') : '';

  const handleNext = () => {
    if (pageIndex < pages.length - 1) setPageIndex((p) => p + 1);
  };

  const handlePrev = () => {
    if (pageIndex > 0) setPageIndex((p) => p - 1);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* PRINT STYLESHEET: Ensures ONLY the clean photobook album prints with 1 spread per page */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 8mm 12mm;
          }
          html, body {
            background: #ffffff !important;
            color: #111827 !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Hide entire web app UI, headers, and modal backdrop */
          #root,
          .photobook-screen-modal,
          .no-print {
            display: none !important;
            visibility: hidden !important;
          }
          /* Show ONLY the dedicated printable photobook album */
          #photobook-print-container {
            display: block !important;
            visibility: visible !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: #ffffff !important;
            color: #111827 !important;
          }
          #photobook-print-container * {
            visibility: visible !important;
          }
          .photobook-print-page {
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            width: 100% !important;
            min-height: 94vh !important;
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            padding: 16px 20px !important;
            background: #ffffff !important;
          }
          .photobook-print-page:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
        }
      `}</style>

      {/* 1. ON-SCREEN INTERACTIVE MODAL */}
      <div className="photobook-screen-modal fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in print:hidden">
        <div className="relative w-full max-w-5xl h-[92vh] glass-panel rounded-3xl border border-white/10 bg-[#0B0F19] p-4 sm:p-6 shadow-2xl flex flex-col overflow-hidden">
          {/* Top Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-white/5 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-glow-primary">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    {book?.title || 'Auto-Curated Photobook'}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-bold">
                    AI Curated
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {book?.totalPages || 0} Spreads • Story-sequenced from event highlights
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-xs font-semibold transition-all border border-purple-500/30 shadow-sm"
                title="Print or Save as PDF (All Pages)"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export PDF</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto py-4 flex flex-col items-center justify-center">
            {loading ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto" />
                <p className="text-sm font-semibold text-white">AI is composing your photobook...</p>
                <p className="text-xs text-slate-400">
                  Analyzing photo compositions, facial expressions, and candid event moments
                </p>
              </div>
            ) : error ? (
              <div className="text-center py-12 max-w-md">
                <p className="text-sm text-red-400 font-semibold mb-2">{error}</p>
                <button
                  onClick={fetchBook}
                  className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold"
                >
                  Retry
                </button>
              </div>
            ) : !currentPage ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No photos found to curate in this collection.
              </div>
            ) : (
              <div className="w-full max-w-4xl h-full flex flex-col justify-between">
                {/* Photobook Spread Canvas */}
                <div className="flex-1 rounded-2xl bg-gradient-to-b from-[#141B2D] to-[#0A0D18] border border-white/10 shadow-2xl p-4 sm:p-6 flex flex-col justify-between overflow-hidden relative">
                  {/* Header of spread */}
                  <div className="flex items-center justify-between pb-3 border-b border-white/5 text-xs text-slate-400">
                    <span className="font-semibold text-purple-300 uppercase tracking-wider text-[11px]">
                      {currentPage.spreadTitle || currentPage.title || 'Spread'}
                    </span>
                    <span>
                      Page {pageIndex + 1} of {pages.length}
                    </span>
                  </div>

                  {/* SPREAD CONTENT BY TYPE */}
                  <div className="flex-1 py-3 flex items-center justify-center">
                    {/* COVER SPREAD */}
                    {currentLayout === 'cover' && (
                      <div className="w-full h-full flex flex-col items-center justify-center text-center space-y-3">
                        {coverPhotoUrl && (
                          <div className="w-full max-h-[46vh] rounded-2xl overflow-hidden shadow-2xl border border-white/10 p-2 bg-[#0d1222] flex items-center justify-center">
                            <img
                              src={coverPhotoUrl}
                              alt="Cover"
                              className="max-h-[42vh] max-w-full object-contain rounded-xl"
                            />
                          </div>
                        )}
                        <div>
                          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                            {book?.title}
                          </h2>
                          <p className="text-xs sm:text-sm text-purple-300 mt-0.5">
                            {book?.description || 'A timeless collection of captured memories'}
                          </p>
                          {currentPage.photos?.[0]?.caption && (
                            <p className="text-xs text-purple-200/90 italic mt-2 font-medium">
                              "{currentPage.photos[0].caption}"
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* DUO SPREAD (2 Side by Side) */}
                    {currentLayout === 'duo_spread' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full h-full items-center">
                        {currentPage.photos?.map((photo, i) => (
                          <div
                            key={i}
                            className="h-full flex flex-col items-center justify-between rounded-2xl overflow-hidden bg-[#0d1222] border border-white/10 p-3 shadow-xl"
                          >
                            <div className="w-full flex-1 flex items-center justify-center overflow-hidden rounded-xl bg-black/40">
                              <img
                                src={photo.url}
                                alt="Duo moment"
                                className="max-h-[42vh] max-w-full object-contain rounded-lg"
                              />
                            </div>
                            {photo.caption && (
                              <p className="text-xs text-purple-200/95 italic mt-2 text-center px-2 font-medium">
                                "{photo.caption}"
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* HERO PORTRAIT */}
                    {currentLayout === 'hero_portrait' && (
                      <div className="w-full h-full flex flex-col items-center justify-between space-y-3">
                        {currentPage.photos?.[0] && (
                          <div className="max-w-xl flex-1 flex items-center justify-center rounded-2xl overflow-hidden shadow-2xl border border-white/10 p-3 bg-[#0d1222]">
                            <img
                              src={currentPage.photos[0].url}
                              alt="Hero Portrait"
                              className="max-h-[46vh] max-w-full object-contain rounded-xl"
                            />
                          </div>
                        )}
                        {currentPage.photos?.[0]?.caption && (
                          <p className="text-xs sm:text-sm text-purple-200/95 italic text-center font-medium max-w-md">
                            "{currentPage.photos[0].caption}"
                          </p>
                        )}
                      </div>
                    )}

                    {/* GROUP SPREAD */}
                    {currentLayout === 'group_spread' && (
                      <div className="w-full h-full flex flex-col items-center justify-between space-y-3">
                        {currentPage.photos?.[0] && (
                          <div className="w-full flex-1 flex items-center justify-center rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-[#0d1222] p-3">
                            <img
                              src={currentPage.photos[0].url}
                              alt="Group Celebration"
                              className="max-h-[46vh] max-w-full object-contain rounded-xl"
                            />
                          </div>
                        )}
                        {currentPage.photos?.[0]?.caption && (
                          <p className="text-xs sm:text-sm text-purple-200/95 italic text-center font-medium max-w-lg">
                            "{currentPage.photos[0].caption}"
                          </p>
                        )}
                      </div>
                    )}

                    {/* MOSAIC SPREAD (Grid of 4) */}
                    {currentLayout === 'mosaic_spread' && (
                      <div className="grid grid-cols-2 gap-3 w-full h-full items-center">
                        {currentPage.photos?.map((photo, i) => (
                          <div
                            key={i}
                            className="h-[27vh] sm:h-[29vh] rounded-2xl overflow-hidden bg-[#0d1222] border border-white/10 p-2.5 flex flex-col items-center justify-between shadow-xl hover:border-purple-500/40 transition-all"
                          >
                            <div className="w-full flex-1 flex items-center justify-center overflow-hidden rounded-xl bg-black/50">
                              <img
                                src={photo.url}
                                alt="Candid moment"
                                className="w-full h-full object-contain"
                              />
                            </div>
                            {photo.caption && (
                              <p className="text-[11px] sm:text-xs text-purple-200/90 italic text-center px-1 truncate w-full mt-1.5 font-medium">
                                "{photo.caption}"
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* BACK COVER */}
                    {currentLayout === 'back_cover' && (
                      <div className="w-full h-full flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                          <Heart className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-white">Thank You For Sharing The Memories</h3>
                        <p className="text-xs text-slate-400 max-w-sm">
                          Curated automatically by SnapShare AI with intelligent facial recognition, composition matching, and neural sequencing.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Spread Caption Footer */}
                  {currentPage.caption && (
                    <div className="pt-2 border-t border-white/5 text-center">
                      <p className="text-xs text-slate-400 italic">"{currentPage.caption}"</p>
                    </div>
                  )}
                </div>

                {/* Navigation Controls */}
                <div className="flex items-center justify-between pt-4">
                  <button
                    onClick={handlePrev}
                    disabled={pageIndex === 0}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-semibold transition-all border border-white/5"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous Spread
                  </button>

                  {/* Page dots */}
                  <div className="flex items-center gap-1.5">
                    {pages.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setPageIndex(idx)}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${
                          idx === pageIndex
                            ? 'w-6 bg-purple-500 shadow-glow-primary'
                            : 'bg-white/20 hover:bg-white/40'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={handleNext}
                    disabled={pageIndex >= pages.length - 1}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-semibold transition-all shadow-glow-primary"
                  >
                    Next Spread
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. DEDICATED PRINTABLE ALBUM: All 7 Spreads rendered sequentially for Print / Export PDF */}
      <div id="photobook-print-container" className="hidden print:block w-full bg-white text-gray-900">
        {pages.map((page, index) => {
          const layout = page.type || page.layoutType;
          const coverUrl = page.photos?.[0]?.url || page.heroImage || '';

          return (
            <div key={index} className="photobook-print-page">
              {/* Minimalist Top Album Header */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <span className="text-purple-700 font-bold">{book?.title || 'SnapShare Event Photobook'}</span>
                <span>
                  {page.spreadTitle || page.title || `Spread ${index + 1}`} • Page {index + 1} of {pages.length}
                </span>
              </div>

              {/* Spread Photo Content */}
              <div className="flex-1 flex flex-col items-center justify-center py-4">
                {/* Cover Print */}
                {layout === 'cover' && (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center space-y-4">
                    {coverUrl && (
                      <div className="w-full max-h-[140mm] flex items-center justify-center overflow-hidden rounded-lg">
                        <img
                          src={coverUrl}
                          alt="Cover"
                          className="max-h-[140mm] max-w-full object-contain rounded-lg shadow-sm"
                        />
                      </div>
                    )}
                    <div>
                      <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">{book?.title}</h1>
                      <p className="text-xs font-semibold text-purple-700 mt-1">
                        {book?.description || 'Curated Keepsake Photobook'}
                      </p>
                      {page.photos?.[0]?.caption && (
                        <p className="text-xs text-gray-600 italic mt-2 max-w-lg mx-auto">
                          "{page.photos[0].caption}"
                        </p>
                      )}
                      {page.date && <p className="text-[11px] text-gray-400 mt-1">{page.date}</p>}
                    </div>
                  </div>
                )}

                {/* Duo Print */}
                {layout === 'duo_spread' && (
                  <div className="grid grid-cols-2 gap-6 w-full h-full items-center">
                    {page.photos?.map((photo, i) => (
                      <div key={i} className="flex flex-col items-center justify-center h-full">
                        <div className="w-full max-h-[135mm] flex items-center justify-center overflow-hidden rounded-lg bg-gray-50 border border-gray-200 p-1">
                          <img
                            src={photo.url}
                            alt="Duo"
                            className="max-h-[130mm] max-w-full object-contain rounded"
                          />
                        </div>
                        {photo.caption && (
                          <p className="text-xs text-gray-700 italic mt-2 text-center max-w-sm">
                            "{photo.caption}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Hero Portrait Print */}
                {layout === 'hero_portrait' && (
                  <div className="w-full h-full flex flex-col items-center justify-center space-y-3">
                    {page.photos?.[0] && (
                      <div className="max-h-[140mm] flex items-center justify-center overflow-hidden rounded-lg bg-gray-50 border border-gray-200 p-1">
                        <img
                          src={page.photos[0].url}
                          alt="Portrait"
                          className="max-h-[135mm] max-w-full object-contain rounded"
                        />
                      </div>
                    )}
                    {page.photos?.[0]?.caption && (
                      <p className="text-sm text-gray-700 italic text-center max-w-md font-medium">
                        "{page.photos[0].caption}"
                      </p>
                    )}
                  </div>
                )}

                {/* Group Print */}
                {layout === 'group_spread' && (
                  <div className="w-full h-full flex flex-col items-center justify-center space-y-3">
                    {page.photos?.[0] && (
                      <div className="w-full max-h-[140mm] flex items-center justify-center overflow-hidden rounded-lg bg-gray-50 border border-gray-200 p-1">
                        <img
                          src={page.photos[0].url}
                          alt="Group"
                          className="max-h-[135mm] max-w-full object-contain rounded"
                        />
                      </div>
                    )}
                    {page.photos?.[0]?.caption && (
                      <p className="text-sm text-gray-700 italic text-center max-w-lg font-medium">
                        "{page.photos[0].caption}"
                      </p>
                    )}
                  </div>
                )}

                {/* Mosaic Print (4 Photos in 2x2 Grid) */}
                {layout === 'mosaic_spread' && (
                  <div className="grid grid-cols-2 gap-4 w-full h-full items-center">
                    {page.photos?.map((photo, i) => (
                      <div key={i} className="flex flex-col items-center justify-center">
                        <div className="w-full max-h-[65mm] flex items-center justify-center overflow-hidden rounded-lg bg-gray-50 border border-gray-200 p-1">
                          <img
                            src={photo.url}
                            alt="Candid"
                            className="max-h-[60mm] max-w-full object-contain rounded"
                          />
                        </div>
                        {photo.caption && (
                          <p className="text-[10.5px] text-gray-700 italic mt-1 text-center truncate max-w-xs font-medium">
                            "{photo.caption}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Back Cover Print */}
                {layout === 'back_cover' && (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mx-auto border border-purple-200">
                      <Heart className="w-8 h-8 text-purple-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {page.title || 'Thank You For Sharing The Memories'}
                    </h2>
                    <p className="text-xs text-gray-600 max-w-md mx-auto">
                      {page.subtitle || 'Curated automatically by SnapShare AI with intelligent facial recognition and composition matching.'}
                    </p>
                    <div className="text-[10px] text-gray-400 mt-6 uppercase tracking-wider font-semibold">
                      SnapShare AI 2.0 • Digital Event Keepsake
                    </div>
                  </div>
                )}
              </div>

              {/* Minimalist Bottom Caption Margin */}
              {page.caption && (
                <div className="pt-2 border-t border-gray-200 text-center">
                  <p className="text-xs text-gray-500 italic">"{page.caption}"</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
};

export default PhotobookModal;
