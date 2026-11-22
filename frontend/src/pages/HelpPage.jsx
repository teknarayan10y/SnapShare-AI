import React, { useState } from 'react';
import { HelpCircle, ChevronDown, Mail, MessageCircle, Book, Zap, Shield, Upload, QrCode, Download } from 'lucide-react';

export const HelpPage = () => {
  const [openFaq, setOpenFaq] = useState(null);

  const sections = [
    {
      icon: Upload,
      title: 'File Uploading',
      color: 'text-purple-400',
      faqs: [
        { q: 'What file types can I upload?', a: 'SnapShare supports images (JPG, PNG, WEBP, GIF, SVG, HEIC), videos (MP4, MOV, MKV, WEBM), audio (MP3, WAV, AAC, FLAC), documents (PDF, DOCX, XLSX, PPTX, TXT), archives (ZIP, RAR, 7Z), code files (JS, TS, PY, HTML, JSON), and more.' },
        { q: 'What is the maximum file size per upload?', a: 'Free tier accounts can upload files up to 500 MB per file. Pro accounts support files up to 2 GB. Enterprise plans support bulk uploads of files up to several gigabytes per file.' },
        { q: 'How does duplicate file detection work?', a: 'SnapShare computes a SHA-256 cryptographic hash of every uploaded file. If an identical file (by content, not name) already exists in the same collection, it is flagged as a duplicate and not stored twice.' },
        { q: 'Can I upload entire folders?', a: 'Yes! On supported browsers (Chrome, Edge), use the "Select Folder" button in the uploader to recursively upload all files within a folder structure.' },
      ],
    },
    {
      icon: QrCode,
      title: 'QR Codes & Sharing',
      color: 'text-cyan-400',
      faqs: [
        { q: 'Do QR codes update when I add new files?', a: 'Yes! SnapShare QR codes are permanently dynamic. They always point to the same collection URL, which shows the latest files. You never need to reprint or redistribute a new QR code after adding more files.' },
        { q: 'What QR formats can I download?', a: 'You can download your QR code as a high-resolution PNG image, an infinitely scalable SVG vector file, or a beautiful print-ready PDF card with collection title, description, and scanning instructions.' },
        { q: 'How do I revoke a shared QR code?', a: 'Navigate to your collection\'s QR Code page and click "Revoke & Regenerate QR". This generates a new unique share token, instantly invalidating all previously distributed QR codes and links.' },
        { q: 'Can I add my logo to the QR code?', a: 'Yes! Pro and Enterprise plans can embed a custom logo URL in the center of the QR code. The QR uses high error-correction (Level H) to remain readable even with a logo overlay.' },
      ],
    },
    {
      icon: Shield,
      title: 'Security & Privacy',
      color: 'text-emerald-400',
      faqs: [
        { q: 'How are files stored securely?', a: 'All files are stored in object storage (Cloudflare R2 or AWS S3) with access-controlled signed URLs. File binaries are never stored in the MongoDB database — only metadata and storage keys.' },
        { q: 'Are uploaded files scanned for malware?', a: 'All uploads are validated using cryptographic magic byte file signature inspection to prevent disguised executables. Dangerous file types (EXE, DLL, ELF, Mach-O binaries) are blocked at upload time.' },
        { q: 'Who can see my files?', a: 'Public collections are accessible to anyone with the link or QR. Password-protected collections require a valid password to unlock. Private collections are only accessible to the owner when logged in.' },
        { q: 'Does SnapShare store my IP address?', a: 'For analytics, only a truncated one-way SHA-256 hash of visitor IPs is stored (non-reversible). We do not store raw IPs or any personally identifiable visitor data.' },
      ],
    },
    {
      icon: Download,
      title: 'Downloads & ZIP',
      color: 'text-amber-400',
      faqs: [
        { q: 'Can visitors download all files at once?', a: 'Yes! On any public collection page, visitors can click "Download All (ZIP)" to trigger the streaming ZIP engine. All files are packaged into a single archive with original filenames preserved.' },
        { q: 'How large can a bulk ZIP be?', a: 'Free accounts support ZIP downloads up to 2 GB. For very large collections, the system automatically prepares the archive as a background job and notifies you when it\'s ready.' },
        { q: 'Can I disable downloads on a collection?', a: 'Yes. When creating or editing a collection, disable the "Allow downloads" toggle. Visitors can still view and preview files but cannot download them individually or in bulk.' },
      ],
    },
  ];

  let globalIdx = 0;

  return (
    <div className="min-h-screen bg-[#080B14] text-slate-100 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 space-y-16">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold">
            <HelpCircle className="w-3.5 h-3.5" />
            Knowledge Base & FAQ
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white">Help & Support</h1>
          <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            Everything you need to know about SnapShare — from uploading files to generating custom QR codes and managing cloud storage.
          </p>
        </div>

        {/* Quick Navigation Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {sections.map((s, i) => {
            const Icon = s.icon;
            return (
              <a
                key={i}
                href={`#section-${i}`}
                className="p-4 rounded-2xl glass-card border border-white/5 hover:border-purple-500/30 transition-all text-center space-y-2"
              >
                <Icon className={`w-6 h-6 mx-auto ${s.color}`} />
                <p className="text-xs font-bold text-white">{s.title}</p>
              </a>
            );
          })}
        </div>

        {/* FAQ Sections */}
        {sections.map((section, sIdx) => {
          const Icon = section.icon;
          return (
            <div key={sIdx} id={`section-${sIdx}`} className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                <div className={`p-2 rounded-xl bg-white/5 ${section.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-extrabold text-white">{section.title}</h2>
              </div>

              <div className="space-y-3">
                {section.faqs.map((faq, fIdx) => {
                  const idx = `${sIdx}-${fIdx}`;
                  return (
                    <div key={fIdx} className="rounded-2xl glass-panel border border-white/5 overflow-hidden">
                      <button
                        onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                        className="w-full p-5 text-left flex items-start justify-between gap-4 text-sm font-semibold text-white hover:text-purple-300 transition-colors"
                      >
                        <span>{faq.q}</span>
                        <ChevronDown
                          className={`w-4 h-4 text-purple-400 shrink-0 mt-0.5 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`}
                        />
                      </button>
                      {openFaq === idx && (
                        <div className="px-5 pb-5 text-xs text-slate-400 leading-relaxed border-t border-white/5 pt-3 animate-in fade-in">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Contact Support Section */}
        <div className="p-10 rounded-3xl glass-panel border border-purple-500/20 text-center space-y-5">
          <Mail className="w-10 h-10 text-purple-400 mx-auto" />
          <h3 className="text-xl font-extrabold text-white">Still need help?</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Our support team responds within 24 hours. Pro and Enterprise accounts get priority queue access.
          </p>
          <a
            href="mailto:support@snapshare.io"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold shadow-glow-primary transition-all"
          >
            <Mail className="w-4 h-4" /> Email Support
          </a>
        </div>
      </div>
    </div>
  );
};
