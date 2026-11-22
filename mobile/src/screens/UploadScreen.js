import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../services/api';
import { Header } from '../components/Header';

export const UploadScreen = ({ defaultCollectionId, onUploadComplete }) => {
  const [selectedImages, setSelectedImages] = useState([]);
  const [collections, setCollections] = useState([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState(defaultCollectionId || '');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    api.getCollections()
      .then((data) => {
        const list = data.collections || data || [];
        setCollections(list);
        if (!selectedCollectionId && list.length > 0) {
          setSelectedCollectionId(list[0]._id || list[0].id);
        }
      })
      .catch((err) => console.warn('Could not load collections:', err));
  }, []);

  const handlePickFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Please allow media library access to pick photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.9,
      });

      if (!result.canceled && result.assets) {
        const newAssets = result.assets.map((a) => ({
          uri: a.uri,
          fileName: a.fileName || `photo_${Date.now()}.jpg`,
          mimeType: a.mimeType || 'image/jpeg',
          fileSize: a.fileSize || 0,
        }));
        setSelectedImages((prev) => [...prev, ...newAssets]);
      }
    } catch (err) {
      Alert.alert('Picker Error', err.message);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Please allow camera access to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const a = result.assets[0];
        setSelectedImages((prev) => [
          ...prev,
          {
            uri: a.uri,
            fileName: a.fileName || `camera_${Date.now()}.jpg`,
            mimeType: a.mimeType || 'image/jpeg',
            fileSize: a.fileSize || 0,
          },
        ]);
      }
    } catch (err) {
      Alert.alert('Camera Error', err.message);
    }
  };

  const handleRemoveImage = (index) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStartUpload = async () => {
    if (selectedImages.length === 0) {
      Alert.alert('No Photos', 'Please select or take at least one photo first.');
      return;
    }

    setUploading(true);
    setUploadProgress({ current: 0, total: selectedImages.length });

    let successCount = 0;
    try {
      for (let i = 0; i < selectedImages.length; i++) {
        const img = selectedImages[i];
        setUploadProgress({ current: i + 1, total: selectedImages.length });
        await api.uploadFile(img.uri, img.fileName, img.mimeType, selectedCollectionId);
        successCount++;
      }

      // Automatically trigger AI Face & Group organization
      try {
        await api.triggerOrganization(selectedCollectionId);
      } catch (e) {
        console.warn('AI trigger warning:', e);
      }

      Alert.alert(
        'Upload Complete! ✨',
        `Successfully uploaded ${successCount} photo(s) to Cloudinary and dispatched AI neural face organization.`,
        [{ text: 'View Smart Folders', onPress: onUploadComplete }]
      );
      setSelectedImages([]);
    } catch (err) {
      Alert.alert('Upload Interrupted', `Uploaded ${successCount}/${selectedImages.length}. Error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Upload & Organize"
        subtitle="Direct cloud streaming with instant AI face detection"
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Target Collection Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Target Event Collection</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.collectionScroll}>
            {collections.map((c) => {
              const id = c._id || c.id;
              const isSelected = selectedCollectionId === id;
              return (
                <TouchableOpacity
                  key={id}
                  style={[styles.collectionChip, isSelected && styles.collectionChipSelected]}
                  onPress={() => setSelectedCollectionId(id)}
                >
                  <Ionicons
                    name={isSelected ? 'checkmark-circle' : 'folder-outline'}
                    size={14}
                    color={isSelected ? '#FFFFFF' : '#94A3B8'}
                  />
                  <Text style={[styles.collectionChipText, isSelected && styles.collectionChipTextSelected]}>
                    {c.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Action Buttons: Camera & Gallery */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBtnCamera}
            onPress={handleTakePhoto}
            activeOpacity={0.8}
            disabled={uploading}
          >
            <View style={styles.btnIconWrap}>
              <Ionicons name="camera" size={24} color="#8B5CF6" />
            </View>
            <Text style={styles.actionBtnTitle}>Take Photo</Text>
            <Text style={styles.actionBtnSubtitle}>Use device camera</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtnGallery}
            onPress={handlePickFromGallery}
            activeOpacity={0.8}
            disabled={uploading}
          >
            <View style={styles.btnIconWrap}>
              <Ionicons name="images" size={24} color="#06B6D4" />
            </View>
            <Text style={styles.actionBtnTitle}>Choose Gallery</Text>
            <Text style={styles.actionBtnSubtitle}>Select multiple photos</Text>
          </TouchableOpacity>
        </View>

        {/* Selected Photos Queue */}
        <View style={styles.queueHeader}>
          <Text style={styles.sectionTitle}>
            Ready to Upload ({selectedImages.length})
          </Text>
          {selectedImages.length > 0 && (
            <TouchableOpacity onPress={() => setSelectedImages([])}>
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>

        {selectedImages.length === 0 ? (
          <View style={styles.emptyUploadBox}>
            <Ionicons name="cloud-upload-outline" size={40} color="#475569" />
            <Text style={styles.emptyUploadTitle}>No photos chosen yet</Text>
            <Text style={styles.emptyUploadSubtitle}>
              Capture a photo or pick multiple from your device to begin AI analysis.
            </Text>
          </View>
        ) : (
          <View style={styles.previewGrid}>
            {selectedImages.map((img, idx) => (
              <View key={idx} style={styles.previewThumbWrap}>
                <Image source={{ uri: img.uri }} style={styles.previewThumb} />
                <TouchableOpacity
                  style={styles.deleteThumbBtn}
                  onPress={() => handleRemoveImage(idx)}
                >
                  <Ionicons name="close" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Upload Button */}
        {selectedImages.length > 0 && (
          <TouchableOpacity
            style={styles.uploadSubmitBtn}
            onPress={handleStartUpload}
            disabled={uploading}
            activeOpacity={0.85}
          >
            {uploading ? (
              <View style={styles.uploadingRow}>
                <ActivityIndicator color="#FFFFFF" />
                <Text style={styles.uploadingText}>
                  Uploading {uploadProgress.current}/{uploadProgress.total} photos...
                </Text>
              </View>
            ) : (
              <View style={styles.btnRow}>
                <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                <Text style={styles.uploadSubmitBtnText}>
                  Stream {selectedImages.length} Photo{selectedImages.length === 1 ? '' : 's'} to Cloud
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070B14',
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#CBD5E1',
    marginBottom: 10,
  },
  collectionScroll: {
    flexDirection: 'row',
  },
  collectionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  collectionChipSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#A78BFA',
  },
  collectionChipText: {
    fontSize: 12.5,
    color: '#94A3B8',
    fontWeight: '600',
  },
  collectionChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionBtnCamera: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
    alignItems: 'center',
  },
  actionBtnGallery: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.25)',
    alignItems: 'center',
  },
  btnIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionBtnTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 2,
  },
  actionBtnSubtitle: {
    fontSize: 11,
    color: '#64748B',
  },
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clearAllText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  emptyUploadBox: {
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 36,
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  emptyUploadTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#CBD5E1',
    marginTop: 10,
  },
  emptyUploadSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  previewThumbWrap: {
    width: '30.5%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1E293B',
  },
  previewThumb: {
    width: '100%',
    height: '100%',
  },
  deleteThumbBtn: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadSubmitBtn: {
    backgroundColor: '#8B5CF6',
    borderRadius: 14,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  uploadSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  uploadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  uploadingText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
