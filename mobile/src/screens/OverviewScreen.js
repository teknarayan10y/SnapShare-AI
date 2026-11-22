import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { PhotoDetailModal } from './PhotoDetailModal';
import { SelfieSearchModal } from './SelfieSearchModal';
import { PhotobookModal } from './PhotobookModal';

const { width } = Dimensions.get('window');

export const OverviewScreen = ({ onNavigateTab, onSelectCollection }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);

  // Modals
  const [activePhoto, setActivePhoto] = useState(null);
  const [showSelfie, setShowSelfie] = useState(false);
  const [showPhotobook, setShowPhotobook] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      const data = await api.getDashboard();
      if (data) {
        setDashboardData(data);
      }
    } catch (err) {
      console.warn('Dashboard load fallback:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const stats = dashboardData?.stats || {
    totalCollections: 0,
    totalFiles: 0,
    storageUsed: 0,
    storageQuota: 5368709120,
    activeQRCodes: 0,
    totalScans: 0,
    totalDownloads: 0,
  };

  const recentCollections = dashboardData?.recentCollections || [];
  const recentFiles = dashboardData?.recentFiles || [];

  const storageUsedMB = Math.round((stats.storageUsed || 0) / (1024 * 1024));
  const storageQuotaMB = Math.round((stats.storageQuota || 5368709120) / (1024 * 1024));
  const storagePercent = Math.min(100, Math.round(((stats.storageUsed || 0) / (stats.storageQuota || 1)) * 100));

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#A855F7" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Hero Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.badgeRow}>
            <View style={styles.badgePill}>
              <Ionicons name="sparkles" size={11} color="#38BDF8" />
              <Text style={styles.badgeText}>Universal Cloud Vault</Text>
            </View>
            <View style={styles.statusOnline}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Live Sync</Text>
            </View>
          </View>

          <Text style={styles.welcomeTitle}>
            Welcome back,{'\n'}
            <Text style={styles.userName}>{user?.name || 'Creator'}</Text>
          </Text>
          <Text style={styles.welcomeSubtitle}>
            Monitor your event photos, face clusters, and guest moments.
          </Text>

          {/* Quick Actions Row */}
          <View style={styles.quickActionRow}>
            <TouchableOpacity
              style={styles.quickBtnPrimary}
              onPress={() => setShowSelfie(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="camera" size={15} color="#FFFFFF" />
              <Text style={styles.quickBtnPrimaryText}>Find My Photos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickBtnSecondary}
              onPress={() => setShowPhotobook(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="book-outline" size={15} color="#C084FC" />
              <Text style={styles.quickBtnSecondaryText}>Photobook</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickBtnGhost}
              onPress={() => onNavigateTab && onNavigateTab('upload')}
              activeOpacity={0.8}
            >
              <Ionicons name="cloud-upload-outline" size={16} color="#CBD5E1" />
            </TouchableOpacity>
          </View>
        </View>

        {/* KPI Stats - Perfect 2x2 Responsive Grid */}
        <View style={styles.kpiContainer}>
          {/* Row 1 */}
          <View style={styles.kpiRow}>
            <TouchableOpacity
              style={styles.kpiCard}
              onPress={() => onNavigateTab && onNavigateTab('events')}
              activeOpacity={0.8}
            >
              <View style={styles.kpiHeader}>
                <Text style={styles.kpiLabel}>Collections</Text>
                <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
                  <Ionicons name="folder-outline" size={15} color="#C084FC" />
                </View>
              </View>
              <Text style={styles.kpiValue}>{stats.totalCollections}</Text>
              <Text style={styles.kpiSub}>Active Event Vaults</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.kpiCard}
              onPress={() => onNavigateTab && onNavigateTab('files')}
              activeOpacity={0.8}
            >
              <View style={styles.kpiHeader}>
                <Text style={styles.kpiLabel}>All Photos</Text>
                <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                  <Ionicons name="images-outline" size={15} color="#38BDF8" />
                </View>
              </View>
              <Text style={styles.kpiValue}>{stats.totalFiles}</Text>
              <Text style={styles.kpiSub}>Indexed Vision • Tap to view</Text>
            </TouchableOpacity>
          </View>

          {/* Row 2 */}
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <View style={styles.kpiHeader}>
                <Text style={styles.kpiLabel}>QR Scans</Text>
                <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(251, 146, 60, 0.15)' }]}>
                  <Ionicons name="qr-code-outline" size={15} color="#FB923C" />
                </View>
              </View>
              <Text style={styles.kpiValue}>{stats.totalScans}</Text>
              <Text style={styles.kpiSub}>Guest Interactions</Text>
            </View>

            <View style={styles.kpiCard}>
              <View style={styles.kpiHeader}>
                <Text style={styles.kpiLabel}>Storage</Text>
                <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(52, 211, 153, 0.15)' }]}>
                  <Ionicons name="cloud-done-outline" size={15} color="#34D399" />
                </View>
              </View>
              <Text style={styles.kpiValue}>{formatBytes(stats.storageUsed)}</Text>
              <Text style={styles.kpiSub}>{storagePercent}% of 5 GB used</Text>
            </View>
          </View>
        </View>

        {/* Compact Storage Bar */}
        <View style={styles.storageCard}>
          <View style={styles.storageHeader}>
            <View style={styles.storageTitleWrap}>
              <Ionicons name="server-outline" size={14} color="#A855F7" />
              <Text style={styles.storageTitle}>Cloudinary CDN Bandwidth & Storage</Text>
            </View>
            <Text style={styles.storagePercentText}>{storagePercent}%</Text>
          </View>
          <View style={styles.storageBarBg}>
            <View style={[styles.storageBarFill, { width: `${Math.max(4, storagePercent)}%` }]} />
          </View>
          <Text style={styles.storageSubText}>
            {storageUsedMB} MB of {storageQuotaMB} MB • Zero Local Disk Storage (Cloud Streaming)
          </Text>
        </View>

        {/* Event Collections - Sleek 2-Column Grid Instead of Awkward Horizontal Strip */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Event Collections</Text>
            <Text style={styles.sectionSubtitle}>Tap an event to browse or share QR</Text>
          </View>
          <TouchableOpacity onPress={() => onNavigateTab && onNavigateTab('events')}>
            <Text style={styles.seeAllText}>View All →</Text>
          </TouchableOpacity>
        </View>

        {recentCollections.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="folder-open-outline" size={30} color="#64748B" />
            <Text style={styles.emptyTitle}>No event collections yet</Text>
            <TouchableOpacity
              style={styles.createEventBtn}
              onPress={() => onNavigateTab && onNavigateTab('events')}
            >
              <Text style={styles.createEventBtnText}>Create Event</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.eventsGrid}>
            {recentCollections.map((col) => (
              <TouchableOpacity
                key={col._id || col.id}
                style={styles.eventGridCard}
                onPress={() => onSelectCollection && onSelectCollection(col)}
                activeOpacity={0.8}
              >
                {col.coverImage ? (
                  <Image source={{ uri: col.coverImage }} style={styles.eventGridImg} resizeMode="cover" />
                ) : (
                  <View style={styles.eventGridPlaceholder}>
                    <Ionicons name="images" size={24} color="#A855F7" />
                  </View>
                )}
                <View style={styles.eventGridMeta}>
                  <Text style={styles.eventGridTitle} numberOfLines={1}>
                    {col.name || col.title}
                  </Text>
                  <View style={styles.eventGridSubRow}>
                    <Text style={styles.eventGridCount}>{col.totalFiles || col.fileCount || 0} photos</Text>
                    <Ionicons name="chevron-forward" size={13} color="#A78BFA" />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Recent Photographs - Clean 3-Column Mosaic */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Recent Photographs</Text>
            <Text style={styles.sectionSubtitle}>Neural vision analysis & voice notes</Text>
          </View>
          <TouchableOpacity onPress={() => onNavigateTab && onNavigateTab('files')}>
            <Text style={styles.seeAllText}>View All ({stats.totalFiles}) →</Text>
          </TouchableOpacity>
        </View>

        {recentFiles.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="camera-outline" size={30} color="#64748B" />
            <Text style={styles.emptyTitle}>No photos uploaded yet</Text>
          </View>
        ) : (
          <View style={styles.photosGrid}>
            {recentFiles.slice(0, 6).map((photo) => (
              <TouchableOpacity
                key={photo._id || photo.id}
                style={styles.photoItem}
                onPress={() => setActivePhoto(photo)}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: photo.thumbnailUrl || photo.cloudinaryUrl }}
                  style={styles.photoImg}
                />
                {photo.voiceNote?.url ? (
                  <View style={styles.voiceBadge}>
                    <Ionicons name="mic" size={10} color="#C084FC" />
                  </View>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Lightbox Modal */}
      {activePhoto && (
        <PhotoDetailModal
          visible={!!activePhoto}
          photo={activePhoto}
          onClose={() => setActivePhoto(null)}
        />
      )}

      {/* Feature 1: Selfie Search Modal */}
      <SelfieSearchModal
        visible={showSelfie}
        onClose={() => setShowSelfie(false)}
        onPhotoSelect={(p) => {
          setShowSelfie(false);
          setActivePhoto(p);
        }}
      />

      {/* Feature 6: Auto-Curated Photobook Modal */}
      <PhotobookModal
        visible={showPhotobook}
        onClose={() => setShowPhotobook(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070B14',
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 90,
  },
  heroBanner: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.25)',
    marginBottom: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 14,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#38BDF8',
    textTransform: 'uppercase',
  },
  statusOnline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  onlineText: {
    fontSize: 10.5,
    color: '#10B981',
    fontWeight: '600',
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 26,
  },
  userName: {
    color: '#C084FC',
  },
  welcomeSubtitle: {
    fontSize: 11.5,
    color: '#94A3B8',
    marginTop: 4,
    lineHeight: 16,
  },
  quickActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  quickBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#7C3AED',
    paddingVertical: 9,
    borderRadius: 11,
  },
  quickBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  quickBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    paddingVertical: 9,
    borderRadius: 11,
  },
  quickBtnSecondaryText: {
    color: '#C084FC',
    fontSize: 11.5,
    fontWeight: '700',
  },
  quickBtnGhost: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiContainer: {
    marginBottom: 12,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  kpiLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  kpiIconBox: {
    width: 26,
    height: 26,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiValue: {
    fontSize: 19,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  kpiSub: {
    fontSize: 9.5,
    color: '#64748B',
    marginTop: 2,
  },
  storageCard: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 16,
  },
  storageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  storageTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  storageTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  storagePercentText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#A855F7',
  },
  storageBarBg: {
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  storageBarFill: {
    height: '100%',
    backgroundColor: '#9333EA',
    borderRadius: 3,
  },
  storageSubText: {
    fontSize: 9.5,
    color: '#94A3B8',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 10,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sectionSubtitle: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  seeAllText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#C084FC',
  },
  eventsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  eventGridCard: {
    width: '48.5%',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  eventGridImg: {
    width: '100%',
    height: 90,
  },
  eventGridPlaceholder: {
    width: '100%',
    height: 90,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventGridMeta: {
    padding: 10,
  },
  eventGridTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  eventGridSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 3,
  },
  eventGridCount: {
    fontSize: 10.5,
    color: '#94A3B8',
  },
  emptyCard: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 12,
    color: '#94A3B8',
  },
  createEventBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: '#7C3AED',
    borderRadius: 8,
  },
  createEventBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  photoItem: {
    width: '31.8%',
    aspectRatio: 1,
    borderRadius: 11,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
    position: 'relative',
  },
  photoImg: {
    width: '100%',
    height: '100%',
  },
  voiceBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.4)',
  },
});

export default OverviewScreen;
