import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI, storageRequestAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  User,
  Camera,
  Palette,
  Lock,
  Save,
  Check,
  Trash2,
  AlertTriangle,
  Sparkles,
  HardDrive,
  Upload,
  X,
  Send,
  Clock,
  CheckCircle2,
} from 'lucide-react';

export const UserProfile = () => {
  const { user, updateUser, logout } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [brandingEnabled, setBrandingEnabled] = useState(user?.customBranding?.enabled || false);
  const [companyName, setCompanyName] = useState(user?.customBranding?.companyName || '');
  const [brandColor, setBrandColor] = useState(user?.customBranding?.brandColor || '#8B5CF6');
  const [customMessage, setCustomMessage] = useState(user?.customBranding?.customMessage || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Storage Request State
  const [showStorageModal, setShowStorageModal] = useState(false);
  const [requestedGB, setRequestedGB] = useState(10);
  const [requestReason, setRequestReason] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [myRequests, setMyRequests] = useState([]);

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const fetchMyRequests = async () => {
    try {
      const res = await storageRequestAPI.getMy();
      if (res.data?.success) {
        setMyRequests(res.data.requests || []);
      }
    } catch (e) {
      // quiet fail if not yet configured
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    setUploadingAvatar(true);
    try {
      const res = await authAPI.uploadAvatar(formData);
      if (res.data?.success && res.data.avatar) {
        setAvatar(res.data.avatar);
        updateUser(res.data.user || { ...user, avatar: res.data.avatar });
        toast.success('Profile photo updated successfully! ✨');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to upload profile photo');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setUploadingAvatar(true);
    try {
      const res = await authAPI.updateProfile({ avatar: '' });
      if (res.data?.success) {
        setAvatar('');
        updateUser(res.data.user || { ...user, avatar: '' });
        toast.success('Profile photo removed');
      }
    } catch (err) {
      toast.error('Failed to remove profile photo');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await authAPI.updateProfile({
        name,
        avatar,
        customBranding: {
          enabled: brandingEnabled,
          companyName,
          brandColor,
          customMessage,
        },
      });
      if (res.data.success) {
        updateUser(res.data.user);
        toast.success('Profile updated successfully!');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleRequestStorage = async (e) => {
    e.preventDefault();
    if (!requestReason.trim()) {
      return toast.warning('Please provide a brief reason for requesting more storage');
    }
    setSubmittingRequest(true);
    try {
      const res = await storageRequestAPI.create({
        requestedQuotaGB: Number(requestedGB),
        reason: requestReason.trim(),
      });
      if (res.data?.success) {
        toast.success('Storage upgrade request submitted to admin! 🚀');
        setShowStorageModal(false);
        setRequestReason('');
        fetchMyRequests();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit storage request');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      return toast.warning('New password must be at least 6 characters');
    }
    setSavingPassword(true);
    try {
      const res = await authAPI.changePassword({ currentPassword, newPassword });
      if (res.data.success) {
        toast.success('Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    try {
      await authAPI.deleteAccount();
      toast.success('Account deleted. Goodbye!');
      logout();
    } catch (err) {
      toast.error('Failed to delete account');
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const storageUsed = user?.storageUsed || 0;
  const storageQuota = user?.storageQuota || 5 * 1024 * 1024 * 1024;
  const storagePercent = Math.min(100, Math.max(1, Math.round((storageUsed / storageQuota) * 100)));

  const avatarPresets = [
    `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(user?.name || 'user')}`,
    `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(user?.email || 'user')}`,
    `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user?.name || 'robot')}`,
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in pb-16">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Profile & Settings</h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage your personal details, profile picture, custom branding, and cloud storage allocation.
        </p>
      </div>

      {/* Profile Section */}
      <form onSubmit={handleSaveProfile} className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-white/5">
          <User className="w-5 h-5 text-purple-400" />
          <h2 className="text-base font-bold text-white">Basic Profile</h2>
        </div>

        {/* Avatar Upload, Change & Remove Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-6 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
          <div className="relative group shrink-0">
            {avatar ? (
              <img
                src={avatar}
                alt="Avatar"
                className="w-24 h-24 rounded-3xl object-cover border-2 border-purple-500/40 shadow-glow-primary"
              />
            ) : (
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-purple-700 to-indigo-700 flex items-center justify-center text-white text-3xl font-extrabold shadow-glow-primary">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
            )}
            {uploadingAvatar && (
              <div className="absolute inset-0 bg-black/60 rounded-3xl flex items-center justify-center">
                <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Profile Picture</h3>
                <p className="text-xs text-slate-400">Upload a photo from your computer, choose a preset, or remove it.</p>
              </div>
            </div>

            {/* Action Buttons: Upload / Change & Remove */}
            <div className="flex flex-wrap items-center gap-2.5">
              <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-glow-primary transition-all cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                {avatar ? 'Change Photo' : 'Upload Photo'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploadingAvatar}
                />
              </label>

              {avatar && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={uploadingAvatar}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove Picture
                </button>
              )}
            </div>

            {/* Presets Row */}
            <div className="pt-2">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">Or choose a preset avatar:</span>
              <div className="flex gap-2">
                {avatarPresets.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt="preset"
                    onClick={() => setAvatar(url)}
                    className={`w-9 h-9 rounded-xl object-cover cursor-pointer border-2 transition-all ${
                      avatar === url ? 'border-purple-500 scale-110 shadow-glow-primary' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1.5">Display Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-purple-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">Email Address</label>
          <input
            type="email"
            value={user?.email || ''}
            readOnly
            className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/5 text-slate-500 text-sm cursor-not-allowed"
          />
          <p className="text-[11px] text-slate-500 mt-1">Verified account email address.</p>
        </div>

        {/* Custom Branding Section */}
        <div className="pt-4 border-t border-white/5 space-y-4">
          <div className="flex items-center gap-3">
            <Palette className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Custom Event Branding</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold">
              Pro Feature
            </span>
          </div>

          <label className="flex items-center justify-between p-3 rounded-xl glass-card border border-white/5 cursor-pointer">
            <span className="text-xs font-semibold text-slate-200">
              Enable custom branding on public collection pages & QR links
            </span>
            <input
              type="checkbox"
              checked={brandingEnabled}
              onChange={(e) => setBrandingEnabled(e.target.checked)}
              className="w-4 h-4 accent-purple-600"
            />
          </label>

          {brandingEnabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Company / Brand Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Brand Accent Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="w-12 h-10 rounded-xl cursor-pointer border border-white/10"
                  />
                  <input
                    type="text"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white font-mono focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Custom Footer Message</label>
                <textarea
                  rows={2}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="e.g. Captured with love by Apex Photography"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={savingProfile}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-glow-primary transition-all"
          >
            {savingProfile ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Profile Changes
          </button>
        </div>
      </form>

      {/* Storage Quota & Request Upgrade Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <HardDrive className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Cloud Storage Allocation</h2>
          </div>
          <button
            onClick={() => setShowStorageModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all shadow-glow-emerald"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Request Extra Storage
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-300 font-semibold">
            <span>Storage Used: {formatBytes(storageUsed)}</span>
            <span className="text-emerald-400">{storagePercent}% of {formatBytes(storageQuota)}</span>
          </div>
          <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all duration-500"
              style={{ width: `${storagePercent}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400">
            High-speed multi-region Cloudinary CDN with lossless preservation and AI face embeddings.
          </p>
        </div>

        {/* Existing Storage Requests Status */}
        {myRequests.length > 0 && (
          <div className="pt-3 border-t border-white/5 space-y-2">
            <h4 className="text-xs font-bold text-slate-300">Your Storage Requests</h4>
            <div className="space-y-2">
              {myRequests.slice(0, 3).map((req) => (
                <div key={req._id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                  <div>
                    <span className="font-bold text-white">+{req.requestedQuotaGB} GB Storage</span>
                    <p className="text-[11px] text-slate-400 truncate max-w-xs">{req.reason}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                    req.status === 'approved'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : req.status === 'rejected'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                  }`}>
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Storage Request Modal */}
      {showStorageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md glass-panel p-6 sm:p-7 rounded-3xl border border-white/10 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Request Extra Storage</h3>
              </div>
              <button onClick={() => setShowStorageModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRequestStorage} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">Select Target Capacity</label>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 25, 50, 100].map((gb) => (
                    <button
                      key={gb}
                      type="button"
                      onClick={() => setRequestedGB(gb)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        requestedGB === gb
                          ? 'bg-emerald-500 text-white border-emerald-400 shadow-glow-emerald'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {gb} GB
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Reason for Request *</label>
                <textarea
                  rows={3}
                  required
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  placeholder="e.g. Hosting a 500-guest wedding reception with high-resolution photo drops..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStorageModal(false)}
                  className="px-4 py-2 rounded-xl glass-card text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRequest}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-glow-emerald transition-all"
                >
                  {submittingRequest ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Section */}
      <form onSubmit={handleChangePassword} className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-white/5">
          <Lock className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-bold text-white">Change Password</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-purple-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">New Password (min 6 characters)</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-purple-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={savingPassword}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all"
          >
            {savingPassword ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Lock className="w-4 h-4" />
            )}
            Update Password
          </button>
        </div>
      </form>

      {/* Danger Zone */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-red-500/20 space-y-4">
        <div className="flex items-center gap-3 pb-4 border-red-500/10">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <h2 className="text-base font-bold text-red-400">Danger Zone</h2>
        </div>

        {!showDeleteConfirm ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-200">Delete Account & All Data</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Permanently removes your account, all collections, files, and QR codes. This cannot be undone.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 text-xs font-bold transition-all shrink-0"
            >
              Delete Account
            </button>
          </div>
        ) : (
          <div className="space-y-3 animate-in fade-in">
            <p className="text-xs text-red-300">
              Type <strong>DELETE</strong> to confirm permanent account deletion:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="w-full px-4 py-2.5 rounded-xl bg-red-950/20 border border-red-500/40 text-red-200 text-xs focus:outline-none"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                className="px-4 py-2 rounded-xl glass-card text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE'}
                className="px-4 py-2 rounded-xl bg-red-600 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-bold"
              >
                Permanently Delete Account
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
