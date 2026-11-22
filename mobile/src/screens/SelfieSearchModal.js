import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../services/api';

const { width } = Dimensions.get('window');

export const SelfieSearchModal = ({ visible, onClose, collectionId, onPhotoSelect }) => {
  const [selfieUri, setSelfieUri] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const takeSelfie = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to take a selfie.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        cameraType: ImagePicker.CameraType.front,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelfieUri(asset.uri);
        runSearch(`data:image/jpeg;base64,${asset.base64}`);
      }
    } catch (e) {
      Alert.alert('Camera Error', e.message);
    }
  };

  const pickSelfieFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelfieUri(asset.uri);
        runSearch(`data:image/jpeg;base64,${asset.base64}`);
      }
    } catch (e) {
      Alert.alert('Gallery Error', e.message);
    }
  };

  const runSearch = async (base64Data) => {
    setScanning(true);
    setError(null);
    setResults(null);
    try {
      const res = await api.findMyPhotos(base64Data, collectionId, 0.38);
      if (res.success) {
        if (!res.foundFace) {
          setError(res.message || 'No face detected in your selfie. Please try again with clear lighting.');
        } else {
          setResults(res.matches || []);
        }
      } else {
        setError(res.error || 'Failed to complete face search');
      }
    } catch (err) {
      setError(err.message || 'Face search request failed');
    } finally {
      setScanning(false);
    }
  };

  const handleReset = () => {
    setSelfieUri(null);
    setResults(null);
    setError(null);
    setScanning(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconBox}>
                <Ionicons name="camera" size={20} color="#C084FC" />
              </View>
              <View>
                <Text style={styles.title}>Find My Photos</Text>
                <Text style={styles.subtitle}>Selfie Facial Recognition Search</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <View style={styles.body}>
            {!selfieUri && (
              <View style={styles.uploadPrompt}>
                <View style={styles.cameraCircle}>
                  <Ionicons name="person-circle-outline" size={72} color="#818CF8" />
                </View>
                <Text style={styles.promptTitle}>Snap a 1-Second Selfie</Text>
                <Text style={styles.promptDesc}>
                  Our privacy-first neural face matching will instantly scan this event and retrieve every photo you appear in.
                </Text>

                <View style={styles.btnRow}>
                  <TouchableOpacity style={styles.primaryBtn} onPress={takeSelfie}>
                    <Ionicons name="camera" size={18} color="#FFFFFF" />
                    <Text style={styles.btnText}>Open Camera</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.secondaryBtn} onPress={pickSelfieFromGallery}>
                    <Ionicons name="images-outline" size={18} color="#C084FC" />
                    <Text style={styles.secondaryBtnText}>From Gallery</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Scanning State */}
            {scanning && (
              <View style={styles.centerBox}>
                <ActivityIndicator size="large" color="#A855F7" />
                <Text style={styles.scanningText}>Analyzing 128D Face Embeddings...</Text>
                <Text style={styles.scanningSub}>Matching across all event photographs</Text>
              </View>
            )}

            {/* Error Message */}
            {error && !scanning && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={24} color="#F87171" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={handleReset}>
                  <Text style={styles.retryText}>Try Another Selfie</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Results Grid */}
            {results && !scanning && (
              <View style={styles.resultsContainer}>
                <View style={styles.resultsBar}>
                  <Text style={styles.resultsCount}>
                    Found {results.length} {results.length === 1 ? 'photo' : 'photos'} of you
                  </Text>
                  <TouchableOpacity onPress={handleReset} style={styles.newSearchBtn}>
                    <Ionicons name="refresh" size={14} color="#C084FC" />
                    <Text style={styles.newSearchText}>New Selfie</Text>
                  </TouchableOpacity>
                </View>

                {results.length === 0 ? (
                  <View style={styles.noMatchBox}>
                    <Text style={styles.noMatchText}>
                      No matching photographs found with this selfie.
                    </Text>
                  </View>
                ) : (
                  <FlatList
                    data={results}
                    keyExtractor={(item) => item.fileId || item._id}
                    numColumns={2}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.photoItem}
                        onPress={() => {
                          if (onPhotoSelect) onPhotoSelect(item);
                        }}
                      >
                        <Image source={{ uri: item.thumbnailUrl || item.cloudinaryUrl }} style={styles.photoImg} />
                        <View style={styles.confidenceBadge}>
                          <Text style={styles.confidenceText}>
                            {Math.round((item.similarity || 0.85) * 100)}% match
                          </Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  />
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 16, 0.94)',
    justifyContent: 'flex-end',
  },
  content: {
    height: '88%',
    backgroundColor: '#0D1322',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 11,
    color: '#94A3B8',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  body: {
    flex: 1,
    paddingTop: 16,
  },
  uploadPrompt: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 16,
  },
  cameraCircle: {
    marginBottom: 16,
  },
  promptTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  promptDesc: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  btnRow: {
    width: '100%',
    gap: 12,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#9333EA',
    paddingVertical: 14,
    borderRadius: 16,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    paddingVertical: 14,
    borderRadius: 16,
  },
  secondaryBtnText: {
    color: '#C084FC',
    fontSize: 14,
    fontWeight: '700',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  scanningText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scanningSub: {
    fontSize: 12,
    color: '#94A3B8',
  },
  errorBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    gap: 10,
    marginTop: 20,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 13,
    textAlign: 'center',
  },
  retryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#DC2626',
    borderRadius: 12,
    marginTop: 6,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  resultsContainer: {
    flex: 1,
  },
  resultsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#34D399',
  },
  newSearchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  newSearchText: {
    fontSize: 12,
    color: '#C084FC',
    fontWeight: '600',
  },
  photoItem: {
    flex: 1,
    aspectRatio: 1,
    margin: 5,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000000',
  },
  photoImg: {
    width: '100%',
    height: '100%',
  },
  confidenceBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  noMatchBox: {
    padding: 30,
    alignItems: 'center',
  },
  noMatchText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
  },
});

export default SelfieSearchModal;
