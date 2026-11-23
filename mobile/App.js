import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
  Platform,
  useWindowDimensions,
  Image,
} from 'react-native';
import { SafeAreaProvider, initialWindowMetrics, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { CollectionsScreen } from './src/screens/CollectionsScreen';
import { SmartOrganizerScreen } from './src/screens/SmartOrganizerScreen';
import { UploadScreen } from './src/screens/UploadScreen';
import { PeopleScreen } from './src/screens/PeopleScreen';
import { OverviewScreen } from './src/screens/OverviewScreen';
import { AllFilesScreen } from './src/screens/AllFilesScreen';
import { ProfileSettingsScreen } from './src/screens/ProfileSettingsScreen';
import { Header } from './src/components/Header';
import { SplashScreen } from './src/components/SplashScreen';

const MainNavigator = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [splashVisible, setSplashVisible] = useState(true);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'events' | 'organizer' | 'upload' | 'people' | 'settings'
  const [tabHistory, setTabHistory] = useState(['overview']);
  const [targetCollectionId, setTargetCollectionId] = useState('');

  // Dynamically scale icon & tab dimensions according to mobile screen size
  const effectiveWidth = Math.min(width, 480);
  const scale = effectiveWidth / 390; // normalize around standard iPhone / modern Android width
  const navIconSize = Math.round(Math.min(24, Math.max(18, 21 * scale)));
  const fabIconSize = Math.round(Math.min(26, Math.max(19, 22 * scale)));
  const fabButtonSize = Math.round(Math.min(48, Math.max(40, 44 * scale)));
  const navFontSize = Math.min(10.5, Math.max(8.5, 9.5 * scale));
  const fabMarginTop = -Math.round(fabButtonSize * 0.35);
  const headerBackIconSize = Math.round(Math.min(22, Math.max(17, 20 * scale)));
  const headerSparklesIconSize = Math.round(Math.min(18, Math.max(14, 16 * scale)));

  // Android & iOS Safe Area Insets calculation
  // Status Bar / Notch calculation:
  const topInset = Platform.OS === 'android'
    ? Math.max(insets.top || 0, StatusBar.currentHeight || 0, 28)
    : Math.max(insets.top || 0, 16);
  const headerPaddingTop = topInset + 6;
  const headerContentHeight = 54;
  const totalHeaderHeight = headerContentHeight + headerPaddingTop;

  // Bottom Navigation Bar Safe Area calculation:
  // On Android with 3-button navigation, insets.bottom is typically ~48px.
  // We guarantee a minimum of 24px on Android and 18px on iOS to avoid system buttons/home indicators.
  const bottomInset = insets.bottom || 0;
  const safeBottom = Platform.OS === 'android'
    ? Math.max(bottomInset, 24)
    : Math.max(bottomInset, 18);
  const navTabsHeight = 58;
  const totalNavHeight = navTabsHeight + safeBottom;

  const switchTab = (tab) => {
    if (tab === activeTab) return;
    setTabHistory((prev) => (tab === 'overview' ? ['overview'] : [...prev.filter((t) => t !== tab), tab]));
    setActiveTab(tab);
  };

  const handleGoHome = () => {
    if (activeTab === 'overview') return;
    setActiveTab('overview');
    setTabHistory(['overview']);
  };

  const handleGoBack = () => {
    if (tabHistory.length > 1) {
      const nextHistory = [...tabHistory];
      nextHistory.pop(); // remove current active tab
      const prevTab = nextHistory[nextHistory.length - 1];
      setTabHistory(nextHistory.length > 0 ? nextHistory : ['overview']);
      setActiveTab(prevTab || 'overview');
    } else {
      setActiveTab('overview');
      setTabHistory(['overview']);
    }
  };

  // 1. Full-Screen Splash Screen on App Launch (at least 2 seconds, perfectly centered)
  if (splashVisible) {
    return (
      <SplashScreen
        isReady={!loading}
        onFinish={() => setSplashVisible(false)}
      />
    );
  }

  // 2. Auth Screens if not authenticated
  if (!isAuthenticated) {
    if (authMode === 'register') {
      return <RegisterScreen onNavigateToLogin={() => setAuthMode('login')} />;
    }
    return <LoginScreen onNavigateToRegister={() => setAuthMode('register')} />;
  }

  // 3. Main Dashboard once authenticated
  return (
    <View style={styles.appContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F19" translucent={true} />

      {/* Global Persistent Header on Every Page with safe-area spacing */}
      <View
        style={[
          styles.globalHeader,
          {
            paddingTop: headerPaddingTop,
            height: totalHeaderHeight,
          },
        ]}
      >
            <View style={styles.headerInnerRow}>
              <View style={styles.headerLeftGroup}>
                {activeTab !== 'overview' && (
                  <TouchableOpacity
                    style={styles.headerBackBtn}
                    onPress={handleGoBack}
                    activeOpacity={0.7}
                    accessibilityLabel="Back"
                  >
                    <Ionicons name="arrow-back" size={headerBackIconSize} color="#E2E8F0" />
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.brandRow}
                  onPress={handleGoHome}
                  activeOpacity={0.75}
                  accessibilityLabel="SnapShare Home"
                >
                  <View style={styles.brandIconBox}>
                    <Ionicons name="sparkles" size={headerSparklesIconSize} color="#C084FC" />
                  </View>
                  <Text style={styles.brandTitle}>
                    Snap<Text style={{ color: '#C084FC' }}>Share</Text>
                  </Text>
                  <View style={styles.versionPill}>
                    <Text style={styles.versionPillText}>v2.0</Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.headerRightRow}>
                <TouchableOpacity
                  style={styles.headerAvatarBtn}
                  onPress={() => switchTab('settings')}
                  activeOpacity={0.7}
                >
                  {user?.avatar ? (
                    <Image
                      source={{ uri: user.avatar }}
                      style={{ width: 28, height: 28, borderRadius: 14 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={styles.headerAvatarInitial}>
                      {user?.name ? user.name[0].toUpperCase() : 'U'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Screen View */}
          <View style={styles.screenContainer}>
            {activeTab === 'overview' && (
              <OverviewScreen
                onNavigateTab={(tab) => switchTab(tab)}
                onSelectCollection={() => switchTab('events')}
              />
            )}
            {activeTab === 'files' && (
              <AllFilesScreen onNavigateTab={(tab) => switchTab(tab)} />
            )}
            {activeTab === 'events' && (
              <CollectionsScreen
                onOpenUpload={(colId) => {
                  if (colId) setTargetCollectionId(colId);
                  switchTab('upload');
                }}
              />
            )}
            {activeTab === 'organizer' && <SmartOrganizerScreen />}
            {activeTab === 'upload' && (
              <UploadScreen
                defaultCollectionId={targetCollectionId}
                onUploadComplete={() => {
                  setTargetCollectionId('');
                  switchTab('organizer');
                }}
              />
            )}
            {activeTab === 'people' && <PeopleScreen />}
            {activeTab === 'settings' && <ProfileSettingsScreen />}
          </View>

          {/* Modern 5-Tab Responsive Bottom Navigation Bar */}
          <View
            style={[
              styles.bottomNav,
              {
                height: totalNavHeight,
                paddingBottom: safeBottom,
              },
            ]}
          >
            <View style={styles.navInnerRow}>
              <TouchableOpacity
                style={styles.navTab}
                onPress={() => switchTab('overview')}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={activeTab === 'overview' ? 'home' : 'home-outline'}
                  size={navIconSize}
                  color={activeTab === 'overview' ? '#C084FC' : '#64748B'}
                />
                <Text
                  style={[
                    styles.navLabel,
                    { fontSize: navFontSize },
                    activeTab === 'overview' && styles.navLabelActive,
                  ]}
                >
                  Overview
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navTab}
                onPress={() => switchTab('events')}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={activeTab === 'events' ? 'folder' : 'folder-outline'}
                  size={navIconSize}
                  color={activeTab === 'events' ? '#C084FC' : '#64748B'}
                />
                <Text
                  style={[
                    styles.navLabel,
                    { fontSize: navFontSize },
                    activeTab === 'events' && styles.navLabelActive,
                  ]}
                >
                  Events
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.navTabUpload, { marginTop: fabMarginTop }]}
                onPress={() => switchTab('upload')}
                activeOpacity={0.85}
              >
                <View
                  style={[
                    styles.uploadFab,
                    {
                      width: fabButtonSize,
                      height: fabButtonSize,
                      borderRadius: fabButtonSize / 2,
                    },
                    activeTab === 'upload' && styles.uploadFabActive,
                  ]}
                >
                  <Ionicons name="camera" size={fabIconSize} color="#FFFFFF" />
                </View>
                <Text
                  style={[
                    styles.navLabelUpload,
                    { fontSize: navFontSize },
                    activeTab === 'upload' && styles.navLabelUploadActive,
                  ]}
                >
                  Upload
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navTab}
                onPress={() => switchTab('organizer')}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={activeTab === 'organizer' ? 'sparkles' : 'sparkles-outline'}
                  size={navIconSize}
                  color={activeTab === 'organizer' ? '#C084FC' : '#64748B'}
                />
                <Text
                  style={[
                    styles.navLabel,
                    { fontSize: navFontSize },
                    activeTab === 'organizer' && styles.navLabelActive,
                  ]}
                  numberOfLines={1}
                >
                  AI Organizer
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navTab}
                onPress={() => switchTab('people')}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={activeTab === 'people' ? 'people' : 'people-outline'}
                  size={navIconSize}
                  color={activeTab === 'people' ? '#C084FC' : '#64748B'}
                />
                <Text
                  style={[
                    styles.navLabel,
                    { fontSize: navFontSize },
                    activeTab === 'people' && styles.navLabelActive,
                  ]}
                >
                  People
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
  );
};

export default function App() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <AuthProvider>
        <MainNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: '#070B14',
  },
  globalHeader: {
    backgroundColor: '#0B0F19',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'flex-end',
    zIndex: 50,
  },
  headerInnerRow: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerBackBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(139, 92, 246, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  versionPill: {
    backgroundColor: 'rgba(139, 92, 246, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.35)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 2,
  },
  versionPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A78BFA',
    textTransform: 'uppercase',
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerAvatarBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarInitial: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  screenContainer: {
    flex: 1,
  },
  center: {
    flex: 1,
    backgroundColor: '#070B14',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#94A3B8',
  },
  bottomNav: {
    backgroundColor: '#090D18',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'flex-start',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 16,
  },
  navInnerRow: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  navTab: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 2,
  },
  navLabel: {
    fontSize: 9.5,
    color: '#64748B',
    marginTop: 3,
    fontWeight: '600',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  navLabelActive: {
    color: '#F8FAFC',
    fontWeight: '700',
  },
  navTabUpload: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  uploadFab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#090D18',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 8,
    elevation: 6,
  },
  uploadFabActive: {
    backgroundColor: '#9333EA',
    borderColor: '#C084FC',
  },
  navLabelUpload: {
    fontSize: 9.5,
    color: '#A78BFA',
    marginTop: 2,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  navLabelUploadActive: {
    color: '#FFFFFF',
  },
  tabContent: {
    flex: 1,
    backgroundColor: '#070B14',
  },
  settingsScroll: {
    padding: 16,
    paddingBottom: 120,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
  },
  profileAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  profileInitial: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  profileEmail: {
    fontSize: 12.5,
    color: '#94A3B8',
    marginTop: 2,
  },
  planBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
  },
  planBadgeText: {
    fontSize: 10.5,
    color: '#C4B5FD',
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 16,
  },
  sectionCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  sectionCardSub: {
    fontSize: 11.5,
    color: '#94A3B8',
    marginBottom: 12,
  },
  quotaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  quotaPercent: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#1E293B',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 4,
  },
  quotaSub: {
    fontSize: 11,
    color: '#64748B',
  },
  serverInput: {
    height: 42,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    color: '#FFFFFF',
    paddingHorizontal: 12,
    fontSize: 12.5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  saveServerBtn: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 1,
    borderColor: '#8B5CF6',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveServerBtnText: {
    color: '#C4B5FD',
    fontSize: 12,
    fontWeight: '700',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 12,
    color: '#CBD5E1',
  },
  logoutBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    marginTop: 8,
  },
  logoutBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },
});
