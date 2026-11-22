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

  // New Collection Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPasscode, setNewPasscode] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchCollections = async () => {
    try {
      const data = await api.getCollections();
      setCollections(data.collections || data || []);
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
      Alert.alert('Required', 'Please enter an event or collection name.');
      return;
    }
    setCreating(true);
    try {
      await api.createCollection({
        name: newTitle.trim(),
        description: newDesc.trim(),
        passcode: newPasscode.trim() || undefined,
      });
      setShowCreateModal(false);
      setNewTitle('');
      setNewDesc('');
      setNewPasscode('');
      fetchCollections();
    } catch (err) {
      Alert.alert('Creation Failed', err.message || 'Could not create collection.');
    } finally {
      setCreating(false);
    }
  };

  const renderCollectionItem = ({ item }) => {
    const fileCount = item.fileCount || item.files?.length || 0;
    const coverUrl = item.coverImage || item.thumbnailUrl || (item.files && item.files[0]?.cloudinaryUrl);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          setSelectedDetailCollection(item);
          if (onSelectCollection) onSelectCollection(item);
        }}
        activeOpacity={0.8}
      >
        <View style={styles.cardImageWrap}>
          {coverUrl ? (
            <Image source={{ uri: coverUrl }} style={styles.cardImage} resizeMode="cover" />
          ) : (
            <View style={styles.cardImagePlaceholder}>
              <Ionicons name="images-outline" size={32} color="#64748B" />
            </View>
          )}
          <View style={styles.fileCountPill}>
            <Ionicons name="image" size={12} color="#FFFFFF" />
            <Text style={styles.fileCountText}>{fileCount}</Text>
          </View>
        </View>

        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.cardDesc} numberOfLines={1}>
            {item.description || 'Universal QR Event Collection'}
          </Text>

          <View style={styles.cardFooter}>
            <View style={styles.statusPill}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>{item.isPublic ? 'Public' : 'Protected'}</Text>
            </View>

            <TouchableOpacity
              style={styles.qrActionBtn}
              onPress={() => setActiveQRCollection(item)}
              activeOpacity={0.7}
            >
              <Ionicons name="qr-code" size={16} color="#A78BFA" />
              <Text style={styles.qrActionText}>Show QR</Text>
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
        onBack={() => setSelectedDetailCollection(null)}
        onOpenUpload={(colId) => {
          setSelectedDetailCollection(null);
          if (onOpenUpload) onOpenUpload(colId);
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Event Collections"
        subtitle="Shared galleries with QR codes & instant cloud sync"
        rightAction
        rightIcon="add"
        onRightAction={() => setShowCreateModal(true)}
      />

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading event galleries...</Text>
        </View>
      ) : (
        <FlatList
          data={collections}
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
              <Text style={styles.emptyTitle}>No Collections Yet</Text>
              <Text style={styles.emptySubtitle}>
                Create an event to start collecting and organizing photos from guests.
              </Text>
              <TouchableOpacity
                style={styles.emptyCreateBtn}
                onPress={() => setShowCreateModal(true)}
              >
                <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
                <Text style={styles.emptyCreateBtnText}>Create First Event</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Floating Action Upload Button */}
      <TouchableOpacity
        style={styles.fabUpload}
        onPress={onOpenUpload}
        activeOpacity={0.85}
      >
        <Ionicons name="cloud-upload" size={22} color="#FFFFFF" />
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

      {/* Create Event Modal */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.createModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Event Collection</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Event Name</Text>
            <TextInput
              style={styles.modalInput}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="e.g. Wedding Reception, Tech Meetup"
              placeholderTextColor="#64748B"
            />

            <Text style={styles.inputLabel}>Description (Optional)</Text>
            <TextInput
              style={styles.modalInput}
              value={newDesc}
              onChangeText={setNewDesc}
              placeholder="Share memories with friends..."
              placeholderTextColor="#64748B"
            />

            <Text style={styles.inputLabel}>Access Passcode (Optional)</Text>
            <TextInput
              style={styles.modalInput}
              value={newPasscode}
              onChangeText={setNewPasscode}
              placeholder="Leave empty for open public access"
              placeholderTextColor="#64748B"
            />

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
  listContent: {
    padding: 16,
    paddingBottom: 90,
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
    borderRadius: 18,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileCountPill: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
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
    fontSize: 17,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12.5,
    color: '#94A3B8',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  statusText: {
    fontSize: 11.5,
    color: '#CBD5E1',
    fontWeight: '600',
  },
  qrActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
  },
  qrActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C4B5FD',
  },
  fabUpload: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 30,
    gap: 8,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyContainer: {
    paddingTop: 80,
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  emptyCreateBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  createModalCard: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 6,
    marginTop: 10,
  },
  modalInput: {
    height: 44,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    paddingHorizontal: 12,
    color: '#FFFFFF',
    fontSize: 13,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  submitCreateBtn: {
    height: 46,
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 10,
  },
  submitCreateBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
