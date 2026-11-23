import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';

export const QRScannerModal = ({ visible, onClose, onScanSuccess }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [torch, setTorch] = useState(false);

  useEffect(() => {
    if (visible) {
      setScanned(false);
      setScannedData(null);
      if (!permission?.granted) {
        requestPermission();
      }
    }
  }, [visible]);

  const handleBarcodeScanned = ({ type, data }) => {
    if (scanned) return;
    setScanned(true);
    setScannedData(data);

    if (onScanSuccess) {
      onScanSuccess(data);
    }
  };

  const handleOpenLink = async () => {
    if (!scannedData) return;
    try {
      const supported = await Linking.canOpenURL(scannedData);
      if (supported) {
        await Linking.openURL(scannedData);
        onClose();
      } else {
        Alert.alert('Scanned Content', scannedData);
      }
    } catch (err) {
      Alert.alert('Unable to Open URL', err.message || 'The scanned QR code is not a valid URL.');
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        {/* Top Header Controls */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.iconBtn} onPress={onClose}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Scan QR Code</Text>
          <TouchableOpacity
            style={[styles.iconBtn, torch && styles.iconBtnActive]}
            onPress={() => setTorch(!torch)}
          >
            <Ionicons name={torch ? 'flash' : 'flash-outline'} size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Camera View or Permission Prompt */}
        {!permission ? (
          <View style={styles.centerWrap}>
            <ActivityIndicator size="large" color="#8B5CF6" />
            <Text style={styles.permissionText}>Initializing Camera...</Text>
          </View>
        ) : !permission.granted ? (
          <View style={styles.centerWrap}>
            <Ionicons name="camera-outline" size={60} color="#64748B" />
            <Text style={styles.permissionTitle}>Camera Access Required</Text>
            <Text style={styles.permissionText}>
              SnapShare needs camera permission to scan visitor and event collection QR codes.
            </Text>
            <TouchableOpacity style={styles.grantBtn} onPress={requestPermission}>
              <Text style={styles.grantBtnText}>Grant Camera Permission</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cameraWrapper}>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              enableTorch={torch}
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
              onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            />

            {/* Viewfinder Target Reticle Overlay */}
            <View style={styles.overlay}>
              <View style={styles.reticleBox}>
                {/* 4 Corner Markers */}
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />

                {!scanned && <View style={styles.scanLine} />}
              </View>

              <Text style={styles.reticleHint}>
                Align collection QR code inside the viewfinder
              </Text>
            </View>
          </View>
        )}

        {/* Scanned Result Bottom Sheet */}
        {scanned && (
          <View style={styles.resultSheet}>
            <View style={styles.resultHeader}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              <Text style={styles.resultTitle}>QR Code Scanned!</Text>
            </View>

            <Text style={styles.resultData} numberOfLines={2}>
              {scannedData}
            </Text>

            <View style={styles.resultButtonsRow}>
              <TouchableOpacity
                style={styles.rescanBtn}
                onPress={() => {
                  setScanned(false);
                  setScannedData(null);
                }}
              >
                <Ionicons name="refresh" size={16} color="#94A3B8" />
                <Text style={styles.rescanBtnText}>Scan Again</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.openLinkBtn} onPress={handleOpenLink}>
                <Ionicons name="open-outline" size={16} color="#FFFFFF" />
                <Text style={styles.openLinkBtnText}>Open Link</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070B14',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 44 : 54,
    paddingBottom: 14,
    backgroundColor: 'rgba(7, 11, 20, 0.95)',
    zIndex: 10,
  },
  topTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBtnActive: {
    backgroundColor: '#8B5CF6',
  },
  cameraWrapper: {
    flex: 1,
    position: 'relative',
  },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  grantBtn: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  grantBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  reticleBox: {
    width: 250,
    height: 250,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#38BDF8',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 10,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 10,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 10,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 10,
  },
  scanLine: {
    position: 'absolute',
    top: '50%',
    left: 10,
    right: 10,
    height: 2,
    backgroundColor: '#C084FC',
    shadowColor: '#C084FC',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  reticleHint: {
    marginTop: 24,
    fontSize: 12,
    fontWeight: '600',
    color: '#E2E8F0',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  resultSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'android' ? 30 : 40,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  resultData: {
    fontSize: 12,
    color: '#94A3B8',
    backgroundColor: '#1E293B',
    padding: 10,
    borderRadius: 10,
    marginBottom: 16,
  },
  resultButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  rescanBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    borderRadius: 12,
  },
  rescanBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  openLinkBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    borderRadius: 12,
  },
  openLinkBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
