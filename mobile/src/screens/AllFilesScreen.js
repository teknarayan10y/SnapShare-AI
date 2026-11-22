import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { Header } from '../components/Header';
import { PhotoDetailModal } from './PhotoDetailModal';

const { width } = Dimensions.get('window');
const GRID_COLUMNS = 3;
const GRID_SPACING = 3;
const TILE_SIZE = (width - 28 - (GRID_COLUMNS - 1) * GRID_SPACING) / GRID_COLUMNS;

const CATEGORIES = [
  { id: 'all', label: 'All Files', icon: 'grid-outline' },
  { id: 'image', label: 'Photos', icon: 'image-outline' },
  { id: 'voice', label: 'Voice Notes', icon: 'mic-outline' },
  { id: 'video', label: 'Videos', icon: 'videocam-outline' },
  { id: 'favorites', label: 'Favorites', icon: 'heart-outline' },
];

export const AllFilesScreen = ({ onNavigateTab }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [activePhoto, setActivePhoto] = useState(null);

  const fetchFiles = useCallback(async () => {
    try {
      const data = await api.getFiles();
      const list = Array.isArray(data) ? data : (data.files || []);
      setFiles(list);
    } catch (err) {
      console.warn('Failed to fetch all files:', err);
      // Fallback empty list
      setFiles([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFiles();
  };

  // Filtered files
  const filteredFiles = useMemo(() => {
    return files.filter((f) => {
      // Category filter
      if (activeCategory === 'image') {
        const isImg = f.mimeType?.startsWith('image/') || f.category === 'image' || !f.mimeType;
        if (!isImg) return false;
      } else if (activeCategory === 'voice') {
        if (!f.voiceNote?.url) return false;
      } else if (activeCategory === 'video') {
        const isVid = f.mimeType?.startsWith('video/') || f.category === 'video';
        if (!isVid) return false;
      } else if (activeCategory === 'favorites') {
        if (!f.isFavorite) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = f.originalName?.toLowerCase().includes(q);
        const tagMatch = f.aiAnalysis?.tags?.some?.((t) => t.toLowerCase().includes(q));
        const captionMatch = f.aiAnalysis?.description?.toLowerCase().includes(q);
        if (!nameMatch && !tagMatch && !captionMatch) return false;
      }

      return true;
    });
  }, [files, activeCategory, searchQuery]);

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const renderGridItem = ({ item }) => {
    const url = item.thumbnailUrl || item.cloudinaryUrl || item.url;
    const faceCount = item.faceCount || item.aiAnalysis?.faceCount || 0;
    const hasVoice = Boolean(item.voiceNote?.url);

    return (
      <TouchableOpacity
        style={styles.gridTile}
        onPress={() => setActivePhoto(item)}
        activeOpacity={0.8}
      >
        {url ? (
          <Image source={{ uri: url }} style={styles.gridImage} resizeMode="cover" />
        ) : (
          <View style={styles.gridPlaceholder}>
            <Ionicons name="document-text-outline" size={24} color="#64748B" />
          </View>
        )}

        {/* Badges Overlay */}
        <View style={styles.badgesOverlay}>
          {faceCount > 0 ? (
            <View style={styles.faceCountBadge}>
              <Ionicons name="person" size={9} color="#FFFFFF" />
              <Text style={styles.badgeText}>{faceCount}</Text>
            </View>
          ) : null}
          {hasVoice ? (
            <View style={styles.voiceBadge}>
              <Ionicons name="mic" size={10} color="#C084FC" />
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  const renderListItem = ({ item }) => {
    const url = item.thumbnailUrl || item.cloudinaryUrl || item.url;
    const hasVoice = Boolean(item.voiceNote?.url);

    return (
      <TouchableOpacity
        style={styles.listItem}
        onPress={() => setActivePhoto(item)}
        activeOpacity={0.8}
      >
        <View style={styles.listThumbWrap}>
          {url ? (
            <Image source={{ uri: url }} style={styles.listThumb} resizeMode="cover" />
          ) : (
            <View style={styles.listThumbPlaceholder}>
              <Ionicons name="document-text-outline" size={20} color="#64748B" />
            </View>
          )}
          {hasVoice ? (
            <View style={styles.listVoiceIndicator}>
              <Ionicons name="mic" size={8} color="#C084FC" />
            </View>
          ) : null}
        </View>

        <View style={styles.listInfo}>
          <Text style={styles.listTitle} numberOfLines={1}>
            {item.originalName || 'Untitled Asset'}
          </Text>
          <Text style={styles.listMeta}>
            {formatFileSize(item.fileSize)} • {new Date(item.uploadedAt || item.createdAt || Date.now()).toLocaleDateString()}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={16} color="#64748B" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="All Photos & Files"
        subtitle={`${files.length} indexed files across all collections`}
        rightAction
        rightIcon={viewMode === 'grid' ? 'list-outline' : 'grid-outline'}
        onRightAction={() => setViewMode((m) => (m === 'grid' ? 'list' : 'grid'))}
      />

      {/* Search Input Bar */}
      <View style={styles.searchBarWrap}>
        <View style={styles.searchInputBox}>
          <Ionicons name="search" size={16} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by file name or tags..."
            placeholderTextColor="#64748B"
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Category Pills Bar */}
      <View style={styles.categoriesWrap}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.categoriesContent}
          renderItem={({ item }) => {
            const active = activeCategory === item.id;
            return (
              <TouchableOpacity
                style={[styles.categoryPill, active && styles.categoryPillActive]}
                onPress={() => setActiveCategory(item.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={item.icon}
                  size={13}
                  color={active ? '#FFFFFF' : '#94A3B8'}
                  style={{ marginRight: 5 }}
                />
                <Text style={[styles.categoryPillText, active && styles.categoryPillTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Main Files Display */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading all cloud files...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredFiles}
          key={viewMode}
          keyExtractor={(item) => item._id || item.id || String(Math.random())}
          numColumns={viewMode === 'grid' ? GRID_COLUMNS : 1}
          renderItem={viewMode === 'grid' ? renderGridItem : renderListItem}
          contentContainerStyle={[
            styles.filesListContent,
            viewMode === 'grid' && styles.gridContainer,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#8B5CF6"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="images-outline" size={48} color="#475569" />
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No matching files found' : 'No files in your cloud vault'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? 'Try a different keyword or reset filters'
                  : 'Upload event photographs or audio guestbooks to get started'}
              </Text>
              <TouchableOpacity
                style={styles.uploadBtn}
                onPress={() => onNavigateTab && onNavigateTab('upload')}
                activeOpacity={0.8}
              >
                <Ionicons name="cloud-upload" size={16} color="#FFFFFF" />
                <Text style={styles.uploadBtnText}>Upload Photos</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Lightbox / Photo Detail Modal */}
      {activePhoto ? (
        <PhotoDetailModal
          visible={!!activePhoto}
          photo={activePhoto}
          onClose={() => setActivePhoto(null)}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070B14',
  },
  searchBarWrap: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
  },
  searchInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    marginLeft: 8,
    marginRight: 8,
  },
  categoriesWrap: {
    paddingVertical: 6,
  },
  categoriesContent: {
    paddingHorizontal: 14,
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  categoryPillActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#8B5CF6',
  },
  categoryPillText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filesListContent: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 120,
  },
  gridContainer: {
    paddingHorizontal: 14,
  },
  gridTile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    marginRight: GRID_SPACING,
    marginBottom: GRID_SPACING,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E293B',
  },
  badgesOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    flexDirection: 'row',
    gap: 3,
  },
  faceCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    gap: 2,
  },
  voiceBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(124, 58, 237, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  listThumbWrap: {
    width: 48,
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
    position: 'relative',
    marginRight: 12,
  },
  listThumb: {
    width: '100%',
    height: '100%',
  },
  listThumbPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listVoiceIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(124, 58, 237, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listInfo: {
    flex: 1,
  },
  listTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 2,
  },
  listMeta: {
    fontSize: 11,
    color: '#64748B',
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 12.5,
    color: '#94A3B8',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#CBD5E1',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  uploadBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
