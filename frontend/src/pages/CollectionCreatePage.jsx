import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collectionAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  FolderPlus,
  Lock,
  Globe,
  Calendar,
  Sparkles,
  ArrowRight,
  Shield,
  Upload,
  Check,
} from 'lucide-react';

export const CollectionCreatePage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [template, setTemplate] = useState('standard');
  const [accessType, setAccessType] = useState('public');
  const [password, setPassword] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [allowDownloads, setAllowDownloads] = useState(true);
  const [allowCollaborativeUpload, setAllowCollaborativeUpload] = useState(false);
  const [coverImage, setCoverImage] = useState('');
  const [loading, setLoading] = useState(false);

  const templates = [
    { id: 'standard', name: 'Standard Vault', desc: 'Universal clean sharing for general files', icon: '📁' },
    { id: 'wedding', name: 'Wedding Album', desc: 'Elegant romantic theme with guest uploads', icon: '💍' },
    { id: 'birthday', name: 'Birthday Party', desc: 'Celebration preset with vibrant highlights', icon: '🎉' },
    { id: 'business', name: 'Executive Suite', desc: 'Formal confidential investor/client folder', icon: '💼' },
    { id: 'education', name: 'Course & Lecture', desc: 'Structured syllabus, slides & assignments', icon: '🎓' },
    { id: 'travel', name: 'Travel Explorer', desc: 'Chronological trip media & itinerary', icon: '✈️' },
    { id: 'project', name: 'Engineering Project', desc: 'Code repositories, specs & deliverables', icon: '🚀' },
  ];

  const presetCovers = [
    'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title) return toast.warning('Collection title is required');

    if (accessType === 'password' && (!password || password.length < 4)) {
      return toast.warning('Password must be at least 4 characters');
    }

    setLoading(true);
    try {
      const res = await collectionAPI.create({
        title,
        description,
        category,
        template,
        accessType,
        password,
        eventDate: eventDate || undefined,
        expiresAt: expiresAt || null,
        allowDownloads,
        allowCollaborativeUpload,
        coverImage,
      });

      if (res.data.success) {
        toast.success(`Collection "${title}" created successfully!`);
        navigate(`/dashboard/upload?collectionId=${res.data.collection._id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create collection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in pb-16">
      {/* Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-bold uppercase tracking-wider">
          <FolderPlus className="w-3 h-3 text-purple-400" />
          New Storage Collection
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Create Smart Collection</h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Configure security rules, customizable templates, and automatic QR access links.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Template Selection */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider text-slate-300">
            1. Select Collection Template
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {templates.map((t) => (
              <div
                key={t.id}
                onClick={() => {
                  setTemplate(t.id);
                  setCategory(t.id === 'standard' ? 'general' : t.id);
                }}
                className={`p-4 rounded-2xl glass-card border cursor-pointer transition-all ${
                  template === t.id
                    ? 'border-purple-500 bg-purple-900/20 shadow-glow-primary'
                    : 'border-white/5 hover:border-purple-500/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{t.icon}</span>
                  {template === t.id && <Check className="w-4 h-4 text-purple-400" />}
                </div>
                <h4 className="text-xs font-bold text-white">{t.name}</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Step 2: Metadata Details */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider text-slate-300">
            2. Basic Details & Event Info
          </h3>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Collection Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Annual Tech Symposium 2026 Keynotes"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Description (Optional)</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe what files are contained in this collection..."
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Event Date (Optional)</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Auto-Expiration Date (Optional)</label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Cover Image URL Picker */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Cover Image (URL or Preset)</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="url"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="Paste an image URL or choose a preset below"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                {presetCovers.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt="Preset"
                    onClick={() => setCoverImage(url)}
                    className={`w-16 h-10 rounded-lg object-cover cursor-pointer border-2 transition-all ${
                      coverImage === url ? 'border-purple-500 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Privacy & Security Controls */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider text-slate-300">
            3. Privacy & Access Permissions
          </h3>

          {/* Access Type radio selection */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div
              onClick={() => setAccessType('public')}
              className={`p-4 rounded-2xl glass-card border cursor-pointer ${
                accessType === 'public'
                  ? 'border-purple-500 bg-purple-900/20 shadow-glow-primary'
                  : 'border-white/5'
              }`}
            >
              <Globe className="w-5 h-5 text-purple-400 mb-2" />
              <h4 className="text-xs font-bold text-white">Public Collection</h4>
              <p className="text-[11px] text-slate-400 mt-1">Anyone with the QR or URL can access immediately.</p>
            </div>

            <div
              onClick={() => setAccessType('password')}
              className={`p-4 rounded-2xl glass-card border cursor-pointer ${
                accessType === 'password'
                  ? 'border-purple-500 bg-purple-900/20 shadow-glow-primary'
                  : 'border-white/5'
              }`}
            >
              <Lock className="w-5 h-5 text-amber-400 mb-2" />
              <h4 className="text-xs font-bold text-white">Password Protected</h4>
              <p className="text-[11px] text-slate-400 mt-1">Visitors must enter a PIN/password to unlock files.</p>
            </div>

            <div
              onClick={() => setAccessType('private')}
              className={`p-4 rounded-2xl glass-card border cursor-pointer ${
                accessType === 'private'
                  ? 'border-purple-500 bg-purple-900/20 shadow-glow-primary'
                  : 'border-white/5'
              }`}
            >
              <Shield className="w-5 h-5 text-rose-400 mb-2" />
              <h4 className="text-xs font-bold text-white">Private (Owner Only)</h4>
              <p className="text-[11px] text-slate-400 mt-1">Only you can view and access these assets.</p>
            </div>
          </div>

          {/* Password field if password-protected */}
          {accessType === 'password' && (
            <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 animate-in fade-in">
              <label className="text-xs font-semibold text-amber-200 block mb-1.5">Collection Access Password</label>
              <input
                type="text"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password for visitors"
                className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-amber-500/40 text-white text-xs focus:outline-none"
              />
            </div>
          )}

          {/* Feature Toggles */}
          <div className="pt-2 space-y-3">
            <label className="flex items-center justify-between p-3 rounded-xl glass-card border border-white/5 cursor-pointer">
              <span className="text-xs font-semibold text-slate-200">
                Allow visitors to download files and bulk ZIP
              </span>
              <input
                type="checkbox"
                checked={allowDownloads}
                onChange={(e) => setAllowDownloads(e.target.checked)}
                className="w-4 h-4 accent-purple-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl glass-card border border-white/5 cursor-pointer">
              <span className="text-xs font-semibold text-slate-200">
                Allow collaborative uploads (anyone with link can add files)
              </span>
              <input
                type="checkbox"
                checked={allowCollaborativeUpload}
                onChange={(e) => setAllowCollaborativeUpload(e.target.checked)}
                className="w-4 h-4 accent-purple-600 rounded"
              />
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-glow-primary transition-all flex items-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Create Collection & Upload Files <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
