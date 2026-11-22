import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';

const { width, height } = Dimensions.get('window');

export const PhotobookModal = ({ visible, onClose, collectionId }) => {
  const [loading, setLoading] = useState(true);
  const [book, setBook] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      fetchBook();
    }
  }, [visible, collectionId]);

  const fetchBook = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getPhotobook(collectionId);
      if (res.success && res.photobook) {
        setBook(res.photobook);
        setCurrentIndex(0);
      } else {
        setError('Could not generate photobook layout');
      }
    } catch (err) {
      setError(err.message || 'Failed to load photobook');
    } finally {
      setLoading(false);
    }
  };

  const pages = book?.pages || [];
  const currentPage = pages[currentIndex] || null;
  const currentLayout = currentPage ? (currentPage.type || currentPage.layoutType) : null;
  const coverPhotoUrl = currentPage ? (currentPage.photos?.[0]?.url || currentPage.heroImage || '') : '';

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <View style={styles.headerLeft}>
              <View style={styles.bookIcon}>
                <Ionicons name="book" size={18} color="#C084FC" />
              </View>
              <View>
                <Text style={styles.title} numberOfLines={1}>
                  {book?.title || 'Auto-Curated Photobook'}
                </Text>
                <Text style={styles.subTitle}>
                  {book?.totalPages || 0} Spreads • AI Story Layout
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <View style={styles.body}>
            {loading ? (
              <View style={styles.centerBox}>
                <ActivityIndicator size="large" color="#A855F7" />
                <Text style={styles.loadingText}>Curating Event Photobook...</Text>
                <Text style={styles.loadingSub}>Arranging portraits, duos, and group highlights</Text>
              </View>
            ) : error ? (
              <View style={styles.centerBox}>
                <Ionicons name="alert-circle-outline" size={36} color="#F87171" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={fetchBook}>
                  <Text style={styles.retryBtnText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : !currentPage ? (
              <View style={styles.centerBox}>
                <Text style={styles.emptyText}>No photos available to build photobook.</Text>
              </View>
            ) : (
              <View style={styles.bookCanvas}>
                {/* Spread Header */}
                <View style={styles.spreadHeader}>
                  <Text style={styles.spreadCategory}>
                    {currentPage.spreadTitle || currentPage.title || 'Spread'}
                  </Text>
                  <Text style={styles.pageNumber}>
                    {currentIndex + 1} / {pages.length}
                  </Text>
                </View>

                {/* Spread Contents */}
                <View style={styles.spreadBody}>
                  {/* COVER SPREAD */}
                  {currentLayout === 'cover' && (
                    <View style={styles.coverLayout}>
                      {coverPhotoUrl ? (
                        <Image
                          source={{ uri: coverPhotoUrl }}
                          style={styles.coverImage}
                          resizeMode="cover"
                        />
                      ) : null}
                      <Text style={styles.coverTitle}>{book?.title}</Text>
                      <Text style={styles.coverDesc}>{book?.description || 'Event Highlights'}</Text>
                    </View>
                  )}

                  {/* DUO SPREAD (2 Photos) */}
                  {currentLayout === 'duo_spread' && (
                    <View style={styles.duoLayout}>
                      {currentPage.photos?.map((photo, i) => (
                        <View key={i} style={styles.duoItem}>
                          <Image
                            source={{ uri: photo.url }}
                            style={styles.duoImage}
                            resizeMode="cover"
                          />
                          {photo.caption && (
                            <Text style={styles.photoCaption} numberOfLines={2}>
                              "{photo.caption}"
                            </Text>
                          )}
                        </View>
                      ))}
                    </View>
                  )}

                  {/* HERO PORTRAIT */}
                  {currentLayout === 'hero_portrait' && (
                    <View style={styles.heroLayout}>
                      {currentPage.photos?.[0] && (
                        <Image
                          source={{ uri: currentPage.photos[0].url }}
                          style={styles.heroImage}
                          resizeMode="contain"
                        />
                      )}
                      {currentPage.photos?.[0]?.caption && (
                        <Text style={styles.photoCaption}>
                          "{currentPage.photos[0].caption}"
                        </Text>
                      )}
                    </View>
                  )}

                  {/* GROUP SPREAD */}
                  {currentLayout === 'group_spread' && (
                    <View style={styles.heroLayout}>
                      {currentPage.photos?.[0] && (
                        <Image
                          source={{ uri: currentPage.photos[0].url }}
                          style={styles.groupImage}
                          resizeMode="cover"
                        />
                      )}
                      <Text style={styles.groupTag}>Group Celebration Moment</Text>
                    </View>
                  )}

                  {/* MOSAIC SPREAD (Grid of 4) */}
                  {currentLayout === 'mosaic_spread' && (
                    <View style={styles.mosaicGrid}>
                      {currentPage.photos?.map((photo, i) => (
                        <View key={i} style={styles.mosaicCell}>
                          <Image
                            source={{ uri: photo.url }}
                            style={styles.mosaicImage}
                            resizeMode="cover"
                          />
                        </View>
                      ))}
                    </View>
                  )}

                  {/* BACK COVER */}
                  {currentLayout === 'back_cover' && (
                    <View style={styles.backCoverLayout}>
                      <Ionicons name="heart-circle" size={64} color="#C084FC" />
                      <Text style={styles.backCoverTitle}>Memories Preserved</Text>
                      <Text style={styles.backCoverDesc}>
                        Auto-curated with SnapShare AI facial clustering and composition sequencing.
                      </Text>
                    </View>
                  )}
                </View>

                {/* Spread Caption */}
                {currentPage.caption && (
                  <View style={styles.spreadFooter}>
                    <Text style={styles.footerCaption}>"{currentPage.caption}"</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Bottom Navigation */}
          {pages.length > 0 && (
            <View style={styles.navBar}>
              <TouchableOpacity
                onPress={() => setCurrentIndex((idx) => Math.max(0, idx - 1))}
                disabled={currentIndex === 0}
                style={[styles.navBtn, currentIndex === 0 && styles.disabledBtn]}
              >
                <Ionicons name="chevron-back" size={18} color="#FFFFFF" />
                <Text style={styles.navBtnText}>Previous</Text>
              </TouchableOpacity>

              <View style={styles.dotsRow}>
                {pages.slice(0, 8).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      i === currentIndex && styles.activeDot,
                    ]}
                  />
                ))}
              </View>

              <TouchableOpacity
                onPress={() => setCurrentIndex((idx) => Math.min(pages.length - 1, idx + 1))}
                disabled={currentIndex >= pages.length - 1}
                style={[styles.navBtn, styles.nextBtn, currentIndex >= pages.length - 1 && styles.disabledBtn]}
              >
                <Text style={styles.navBtnText}>Next</Text>
                <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '95%',
    height: '92%',
    backgroundColor: '#0B0F19',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  bookIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subTitle: {
    fontSize: 11,
    color: '#94A3B8',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  body: {
    flex: 1,
    padding: 12,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 20,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loadingSub: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  errorText: {
    color: '#F87171',
    fontSize: 13,
    textAlign: 'center',
  },
  retryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#9333EA',
    borderRadius: 10,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  bookCanvas: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
    justifyContent: 'space-between',
  },
  spreadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  spreadCategory: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C084FC',
    textTransform: 'uppercase',
  },
  pageNumber: {
    fontSize: 11,
    color: '#94A3B8',
  },
  spreadBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  coverLayout: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  coverImage: {
    width: '100%',
    height: 240,
    borderRadius: 14,
    marginBottom: 14,
  },
  coverTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  coverDesc: {
    fontSize: 12,
    color: '#C084FC',
    marginTop: 4,
    textAlign: 'center',
  },
  duoLayout: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    height: 260,
  },
  duoItem: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  duoImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  photoCaption: {
    fontSize: 11,
    color: '#CBD5E1',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 6,
  },
  heroLayout: {
    width: '100%',
    alignItems: 'center',
  },
  heroImage: {
    width: '100%',
    height: 280,
    borderRadius: 14,
  },
  groupImage: {
    width: '100%',
    height: 260,
    borderRadius: 14,
  },
  groupTag: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A855F7',
    marginTop: 8,
  },
  mosaicGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
    justifyContent: 'center',
  },
  mosaicCell: {
    width: '48%',
    height: 155,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  mosaicImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  backCoverLayout: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  backCoverTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 12,
  },
  backCoverDesc: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
  },
  spreadFooter: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
  },
  footerCaption: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  nextBtn: {
    backgroundColor: '#9333EA',
  },
  disabledBtn: {
    opacity: 0.3,
  },
  navBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  activeDot: {
    width: 14,
    backgroundColor: '#A855F7',
  },
});

export default PhotobookModal;
