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
  ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';

// ── Glass Input Field ────────────────────────────────────────────────────────
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
      <View style={[gi.box, focused && gi.boxFocused]}>
        <Text style={gi.icon}>{icon}</Text>
        <TextInput
          style={[
            gi.input,
            Platform.OS === 'web'
              ? ({
                  outline: 'none',
                  backgroundColor: 'transparent',
                  color: '#FFFFFF',
                  WebkitBoxShadow: '0 0 0 1000px transparent inset',
                } as any)
              : null,
          ]}
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
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
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
    letterSpacing: 0.1,
  },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 25, 42, 0.72)',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 16,
    height: 52,
    gap: 12,
  },
  boxFocused: {
    borderColor: '#00DFB2',
    backgroundColor: 'rgba(18, 32, 54, 0.88)',
    shadowColor: '#00DFB2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  icon: { fontSize: 16, opacity: 0.9 },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14.5,
    backgroundColor: 'transparent',
    height: '100%',
    padding: 0,
  },
  eyeBtn: { padding: 4 },
  eyeIcon: { color: '#94A3B8', fontSize: 16 },
});

// ── Main Screen Component ───────────────────────────────────────────────────
export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  const { signIn } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const isDesktop = width >= 900;

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
    <ImageBackground
      source={require('../../assets/images/login-bg.png')}
      style={s.bgImage}
      resizeMode="cover"
    >
      {/* Dark overlay for optimal text contrast and neon ambience */}
      <View style={s.darkBackdrop} />

      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
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
            <View style={[s.cardWrapper, isDesktop && s.cardWrapperDesktop]}>
              {/* ── Center Glassmorphism Login Card ─────────────────────────── */}
              <View
                style={[
                  s.card,
                  isDesktop && s.cardDesktop,
                  Platform.OS === 'web'
                    ? ({
                        backdropFilter: 'blur(28px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
                        boxShadow:
                          '0 0 50px rgba(0, 223, 178, 0.16), 0 30px 60px rgba(0, 0, 0, 0.75), inset 0 1px 1px rgba(255, 255, 255, 0.15)',
                      } as any)
                    : null,
                ]}
              >
                {/* Brand Header: Logo + Title */}
                <View style={s.brandRow}>
                  <View style={s.logoBadge}>
                    <Text style={s.logoIcon}>📖</Text>
                  </View>
                  <View>
                    <Text style={s.brandTitle}>StudyFlow</Text>
                    <Text style={s.brandSubtitle}>AI-Powered Learning</Text>
                  </View>
                </View>

                {/* Welcome section */}
                <View style={s.welcomeBox}>
                  <Text style={s.welcomeHeading}>Welcome back 👋</Text>
                  <Text style={s.welcomeSub}>Sign in to continue your learning journey</Text>
                </View>

                {/* Email Address */}
                <GlassInput
                  label="Email Address"
                  placeholder="Enter your email address"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  icon="✉️"
                />

                {/* Password */}
                <GlassInput
                  label="Password"
                  placeholder="Enter your password"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  icon="🔒"
                />

                {/* Remember Me + Forgot Password */}
                <View style={s.metaRow}>
                  <TouchableOpacity
                    style={s.rememberRow}
                    onPress={() => setRememberMe(!rememberMe)}
                    activeOpacity={0.8}
                  >
                    <View style={[s.checkbox, rememberMe && s.checkboxChecked]}>
                      {rememberMe && <Text style={s.checkmarkText}>✓</Text>}
                    </View>
                    <Text style={s.rememberLabel}>Remember me</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert(
                        'Forgot Password',
                        'Password reset instructions have been sent to your email.'
                      )
                    }
                    activeOpacity={0.7}
                  >
                    <Text style={s.forgotLink}>Forgot password?</Text>
                  </TouchableOpacity>
                </View>

                {/* Sign In CTA Button */}
                <Animated.View style={{ transform: [{ scale: btnScale }] }}>
                  <TouchableOpacity
                    style={[s.ctaButton, loading && { opacity: 0.75 }]}
                    onPress={handleLogin}
                    onPressIn={pressIn}
                    onPressOut={pressOut}
                    disabled={loading}
                    activeOpacity={0.9}
                  >
                    <Text style={s.ctaText}>
                      {loading ? 'Signing in...' : 'Sign In  →'}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>

                {/* Divider */}
                <View style={s.dividerContainer}>
                  <View style={s.dividerBar} />
                  <Text style={s.dividerLabel}>or</Text>
                  <View style={s.dividerBar} />
                </View>

                {/* Create Account Link */}
                <TouchableOpacity
                  style={s.createAccountRow}
                  onPress={() => router.push('/(auth)/register')}
                  activeOpacity={0.7}
                >
                  <Text style={s.createAccountText}>
                    New here?{' '}
                    <Text style={s.createAccountHighlight}>Create account</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const s = StyleSheet.create({
  bgImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#060A10',
  },
  darkBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(6, 10, 16, 0.45)',
  },
  safe: {
    flex: 1,
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
    paddingHorizontal: 64,
  },
  cardWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardWrapperDesktop: {
    width: '100%',
    maxWidth: 1200,
    alignItems: 'flex-start',
    paddingLeft: 60,
  },

  // Glassmorphism Center Card
  card: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: 'rgba(10, 20, 34, 0.65)',
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 229, 187, 0.35)',
    paddingHorizontal: 32,
    paddingVertical: 36,
    shadowColor: '#00DFB2',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 35,
    elevation: 12,
  },
  cardDesktop: {
    width: 480,
    maxWidth: 500,
    paddingHorizontal: 36,
    paddingVertical: 40,
  },

  // Brand Header
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 22,
  },
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#00DFB2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00DFB2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 5,
  },
  logoIcon: {
    fontSize: 24,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  brandSubtitle: {
    color: '#00DFB2',
    fontSize: 12.5,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.2,
  },

  // Welcome section
  welcomeBox: {
    marginBottom: 24,
  },
  welcomeHeading: {
    color: '#FFFFFF',
    fontSize: 27,
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
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 24,
  },
  rememberRow: {
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
    backgroundColor: '#00DFB2',
    borderColor: '#00DFB2',
  },
  checkmarkText: {
    color: '#05131C',
    fontSize: 12,
    fontWeight: '900',
  },
  rememberLabel: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
  },
  forgotLink: {
    color: '#00DFB2',
    fontSize: 13,
    fontWeight: '600',
  },

  // CTA Button
  ctaButton: {
    backgroundColor: '#00DFB2',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00DFB2',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 20,
    elevation: 10,
  },
  ctaText: {
    color: '#05131C',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.3,
  },

  // Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
    gap: 14,
  },
  dividerBar: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  dividerLabel: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
  },

  // Create account
  createAccountRow: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  createAccountText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },
  createAccountHighlight: {
    color: '#00DFB2',
    fontWeight: '700',
  },
});
