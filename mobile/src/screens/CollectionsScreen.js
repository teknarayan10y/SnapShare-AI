import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { Header } from '../components/Header';
import { QRModal } from './QRModal';
import { CollectionDetailScreen } from './CollectionDetailScreen';

export const CollectionsScreen = ({ onSelectCollection, onOpenUpload }) => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeQRCollection, setActiveQRCollection] = useState(null);
  const [selectedDetailCollection, setSelectedDetailCollection] = useState(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // New Collection Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [accessType, setAccessType] = useState('public'); // 'public' | 'password'
  const [newPasscode, setNewPasscode] = useState('');
  const [allowCollaborative, setAllowCollaborative] = useState(true);
  const [allowDownloads, setAllowDownloads] = useState(true);
  const [creating, setCreating] = useState(false);

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'general', label: 'General' },
    { id: 'wedding', label: 'Wedding' },
    { id: 'birthday', label: 'Birthday' },
    { id: 'corporate', label: 'Corporate' },
    { id: 'party', label: 'Party' },
    { id: 'travel', label: 'Travel' },
    { id: 'personal', label: 'Personal' },
  ];

  const fetchCollections = async () => {
    try {
      const data = await api.getCollections();
      const list = data.collections || (Array.isArray(data) ? data : []);
      setCollections(list);
    } catch (err) {
      console.warn('Failed to fetch collections:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCollections();
  };

  const handleCreateCollection = async () => {
    if (!newTitle.trim()) {
      Alert.alert('Required', 'Please enter a collection or event title.');
      return;
    }
    if (accessType === 'password' && (!newPasscode.trim() || newPasscode.trim().length < 4)) {
      Alert.alert('Passcode Required', 'Password-protected collections require at least 4 characters.');
      return;
    }

    setCreating(true);
    try {
      const payload = {
        title: newTitle.trim(),
        name: newTitle.trim(),
        description: newDesc.trim(),
        category: newCategory,
        accessType,
        password: accessType === 'password' ? newPasscode.trim() : undefined,
        allowCollaborativeUpload: allowCollaborative,
        allowDownloads,
      };

      await api.createCollection(payload);
      setShowCreateModal(false);
      setNewTitle('');
      setNewDesc('');
      setNewCategory('general');
      setAccessType('public');
      setNewPasscode('');
      setAllowCollaborative(true);
      setAllowDownloads(true);
      fetchCollections();
      Alert.alert('Collection Created ✨', 'Your new collection and QR code are ready!');
    } catch (err) {
      Alert.alert('Creation Failed', err.message || 'Could not create collection.');
    } finally {
      setCreating(false);
    }
  };

  const handleDuplicateCollection = async (collectionId) => {
    try {
      const res = await api.duplicateCollection(collectionId);
      if (res.collection) {
        setCollections((prev) => [res.collection, ...prev]);
        Alert.alert('Duplicated ✨', 'Collection duplicated successfully.');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to duplicate collection.');
    }
  };

  const handleDeleteCollection = (collectionId, title) => {
    Alert.alert(
      'Delete Collection',
      `Are you sure you want to delete "${title}" and all its photos? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteCollection(collectionId);
              setCollections((prev) => prev.filter((c) => (c._id || c.id) !== collectionId));
              Alert.alert('Deleted', 'Collection removed successfully.');
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to delete collection.');
            }
          },
        },
      ]
    );
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Filter collections by search and category
  const filteredCollections = collections.filter((c) => {
    const matchesSearch =
      (c.title || c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat =
      selectedCategory === 'all' ||
      (c.category || 'general').toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCat;
  });

  const renderCollectionItem = ({ item }) => {
    const collId = item._id || item.id;
    const title = item.title || item.name || 'Untitled Collection';
    const fileCount = item.totalFiles ?? item.fileCount ?? (item.files ? item.files.length : 0);
    const coverUrl = item.coverImage || item.thumbnailUrl || (item.files && item.files[0]?.cloudinaryUrl);
    const category = item.category || 'General';
    const isPublic = item.accessType === 'public' || item.isPublic !== false;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          setSelectedDetailCollection(item);
          if (onSelectCollection) onSelectCollection(item);
        }}
        activeOpacity={0.85}
      >
        {/* Cover / Header */}
        <View style={styles.cardImageWrap}>
          {coverUrl ? (
            <Image source={{ uri: coverUrl }} style={styles.cardImage} resizeMode="cover" />
          ) : (
            <View style={styles.cardImagePlaceholder}>
              <Ionicons name="images-outline" size={36} color="#64748B" />
            </View>
          )}

          {/* Top badges */}
          <View style={styles.cardTopBadges}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{category}</Text>
            </View>
            <View style={[styles.accessBadge, !isPublic && styles.accessBadgeProtected]}>
              <Ionicons
                name={isPublic ? 'globe-outline' : 'lock-closed-outline'}
                size={11}
                color="#FFFFFF"
              />
              <Text style={styles.accessBadgeText}>{isPublic ? 'Public' : 'Protected'}</Text>
            </View>
          </View>

          {/* File Count Overlay */}
          <View style={styles.fileCountPill}>
            <Ionicons name="images" size={12} color="#FFFFFF" />
            <Text style={styles.fileCountText}>{fileCount} Photos</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={1}>{title}</Text>
          <Text style={styles.cardDesc} numberOfLines={2}>
            {item.description || 'Shared universal gallery with instant QR visitor streaming.'}
          </Text>

          {/* Stats Bar */}
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Ionicons name="file-tray-full-outline" size={13} color="#94A3B8" />
              <Text style={styles.statText}>{formatBytes(item.totalSize || 0)}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="qr-code-outline" size={13} color="#94A3B8" />
              <Text style={styles.statText}>{item.scanCount || 0} scans</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="cloud-download-outline" size={13} color="#94A3B8" />
              <Text style={styles.statText}>{item.downloadCount || 0} dl</Text>
            </View>
          </View>

          {/* Action Row */}
          <View style={styles.cardFooterActions}>
            <TouchableOpacity
              style={styles.actionIconBtn}
              onPress={() => setActiveQRCollection(item)}
              activeOpacity={0.7}
            >
              <Ionicons name="qr-code" size={16} color="#C084FC" />
              <Text style={styles.actionIconText}>QR Share</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionIconBtn}
              onPress={() => {
                if (onOpenUpload) onOpenUpload(collId);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="cloud-upload-outline" size={16} color="#38BDF8" />
              <Text style={[styles.actionIconText, { color: '#38BDF8' }]}>Upload</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionIconBtn}
              onPress={() => handleDuplicateCollection(collId)}
              activeOpacity={0.7}
            >
              <Ionicons name="copy-outline" size={16} color="#94A3B8" />
              <Text style={[styles.actionIconText, { color: '#94A3B8' }]}>Copy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionIconBtn}
              onPress={() => handleDeleteCollection(collId, title)}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
              <Text style={[styles.actionIconText, { color: '#EF4444' }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (selectedDetailCollection) {
    return (
      <CollectionDetailScreen
        collection={selectedDetailCollection}
        onBack={() => {
          setSelectedDetailCollection(null);
          fetchCollections();
        }}
        onOpenUpload={(colId) => {
          setSelectedDetailCollection(null);
          if (onOpenUpload) onOpenUpload(colId);
        }}
        onDeleteCollection={(colId) => {
          setSelectedDetailCollection(null);
          setCollections((prev) => prev.filter((c) => (c._id || c.id) !== colId));
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Event Collections"
        subtitle="Manage, duplicate, and share dynamic QR vaults"
        rightAction
        rightIcon="add"
        onRightAction={() => setShowCreateModal(true)}
      />

      {/* Search & Category Filter Toolbar */}
      <View style={styles.searchFilterContainer}>
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search collections..."
            placeholderTextColor="#64748B"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Category Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextSelected]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Collections List */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading event galleries...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredCollections}
          keyExtractor={(item) => item._id || item.id || String(Math.random())}
          renderItem={renderCollectionItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#8B5CF6" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="folder-open-outline" size={48} color="#64748B" />
              </View>
              <Text style={styles.emptyTitle}>
                {searchQuery || selectedCategory !== 'all'
                  ? 'No matching collections'
                  : 'No Collections Yet'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery || selectedCategory !== 'all'
                  ? 'Try adjusting your search terms or category filter.'
                  : 'Create an event collection to start collecting, organizing, and sharing photos.'}
              </Text>
              <TouchableOpacity
                style={styles.emptyCreateBtn}
                onPress={() => setShowCreateModal(true)}
              >
                <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
                <Text style={styles.emptyCreateBtnText}>Create New Event</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Floating Action Upload Button */}
      <TouchableOpacity
        style={styles.fabUpload}
        onPress={() => onOpenUpload && onOpenUpload('')}
        activeOpacity={0.85}
      >
        <Ionicons name="cloud-upload" size={20} color="#FFFFFF" />
        <Text style={styles.fabText}>Upload Photos</Text>
      </TouchableOpacity>

      {/* QR Code Presentation Modal */}
      {activeQRCollection && (
        <QRModal
          visible={!!activeQRCollection}
          collection={activeQRCollection}
          onClose={() => setActiveQRCollection(null)}
        />
      )}

      {/* Create Event Modal (Full Web Parity) */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.createModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Event Collection</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 440 }}>
              {/* Event Title */}
              <Text style={styles.inputLabel}>Event / Collection Title *</Text>
              <TextInput
                style={styles.modalInput}
                value={newTitle}
                onChangeText={setNewTitle}
                placeholder="e.g. Wedding Reception, Corporate Summit"
                placeholderTextColor="#64748B"
              />

              {/* Description */}
              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.modalInput, { height: 60 }]}
                value={newDesc}
                onChangeText={setNewDesc}
                placeholder="Share memories with friends & guests..."
                placeholderTextColor="#64748B"
                multiline
              />

              {/* Category Picker */}
              <Text style={styles.inputLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {['general', 'wedding', 'birthday', 'corporate', 'party', 'travel', 'personal'].map((cat) => {
                  const isSel = newCategory === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.modalCatChip, isSel && styles.modalCatChipSelected]}
                      onPress={() => setNewCategory(cat)}
                    >
                      <Text style={[styles.modalCatChipText, isSel && styles.modalCatChipTextSelected]}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Access Type Switch */}
              <View style={styles.modalSwitchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalSwitchTitle}>Public Access (Instant QR)</Text>
                  <Text style={styles.modalSwitchSub}>Anyone with the QR code or link can view</Text>
                </View>
                <Switch
                  value={accessType === 'public'}
                  onValueChange={(val) => setAccessType(val ? 'public' : 'password')}
                  trackColor={{ false: '#1E293B', true: '#8B5CF6' }}
                  thumbColor={accessType === 'public' ? '#FFFFFF' : '#94A3B8'}
                />
              </View>

              {/* Passcode if Password Protected */}
              {accessType === 'password' && (
                <View style={{ marginBottom: 12 }}>
                  <Text style={styles.inputLabel}>Access Passcode *</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={newPasscode}
                    onChangeText={setNewPasscode}
                    placeholder="Enter 4+ character passcode"
                    placeholderTextColor="#64748B"
                    secureTextEntry
                  />
                </View>
              )}

              {/* Collaborative Uploads */}
              <View style={styles.modalSwitchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalSwitchTitle}>Collaborative Guest Uploads</Text>
                  <Text style={styles.modalSwitchSub}>Allow guests to upload photos via QR</Text>
                </View>
                <Switch
                  value={allowCollaborative}
                  onValueChange={setAllowCollaborative}
                  trackColor={{ false: '#1E293B', true: '#8B5CF6' }}
                  thumbColor={allowCollaborative ? '#FFFFFF' : '#94A3B8'}
                />
              </View>

              {/* Allow Downloads */}
              <View style={styles.modalSwitchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalSwitchTitle}>Allow Photo Downloads</Text>
                  <Text style={styles.modalSwitchSub}>Visitors can download original high-res photos</Text>
                </View>
                <Switch
                  value={allowDownloads}
                  onValueChange={setAllowDownloads}
                  trackColor={{ false: '#1E293B', true: '#8B5CF6' }}
                  thumbColor={allowDownloads ? '#FFFFFF' : '#94A3B8'}
                />
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.submitCreateBtn}
              onPress={handleCreateCollection}
              disabled={creating}
            >
              {creating ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitCreateBtnText}>Create Collection & Generate QR</Text>
              )}
            </TouchableOpacity>
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
  searchFilterContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 13,
  },
  categoryScroll: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginRight: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  categoryChipSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#A78BFA',
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 120,
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#94A3B8',
  },
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    overflow: 'hidden',
  },
  cardImageWrap: {
    height: 140,
    backgroundColor: '#1E293B',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardImagePlaceholder: {
    flex: 1,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTopBadges: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },
  categoryBadgeText: {
    color: '#C4B5FD',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  accessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(6, 182, 212, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  accessBadgeProtected: {
    backgroundColor: 'rgba(245, 158, 11, 0.85)',
  },
  accessBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  fileCountPill: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  fileCountText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  cardInfo: {
    padding: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 17,
    marginBottom: 10,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 10,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  cardFooterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  actionIconText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#C084FC',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  emptyCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyCreateBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  fabUpload: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    elevation: 6,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  createModalCard: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    color: '#F8FAFC',
    fontSize: 13,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 12,
  },
  modalCatChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    marginRight: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalCatChipSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#A78BFA',
  },
  modalCatChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  modalCatChipTextSelected: {
    color: '#FFFFFF',
  },
  modalSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  modalSwitchTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  modalSwitchSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  submitCreateBtn: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  submitCreateBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
