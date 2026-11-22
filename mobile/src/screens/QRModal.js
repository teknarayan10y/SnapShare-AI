import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';

export const QRModal = ({ visible, collection, onClose }) => {
  if (!collection) return null;

  const collectionId = collection._id || collection.id;
  // QR Payload: A universal URL that opens the event gallery
  const qrValue = `https://snapshare.ai/events/${collectionId}`;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.titleWrap}>
              <Text style={styles.title} numberOfLines={1}>{collection.name}</Text>
              <Text style={styles.subtitle}>Universal Visitor QR Code</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* QR Code Canvas */}
          <View style={styles.qrContainer}>
            <QRCode
              value={qrValue}
              size={200}
              color="#0B0F19"
              backgroundColor="#FFFFFF"
            />
          </View>

          <Text style={styles.instructionText}>
            Guests scan this QR code with their camera to view the gallery and upload photos without creating an account.
          </Text>

          {collection.passcode ? (
            <View style={styles.passcodeBox}>
              <Ionicons name="lock-closed" size={14} color="#F59E0B" />
              <Text style={styles.passcodeText}>
                Passcode: <Text style={styles.passcodeHighlight}>{collection.passcode}</Text>
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={styles.doneBtn}
            onPress={onClose}
          >
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleWrap: {
    flex: 1,
    marginRight: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  subtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    marginBottom: 16,
  },
  instructionText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
  },
  passcodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    marginBottom: 16,
  },
  passcodeText: {
    fontSize: 12,
    color: '#FCD34D',
    fontWeight: '600',
  },
  passcodeHighlight: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  doneBtn: {
    width: '100%',
    height: 44,
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
