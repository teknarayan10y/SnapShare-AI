import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
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
} from 'lucide-react';

export const UserProfile = () => {
  const { user, updateUser, logout } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
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

  const avatarPresets = [
    `https://api.dicebear.com/7.x/shapes/svg?seed=${user?.name || 'user'}`,
    `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.email}`,
    `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user?.name}`,
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in pb-16">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Profile & Branding</h1>
        <p className="text-xs text-slate-400 mt-1">
          Customize your identity and branding that appears on public collection pages.
        </p>
      </div>

      {/* Profile Section */}
      <form onSubmit={handleSaveProfile} className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-white/5">
          <User className="w-5 h-5 text-purple-400" />
          <h2 className="text-base font-bold text-white">Basic Profile</h2>
        </div>

        {/* Avatar Preview */}
        <div className="flex items-center gap-6">
          <img
            src={avatar || `https://api.dicebear.com/7.x/shapes/svg?seed=${user?.name}`}
            alt="Avatar"
            className="w-20 h-20 rounded-3xl object-cover border-2 border-purple-500/40 shadow-glow-primary"
          />
          <div className="flex-1 space-y-3">
            <label className="text-xs font-semibold text-slate-300 block">Avatar URL or Preset</label>
            <input
              type="url"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="Paste image URL here"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
            />
            <div className="flex gap-2">
              {avatarPresets.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt="preset"
                  onClick={() => setAvatar(url)}
                  className={`w-10 h-10 rounded-xl object-cover cursor-pointer border-2 transition-all ${avatar === url ? 'border-purple-500 scale-110' : 'border-transparent opacity-60 hover:opacity-100'}`}
                />
              ))}
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
          <p className="text-[11px] text-slate-500 mt-1">Email cannot be changed once registered.</p>
        </div>

        {/* Custom Branding Section */}
        <div className="pt-4 border-t border-white/5 space-y-4">
          <div className="flex items-center gap-3">
            <Palette className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Custom Branding</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold">
              Pro Feature
            </span>
          </div>

          <label className="flex items-center justify-between p-3 rounded-xl glass-card border border-white/5 cursor-pointer">
            <span className="text-xs font-semibold text-slate-200">
              Enable custom branding on public collection pages
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
                  placeholder="e.g. Your professional digital media delivery platform"
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
            Save Profile
          </button>
        </div>
      </form>

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
        <div className="flex items-center gap-3 pb-4 border-b border-red-500/10">
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
