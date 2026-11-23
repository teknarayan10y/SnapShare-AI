import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Switch,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Header } from '../components/Header';

export const ProfileSettingsScreen = () => {
  const { user, updateUser, refreshUser, logout } = useAuth();

  // Basic Profile Form
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Custom Branding Form
  const [brandingEnabled, setBrandingEnabled] = useState(user?.customBranding?.enabled || false);
  const [companyName, setCompanyName] = useState(user?.customBranding?.companyName || '');
  const [brandColor, setBrandColor] = useState(user?.customBranding?.brandColor || '#8B5CF6');
  const [customMessage, setCustomMessage] = useState(user?.customBranding?.customMessage || '');

  // Security / Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Danger Zone / Delete Account Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Sync state when user changes
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setAvatar(user.avatar || '');
      setBrandingEnabled(user.customBranding?.enabled || false);
      setCompanyName(user.customBranding?.companyName || '');
      setBrandColor(user.customBranding?.brandColor || '#8B5CF6');
      setCustomMessage(user.customBranding?.customMessage || '');
    }
  }, [user]);

  // Brand color swatches matching website
  const brandColors = [
    '#8B5CF6', // Purple
    '#3B82F6', // Blue
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EC4899', // Pink
    '#06B6D4', // Cyan
  ];

  // Avatar presets matching website
  const avatarPresets = [
    `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(user?.name || 'SnapShare')}`,
    `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(user?.email || 'user')}`,
    `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user?.name || 'robot')}`,
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
  ];

  // Pick Avatar from Gallery
  const handlePickAvatar = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Please allow photo library access to choose your profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setUploadingAvatar(true);
        const uploadResult = await api.uploadAvatar(
          asset.uri,
          asset.fileName || `avatar_${Date.now()}.jpg`,
          asset.mimeType || 'image/jpeg'
        );

        if (uploadResult.avatar) {
          setAvatar(uploadResult.avatar);
          updateUser({ avatar: uploadResult.avatar });
          Alert.alert('Avatar Updated ✨', 'Your new profile photo was uploaded successfully!');
        }
      }
    } catch (err) {
      Alert.alert('Upload Failed', err.message || 'Could not upload avatar image.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Take Avatar with Camera
  const handleTakeAvatar = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Please allow camera access to take your profile picture.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setUploadingAvatar(true);
        const uploadResult = await api.uploadAvatar(
          asset.uri,
          asset.fileName || `avatar_camera_${Date.now()}.jpg`,
          asset.mimeType || 'image/jpeg'
        );

        if (uploadResult.avatar) {
          setAvatar(uploadResult.avatar);
          updateUser({ avatar: uploadResult.avatar });
          Alert.alert('Avatar Updated ✨', 'Your new profile photo was captured and uploaded!');
        }
      }
    } catch (err) {
      Alert.alert('Camera Error', err.message || 'Could not capture avatar image.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Save Profile & Branding
  const handleSaveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Display Name cannot be empty.');
      return;
    }

    setSavingProfile(true);
    try {
      const res = await api.updateProfile({
        name: name.trim(),
        avatar: avatar.trim(),
        customBranding: {
          enabled: brandingEnabled,
          companyName: companyName.trim(),
          brandColor,
          customMessage: customMessage.trim(),
        },
      });

      if (res.success && res.user) {
        updateUser(res.user);
        Alert.alert('Profile Saved', 'Your profile and branding settings have been updated.');
      } else {
        Alert.alert('Profile Updated', 'Profile changes saved successfully.');
      }
    } catch (err) {
      Alert.alert('Save Failed', err.message || 'Could not update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Update Password
  const handleChangePassword = async () => {
    if (!currentPassword) {
      Alert.alert('Missing Field', 'Please enter your current password.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Invalid Password', 'New password must be at least 6 characters long.');
      return;
    }

    setSavingPassword(true);
    try {
      await api.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      Alert.alert('Password Changed', 'Your account password has been updated securely.');
    } catch (err) {
      Alert.alert('Password Error', err.message || 'Failed to change password. Verify your current password.');
    } finally {
      setSavingPassword(false);
    }
  };

  // Delete Account
  const handleDeleteAccount = async () => {
    if (deleteConfirmationText !== 'DELETE') {
      Alert.alert('Confirmation Required', 'Please type DELETE exactly in uppercase to confirm.');
      return;
    }

    setDeletingAccount(true);
    try {
      await api.deleteAccount();
      setShowDeleteModal(false);
      Alert.alert('Account Deleted', 'Your account and all associated collections have been deleted.');
      logout();
    } catch (err) {
      Alert.alert('Deletion Failed', err.message || 'Could not delete account.');
    } finally {
      setDeletingAccount(false);
    }
  };

  // Storage Quota Computation
  const storageQuotaMB = Math.round((user?.storageQuota || 5 * 1024 * 1024 * 1024) / (1024 * 1024));
  const storageUsedMB = Math.max(1, Math.round((user?.storageUsed || 28 * 1024 * 1024) / (1024 * 1024)));
  const quotaPercent = Math.min(100, Math.max(1, Math.round((storageUsedMB / storageQuotaMB) * 100)));

  return (
    <View style={styles.container}>
      <Header title="Profile & Settings" subtitle="Personal details, custom branding & security" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card & Avatar Section */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="person-circle-outline" size={20} color="#C084FC" />
            <Text style={styles.sectionTitle}>Profile & Identity</Text>
          </View>

          {/* Avatar Row */}
          <View style={styles.avatarRow}>
            <View style={styles.avatarWrapper}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitial}>
                    {user?.name ? user.name[0].toUpperCase() : 'U'}
                  </Text>
                </View>
              )}
              {uploadingAvatar && (
                <View style={styles.avatarLoadingOverlay}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                </View>
              )}
            </View>

            <View style={styles.avatarActionsCol}>
              <Text style={styles.avatarLabel}>Profile Picture</Text>
              <Text style={styles.avatarSub}>Upload your photo or choose a preset</Text>
              <View style={styles.avatarButtonsRow}>
                <TouchableOpacity
                  style={styles.avatarActionBtn}
                  onPress={handlePickAvatar}
                  disabled={uploadingAvatar}
                >
                  <Ionicons name="images-outline" size={14} color="#C084FC" />
                  <Text style={styles.avatarActionBtnText}>Gallery</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.avatarActionBtn}
                  onPress={handleTakeAvatar}
                  disabled={uploadingAvatar}
                >
                  <Ionicons name="camera-outline" size={14} color="#C084FC" />
                  <Text style={styles.avatarActionBtnText}>Camera</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Preset Avatars */}
          <View style={styles.presetSection}>
            <Text style={styles.presetTitle}>Or Select Quick Preset</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
              {avatarPresets.map((presetUrl, idx) => {
                const isSelected = avatar === presetUrl;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.presetItem, isSelected && styles.presetItemSelected]}
                    onPress={() => setAvatar(presetUrl)}
                  >
                    <Image source={{ uri: presetUrl }} style={styles.presetImg} />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Editable Display Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Display Name</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="Your full name"
                placeholderTextColor="#64748B"
              />
            </View>
          </View>

          {/* Email Address (Read-only) */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Email Address</Text>
            <View style={[styles.inputContainer, styles.inputDisabled]}>
              <Ionicons name="mail-outline" size={18} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, { color: '#94A3B8' }]}
                value={user?.email || 'user@snapshare.com'}
                editable={false}
              />
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={13} color="#10B981" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            </View>
          </View>

          {/* Avatar URL direct input */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Custom Avatar Image URL</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="link-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={avatar}
                onChangeText={setAvatar}
                placeholder="https://..."
                placeholderTextColor="#64748B"
                autoCapitalize="none"
              />
            </View>
          </View>
        </View>

        {/* Custom Event Branding (Matches Web UserProfile.jsx) */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="color-palette-outline" size={20} color="#38BDF8" />
            <Text style={styles.sectionTitle}>Event Branding & Whitelabel</Text>
          </View>
          <Text style={styles.cardDesc}>
            Customize the brand identity shown to visitors on your public collection pages and QR viewers.
          </Text>

          {/* Branding Toggle */}
          <View style={styles.switchRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.switchTitle}>Enable Custom Branding</Text>
              <Text style={styles.switchSub}>Show your company name and custom colors on QR visitor links</Text>
            </View>
            <Switch
              value={brandingEnabled}
              onValueChange={setBrandingEnabled}
              trackColor={{ false: '#1E293B', true: '#8B5CF6' }}
              thumbColor={brandingEnabled ? '#FFFFFF' : '#94A3B8'}
            />
          </View>

          {brandingEnabled && (
            <View style={styles.brandingFieldsWrap}>
              {/* Company / Host Name */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Company / Event Host Name</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="business-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={companyName}
                    onChangeText={setCompanyName}
                    placeholder="e.g. Apex Photography, Royal Celebrations"
                    placeholderTextColor="#64748B"
                  />
                </View>
              </View>

              {/* Brand Accent Color */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Brand Accent Color</Text>
                <View style={styles.colorSwatchesRow}>
                  {brandColors.map((color) => {
                    const isSelected = brandColor.toLowerCase() === color.toLowerCase();
                    return (
                      <TouchableOpacity
                        key={color}
                        style={[
                          styles.colorSwatch,
                          { backgroundColor: color },
                          isSelected && styles.colorSwatchSelected,
                        ]}
                        onPress={() => setBrandColor(color)}
                      >
                        {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Custom Footer Message */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Custom Footer / Welcome Message</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="chatbox-ellipses-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={customMessage}
                    onChangeText={setCustomMessage}
                    placeholder="e.g. Captured with love • Tag @ApexPhotos"
                    placeholderTextColor="#64748B"
                  />
                </View>
              </View>

              {/* Live Branding Preview */}
              <View style={[styles.brandingPreviewCard, { borderColor: brandColor }]}>
                <View style={[styles.previewTag, { backgroundColor: brandColor }]}>
                  <Text style={styles.previewTagText}>Visitor View Preview</Text>
                </View>
                <Text style={[styles.previewCompany, { color: brandColor }]}>
                  {companyName || 'Your Event Company'}
                </Text>
                <Text style={styles.previewMsg}>
                  {customMessage || 'Captured with SnapShare AI Universal Event Cloud'}
                </Text>
              </View>
            </View>
          )}

          {/* Save Profile & Branding Button */}
          <TouchableOpacity
            style={styles.saveProfileBtn}
            onPress={handleSaveProfile}
            disabled={savingProfile}
          >
            {savingProfile ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="save-outline" size={18} color="#FFFFFF" />
                <Text style={styles.saveProfileBtnText}>Save Profile & Branding</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Cloud Storage Quota Bar */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="cloud-done-outline" size={20} color="#10B981" />
            <Text style={styles.sectionTitle}>Cloud Storage Quota</Text>
            <View style={styles.planBadge}>
              <Text style={styles.planBadgeText}>5 GB Free Tier</Text>
            </View>
          </View>

          <View style={styles.quotaHeader}>
            <Text style={styles.quotaSubText}>Cloudinary High-Speed Storage</Text>
            <Text style={styles.quotaPercent}>{quotaPercent}% Used</Text>
          </View>

          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${quotaPercent}%` }]} />
          </View>

          <Text style={styles.quotaDetails}>
            {storageUsedMB} MB of {storageQuotaMB.toLocaleString()} MB (Global Multi-Region CDN)
          </Text>
        </View>

        {/* Security & Change Password Section */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="lock-closed-outline" size={20} color="#F59E0B" />
            <Text style={styles.sectionTitle}>Security & Password</Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Current Password</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="key-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                placeholderTextColor="#64748B"
                secureTextEntry={!showCurrentPassword}
              />
              <TouchableOpacity
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={showCurrentPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color="#94A3B8"
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>New Password</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="At least 6 characters"
                placeholderTextColor="#64748B"
                secureTextEntry={!showNewPassword}
              />
              <TouchableOpacity
                onPress={() => setShowNewPassword(!showNewPassword)}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color="#94A3B8"
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.changePasswordBtn}
            onPress={handleChangePassword}
            disabled={savingPassword}
          >
            {savingPassword ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="lock-open-outline" size={16} color="#FFFFFF" />
                <Text style={styles.changePasswordBtnText}>Update Password</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Cross-Platform AI Pipeline Specs */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="hardware-chip-outline" size={20} color="#A78BFA" />
            <Text style={styles.sectionTitle}>AI System Specs</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.featureText}>YuNet Neural Face Detection (5-point Landmark)</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.featureText}>SFace 128-dim Biometric Matching</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.featureText}>Smart Folders: Solo, Two People, Three People, Group</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.featureText}>Full Web & Mobile Parity Synchronization</Text>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={[styles.sectionCard, styles.dangerCard]}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="warning-outline" size={20} color="#EF4444" />
            <Text style={[styles.sectionTitle, { color: '#EF4444' }]}>Danger Zone</Text>
          </View>
          <Text style={styles.dangerDesc}>
            Once deleted, your account, uploaded photos, event collections, and QR codes cannot be recovered.
          </Text>

          <View style={styles.dangerButtonsRow}>
            <TouchableOpacity
              style={styles.deleteAccountBtn}
              onPress={() => setShowDeleteModal(true)}
            >
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
              <Text style={styles.deleteAccountBtnText}>Delete Account</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
              <Ionicons name="log-out-outline" size={16} color="#CBD5E1" />
              <Text style={styles.logoutBtnText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Delete Account Modal */}
      <Modal visible={showDeleteModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalCard}>
            <View style={styles.deleteModalIcon}>
              <Ionicons name="alert-circle" size={40} color="#EF4444" />
            </View>
            <Text style={styles.deleteModalTitle}>Confirm Account Deletion</Text>
            <Text style={styles.deleteModalSub}>
              This will permanently delete your account, collections, and all associated media from Cloudinary.
            </Text>
            <Text style={styles.deleteModalPrompt}>
              Type <Text style={{ fontWeight: 'bold', color: '#EF4444' }}>DELETE</Text> below to proceed:
            </Text>
            <TextInput
              style={styles.deleteInput}
              value={deleteConfirmationText}
              onChangeText={setDeleteConfirmationText}
              placeholder="DELETE"
              placeholderTextColor="#64748B"
              autoCapitalize="characters"
            />
            <View style={styles.deleteModalActions}>
              <TouchableOpacity
                style={styles.deleteCancelBtn}
                onPress={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmationText('');
                }}
              >
                <Text style={styles.deleteCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.deleteConfirmBtn,
                  deleteConfirmationText !== 'DELETE' && { opacity: 0.5 },
                ]}
                onPress={handleDeleteAccount}
                disabled={deleteConfirmationText !== 'DELETE' || deletingAccount}
              >
                {deletingAccount ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.deleteConfirmBtnText}>Permanently Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070B14',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  sectionCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    flex: 1,
  },
  cardDesc: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 16,
    lineHeight: 18,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  avatarWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1E293B',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
  },
  avatarInitial: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  avatarLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarActionsCol: {
    flex: 1,
  },
  avatarLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  avatarSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    marginBottom: 8,
  },
  avatarButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  avatarActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  avatarActionBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#C4B5FD',
  },
  presetSection: {
    marginBottom: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  presetTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 8,
  },
  presetScroll: {
    flexDirection: 'row',
  },
  presetItem: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  presetItemSelected: {
    borderColor: '#8B5CF6',
    transform: [{ scale: 1.05 }],
  },
  presetImg: {
    width: '100%',
    height: '100%',
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
  },
  inputDisabled: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    height: 44,
    fontSize: 13,
    color: '#F8FAFC',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 12,
  },
  switchTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  switchSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  brandingFieldsWrap: {
    marginTop: 8,
  },
  colorSwatchesRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 4,
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorSwatchSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.1 }],
  },
  brandingPreviewCard: {
    backgroundColor: '#0B0F19',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    marginTop: 8,
    marginBottom: 14,
  },
  previewTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  previewTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  previewCompany: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  previewMsg: {
    fontSize: 11,
    color: '#94A3B8',
  },
  saveProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  saveProfileBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  planBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  planBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
  },
  quotaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  quotaSubText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  quotaPercent: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#1E293B',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  quotaDetails: {
    fontSize: 11,
    color: '#64748B',
  },
  eyeBtn: {
    padding: 6,
  },
  changePasswordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#D97706',
    paddingVertical: 11,
    borderRadius: 12,
    marginTop: 4,
  },
  changePasswordBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 12,
    color: '#CBD5E1',
  },
  dangerCard: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  dangerDesc: {
    fontSize: 11,
    color: '#F87171',
    lineHeight: 16,
    marginBottom: 14,
  },
  dangerButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  deleteAccountBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    paddingVertical: 11,
    borderRadius: 12,
  },
  deleteAccountBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  logoutBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1E293B',
    paddingVertical: 11,
    borderRadius: 12,
  },
  logoutBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  deleteModalCard: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  deleteModalIcon: {
    marginBottom: 12,
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  deleteModalSub: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  deleteModalPrompt: {
    fontSize: 13,
    color: '#CBD5E1',
    marginBottom: 8,
  },
  deleteInput: {
    width: '100%',
    height: 46,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingHorizontal: 16,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  deleteModalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  deleteCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    alignItems: 'center',
  },
  deleteCancelBtnText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
  },
  deleteConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    alignItems: 'center',
  },
  deleteConfirmBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
