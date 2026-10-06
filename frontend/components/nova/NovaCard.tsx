import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { Colors, Radius } from '../../constants/theme';
import { NovaRecommendation } from '../../services/nova';

// Safe Lottie loader — works in both Expo Go (fallback) and dev builds (real animation)
let LottieView: any = null;
let slothSource: any = null;
try {
  LottieView = require('lottie-react-native').default;
  slothSource = require('../../assets/animations/sloth_meditate.lottie');
} catch (_) {
  LottieView = null;
  slothSource = null;
}

// ── Pulsing dot ──────────────────────────────────────────────────────────────
function PulseDot({ color }: { color: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.5, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.3, duration: 900, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.9, duration: 900, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[pd.dot, { backgroundColor: color, transform: [{ scale }], opacity }]} />
  );
}
const pd = StyleSheet.create({
  dot: { width: 8, height: 8, borderRadius: 4 },
});

// ── Floating Sloth Lottie ─────────────────────────────────────────────────────
function SlothAvatar({ size = 72 }: { size?: number }) {
  const floatY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, { toValue: -6, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatY, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ translateY: floatY }] }}>
      {LottieView && slothSource ? (
        <LottieView
          source={slothSource}
          autoPlay
          loop
          style={{ width: size, height: size }}
          enableMergePathsAndroidForKitKatAndAbove
        />
      ) : (
        // Fallback: animated sloth emoji (works in Expo Go)
        <View style={[fb.circle, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={{ fontSize: size * 0.55 }}>🦥</Text>
        </View>
      )}
    </Animated.View>
  );
}
const fb = StyleSheet.create({
  circle: {
    backgroundColor: '#0F2A22',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.teal,
  },
});

// ── Badge ────────────────────────────────────────────────────────────────────
function NovaBadge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[nb.wrap, { borderColor: color + '40', backgroundColor: color + '18' }]}>
      <Text style={[nb.text, { color }]}>{label}</Text>
    </View>
  );
}
const nb = StyleSheet.create({
  wrap: { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  text: { fontSize: 11, fontWeight: '800' },
});

// ── Message Typewriter ────────────────────────────────────────────────────────
function TypewriterText({ text, style }: { text: string; style?: any }) {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    setDisplayed('');
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(interval);
    }, 22);
    return () => clearInterval(interval);
  }, [text]);

  return <Text style={style}>{displayed}</Text>;
}

// ── Main NovaCard ─────────────────────────────────────────────────────────────
interface NovaCardProps {
  recommendation: NovaRecommendation;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function NovaCard({ recommendation, onRefresh, isLoading }: NovaCardProps) {
  const shimmer = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(1)).current;

  // Shimmer for loading
  useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmer, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(shimmer, { toValue: 0, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [isLoading]);

  const pressIn = useCallback(() => {
    Animated.spring(cardScale, { toValue: 0.97, useNativeDriver: true }).start();
  }, []);
  const pressOut = useCallback(() => {
    Animated.spring(cardScale, { toValue: 1, useNativeDriver: true }).start();
  }, []);

  const urgencyBorderColor =
    recommendation.urgency === 'high' ? '#EF444430'
      : recommendation.urgency === 'medium' ? '#F97316' + '30'
      : Colors.teal + '40';

  return (
    <Animated.View style={{ transform: [{ scale: cardScale }] }}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={pressIn}
        onPressOut={pressOut}
        onLongPress={onRefresh}
        style={[
          s.card,
          { borderColor: urgencyBorderColor },
          recommendation.urgency === 'high' && s.cardUrgent,
        ]}
      >
        {/* ── Top strip: urgent glow ── */}
        {recommendation.urgency === 'high' && (
          <View style={s.urgentStrip} />
        )}

        {/* ── Header row ── */}
        <View style={s.headerRow}>
          <View style={s.headerLeft}>
            <PulseDot color={recommendation.urgency === 'high' ? Colors.red : Colors.teal} />
            <Text style={s.novaTitleText}>Nova</Text>
            <Text style={s.novaSubText}>· AI Nudge</Text>
          </View>
          <NovaBadge label={recommendation.tag} color={recommendation.tagColor} />
        </View>

        {/* ── Body ── */}
        <View style={s.body}>
          {/* Sloth Lottie avatar */}
          <View style={s.slothWrap}>
            <SlothAvatar size={80} />
            {/* Shadow/glow under sloth */}
            <View style={s.slothShadow} />
          </View>

          {/* Message + tip */}
          <View style={s.textBlock}>
            <View style={s.iconRow}>
              <Text style={s.iconEmoji}>{recommendation.icon}</Text>
              <Text style={s.insightText}>{recommendation.insight}</Text>
            </View>

            <TypewriterText
              text={`"${recommendation.message}"`}
              style={s.messageText}
            />

            {/* Tip box */}
            <View style={s.tipBox}>
              <Text style={s.tipLabel}>💡 Tip</Text>
              <Text style={s.tipText}>{recommendation.tip}</Text>
            </View>
          </View>
        </View>

        {/* ── Footer ── */}
        <View style={s.footer}>
          <Text style={s.footerHint}>Long press to refresh nudge</Text>
          <TouchableOpacity onPress={onRefresh} style={s.refreshBtn}>
            <Text style={s.refreshText}>↻ New Nudge</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  card: {
    backgroundColor: '#0A1A14',
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginBottom: 16,
  },
  cardUrgent: {
    backgroundColor: '#130A0A',
  },
  urgentStrip: {
    height: 3,
    backgroundColor: Colors.red,
    width: '100%',
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  novaTitleText: {
    color: Colors.teal,
    fontWeight: '800',
    fontSize: 15,
  },
  novaSubText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },

  // Body
  body: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 14,
  },
  slothWrap: {
    alignItems: 'center',
    paddingTop: 4,
  },
  slothShadow: {
    width: 48,
    height: 8,
    borderRadius: 99,
    backgroundColor: Colors.teal,
    opacity: 0.2,
    marginTop: 4,
  },
  textBlock: {
    flex: 1,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  iconEmoji: { fontSize: 16 },
  insightText: {
    color: Colors.teal,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.3,
  },
  messageText: {
    color: Colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    fontStyle: 'italic',
    marginBottom: 10,
  },

  // Tip
  tipBox: {
    backgroundColor: '#0D2137',
    borderRadius: Radius.md,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: Colors.indigo,
  },
  tipLabel: {
    color: Colors.indigo,
    fontWeight: '800',
    fontSize: 11,
    marginBottom: 3,
  },
  tipText: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#1A2E26',
  },
  footerHint: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  refreshBtn: {
    backgroundColor: '#0D2A1E',
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.teal + '50',
  },
  refreshText: {
    color: Colors.teal,
    fontWeight: '700',
    fontSize: 12,
  },
});
