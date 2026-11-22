import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Switch,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Image,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { Header } from '../components/Header';

export const PeopleScreen = () => {
  const [people, setPeople] = useState([]);
  const [matchingConsent, setMatchingConsent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Rename modal
  const [editingPerson, setEditingPerson] = useState(null);
  const [newName, setNewName] = useState('');
  const [renaming, setRenaming] = useState(false);

  const loadData = async () => {
    try {
      const [peopleRes, privacyRes] = await Promise.all([
        api.getPeople().catch((err) => {
          console.warn('api.getPeople error:', err);
          return { people: [] };
        }),
        api.getPrivacySettings().catch((err) => {
          console.warn('api.getPrivacySettings error:', err);
          return { privacy: {} };
        }),
      ]);

      const peopleList = Array.isArray(peopleRes) ? peopleRes : (peopleRes?.people || []);
      setPeople(peopleList);

      const privacy = privacyRes?.privacy || {};
      setMatchingConsent(!!privacy.enableFaceMatching);
    } catch (err) {
      console.warn('Failed to load people:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleConsent = async (val) => {
    setMatchingConsent(val);
    try {
      await api.updatePrivacySettings({
        enableFaceMatching: val,
      });
      Alert.alert(
        val ? 'Face Matching Enabled' : 'Face Matching Disabled',
        val
          ? 'Photos will now be grouped by recurring person identities using SFace 128-dim vectors.'
          : 'Face matching disabled. No biometric face vectors will be generated or compared.'
      );
    } catch (err) {
      setMatchingConsent(!val);
      Alert.alert('Error', err.message || 'Could not update privacy settings');
    }
  };

  const handleRename = async () => {
    if (!editingPerson || !newName.trim()) return;
    setRenaming(true);
    try {
      await api.renamePerson(editingPerson._id || editingPerson.id, newName.trim());
      setEditingPerson(null);
      setNewName('');
      loadData();
    } catch (err) {
      Alert.alert('Rename Failed', err.message || 'Could not rename person profile');
    } finally {
      setRenaming(false);
    }
  };

  const handlePurgeBiometrics = () => {
    Alert.alert(
      'GDPR Biometric Right to Erasure',
      'Are you sure you want to permanently delete all face embeddings and biometric data from your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purge Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.purgeBiometricData();
              Alert.alert('Biometrics Purged', 'All private face profiles and embeddings have been deleted.');
              loadData();
            } catch (err) {
              Alert.alert('Purge Error', err.message || 'Could not purge biometric data');
            }
          },
        },
      ]
    );
  };

  const renderPerson = ({ item }) => {
    const fileCount = item.fileCount || item.fileIds?.length || item.photoCount || 0;
    const name = item.displayName || item.name || `Person #${item.unnamedId ? item.unnamedId.slice(-4) : '1'}`;
    const avatarUri = item.samplePhotoUrl || item.sampleFaceUrl;

    return (
      <View style={styles.personCard}>
        <View style={styles.personAvatar}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.personAvatarImg} resizeMode="cover" />
          ) : (
            <Ionicons name="person" size={20} color="#A78BFA" />
          )}
        </View>

        <View style={styles.personInfo}>
          <Text style={styles.personName}>{name}</Text>
          <Text style={styles.personMeta}>
            {fileCount} recognized photo{fileCount === 1 ? '' : 's'} • Private Profile
          </Text>
        </View>

        <TouchableOpacity
          style={styles.renameBtn}
          onPress={() => {
            setEditingPerson(item);
            setNewName(item.displayName || item.name || '');
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="pencil" size={14} color="#CBD5E1" />
          <Text style={styles.renameBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="People & Biometrics"
        subtitle="Privacy-first recurring identity & SFace embeddings"
      />

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      ) : (
        <FlatList
          data={people}
          keyExtractor={(item) => item._id || item.id || String(Math.random())}
          renderItem={renderPerson}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadData();
              }}
              tintColor="#8B5CF6"
            />
          }
          ListHeaderComponent={
            <View>
              {/* Privacy Consent Box */}
              <View style={styles.consentCard}>
                <View style={styles.consentRow}>
                  <View style={styles.consentInfo}>
                    <View style={styles.consentHeaderRow}>
                      <Ionicons name="shield-checkmark" size={18} color="#10B981" />
                      <Text style={styles.consentTitle}>Face Matching Consent</Text>
                    </View>
                    <Text style={styles.consentDesc}>
                      Opt-in to compare faces across photographs. Zero external APIs; embeddings stay private to you.
                    </Text>
                  </View>
                  <Switch
                    value={matchingConsent}
                    onValueChange={handleToggleConsent}
                    trackColor={{ false: '#334155', true: '#8B5CF6' }}
                    thumbColor={matchingConsent ? '#FFFFFF' : '#94A3B8'}
                  />
                </View>
              </View>

              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>Recognized People Profiles ({people.length})</Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="people-outline" size={48} color="#475569" />
              <Text style={styles.emptyTitle}>No People Profiles Yet</Text>
              <Text style={styles.emptySubtitle}>
                {matchingConsent
                  ? 'Upload photographs containing people to generate recurring private identities.'
                  : 'Turn on Face Matching Consent above to start grouping people automatically.'}
              </Text>
            </View>
          }
          ListFooterComponent={
            <View style={styles.footerWrap}>
              <TouchableOpacity
                style={styles.purgeBtn}
                onPress={handlePurgeBiometrics}
                activeOpacity={0.8}
              >
                <Ionicons name="trash-bin-outline" size={16} color="#EF4444" />
                <Text style={styles.purgeBtnText}>Purge All Biometric Data (GDPR)</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Rename Person Modal */}
      <Modal visible={!!editingPerson} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Rename Person Profile</Text>
            <Text style={styles.modalSub}>
              Give this private profile a recognizable name (e.g., Mom, Alex, Groom)
            </Text>

            <TextInput
              style={styles.nameInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="Enter name..."
              placeholderTextColor="#64748B"
              autoFocus
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setEditingPerson(null)}
              >
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveModalBtn}
                onPress={handleRename}
                disabled={renaming}
              >
                {renaming ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.saveModalBtnText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
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
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  consentCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 20,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  consentInfo: {
    flex: 1,
    marginRight: 14,
  },
  consentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  consentTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  consentDesc: {
    fontSize: 11.5,
    color: '#94A3B8',
    lineHeight: 16,
  },
  sectionTitleRow: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  personCard: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  personAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  personAvatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 2,
  },
  personMeta: {
    fontSize: 11.5,
    color: '#64748B',
  },
  renameBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  renameBtnText: {
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: '600',
  },
  emptyWrap: {
    paddingTop: 40,
    alignItems: 'center',
    paddingHorizontal: 20,
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
  footerWrap: {
    marginTop: 24,
    alignItems: 'center',
  },
  purgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  purgeBtnText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#0F172A',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 16,
  },
  nameInput: {
    height: 44,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    color: '#FFFFFF',
    paddingHorizontal: 12,
    fontSize: 13,
    marginBottom: 16,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelModalBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelModalBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  saveModalBtn: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveModalBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
