import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';

const { width } = Dimensions.get('window');

export const PhotoDetailModal = ({ visible, photo, onClose }) => {
  if (!photo) return null;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVoiceNote, setCurrentVoiceNote] = useState(photo.voiceNote || null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const [recordedBase64, setRecordedBase64] = useState(null);
  const [senderName, setSenderName] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    setCurrentVoiceNote(photo.voiceNote || null);
  }, [photo]);

  const startRecording = async () => {
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        Alert.alert('Audio Note', 'Audio recording is supported on mobile browser and supported Expo runtimes.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => setRecordedBase64(reader.result);
        stream.getTracks().forEach((t) => t.stop());
      };

      mr.start(200);
      setIsRecording(true);
      setRecordSecs(0);
      timerRef.current = setInterval(() => {
        setRecordSecs((s) => (s >= 30 ? (stopRecording(), 30) : s + 1));
      }, 1000);
    } catch (err) {
      Alert.alert('Microphone Error', err.message || 'Microphone access denied.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const saveVoiceNote = async () => {
    if (!recordedBase64) return;
    setSavingNote(true);
    try {
      const fileId = photo._id || photo.id;
      const res = await api.attachVoiceNote(fileId, {
        audioBase64: recordedBase64,
        senderName: senderName.trim() || 'Guest',
        duration: recordSecs,
      });
      if (res.success) {
        setCurrentVoiceNote(res.voiceNote);
        setRecordedBase64(null);
        setSenderName('');
        Alert.alert('Voice Note Saved ✨', 'Audio greeting attached to photograph!');
      }
    } catch (e) {
      Alert.alert('Upload Error', e.message);
    } finally {
      setSavingNote(false);
    }
  };

  const url = photo.cloudinaryUrl || photo.url || photo.thumbnailUrl;
  const faceCount = photo.faceCount || photo.aiAnalysis?.faceCount || 0;
  const caption = photo.aiAnalysis?.caption || photo.caption || 'AI analyzed image';
  const tags = photo.aiAnalysis?.tags || photo.tags || [];
  const dominantColors = photo.aiAnalysis?.dominantColors || [];
  const qualityScore = photo.aiAnalysis?.qualityScore || 100;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.topBar}>
            <View style={styles.titleInfo}>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {photo.originalName || photo.filename || 'Photograph'}
              </Text>
              <Text style={styles.metaSub}>
                {photo.size ? `${(photo.size / (1024 * 1024)).toFixed(1)} MB • ` : ''}
                {faceCount} {faceCount === 1 ? 'Face Detected' : 'Faces Detected'}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.bodyScroll}>
            {/* Full-width Image */}
            <View style={styles.imageContainer}>
              <Image source={{ uri: url }} style={styles.image} resizeMode="contain" />
              <View style={styles.faceOverlayPill}>
                <Ionicons name="person" size={12} color="#FFFFFF" />
                <Text style={styles.faceOverlayText}>
                  {faceCount > 0 ? `${faceCount} People Found` : 'Non-Human Scenery'}
                </Text>
              </View>
            </View>

            {/* AI Insights Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="sparkles" size={16} color="#A78BFA" />
                <Text style={styles.cardTitle}>Neural Vision Insights</Text>
              </View>

              <Text style={styles.captionText}>"{caption}"</Text>

              {/* Dominant Colors */}
              {dominantColors.length > 0 && (
                <View style={styles.colorRow}>
                  <Text style={styles.colorLabel}>Dominant Tones:</Text>
                  {dominantColors.map((hex, i) => (
                    <View key={i} style={[styles.colorSwatch, { backgroundColor: hex }]} />
                  ))}
                </View>
              )}

              {/* Quality & Classification Tags */}
              <View style={styles.chipsRow}>
                <View style={styles.qualityChip}>
                  <Text style={styles.qualityChipText}>Quality {qualityScore}%</Text>
                </View>
                {tags.map((t, i) => (
                  <View key={i} style={styles.tagChip}>
                    <Text style={styles.tagChipText}>#{t.replace(/^#/, '')}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Feature 4: Voice Memory Note Card (Playback & Recording) */}
            <View style={styles.voiceNoteCard}>
              {currentVoiceNote?.url ? (
                <View style={styles.voiceNoteHeader}>
                  <View style={styles.voiceIconBox}>
                    <Ionicons name="mic" size={18} color="#C084FC" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.voiceTitle}>
                      Voice Note • {currentVoiceNote.senderName || 'Guest'}
                    </Text>
                    <Text style={styles.voiceSub}>
                      {currentVoiceNote.duration ? `${currentVoiceNote.duration}s • ` : ''}
                      Recorded {new Date(currentVoiceNote.recordedAt || Date.now()).toLocaleDateString()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.playAudioBtn}
                    onPress={() => setIsPlaying((p) => !p)}
                  >
                    <Ionicons name={isPlaying ? 'pause' : 'play'} size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ) : null}

              {isPlaying && (
                <View style={styles.audioWaveform}>
                  <Text style={styles.audioPlayingText}>Playing audio memory...</Text>
                </View>
              )}

              {/* Record greeting / note section */}
              <View style={[styles.recordSection, currentVoiceNote?.url && styles.recordSectionBorder]}>
                <View style={styles.recordHeaderRow}>
                  <Text style={styles.recordHeaderTitle}>
                    {currentVoiceNote?.url ? 'Add Another Voice Note' : 'Leave a Voice Memory Note'}
                  </Text>
                  {isRecording && (
                    <Text style={styles.recordingTimer}>00:{recordSecs < 10 ? `0${recordSecs}` : recordSecs}</Text>
                  )}
                </View>

                {!recordedBase64 && !isRecording && (
                  <TouchableOpacity style={styles.recordTriggerBtn} onPress={startRecording}>
                    <Ionicons name="mic" size={16} color="#C084FC" />
                    <Text style={styles.recordTriggerText}>Tap to Record Voice Greeting (Max 30s)</Text>
                  </TouchableOpacity>
                )}

                {isRecording && (
                  <TouchableOpacity style={styles.stopRecordBtn} onPress={stopRecording}>
                    <Ionicons name="stop" size={16} color="#FFFFFF" />
                    <Text style={styles.stopRecordText}>Stop Recording ({recordSecs}s)</Text>
                  </TouchableOpacity>
                )}

                {recordedBase64 && !isRecording && (
                  <View style={styles.saveSection}>
                    <TextInput
                      style={styles.senderInput}
                      placeholder="Your Name (e.g. Best Friend, Uncle John)"
                      placeholderTextColor="#64748B"
                      value={senderName}
                      onChangeText={setSenderName}
                    />
                    <TouchableOpacity
                      style={styles.saveNoteBtn}
                      onPress={saveVoiceNote}
                      disabled={savingNote}
                    >
                      {savingNote ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Ionicons name="send" size={14} color="#FFFFFF" />
                          <Text style={styles.saveNoteBtnText}>Attach Note</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    justifyContent: 'center',
  },
  modalContent: {
    flex: 1,
    paddingTop: 45,
    backgroundColor: '#070B14',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  titleInfo: {
    flex: 1,
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  metaSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bodyScroll: {
    paddingBottom: 30,
  },
  imageContainer: {
    width: width,
    height: 340,
    backgroundColor: '#000000',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  faceOverlayPill: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    backgroundColor: 'rgba(139, 92, 246, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
  },
  faceOverlayText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    margin: 16,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#C4B5FD',
  },
  captionText: {
    fontSize: 13.5,
    lineHeight: 20,
    color: '#CBD5E1',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  colorLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  colorSwatch: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  qualityChip: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  qualityChipText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '700',
  },
  tagChip: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagChipText: {
    color: '#A78BFA',
    fontSize: 11,
    fontWeight: '600',
  },
  voiceNoteCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  voiceNoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  voiceIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  voiceTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  voiceSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  playAudioBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#9333EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioWaveform: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  audioPlayingText: {
    fontSize: 11,
    color: '#C084FC',
    fontStyle: 'italic',
  },
  recordSection: {
    marginTop: 10,
    gap: 8,
  },
  recordSectionBorder: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  recordHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  recordingTimer: {
    fontSize: 12,
    fontWeight: '800',
    color: '#EF4444',
  },
  recordTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(168, 85, 247, 0.4)',
  },
  recordTriggerText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#C084FC',
  },
  stopRecordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#DC2626',
  },
  stopRecordText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  saveSection: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  senderInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 11.5,
    color: '#FFFFFF',
  },
  saveNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#9333EA',
    paddingHorizontal: 12,
    borderRadius: 10,
    justifyContent: 'center',
  },
  saveNoteBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
});
