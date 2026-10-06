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

// ── Icons (Clean SVG / Vector Style) ──────────────────────────────────────────
function MailIcon({ color = '#8E9BAE' }: { color?: string }) {
  return (
    <View style={iconStyles.wrap}>
      <Text style={[iconStyles.symbol, { color }]}>✉️</Text>
    </View>
  );
}

function LockIcon({ color = '#8E9BAE' }: { color?: string }) {
  return (
    <View style={iconStyles.wrap}>
      <Text style={[iconStyles.symbol, { color }]}>🔒</Text>
    </View>
  );
}

function EyeIcon({ visible, color = '#8E9BAE' }: { visible: boolean; color?: string }) {
  return (
    <View style={iconStyles.wrap}>
      <Text style={[iconStyles.symbol, { color }]}>{visible ? '👁️' : '🙈'}</Text>
    </View>
  );
}

const iconStyles = StyleSheet.create({
  wrap: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  symbol: {
    fontSize: 16,
  },
});

// ── Glass Input Field Component ──────────────────────────────────────────────
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
  icon: 'mail' | 'lock';
}) {
  const [focused, setFocused] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  return (
    <View style={gi.wrap}>
      <Text style={gi.label}>{label}</Text>
      <View style={[gi.box, focused && gi.boxFocused]}>
        {icon === 'mail' ? (
          <MailIcon color={focused ? '#00DFB2' : '#8E9BAE'} />
        ) : (
          <LockIcon color={focused ? '#00DFB2' : '#8E9BAE'} />
        )}
        <TextInput
          style={[
            gi.input,
            Platform.OS === 'web'
              ? ({
                outline: 'none',
                backgroundColor: 'transparent',
                color: '#FFFFFF',
                WebkitBoxShadow: '0 0 0 1000px rgba(12, 22, 36, 0.95) inset',
                WebkitTextFillColor: '#FFFFFF',
              } as any)
              : null,
          ]}
          placeholder={placeholder}
          placeholderTextColor="#64748B"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !showPwd}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? 'none'}
          autoCorrect={false}
          autoComplete="off"
          textContentType="none"
          spellCheck={false}
          {...(Platform.OS === 'web'
            ? ({
                autoComplete: 'new-password',
                'data-lpignore': 'true',
                'data-1p-ignore': 'true',
                'data-form-type': 'other',
              } as any)
            : {})}
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
            <EyeIcon visible={!showPwd} color={showPwd ? '#00DFB2' : '#8E9BAE'} />
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
    backgroundColor: 'rgba(12, 22, 36, 0.72)',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 16,
    height: 50,
    gap: 12,
  },
  boxFocused: {
    borderColor: '#00DFB2',
    backgroundColor: 'rgba(14, 28, 46, 0.88)',
    shadowColor: '#00DFB2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 4,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '400',
    height: '100%',
    paddingVertical: 0,
  },
  eyeBtn: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// ── Main Login Screen ─────────────────────────────────────────────────────────
export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  const { signIn } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const isDesktop = width >= 920;

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
      {/* Subtle backdrop overlay to balance background artwork and focus on card */}
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
            <View style={[s.layoutWrapper, isDesktop && s.layoutWrapperDesktop]}>
              {/* ── Center-Left Glassmorphism Card ─────────────────────────── */}
              <View
                style={[
                  s.card,
                  isDesktop && s.cardDesktop,
                  Platform.OS === 'web'
                    ? ({
                      backdropFilter: 'blur(32px) saturate(190%)',
                      WebkitBackdropFilter: 'blur(32px) saturate(190%)',
                      boxShadow:
                        '0 0 50px rgba(0, 223, 178, 0.2), 0 25px 50px rgba(0, 0, 0, 0.75), inset 0 1px 1px rgba(255, 255, 255, 0.18)',
                    } as any)
                    : null,
                ]}
              >
                {/* Brand Header */}
                <View style={s.brandRow}>
                  <View style={s.logoSquare}>
                    <Text style={s.logoIcon}>📖</Text>
                  </View>
                  <View>
                    <Text style={s.brandTitle}>StudyFlow</Text>
                    <Text style={s.brandSubtitle}>AI-Powered Learning</Text>
                  </View>
                </View>

                {/* Welcome Heading */}
                <View style={s.welcomeWrap}>
                  <Text style={s.welcomeTitle}>Welcome back 👋</Text>
                  <Text style={s.welcomeSub}>Sign in to continue your learning journey</Text>
                </View>

                {/* Email Address */}
                <GlassInput
                  label="Email Address"
                  placeholder="Enter your email address"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  icon="mail"
                />

                {/* Password */}
                <GlassInput
                  label="Password"
                  placeholder="Enter your password"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  icon="lock"
                />

                {/* Remember Me & Forgot Password */}
                <View style={s.optionsRow}>
                  <TouchableOpacity
                    style={s.rememberRow}
                    onPress={() => setRememberMe(!rememberMe)}
                    activeOpacity={0.8}
                  >
                    <View style={[s.checkbox, rememberMe && s.checkboxChecked]}>
                      {rememberMe && <Text style={s.checkMark}>✓</Text>}
                    </View>
                    <Text style={s.rememberText}>Remember me</Text>
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
    backgroundColor: 'rgba(4, 8, 14, 0.35)',
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

  layoutWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  layoutWrapperDesktop: {
    width: '100%',
    maxWidth: 1280,
    alignItems: 'flex-start',
    paddingLeft: 40,
  },

  // ── Glass Card ─────────────────────────────────────────────────────────────
  card: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: 'rgba(9, 18, 30, 0.65)',
    borderRadius: 26,
    borderWidth: 1.2,
    borderColor: 'rgba(0, 223, 178, 0.38)',
    paddingHorizontal: 32,
    paddingVertical: 36,
    shadowColor: '#00DFB2',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 36,
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
    marginBottom: 24,
  },
  logoSquare: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: '#00DFB2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00DFB2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 5,
  },
  logoIcon: {
    fontSize: 22,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 23,
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
    fontSize: 13.5,
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
  checkMark: {
    color: '#051817',
    fontSize: 12,
    fontWeight: '900',
  },
  rememberText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
  },
  forgotText: {
    color: '#00DFB2',
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
    shadowOpacity: 0.55,
    shadowRadius: 20,
    elevation: 10,
  },
  signInText: {
    color: '#051817',
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
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
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
    color: '#00DFB2',
    fontWeight: '700',
  },
});
