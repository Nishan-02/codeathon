import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  Animated,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';

// ── Fancy Glass Input Component ─────────────────────────────────────────────
function GlassInput({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  icon,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
  icon: string;
}) {
  const [focused, setFocused] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  return (
    <View style={gi.wrap}>
      <Text style={gi.label}>{label}</Text>
      <View style={[gi.row, focused && gi.rowFocused]}>
        <Text style={gi.icon}>{icon}</Text>
        <TextInput
          style={[gi.input, Platform.OS === 'web' ? ({ outline: 'none' } as any) : null]}
          placeholder={placeholder}
          placeholderTextColor="#5C6E82"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !showPwd}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? 'none'}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setShowPwd((v) => !v)}
            style={gi.eyeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={gi.eyeIcon}>{showPwd ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const gi = StyleSheet.create({
  wrap: { marginBottom: 18 },
  label: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(13, 22, 38, 0.75)',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    gap: 12,
    height: 52,
  },
  rowFocused: {
    borderColor: '#00C9A7',
    backgroundColor: 'rgba(15, 28, 48, 0.9)',
    shadowColor: '#00C9A7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 3,
  },
  icon: { fontSize: 16, opacity: 0.9 },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '400',
    height: '100%',
  },
  eyeBtn: { padding: 4 },
  eyeIcon: { color: '#94A3B8', fontSize: 16 },
});

// ── Right-Side Futuristic Education Illustration (Desktop Only) ──────────────
function EducationIllustration() {
  return (
    <View style={ill.container}>
      {/* Ambient background glow behind illustration */}
      <View style={[ill.ambientGlow, Platform.OS === 'web' ? ({ filter: 'blur(70px)' } as any) : null]} />

      {/* Floating Holographic Cards */}
      <View style={[ill.holoCard, ill.holoCap]}>
        <Text style={ill.holoIcon}>🎓</Text>
      </View>

      <View style={[ill.holoCard, ill.holoBrain]}>
        <Text style={ill.holoIcon}>🧠</Text>
      </View>

      <View style={[ill.holoCard, ill.holoVideo]}>
        <Text style={ill.holoIcon}>▶️</Text>
      </View>

      <View style={[ill.holoCard, ill.holoNotes]}>
        <View style={ill.notesLines}>
          <View style={[ill.noteLine, { width: 28 }]} />
          <View style={[ill.noteLine, { width: 20 }]} />
          <View style={[ill.noteLine, { width: 24 }]} />
        </View>
      </View>

      {/* Floating glowing orbs */}
      <View style={[ill.orb, ill.orb1]} />
      <View style={[ill.orb, ill.orb2]} />
      <View style={[ill.orb, ill.orb3]} />

      {/* Glowing Open Book & Stack */}
      <View style={ill.bookStack}>
        {/* Open Book with Glowing Pages */}
        <View style={ill.openBookWrapper}>
          <View style={[ill.openBookGlow, Platform.OS === 'web' ? ({ filter: 'blur(30px)' } as any) : null]} />
          <View style={ill.openBook}>
            <View style={ill.bookPageLeft}>
              <View style={ill.pageLine} />
              <View style={ill.pageLine} />
              <View style={ill.pageLine} />
            </View>
            <View style={ill.bookSpineGlow} />
            <View style={ill.bookPageRight}>
              <View style={ill.pageLine} />
              <View style={ill.pageLine} />
              <View style={ill.pageLine} />
            </View>
          </View>
        </View>

        {/* Stack Layer 1 */}
        <View style={ill.bookBottom1}>
          <View style={ill.bookSpine} />
          <View style={ill.bookPagesEdge} />
        </View>

        {/* Stack Layer 2 */}
        <View style={ill.bookBottom2}>
          <View style={[ill.bookSpine, { backgroundColor: '#0D2235' }]} />
          <View style={ill.bookPagesEdge} />
        </View>

        {/* Cyber perspective floor reflection */}
        <View style={ill.gridFloor} />
      </View>
    </View>
  );
}

const ill = StyleSheet.create({
  container: {
    width: 440,
    height: 480,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginLeft: 32,
  },
  ambientGlow: {
    position: 'absolute',
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: 'rgba(0, 201, 167, 0.12)',
  },
  holoCard: {
    position: 'absolute',
    backgroundColor: 'rgba(10, 25, 40, 0.75)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 201, 167, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00C9A7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 6,
  },
  holoIcon: { fontSize: 26 },
  holoCap: {
    top: 24,
    right: 50,
    width: 68,
    height: 68,
  },
  holoBrain: {
    top: 100,
    right: 0,
    width: 64,
    height: 64,
  },
  holoVideo: {
    top: 120,
    left: 40,
    width: 60,
    height: 60,
  },
  holoNotes: {
    top: 190,
    right: 28,
    width: 58,
    height: 58,
    padding: 12,
  },
  notesLines: { gap: 4, width: '100%' },
  noteLine: { height: 3, backgroundColor: '#00C9A7', borderRadius: 2, opacity: 0.8 },

  orb: {
    position: 'absolute',
    borderRadius: 99,
    backgroundColor: '#00C9A7',
    shadowColor: '#00C9A7',
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  orb1: { width: 14, height: 14, top: 110, left: 16, opacity: 0.8 },
  orb2: { width: 20, height: 20, top: 190, left: 18, opacity: 0.9 },
  orb3: { width: 10, height: 10, top: 70, right: 140, opacity: 0.6 },

  bookStack: {
    position: 'absolute',
    bottom: 30,
    alignItems: 'center',
  },
  openBookWrapper: {
    position: 'relative',
    zIndex: 10,
    marginBottom: -12,
  },
  openBookGlow: {
    position: 'absolute',
    width: 220,
    height: 120,
    top: -20,
    left: -10,
    backgroundColor: 'rgba(0, 201, 167, 0.35)',
    borderRadius: 99,
  },
  openBook: {
    flexDirection: 'row',
    width: 200,
    height: 70,
    backgroundColor: '#0F2A38',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#00C9A7',
    overflow: 'hidden',
    shadowColor: '#00C9A7',
    shadowOpacity: 0.6,
    shadowRadius: 18,
    elevation: 8,
  },
  bookPageLeft: {
    flex: 1,
    backgroundColor: 'rgba(0, 201, 167, 0.15)',
    padding: 10,
    gap: 6,
    borderRightWidth: 1,
    borderRightColor: '#00C9A7',
    transform: [{ skewY: '-6deg' }],
  },
  bookPageRight: {
    flex: 1,
    backgroundColor: 'rgba(0, 201, 167, 0.15)',
    padding: 10,
    gap: 6,
    transform: [{ skewY: '6deg' }],
  },
  bookSpineGlow: {
    width: 2,
    backgroundColor: '#00DFB2',
    height: '100%',
  },
  pageLine: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 2,
    width: '85%',
  },
  bookBottom1: {
    width: 240,
    height: 36,
    backgroundColor: '#0E1F30',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 201, 167, 0.4)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  bookBottom2: {
    width: 260,
    height: 40,
    backgroundColor: '#091522',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 201, 167, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  bookSpine: {
    width: 24,
    height: '70%',
    backgroundColor: '#00C9A7',
    borderRadius: 3,
    opacity: 0.8,
  },
  bookPagesEdge: {
    flex: 1,
    height: '60%',
    marginLeft: 8,
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  gridFloor: {
    width: 320,
    height: 30,
    marginTop: 10,
    borderTopWidth: 1,
    borderColor: 'rgba(0, 201, 167, 0.2)',
    opacity: 0.7,
  },
});

// ── Main Login Screen ─────────────────────────────────────────────────────────
export default function LoginScreen() {
  const [email, setEmail] = useState('sharsha0333@gmail.com');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  const { signIn } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const isDesktop = width >= 960;

  const btnScale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(btnScale, { toValue: 0.97, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(btnScale, { toValue: 1, useNativeDriver: true }).start();

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Validation Error', 'Please enter your email and password.');
      return;
    }
    try {
      setLoading(true);
      await signIn(email.trim(), password);
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Login Failed', err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      {/* Atmospheric Background Effects */}
      <View style={[s.bgGlowTopLeft, Platform.OS === 'web' ? ({ filter: 'blur(90px)' } as any) : null]} />
      <View style={[s.bgGlowBottomRight, Platform.OS === 'web' ? ({ filter: 'blur(100px)' } as any) : null]} />
      <View style={s.bgWaveLeft} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            s.scroll,
            isDesktop && s.scrollDesktop,
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[s.layoutContainer, isDesktop && s.layoutContainerDesktop]}>
            {/* ── Glassmorphism Login Card ────────────────────────────────────── */}
            <View
              style={[
                s.card,
                isDesktop && s.cardDesktop,
                Platform.OS === 'web' ? ({ backdropFilter: 'blur(24px)' } as any) : null,
              ]}
            >
              {/* Brand Header */}
              <View style={s.brandHeader}>
                <View style={s.logoSquare}>
                  <Text style={s.logoBookIcon}>📖</Text>
                </View>
                <View>
                  <Text style={s.brandTitle}>StudyFlow</Text>
                  <Text style={s.brandSubtitle}>AI-Powered Learning</Text>
                </View>
              </View>

              {/* Welcome Titles */}
              <View style={s.welcomeWrap}>
                <Text style={s.welcomeTitle}>Welcome back 👋</Text>
                <Text style={s.welcomeSub}>Sign in to continue your learning journey</Text>
              </View>

              {/* Inputs */}
              <GlassInput
                label="Email Address"
                placeholder="Enter your email address"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                icon="✉️"
              />

              <GlassInput
                label="Password"
                placeholder="Enter your password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                icon="🔒"
              />

              {/* Remember Me & Forgot Password */}
              <View style={s.optionsRow}>
                <TouchableOpacity
                  style={s.rememberMeRow}
                  onPress={() => setRememberMe(!rememberMe)}
                  activeOpacity={0.8}
                >
                  <View style={[s.checkbox, rememberMe && s.checkboxChecked]}>
                    {rememberMe && <Text style={s.checkMark}>✓</Text>}
                  </View>
                  <Text style={s.rememberText}>Remember me</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => Alert.alert('Forgot Password', 'Password reset instructions have been sent to your email.')}
                  activeOpacity={0.7}
                >
                  <Text style={s.forgotText}>Forgot password?</Text>
                </TouchableOpacity>
              </View>

              {/* Sign In CTA Button */}
              <Animated.View style={{ transform: [{ scale: btnScale }] }}>
                <TouchableOpacity
                  style={[s.signInBtn, loading && { opacity: 0.75 }]}
                  onPress={handleLogin}
                  onPressIn={pressIn}
                  onPressOut={pressOut}
                  disabled={loading}
                  activeOpacity={0.9}
                >
                  <Text style={s.signInText}>
                    {loading ? 'Signing in...' : 'Sign In  →'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>

              {/* Divider */}
              <View style={s.dividerRow}>
                <View style={s.dividerLine} />
                <Text style={s.dividerText}>or</Text>
                <View style={s.dividerLine} />
              </View>

              {/* Create Account Link */}
              <TouchableOpacity
                style={s.createAccountBtn}
                onPress={() => router.push('/(auth)/register')}
                activeOpacity={0.7}
              >
                <Text style={s.createAccountText}>
                  New here?{' '}
                  <Text style={s.createAccountHighlight}>Create account</Text>
                </Text>
              </TouchableOpacity>
            </View>

            {/* ── Right-Side Futuristic Education Illustration (Desktop) ─────── */}
            {isDesktop && <EducationIllustration />}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#060A10',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  scrollDesktop: {
    paddingVertical: 48,
    paddingHorizontal: 48,
  },

  // Atmospheric background elements
  bgGlowTopLeft: {
    position: 'absolute',
    top: -120,
    left: -120,
    width: 450,
    height: 450,
    borderRadius: 225,
    backgroundColor: 'rgba(0, 201, 167, 0.08)',
  },
  bgGlowBottomRight: {
    position: 'absolute',
    bottom: -100,
    right: -100,
    width: 550,
    height: 550,
    borderRadius: 275,
    backgroundColor: 'rgba(0, 201, 167, 0.14)',
  },
  bgWaveLeft: {
    position: 'absolute',
    bottom: 60,
    left: -60,
    width: 320,
    height: 160,
    borderRadius: 160,
    borderTopWidth: 2,
    borderColor: 'rgba(0, 201, 167, 0.25)',
    transform: [{ rotate: '-15deg' }],
  },

  layoutContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  layoutContainerDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 1100,
    gap: 40,
  },

  // Center Glass Card
  card: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: 'rgba(12, 20, 34, 0.78)',
    borderRadius: 26,
    borderWidth: 1.2,
    borderColor: 'rgba(0, 201, 167, 0.25)',
    paddingHorizontal: 28,
    paddingVertical: 34,
    shadowColor: '#00C9A7',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 35,
    elevation: 10,
  },
  cardDesktop: {
    width: 500,
    maxWidth: 520,
    paddingHorizontal: 36,
    paddingVertical: 40,
  },

  // Brand Header
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
  },
  logoSquare: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#00C9A7',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00C9A7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  logoBookIcon: {
    fontSize: 24,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    color: '#00C9A7',
    fontSize: 12.5,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.3,
  },

  // Welcome section
  welcomeWrap: {
    marginBottom: 26,
  },
  welcomeTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  welcomeSub: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '400',
  },

  // Options row
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 24,
  },
  rememberMeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#475569',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#00C9A7',
    borderColor: '#00C9A7',
  },
  checkMark: {
    color: '#060A10',
    fontSize: 12,
    fontWeight: '900',
  },
  rememberText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
  },
  forgotText: {
    color: '#00C9A7',
    fontSize: 13,
    fontWeight: '600',
  },

  // Sign In CTA
  signInBtn: {
    backgroundColor: '#00DFB2',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00DFB2',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 8,
  },
  signInText: {
    color: '#05131C',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.3,
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
    gap: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
  },

  // Create Account
  createAccountBtn: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  createAccountText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },
  createAccountHighlight: {
    color: '#00C9A7',
    fontWeight: '700',
  },
});
