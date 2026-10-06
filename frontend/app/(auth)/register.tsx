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
            <Text style={{ color: showPwd ? '#00DFB2' : '#8E9BAE', fontSize: 16 }}>{showPwd ? '🙈' : '👁️'}</Text>
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
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(12, 22, 36, 0.72)',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 16,
    height: 48,
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
  icon: { fontSize: 16 },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14.5,
    height: '100%',
    paddingVertical: 0,
  },
  eyeBtn: { padding: 4 },
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
  const isDesktop = width >= 920;

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
      await signUp(email.trim(), password, name.trim());
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message || 'Could not create account.');
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
      <View style={s.darkBackdrop} />

      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={[s.scroll, isDesktop && s.scrollDesktop]}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[s.layoutWrapper, isDesktop && s.layoutWrapperDesktop]}>
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
                {/* Header */}
                <View style={s.brandRow}>
                  <View style={s.logoSquare}>
                    <Text style={s.logoIcon}>📖</Text>
                  </View>
                  <View>
                    <Text style={s.brandTitle}>StudyFlow</Text>
                    <Text style={s.brandSubtitle}>AI-Powered Learning</Text>
                  </View>
                </View>

                <View style={s.welcomeWrap}>
                  <Text style={s.welcomeTitle}>Create Account </Text>
                  <Text style={s.welcomeSub}>Start your AI-powered study journey today</Text>
                </View>

                <GlassInput
                  label="Full Name"
                  placeholder="Enter your name"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  icon="👤"
                />
                <GlassInput
                  label="Email Address"
                  placeholder="Enter your email"
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
                                ? i <= 1 ? '#EF4444' : i <= 2 ? '#F59E0B' : i <= 3 ? '#6366F1' : '#00DFB2'
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
                  <Text style={{ color: '#00DFB2' }}>Terms</Text> &{' '}
                  <Text style={{ color: '#00DFB2' }}>Privacy Policy</Text>.
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

  card: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: 'rgba(9, 18, 30, 0.65)',
    borderRadius: 26,
    borderWidth: 1.2,
    borderColor: 'rgba(0, 223, 178, 0.38)',
    paddingHorizontal: 32,
    paddingVertical: 34,
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
    paddingVertical: 38,
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  logoSquare: {
    width: 44,
    height: 44,
    borderRadius: 12,
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
    fontSize: 21,
    fontWeight: '800',
  },
  brandSubtitle: {
    color: '#00DFB2',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },

  welcomeWrap: {
    marginBottom: 20,
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
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
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
    color: '#00DFB2',
    fontWeight: '700',
  },
});
