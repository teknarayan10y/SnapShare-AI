import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Animated,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const SplashScreen = ({ isReady = true, onFinish }) => {
  const insets = useSafeAreaInsets();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  // Animation controllers
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.85)).current;
  const logoOpacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Safe area insets for Android system navigation and status bar
  const safeBottom = Platform.OS === 'android'
    ? Math.max(insets.bottom || 0, 24)
    : Math.max(insets.bottom || 0, 18);

  useEffect(() => {
    // 1. Smooth entrance animation (scale + fade in)
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
          toValue: 1.08,
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
        styles.fullScreen,
        {
          opacity: fadeAnim,
        },
      ]}
    >
      <StatusBar barStyle="light-content" backgroundColor="#070B14" translucent={true} />

      {/* Perfectly Centered Core Brand Section */}
      <View style={styles.centeredContainer}>
        {/* Pulsing Outer Glow Aura */}
        <Animated.View
          style={[
            styles.glowAura,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />

        {/* Animated Brand Container */}
        <Animated.View
          style={[
            styles.brandContent,
            {
              opacity: logoOpacityAnim,
              transform: [{ scale: logoScaleAnim }],
            },
          ]}
        >
          {/* Brand Sparkles Icon Badge */}
          <View style={styles.logoBadge}>
            <Ionicons name="sparkles" size={44} color="#C084FC" />
          </View>

          {/* Brand Title */}
          <View style={styles.titleRow}>
            <Text style={styles.titleSnap}>Snap</Text>
            <Text style={styles.titleShare}>Share</Text>
            <View style={styles.versionPill}>
              <Text style={styles.versionPillText}>v2.0</Text>
            </View>
          </View>

          {/* Subtitle / Tagline */}
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

          {/* Progress Bar Track */}
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
          </View>
          <Text style={styles.loadingStatusText}>Securing cloud connection...</Text>
        </Animated.View>
      </View>

      {/* Bottom Pinned Footer */}
      <View style={[styles.bottomFooter, { paddingBottom: safeBottom + 16 }]}>
        <Text style={styles.footerText}>POWERED BY DEEPMIND VISION & YUNET</Text>
        <Text style={styles.footerSubText}>End-to-End Encrypted • Real-time Cloud Streaming</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#070B14',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 28,
  },
  glowAura: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 44,
    backgroundColor: 'rgba(139, 92, 246, 0.16)',
    borderWidth: 1.5,
    borderColor: 'rgba(192, 132, 252, 0.35)',
    top: '32%',
  },
  brandContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  logoBadge: {
    width: 90,
    height: 90,
    borderRadius: 26,
    backgroundColor: 'rgba(139, 92, 246, 0.16)',
    borderWidth: 2,
    borderColor: 'rgba(168, 85, 247, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.65,
    shadowRadius: 18,
    elevation: 14,
    marginBottom: 20,
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
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 26,
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
  progressTrack: {
    width: 140,
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
  },
  bottomFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
