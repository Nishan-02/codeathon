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
  wrap: { marginBottom: 14 },
  label: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
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
    height: 50,
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
  icon: { fontSize: 16 },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14.5,
    height: '100%',
  },
  eyeBtn: { padding: 4 },
  eyeIcon: { color: '#94A3B8', fontSize: 16 },
});

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { signUp } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 960;

  const btnScale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(btnScale, { toValue: 0.97, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(btnScale, { toValue: 1, useNativeDriver: true }).start();

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert('Validation Error', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters.');
      return;
    }
    try {
      setLoading(true);
      await signUp(email.trim(), password);
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message || 'Could not create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      {/* Background glow */}
      <View style={[s.bgGlowTopLeft, Platform.OS === 'web' ? ({ filter: 'blur(90px)' } as any) : null]} />
      <View style={[s.bgGlowBottomRight, Platform.OS === 'web' ? ({ filter: 'blur(100px)' } as any) : null]} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[s.scroll, isDesktop && s.scrollDesktop]}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={[
              s.card,
              isDesktop && s.cardDesktop,
              Platform.OS === 'web' ? ({ backdropFilter: 'blur(24px)' } as any) : null,
            ]}
          >
            {/* Header */}
            <View style={s.brandHeader}>
              <View style={s.logoSquare}>
                <Text style={s.logoBookIcon}>📖</Text>
              </View>
              <View>
                <Text style={s.brandTitle}>StudyFlow</Text>
                <Text style={s.brandSubtitle}>AI-Powered Learning</Text>
              </View>
            </View>

            <View style={s.welcomeWrap}>
              <Text style={s.welcomeTitle}>Create Account ✨</Text>
              <Text style={s.welcomeSub}>Start your AI-powered study journey today</Text>
            </View>

            <GlassInput
              label="Full Name"
              placeholder="John Doe"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              icon="👤"
            />
            <GlassInput
              label="Email Address"
              placeholder="student@example.com"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              icon="✉️"
            />
            <GlassInput
              label="Password"
              placeholder="Minimum 6 characters"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              icon="🔒"
            />
            <GlassInput
              label="Confirm Password"
              placeholder="Re-enter your password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              icon="🔑"
            />

            {/* Password strength */}
            {password.length > 0 && (
              <View style={s.strengthRow}>
                {[1, 2, 3, 4].map((i) => (
                  <View
                    key={i}
                    style={[
                      s.strengthBar,
                      {
                        backgroundColor:
                          password.length >= i * 3
                            ? i <= 1 ? '#EF4444' : i <= 2 ? '#F59E0B' : i <= 3 ? '#6366F1' : '#00C9A7'
                            : 'rgba(255, 255, 255, 0.1)',
                      },
                    ]}
                  />
                ))}
                <Text style={s.strengthLabel}>
                  {password.length < 4 ? 'Weak' : password.length < 7 ? 'Fair' : password.length < 10 ? 'Good' : 'Strong'}
                </Text>
              </View>
            )}

            {/* Submit CTA */}
            <Animated.View style={[{ transform: [{ scale: btnScale }] }, { marginTop: 10 }]}>
              <TouchableOpacity
                style={[s.signInBtn, loading && { opacity: 0.75 }]}
                onPress={handleRegister}
                onPressIn={pressIn}
                onPressOut={pressOut}
                disabled={loading}
                activeOpacity={0.9}
              >
                <Text style={s.signInText}>
                  {loading ? 'Creating account...' : 'Create Account  →'}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Terms */}
            <Text style={s.terms}>
              By signing up you agree to our{' '}
              <Text style={{ color: '#00C9A7' }}>Terms</Text> &{' '}
              <Text style={{ color: '#00C9A7' }}>Privacy Policy</Text>.
            </Text>

            {/* Divider */}
            <View style={s.dividerRow}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>or</Text>
              <View style={s.dividerLine} />
            </View>

            {/* Login Link */}
            <TouchableOpacity
              style={s.createAccountBtn}
              onPress={() => router.push('/(auth)/login')}
              activeOpacity={0.7}
            >
              <Text style={s.createAccountText}>
                Already have an account?{' '}
                <Text style={s.createAccountHighlight}>Sign In</Text>
              </Text>
            </TouchableOpacity>
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
    width: 520,
    maxWidth: 540,
    paddingHorizontal: 36,
    paddingVertical: 38,
  },

  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  logoSquare: {
    width: 44,
    height: 44,
    borderRadius: 12,
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
    fontSize: 22,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  brandSubtitle: {
    color: '#00C9A7',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },

  welcomeWrap: {
    marginBottom: 22,
  },
  welcomeTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  welcomeSub: {
    color: '#94A3B8',
    fontSize: 13.5,
  },

  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 99,
  },
  strengthLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    width: 45,
  },

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

  terms: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
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
