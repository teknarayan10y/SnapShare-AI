import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  QrCode,
  UploadCloud,
  FileCheck,
  Shield,
  Zap,
  Layers,
  ArrowRight,
  Sparkles,
  Download,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  Archive,
  Code,
  CheckCircle2,
  Lock,
  BarChart3,
  Smartphone,
  ChevronDown,
} from 'lucide-react';

export const LandingPage = () => {
  const [activeFaq, setActiveFaq] = useState(null);

  const supportedTypes = [
    { title: 'Images', ext: 'JPG, PNG, WEBP, GIF, SVG, HEIC', icon: ImageIcon, color: 'text-purple-400', border: 'border-purple-500/20' },
    { title: 'Videos', ext: 'MP4, MOV, MKV, WEBM, AVI, M4V', icon: Video, color: 'text-rose-400', border: 'border-rose-500/20' },
    { title: 'Audio', ext: 'MP3, WAV, AAC, FLAC, OGG, M4A', icon: Music, color: 'text-cyan-400', border: 'border-cyan-500/20' },
    { title: 'Documents', ext: 'PDF, DOCX, XLSX, PPTX, TXT, CSV', icon: FileText, color: 'text-amber-400', border: 'border-amber-500/20' },
    { title: 'Archives', ext: 'ZIP, RAR, 7Z, TAR, GZ', icon: Archive, color: 'text-orange-400', border: 'border-orange-500/20' },
    { title: 'Dev Code', ext: 'JS, TS, PY, HTML, CSS, JSON, SQL', icon: Code, color: 'text-emerald-400', border: 'border-emerald-500/20' },
  ];

  const faqs = [
    {
      q: 'Do recipients need a SnapShare account to scan and download files?',
      a: 'No! Anyone with a smartphone camera or QR scanner can point and instantly access your public collection, view previews, and download individual files or the entire collection as a single ZIP archive without creating an account.',
    },
    {
      q: 'What happens when I add more files to an existing collection?',
      a: 'Your QR code is permanently dynamic. Whenever you upload new files or reorder existing ones, the same printed or distributed QR code will automatically reflect the updated content.',
    },
    {
      q: 'Can I password-protect or set expiration dates on collections?',
      a: 'Yes. SnapShare provides granular security controls including PIN/password encryption, customizable link expiration dates, view-only modes, and instant QR code revocation.',
    },
    {
      q: 'How large can uploaded files and bulk ZIP downloads be?',
      a: 'Free accounts support up to 500 MB per file and 5 GB total vault storage. Pro and Enterprise accounts support massive files up to several gigabytes with background streaming ZIP engines.',
    },
    {
      q: 'How are files stored and secured?',
      a: 'Files are validated using magic byte signatures, quarantined from execution, stored in secure S3/Cloudflare R2 object storage with encrypted keys, and accessed solely via cryptographically signed URLs.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#080B14] text-slate-100 overflow-hidden">
      {/* Glow Orbs Background */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-purple-700/20 via-indigo-600/20 to-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[800px] -left-40 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[1600px] -right-40 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* HERO SECTION */}
      <section className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          {/* Futuristic Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold shadow-glow-primary animate-pulse-slow">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Universal QR Cloud File Exchange Platform
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight leading-[1.1]">
            Share Everything.{' '}
            <span className="gradient-text-purple">Scan Once.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Upload multiple photos, 4K videos, documents, audio tracks, and archives into beautifully branded collections. Generate a universal dynamic QR code for instant scan-and-download anywhere.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-base shadow-glow-primary hover:shadow-glow-secondary flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
            >
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl glass-card hover:border-purple-500/40 text-slate-200 font-semibold text-base flex items-center justify-center gap-2 transition-all"
            >
              Explore Features
            </a>
          </div>

          {/* Trust stats pill */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-8 text-xs font-medium text-slate-400">
            <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-emerald-400" /> End-to-End Cryptography</span>
            <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-purple-400" /> Zero Compression Artifacts</span>
            <span className="flex items-center gap-1.5"><Download className="w-4 h-4 text-cyan-400" /> One-Click Bulk ZIP Stream</span>
          </div>
        </div>

        {/* Floating Cards & Glowing QR Showcase */}
        <div className="mt-16 relative max-w-5xl mx-auto">
          <div className="glass-panel rounded-3xl border border-white/10 p-6 sm:p-10 shadow-2xl relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left: Interactive Uploader Simulation */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500" />
                    <span className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="ml-2 text-xs font-mono text-slate-400">snapshare://vault/live-demo</span>
                  </div>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 font-semibold border border-emerald-500/20">
                    Active Collection
                  </span>
                </div>

                {/* Floating Item Previews */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-2.5 transform hover:scale-105 transition-transform">
                    <ImageIcon className="w-6 h-6 text-purple-400" />
                    <div className="truncate">
                      <p className="text-xs font-semibold text-white truncate">Ceremony_4K.jpg</p>
                      <p className="text-[10px] text-slate-400">4.8 MB • Image</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-2.5 transform hover:scale-105 transition-transform">
                    <Video className="w-6 h-6 text-rose-400" />
                    <div className="truncate">
                      <p className="text-xs font-semibold text-white truncate">Vows_Film.mov</p>
                      <p className="text-[10px] text-slate-400">142 MB • Video</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-2.5 transform hover:scale-105 transition-transform">
                    <FileText className="w-6 h-6 text-amber-400" />
                    <div className="truncate">
                      <p className="text-xs font-semibold text-white truncate">Catalog_2026.pdf</p>
                      <p className="text-[10px] text-slate-400">1.2 MB • Doc</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Layers className="w-5 h-5 text-purple-400" />
                    <span className="text-xs font-semibold text-slate-200">12 Files Processed • 148 MB Total</span>
                  </div>
                  <span className="text-xs font-bold text-cyan-400 flex items-center gap-1">
                    Ready to Scan <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </span>
                </div>
              </div>

              {/* Right: Glowing Dynamic QR Visual */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 rounded-3xl bg-gradient-to-br from-[#0B0F19] to-[#05070D] border border-purple-500/30 shadow-glow-primary">
                <div className="relative group p-4 rounded-2xl bg-white shadow-2xl">
                  {/* Real QR SVG visual */}
                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://snapshare.io/demo&color=8B5CF6&bgcolor=FFFFFF"
                    alt="Demo QR"
                    className="w-44 h-44 rounded-xl"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/60 backdrop-blur-xs rounded-2xl transition-opacity">
                    <Link
                      to="/register"
                      className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold shadow-glow-primary"
                    >
                      Try Live QR
                    </Link>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-sm font-bold text-white">Universal Share QR</p>
                  <p className="text-xs text-slate-400 mt-0.5">Scan with any phone camera to preview</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/5">
        <div className="text-center space-y-3 mb-16">
          <p className="text-xs font-bold uppercase tracking-wider text-purple-400">Streamlined Architecture</p>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white">How SnapShare Works</h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Three intuitive steps from high-volume multi-file upload to instant frictionless smartphone distribution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl glass-panel border border-white/5 space-y-4 hover:border-purple-500/30 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20 font-extrabold text-lg">
              01
            </div>
            <h3 className="text-xl font-bold text-white">Create & Upload</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Drag and drop images, raw videos, documents, or developer archives. Automatic SHA-256 duplicate detection and WebP thumbnail generation.
            </p>
          </div>

          <div className="p-8 rounded-3xl glass-panel border border-white/5 space-y-4 hover:border-purple-500/30 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20 font-extrabold text-lg">
              02
            </div>
            <h3 className="text-xl font-bold text-white">Generate Dynamic QR</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Customize colors, logos, and event presets. Download high-resolution PNG, vector SVG, or printable PDF display cards with zero scanning distortion.
            </p>
          </div>

          <div className="p-8 rounded-3xl glass-panel border border-white/5 space-y-4 hover:border-purple-500/30 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 font-extrabold text-lg">
              03
            </div>
            <h3 className="text-xl font-bold text-white">Scan & Download All</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Visitors scan with any smartphone camera. Beautiful in-browser previews for photos, media, and PDFs. One-click streaming bulk ZIP download engine.
            </p>
          </div>
        </div>
      </section>

      {/* SUPPORTED FILE TYPES MATRIX */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/5">
        <div className="text-center space-y-3 mb-16">
          <p className="text-xs font-bold uppercase tracking-wider text-cyan-400">Universal Compatibility</p>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white">Supported File Ecosystem</h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            From RAW photography and 4K cinema to CAD, spreadsheets, and source code packages.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {supportedTypes.map((t, idx) => {
            const Icon = t.icon;
            return (
              <div
                key={idx}
                className={`p-6 rounded-3xl glass-panel border ${t.border} space-y-3 hover:scale-[1.02] transition-transform`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl bg-white/5 ${t.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white">{t.title}</h3>
                </div>
                <p className="text-xs font-mono text-slate-400 leading-relaxed">{t.ext}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t border-white/5">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Frequently Asked Questions</h2>
          <p className="text-slate-400 text-sm">Everything you need to know about SnapShare QR cloud sharing.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((f, i) => (
            <div
              key={i}
              className="rounded-2xl glass-panel border border-white/5 overflow-hidden transition-all"
            >
              <button
                onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                className="w-full p-5 text-left flex items-center justify-between text-sm font-bold text-white hover:text-purple-300 transition-colors"
              >
                <span>{f.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-purple-400 transition-transform ${activeFaq === i ? 'rotate-180' : ''}`}
                />
              </button>
              {activeFaq === i && (
                <div className="px-5 pb-5 text-xs text-slate-400 leading-relaxed border-t border-white/5 pt-3">
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* BOTTOM CTA BANNER */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="p-10 sm:p-14 rounded-3xl bg-gradient-to-r from-purple-900/40 via-indigo-900/40 to-cyan-900/40 border border-purple-500/30 text-center space-y-6 shadow-glow-primary relative overflow-hidden">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white">
            Ready to upgrade your file sharing?
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
            Join thousands of creators, event organizers, and software teams using SnapShare to distribute files with effortless QR scanning.
          </p>
          <div className="pt-2">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-glow-primary transition-all"
            >
              Create Your Free Account <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
