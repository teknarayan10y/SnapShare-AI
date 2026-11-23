import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { PhotoDetailModal } from './PhotoDetailModal';
import { QRModal } from './QRModal';
import { SelfieSearchModal } from './SelfieSearchModal';
import { PhotobookModal } from './PhotobookModal';

export const CollectionDetailScreen = ({
  collection,
  onBack,
  onOpenUpload,
  onDeleteCollection,
}) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [showSelfie, setShowSelfie] = useState(false);
  const [showPhotobook, setShowPhotobook] = useState(false);

  // Search, Filter & Sort State (Full Web Parity)
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [fileSortBy, setFileSortBy] = useState('name_asc'); // 'name_asc' | 'name_desc' | 'newest' | 'oldest' | 'size'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  const collectionId = collection._id || collection.id;
  const collectionTitle = collection.title || collection.name || 'Collection Details';

  const categoryFilters = [
    { id: 'all', label: 'All' },
    { id: 'image', label: 'Images' },
    { id: 'video', label: 'Videos' },
    { id: 'audio', label: 'Audio' },
    { id: 'document', label: 'Documents' },
    { id: 'code', label: 'Code' },
  ];

  const sortOptions = [
    { id: 'name_asc', label: 'Name: 1 → 45 (A–Z)' },
    { id: 'name_desc', label: 'Name: 45 → 1 (Z–A)' },
    { id: 'newest', label: 'Newest' },
    { id: 'oldest', label: 'Oldest' },
    { id: 'size', label: 'Size' },
  ];

  const loadCollectionFiles = async () => {
    try {
      const data = await api.getFiles(collectionId);
      const list = Array.isArray(data) ? data : (data.files || []);
      setFiles(list);
    } catch (err) {
      console.warn('Failed to load collection files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCollectionFiles();
  }, [collectionId]);

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Toggle Favorite
  const handleToggleFavorite = async (fileId) => {
    try {
      const res = await api.toggleFavorite(fileId);
      if (res.success && res.file) {
        setFiles((prev) =>
          prev.map((f) => (f._id === fileId ? { ...f, isFavorite: res.file.isFavorite } : f))
        );
      } else {
        // Optimistic toggle
        setFiles((prev) =>
          prev.map((f) => (f._id === fileId ? { ...f, isFavorite: !f.isFavorite } : f))
        );
      }
    } catch (err) {
      Alert.alert('Favorite Error', err.message || 'Could not update favorite status');
    }
  };

  // Delete File
  const handleDeleteFile = (fileId, fileName) => {
    Alert.alert(
      'Delete Photo',
      `Delete "${fileName || 'this photo'}" permanently from the vault?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteFile(fileId);
              setFiles((prev) => prev.filter((f) => (f._id || f.id) !== fileId));
            } catch (err) {
              Alert.alert('Delete Failed', err.message || 'Could not delete file');
            }
          },
        },
      ]
    );
  };

  // Filter and natural numerical sort matching website
  const filteredFiles = files
    .filter((f) => {
      const name = (f.originalName || f.name || '').toLowerCase();
      const tags = f.metadata?.aiTags || [];
      const matchesSearch =
        name.includes(searchQuery.toLowerCase()) ||
        tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const fileCat = (f.metadata?.aiCategory || f.category || 'image').toLowerCase();
      const matchesCategory = categoryFilter === 'all' || fileCat === categoryFilter;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      const nameA = a.originalName || a.name || '';
      const nameB = b.originalName || b.name || '';
      if (fileSortBy === 'name_asc') {
        return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
      }
      if (fileSortBy === 'name_desc') {
        return nameB.localeCompare(nameA, undefined, { numeric: true, sensitivity: 'base' });
      }
      if (fileSortBy === 'newest') {
        return new Date(b.uploadedAt || b.createdAt || 0) - new Date(a.uploadedAt || a.createdAt || 0);
      }
      if (fileSortBy === 'oldest') {
        return new Date(a.uploadedAt || a.createdAt || 0) - new Date(b.uploadedAt || b.createdAt || 0);
      }
      if (fileSortBy === 'size') {
        return (b.fileSize || 0) - (a.fileSize || 0);
      }
      return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
    });

  // Render Item (Grid vs List)
  const renderItem = ({ item }) => {
    const fileId = item._id || item.id;
    const url = item.cloudinaryUrl || item.url || item.thumbnailUrl;
    const faceCount = item.faceCount || item.aiAnalysis?.faceCount || 0;
    const isFav = !!item.isFavorite;
    const fileName = item.originalName || item.name || 'Photo';

    if (viewMode === 'list') {
      return (
        <TouchableOpacity
          style={styles.listItem}
          onPress={() => setActivePhoto(item)}
          activeOpacity={0.8}
        >
          <Image source={{ uri: url }} style={styles.listThumb} />
          <View style={styles.listDetails}>
            <Text style={styles.listFileName} numberOfLines={1}>{fileName}</Text>
            <View style={styles.listMetaRow}>
              <Text style={styles.listMetaText}>{formatBytes(item.fileSize || 0)}</Text>
              {faceCount > 0 && (
                <View style={styles.inlineFaceBadge}>
                  <Ionicons name="person" size={10} color="#C4B5FD" />
                  <Text style={styles.inlineFaceText}>{faceCount} {faceCount === 1 ? 'person' : 'people'}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Action buttons on list item */}
          <View style={styles.listItemActions}>
            <TouchableOpacity
              onPress={() => handleToggleFavorite(fileId)}
              style={styles.listFavBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={isFav ? 'star' : 'star-outline'}
                size={18}
                color={isFav ? '#F59E0B' : '#94A3B8'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleDeleteFile(fileId, fileName)}
              style={styles.listDelBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={17} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      );
    }

    // Grid Item
    return (
      <TouchableOpacity
        style={styles.photoItem}
        onPress={() => setActivePhoto(item)}
        activeOpacity={0.8}
      >
        <Image source={{ uri: url }} style={styles.photoImg} />

        {/* Favorite Star Badge */}
        <TouchableOpacity
          style={styles.favBadge}
          onPress={() => handleToggleFavorite(fileId)}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons
            name={isFav ? 'star' : 'star-outline'}
            size={13}
            color={isFav ? '#F59E0B' : 'rgba(255, 255, 255, 0.7)'}
          />
        </TouchableOpacity>

        {/* Face Count Badge */}
        {faceCount > 0 && (
          <View style={styles.faceBadge}>
            <Ionicons name="person" size={10} color="#FFFFFF" />
            <Text style={styles.faceBadgeText}>{faceCount}</Text>
          </View>
        )}

        {/* Voice Note Badge */}
        {item.voiceNote?.url && (
          <View style={styles.voiceBadge}>
            <Ionicons name="mic" size={10} color="#C084FC" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Navbar */}
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color="#CBD5E1" />
        </TouchableOpacity>

        <View style={styles.navTitleWrap}>
          <Text style={styles.navTitle} numberOfLines={1}>{collectionTitle}</Text>
          <Text style={styles.navSub}>
            {files.length} {files.length === 1 ? 'file' : 'files'} • {formatBytes(collection.totalSize || 0)}
          </Text>
        </View>

        <TouchableOpacity style={styles.qrBtn} onPress={() => setShowQR(true)}>
          <Ionicons name="qr-code" size={18} color="#C084FC" />
        </TouchableOpacity>
      </View>

      {/* Collection Hero Bar */}
      <View style={styles.heroCard}>
        {/* Badges Row */}
        <View style={styles.heroBadgesRow}>
          <View style={styles.categoryPill}>
            <Text style={styles.categoryPillText}>{collection.category || 'General'}</Text>
          </View>
          <View style={styles.accessPill}>
            <Ionicons
              name={collection.accessType === 'password' ? 'lock-closed' : 'globe'}
              size={11}
              color="#38BDF8"
            />
            <Text style={styles.accessPillText}>
              {collection.accessType === 'password' ? 'Protected' : 'Public'}
            </Text>
          </View>
          {collection.eventDate ? (
            <View style={styles.datePill}>
              <Ionicons name="calendar-outline" size={11} color="#94A3B8" />
              <Text style={styles.datePillText}>
                {new Date(collection.eventDate).toLocaleDateString()}
              </Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.descText} numberOfLines={2}>
          {collection.description || 'Shared event gallery with instant visitor QR access & AI face organization'}
        </Text>

        {/* Stats Row */}
        <View style={styles.heroStatsRow}>
          <Text style={styles.heroStatItem}>{files.length} Photos</Text>
          <Text style={styles.heroStatDot}>•</Text>
          <Text style={styles.heroStatItem}>{formatBytes(collection.totalSize || 0)}</Text>
          <Text style={styles.heroStatDot}>•</Text>
          <Text style={styles.heroStatItem}>{collection.scanCount || 0} QR Scans</Text>
          <Text style={styles.heroStatDot}>•</Text>
          <Text style={styles.heroStatItem}>{collection.downloadCount || 0} Downloads</Text>
        </View>

        {/* Hero Actions Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.heroActionsScroll}>
          <TouchableOpacity
            style={styles.findPhotosBtn}
            onPress={() => setShowSelfie(true)}
          >
            <Ionicons name="camera" size={14} color="#FFFFFF" />
            <Text style={styles.findPhotosBtnText}>Find My Photos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.photobookBtn}
            onPress={() => setShowPhotobook(true)}
          >
            <Ionicons name="book-outline" size={14} color="#C084FC" />
            <Text style={styles.photobookBtnText}>Photobook</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addPhotosBtn}
            onPress={() => onOpenUpload && onOpenUpload(collectionId)}
          >
            <Ionicons name="cloud-upload-outline" size={14} color="#FFFFFF" />
            <Text style={styles.addPhotosBtnText}>Upload Files</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.showQrHeroBtn}
            onPress={() => setShowQR(true)}
          >
            <Ionicons name="qr-code-outline" size={14} color="#C4B5FD" />
            <Text style={styles.showQrHeroText}>Share & QR</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Search, Filter & Sort Toolbar (Full Web Parity) */}
      <View style={styles.toolbarContainer}>
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={15} color="#94A3B8" style={{ marginRight: 6 }} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search photos by name or tag..."
            placeholderTextColor="#64748B"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={15} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Category Pills & View Mode */}
        <View style={styles.filterViewRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
            {categoryFilters.map((cat) => {
              const isSel = categoryFilter === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.filterChip, isSel && styles.filterChipSelected]}
                  onPress={() => setCategoryFilter(cat.id)}
                >
                  <Text style={[styles.filterChipText, isSel && styles.filterChipTextSelected]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Grid vs List View Toggle */}
          <View style={styles.viewToggleGroup}>
            <TouchableOpacity
              style={[styles.viewToggleBtn, viewMode === 'grid' && styles.viewToggleBtnActive]}
              onPress={() => setViewMode('grid')}
            >
              <Ionicons name="grid-outline" size={14} color={viewMode === 'grid' ? '#FFFFFF' : '#94A3B8'} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewToggleBtn, viewMode === 'list' && styles.viewToggleBtnActive]}
              onPress={() => setViewMode('list')}
            >
              <Ionicons name="list-outline" size={14} color={viewMode === 'list' ? '#FFFFFF' : '#94A3B8'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Natural Numerical Sorting Row */}
        <View style={styles.sortRow}>
          <Text style={styles.sortLabel}>Sort:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {sortOptions.map((opt) => {
              const isSel = fileSortBy === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.sortChip, isSel && styles.sortChipSelected]}
                  onPress={() => setFileSortBy(opt.id)}
                >
                  <Text style={[styles.sortChipText, isSel && styles.sortChipTextSelected]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* Photos Grid or List */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading collection files...</Text>
        </View>
      ) : (
        <FlatList
          key={viewMode}
          data={filteredFiles}
          keyExtractor={(item) => item._id || item.id || String(Math.random())}
          numColumns={viewMode === 'grid' ? 3 : 1}
          renderItem={renderItem}
          contentContainerStyle={viewMode === 'grid' ? styles.gridContent : styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="images-outline" size={44} color="#475569" />
              <Text style={styles.emptyTitle}>
                {searchQuery || categoryFilter !== 'all' ? 'No matching photos' : 'No photos in this event yet'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery || categoryFilter !== 'all'
                  ? 'Try clearing your search query or choosing another category.'
                  : 'Add photos or share the QR code with guests to start collecting photos.'}
              </Text>
              {files.length === 0 && (
                <TouchableOpacity
                  style={styles.emptyUploadBtn}
                  onPress={() => onOpenUpload && onOpenUpload(collectionId)}
                >
                  <Ionicons name="cloud-upload" size={16} color="#FFFFFF" />
                  <Text style={styles.emptyUploadBtnText}>Upload First Photo</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* QR Code Modal */}
      {showQR && (
        <QRModal
          visible={showQR}
          collection={collection}
          onClose={() => setShowQR(false)}
        />
      )}

      {/* Lightbox Modal */}
      {activePhoto && (
        <PhotoDetailModal
          visible={!!activePhoto}
          photo={activePhoto}
          onClose={() => setActivePhoto(null)}
        />
      )}

      {/* Selfie Search Modal */}
      <SelfieSearchModal
        visible={showSelfie}
        collectionId={collectionId}
        onClose={() => setShowSelfie(false)}
        onPhotoSelect={(p) => {
          setShowSelfie(false);
          setActivePhoto(p);
        }}
      />

      {/* Curated Photobook Modal */}
      <PhotobookModal
        visible={showPhotobook}
        collectionId={collectionId}
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
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#0B0F19',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  navTitleWrap: {
    flex: 1,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  navSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  qrBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroCard: {
    backgroundColor: '#0F172A',
    padding: 14,
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  heroBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  categoryPill: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  categoryPillText: {
    color: '#C4B5FD',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  accessPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  accessPillText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '600',
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  datePillText: {
    color: '#94A3B8',
    fontSize: 10,
  },
  descText: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 17,
    marginBottom: 8,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    paddingTop: 6,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  heroStatItem: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  heroStatDot: {
    fontSize: 10,
    color: '#64748B',
  },
  heroActionsScroll: {
    flexDirection: 'row',
  },
  findPhotosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 5,
    marginRight: 8,
  },
  findPhotosBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  photobookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 5,
    marginRight: 8,
  },
  photobookBtnText: {
    color: '#C084FC',
    fontSize: 11,
    fontWeight: '700',
  },
  addPhotosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 5,
    marginRight: 8,
  },
  addPhotosBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  showQrHeroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 5,
  },
  showQrHeroText: {
    color: '#C4B5FD',
    fontSize: 11,
    fontWeight: '700',
  },
  toolbarContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    height: 38,
    marginBottom: 6,
  },
  searchInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 12,
  },
  filterViewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginRight: 6,
  },
  filterChipSelected: {
    backgroundColor: '#8B5CF6',
  },
  filterChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  filterChipTextSelected: {
    color: '#FFFFFF',
  },
  viewToggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  viewToggleBtn: {
    padding: 4,
    borderRadius: 6,
  },
  viewToggleBtnActive: {
    backgroundColor: '#8B5CF6',
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sortLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  sortChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: '#0F172A',
    marginRight: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  sortChipSelected: {
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },
  sortChipText: {
    fontSize: 10,
    color: '#94A3B8',
  },
  sortChipTextSelected: {
    color: '#C4B5FD',
    fontWeight: '700',
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 12,
    color: '#94A3B8',
  },
  gridContent: {
    padding: 8,
    paddingBottom: 90,
  },
  photoItem: {
    flex: 1 / 3,
    aspectRatio: 1,
    margin: 3,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
    position: 'relative',
  },
  photoImg: {
    width: '100%',
    height: '100%',
  },
  favBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 4,
    borderRadius: 12,
  },
  faceBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(139, 92, 246, 0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  faceBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
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
  listContent: {
    padding: 12,
    paddingBottom: 90,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  listThumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: '#1E293B',
  },
  listDetails: {
    flex: 1,
    marginLeft: 12,
  },
  listFileName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  listMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  listMetaText: {
    fontSize: 11,
    color: '#64748B',
  },
  inlineFaceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  inlineFaceText: {
    fontSize: 10,
    color: '#C4B5FD',
    fontWeight: '600',
  },
  listItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  listFavBtn: {
    padding: 6,
  },
  listDelBtn: {
    padding: 6,
  },
  emptyWrap: {
    paddingTop: 50,
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#CBD5E1',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  emptyUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    marginTop: 16,
  },
  emptyUploadBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
