import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  Share2,
  Printer,
  Download,
  ExternalLink,
  MessageCircle,
  Send,
  Mail,
  Palette,
  Sparkles,
} from 'lucide-react';
import QRCode from 'qrcode';
import { useToast } from '../context/ToastContext';

export const QRShareModal = ({ collection, isOpen, onClose }) => {
  if (!isOpen || !collection) return null;

  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [template, setTemplate] = useState('gradient');
  const [dotsColor, setDotsColor] = useState('#8B5CF6');
  const [bgColor, setBgColor] = useState('#080B14');
  const [qrDataUrl, setQrDataUrl] = useState('');

  const publicUrl = `${window.location.origin}/public/${collection.shareToken}`;

  // Generate QR on parameter change
  useEffect(() => {
    QRCode.toDataURL(publicUrl, {
      width: 512,
      margin: 2,
      color: {
        dark: dotsColor,
        light: bgColor,
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error(err));
  }, [publicUrl, dotsColor, bgColor]);

  // Preset templates
  const applyTemplate = (name) => {
    setTemplate(name);
    if (name === 'minimal') {
      setDotsColor('#0F172A');
      setBgColor('#FFFFFF');
    } else if (name === 'gradient') {
      setDotsColor('#8B5CF6');
      setBgColor('#080B14');
    } else if (name === 'professional') {
      setDotsColor('#2563EB');
      setBgColor('#0B0F19');
    } else if (name === 'event') {
      setDotsColor('#EC4899');
      setBgColor('#0A0713');
    } else if (name === 'dark') {
      setDotsColor('#E2E8F0');
      setBgColor('#000000');
    } else if (name === 'branded') {
      setDotsColor('#06B6D4');
      setBgColor('#030712');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    toast.success('Collection link copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `SnapShare: ${collection.title}`,
          text: `Check out this collection "${collection.title}" on SnapShare!`,
          url: publicUrl,
        });
        toast.success('Shared successfully!');
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${collection.title} — QR Access Card</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #fff; color: #111; }
            .card { border: 2px solid #8B5CF6; border-radius: 24px; padding: 40px; text-align: center; max-width: 480px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
            h1 { color: #8B5CF6; margin: 0 0 8px 0; font-size: 26px; }
            h2 { margin: 16px 0 8px 0; font-size: 20px; }
            p { color: #64748B; font-size: 14px; margin-bottom: 24px; }
            img { width: 280px; height: 280px; border-radius: 16px; }
            .url { margin-top: 24px; font-weight: bold; color: #8B5CF6; word-break: break-all; }
            .instructions { font-size: 12px; color: #94A3B8; margin-top: 12px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>SnapShare</h1>
            <p>Share Everything. Scan Once.</p>
            <hr style="border: 0; border-top: 1px solid #E2E8F0; margin: 20px 0;" />
            <h2>${collection.title}</h2>
            <p>${collection.description || 'Scan the code below with your smartphone camera to access files.'}</p>
            <img src="${qrDataUrl}" alt="QR Code" />
            <div class="url">${publicUrl}</div>
            <div class="instructions">Point your camera at this QR code to preview and download all files.</div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const downloadPNG = () => {
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `${collection.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_QR.png`;
    a.click();
    toast.success('QR Code downloaded as PNG');
  };

  const downloadPDFCard = () => {
    window.open(`/api/qr/${collection._id}/download/pdf`, '_blank');
    toast.success('Generating printable PDF card...');
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`Check out "${collection.title}" on SnapShare:\n${publicUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const shareTelegram = () => {
    const text = encodeURIComponent(`Check out "${collection.title}" on SnapShare:`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(publicUrl)}&text=${text}`, '_blank');
  };

  const shareEmail = () => {
    const subject = encodeURIComponent(`Shared Collection: ${collection.title}`);
    const body = encodeURIComponent(`Hi,\n\nI have shared a file collection "${collection.title}" with you via SnapShare.\n\nYou can access, preview, and download the files here:\n${publicUrl}\n\nEnjoy!`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl glass-panel rounded-3xl border border-purple-500/20 shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Share Collection</h3>
              <p className="text-xs text-slate-400 truncate max-w-md">{collection.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Center QR Display & Template Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* QR Card Preview */}
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-b from-white/5 to-white/[0.02] border border-white/10 shadow-inner">
            <div className="p-3 rounded-2xl bg-white shadow-glow-primary">
              {qrDataUrl && (
                <img
                  src={qrDataUrl}
                  alt="Collection QR Code"
                  className="w-48 h-48 object-contain rounded-xl"
                />
              )}
            </div>
            <p className="text-[11px] font-semibold text-slate-400 mt-3 uppercase tracking-wider">
              {template.toUpperCase()} STYLE
            </p>
          </div>

          {/* Customization & Templates */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 block">
                QR Style Presets
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['gradient', 'minimal', 'professional', 'event', 'dark', 'branded'].map((t) => (
                  <button
                    key={t}
                    onClick={() => applyTemplate(t)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold capitalize border transition-all ${
                      template === t
                        ? 'bg-purple-600/20 border-purple-500 text-purple-300 shadow-glow-primary'
                        : 'border-white/5 bg-white/5 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 block">
                Direct Social Sharing
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={shareWhatsApp}
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400" /> WhatsApp
                </button>
                <button
                  onClick={shareTelegram}
                  className="flex-1 py-2 px-3 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                >
                  <Send className="w-4 h-4 text-sky-400" /> Telegram
                </button>
                <button
                  onClick={shareEmail}
                  className="flex-1 py-2 px-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                >
                  <Mail className="w-4 h-4 text-purple-400" /> Email
                </button>
              </div>
            </div>

            {/* Export Actions */}
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 block">
                Downloads & Print
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={downloadPNG}
                  className="flex-1 py-2 px-2.5 rounded-xl glass-card hover:border-purple-500/40 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> PNG
                </button>
                <button
                  onClick={downloadPDFCard}
                  className="flex-1 py-2 px-2.5 rounded-xl glass-card hover:border-purple-500/40 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> PDF Card
                </button>
                <button
                  onClick={handlePrint}
                  className="flex-1 py-2 px-2.5 rounded-xl glass-card hover:border-purple-500/40 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Shareable Link Box */}
        <div className="p-3 rounded-2xl glass-card flex items-center justify-between gap-3 border border-white/10">
          <input
            type="text"
            readOnly
            value={publicUrl}
            className="bg-transparent text-xs text-slate-300 flex-1 outline-none px-2 font-mono select-all"
          />
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-glow-primary transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy Link'}
            </button>
            <button
              onClick={handleNativeShare}
              className="p-1.5 rounded-xl glass-card hover:border-purple-500/40 text-slate-300"
              title="Share with device"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRShareModal;
