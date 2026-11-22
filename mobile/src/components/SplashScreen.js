import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  Animated,
  StatusBar,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const SplashScreen = ({ isReady = true, onFinish }) => {
  const insets = useSafeAreaInsets();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.82)).current;
  const logoOpacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Safe area insets (respecting punch-hole, status bar, and 3-button navigation bar)
  const safeTop = Platform.OS === 'android'
    ? Math.max(insets.top || 0, StatusBar.currentHeight || 0, 28)
    : Math.max(insets.top || 0, 16);
  const safeBottom = Platform.OS === 'android'
    ? Math.max(insets.bottom || 0, 24)
    : Math.max(insets.bottom || 0, 18);

  useEffect(() => {
    // 1. Entrance animation (scale + fade in)
    Animated.parallel([
      Animated.timing(logoScaleAnim, {
        toValue: 1,
        duration: 650,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacityAnim, {
        toValue: 1,
        duration: 550,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: false,
      }),
    ]).start();

    // 2. Continuous breathing / pulsing glow
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.07,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // 3. Minimum display duration of 2000ms (2 seconds)
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 2000);

    return () => {
      clearTimeout(timer);
      pulseLoop.stop();
    };
  }, []);

  // When both the 2-second minimum timer AND isReady are true, smoothly fade out
  useEffect(() => {
    if (minTimeElapsed && isReady) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 380,
        useNativeDriver: true,
      }).start(() => {
        if (onFinish) onFinish();
      });
    }
  }, [minTimeElapsed, isReady]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity: fadeAnim,
          paddingTop: safeTop + 12,
          paddingBottom: safeBottom + 16,
        },
      ]}
      pointerEvents={minTimeElapsed && isReady ? 'none' : 'auto'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#070B14" translucent={true} />

      {/* Top Header Badge */}
      <View style={styles.topHeader}>
        <View style={styles.secureBadge}>
          <Ionicons name="shield-checkmark" size={12} color="#10B981" />
          <Text style={styles.secureBadgeText}>Universal Cloud Vault</Text>
        </View>
      </View>

      {/* Center Brand & Logo */}
      <Animated.View
        style={[
          styles.centerBrandContainer,
          {
            opacity: logoOpacityAnim,
            transform: [{ scale: logoScaleAnim }],
          },
        ]}
      >
        {/* Pulsing Outer Glow Ring */}
        <Animated.View
          style={[
            styles.glowRing,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />

        {/* Logo Card */}
        <View style={styles.logoCard}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logoImage}
            resizeMode="cover"
          />
        </View>

        {/* Title */}
        <View style={styles.titleRow}>
          <Text style={styles.titleSnap}>Snap</Text>
          <Text style={styles.titleShare}>Share</Text>
          <View style={styles.versionPill}>
            <Text style={styles.versionPillText}>v2.0</Text>
          </View>
        </View>

        {/* Tagline */}
        <Text style={styles.tagline}>Intelligent Event Vault & Face Search</Text>

        {/* Feature Highlights Pills */}
        <View style={styles.chipsRow}>
          <View style={styles.chip}>
            <Ionicons name="sparkles" size={11} color="#C084FC" />
            <Text style={styles.chipText}>YuNet AI</Text>
          </View>
          <View style={styles.chipDot} />
          <View style={styles.chip}>
            <Ionicons name="qr-code" size={11} color="#38BDF8" />
            <Text style={styles.chipText}>Instant QR Drop</Text>
          </View>
          <View style={styles.chipDot} />
          <View style={styles.chip}>
            <Ionicons name="cloud-done" size={11} color="#34D399" />
            <Text style={styles.chipText}>Live Sync</Text>
          </View>
        </View>
      </Animated.View>

      {/* Bottom Loading Progress & Footer */}
      <View style={styles.bottomContainer}>
        {/* Sleek Progress Bar */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
        </View>
        <Text style={styles.loadingStatusText}>Securing cloud connection & AI models...</Text>

        {/* Bottom Credits */}
        <View style={styles.footerBranding}>
          <Text style={styles.footerText}>POWERED BY DEEPMIND VISION & YUNET</Text>
          <Text style={styles.footerSubText}>End-to-End Encrypted • Real-time Cloud Streaming</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#070B14',
    zIndex: 9999,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  topHeader: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 8,
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
  },
  secureBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#34D399',
    letterSpacing: 0.2,
  },
  centerBrandContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  glowRing: {
    position: 'absolute',
    width: 126,
    height: 126,
    borderRadius: 36,
    backgroundColor: 'rgba(139, 92, 246, 0.16)',
    borderWidth: 1.5,
    borderColor: 'rgba(192, 132, 252, 0.3)',
  },
  logoCard: {
    width: 96,
    height: 96,
    borderRadius: 26,
    backgroundColor: '#0F172A',
    borderWidth: 2,
    borderColor: 'rgba(168, 85, 247, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.65,
    shadowRadius: 18,
    elevation: 14,
    marginBottom: 20,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: 6,
  },
  titleSnap: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  titleShare: {
    fontSize: 32,
    fontWeight: '900',
    color: '#C084FC',
    letterSpacing: -0.5,
  },
  versionPill: {
    backgroundColor: 'rgba(139, 92, 246, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.45)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 6,
  },
  versionPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#A78BFA',
    textTransform: 'uppercase',
  },
  tagline: {
    fontSize: 13,
    color: '#94A3B8',
    letterSpacing: -0.2,
    textAlign: 'center',
    marginBottom: 16,
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  chipDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  bottomContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressTrack: {
    width: '55%',
    height: 3,
    backgroundColor: '#1E293B',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 2,
  },
  loadingStatusText: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 14,
  },
  footerBranding: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  footerSubText: {
    fontSize: 10,
    color: '#334155',
  },
});
