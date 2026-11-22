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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { PhotoDetailModal } from './PhotoDetailModal';
import { QRModal } from './QRModal';
import { SelfieSearchModal } from './SelfieSearchModal';
import { PhotobookModal } from './PhotobookModal';

export const CollectionDetailScreen = ({ collection, onBack, onOpenUpload }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [showSelfie, setShowSelfie] = useState(false);
  const [showPhotobook, setShowPhotobook] = useState(false);

  const collectionId = collection._id || collection.id;

  const loadCollectionFiles = async () => {
    try {
      const data = await api.getFiles(collectionId);
      setFiles(Array.isArray(data) ? data : (data.files || []));
    } catch (err) {
      console.warn('Failed to load collection files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCollectionFiles();
  }, [collectionId]);

  const renderPhoto = ({ item }) => {
    const url = item.cloudinaryUrl || item.url || item.thumbnailUrl;
    const faceCount = item.faceCount || item.aiAnalysis?.faceCount || 0;

    return (
      <TouchableOpacity
        style={styles.photoItem}
        onPress={() => setActivePhoto(item)}
        activeOpacity={0.8}
      >
        <Image source={{ uri: url }} style={styles.photoImg} />
        {faceCount > 0 ? (
          <View style={styles.faceBadge}>
            <Ionicons name="person" size={10} color="#FFFFFF" />
            <Text style={styles.faceBadgeText}>{faceCount}</Text>
          </View>
        ) : null}
        {item.voiceNote?.url ? (
          <View style={styles.voiceBadge}>
            <Ionicons name="mic" size={10} color="#C084FC" />
          </View>
        ) : null}
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
          <Text style={styles.navTitle} numberOfLines={1}>{collection.name}</Text>
          <Text style={styles.navSub}>{files.length} Photo{files.length === 1 ? '' : 's'}</Text>
        </View>
        <TouchableOpacity style={styles.qrBtn} onPress={() => setShowQR(true)}>
          <Ionicons name="qr-code" size={18} color="#A78BFA" />
        </TouchableOpacity>
      </View>

      {/* Collection Hero Bar */}
      <View style={styles.heroCard}>
        <Text style={styles.descText}>
          {collection.description || 'Shared event gallery with instant visitor QR access'}
        </Text>
        <View style={styles.heroActionsRow}>
          <TouchableOpacity
            style={styles.findPhotosBtn}
            onPress={() => setShowSelfie(true)}
          >
            <Ionicons name="camera" size={15} color="#FFFFFF" />
            <Text style={styles.findPhotosBtnText}>Find My Photos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.photobookBtn}
            onPress={() => setShowPhotobook(true)}
          >
            <Ionicons name="book-outline" size={15} color="#C084FC" />
            <Text style={styles.photobookBtnText}>Photobook</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addPhotosBtn}
            onPress={() => onOpenUpload && onOpenUpload(collectionId)}
          >
            <Ionicons name="add" size={16} color="#FFFFFF" />
            <Text style={styles.addPhotosBtnText}>Add Photos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.showQrHeroBtn}
            onPress={() => setShowQR(true)}
          >
            <Ionicons name="qr-code-outline" size={16} color="#A78BFA" />
            <Text style={styles.showQrHeroText}>QR</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Photos Grid */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      ) : (
        <FlatList
          data={files}
          keyExtractor={(item) => item._id || item.id || String(Math.random())}
          numColumns={3}
          renderItem={renderPhoto}
          contentContainerStyle={styles.gridContent}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="images-outline" size={44} color="#475569" />
              <Text style={styles.emptyTitle}>No photos in this event yet</Text>
              <Text style={styles.emptySubtitle}>
                Add photos or share the QR code with guests to start collecting photos.
              </Text>
            </View>
          }
        />
      )}

      {/* QR Modal */}
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

      {/* Feature 1: Selfie Search Modal */}
      <SelfieSearchModal
        visible={showSelfie}
        collectionId={collectionId}
        onClose={() => setShowSelfie(false)}
        onPhotoSelect={(p) => {
          setShowSelfie(false);
          setActivePhoto(p);
        }}
      />

      {/* Feature 6: Auto-Curated Photobook Modal */}
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
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  descText: {
    fontSize: 12,
    color: '#CBD5E1',
    marginBottom: 10,
  },
  heroActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  addPhotosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 6,
  },
  addPhotosBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  showQrHeroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 6,
  },
  showQrHeroText: {
    color: '#C4B5FD',
    fontSize: 12,
    fontWeight: '700',
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridContent: {
    padding: 10,
    paddingBottom: 80,
  },
  photoItem: {
    flex: 1 / 3,
    aspectRatio: 1,
    margin: 4,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
    position: 'relative',
  },
  photoImg: {
    width: '100%',
    height: '100%',
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
  findPhotosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
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
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  photobookBtnText: {
    color: '#C084FC',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyWrap: {
    paddingTop: 60,
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
  },
});
