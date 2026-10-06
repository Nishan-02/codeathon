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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { Colors, Radius } from '../../constants/theme';

// ── Reusable fancy input ──────────────────────────────────────────────────────
function FancyInput({
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
    <View style={fi.wrap}>
      <Text style={fi.label}>{label}</Text>
      <View style={[fi.row, focused && fi.rowFocused]}>
        <Text style={fi.icon}>{icon}</Text>
        <TextInput
          style={fi.input}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !showPwd}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? 'none'}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setShowPwd((v) => !v)} style={{ padding: 4 }}>
            <Text style={{ color: Colors.textMuted, fontSize: 16 }}>{showPwd ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const fi = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 6 },
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827',
    borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: 14, gap: 10,
  },
  rowFocused: { borderColor: Colors.teal },
  icon: { fontSize: 16 },
  input: { flex: 1, color: Colors.textPrimary, fontSize: 15, paddingVertical: 14 },
});

// ── Step indicator ────────────────────────────────────────────────────────────
function StepDot({ active, done }: { active: boolean; done: boolean }) {
  return (
    <View
      style={{
        width: 28, height: 28, borderRadius: 99,
        backgroundColor: done ? Colors.teal : active ? Colors.indigo : '#1E293B',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: active && !done ? 2 : 0, borderColor: Colors.indigo,
      }}
    >
      {done && <Text style={{ color: Colors.bg, fontWeight: '700', fontSize: 13 }}>✓</Text>}
      {active && !done && <View style={{ width: 8, height: 8, borderRadius: 99, backgroundColor: Colors.white }} />}
    </View>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();
  const btnScale = useRef(new Animated.Value(1)).current;

  const pressIn = () => Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(btnScale, { toValue: 1, useNativeDriver: true }).start();

  // Simple step indicator — step 1: name/email, step 2: password
  const step = name && email ? 2 : 1;

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
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
      await signUp(email, password);
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message || 'Could not create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          {/* Logo */}
          <View style={s.logoWrap}>
            <View style={s.logoCircle}>
              <Text style={s.logoIcon}>📖</Text>
            </View>
            <View>
              <Text style={s.logoTitle}>StudyFlow</Text>
              <View style={s.logoTagRow}>
                <View style={s.onlineDot} />
                <Text style={s.logoTag}>AI-Powered Learning</Text>
              </View>
            </View>
          </View>

          {/* Steps */}
          <View style={s.stepsRow}>
            <StepDot active={step === 1} done={step > 1} />
            <View style={[s.stepLine, { backgroundColor: step > 1 ? Colors.teal : Colors.border }]} />
            <StepDot active={step === 2} done={false} />
            <View style={[s.stepLine, { backgroundColor: Colors.border }]} />
            <StepDot active={false} done={false} />
          </View>
          <View style={s.stepLabels}>
            <Text style={[s.stepLbl, { color: step >= 1 ? Colors.teal : Colors.textMuted }]}>Profile</Text>
            <Text style={[s.stepLbl, { color: step >= 2 ? Colors.teal : Colors.textMuted }]}>Security</Text>
            <Text style={[s.stepLbl, { color: Colors.textMuted }]}>Done</Text>
          </View>

          {/* Headline */}
          <View style={s.headWrap}>
            <Text style={s.headline}>Create Account ✨</Text>
            <Text style={s.sub}>Start your AI-powered study journey today</Text>
          </View>

          {/* Form */}
          <View style={s.form}>
            <FancyInput
              label="Full Name"
              placeholder="John Doe"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              icon="👤"
            />
            <FancyInput
              label="Email Address"
              placeholder="student@example.com"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              icon="✉️"
            />
            <FancyInput
              label="Password"
              placeholder="Minimum 6 characters"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              icon="🔒"
            />
            <FancyInput
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
                            ? i <= 1 ? Colors.red : i <= 2 ? Colors.amber : i <= 3 ? Colors.indigo : Colors.teal
                            : Colors.border,
                      },
                    ]}
                  />
                ))}
                <Text style={s.strengthLabel}>
                  {password.length < 4 ? 'Weak' : password.length < 7 ? 'Fair' : password.length < 10 ? 'Good' : 'Strong'}
                </Text>
              </View>
            )}

            {/* Register button */}
            <Animated.View style={[{ transform: [{ scale: btnScale }] }, { marginTop: 6 }]}>
              <TouchableOpacity
                style={[s.regBtn, loading && { opacity: 0.7 }]}
                onPress={handleRegister}
                onPressIn={pressIn}
                onPressOut={pressOut}
                disabled={loading}
                activeOpacity={1}
              >
                <Text style={s.regBtnText}>{loading ? 'Creating account...' : 'Create Account  →'}</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Terms */}
            <Text style={s.terms}>
              By creating an account you agree to our{' '}
              <Text style={{ color: Colors.teal }}>Terms of Service</Text> &{' '}
              <Text style={{ color: Colors.teal }}>Privacy Policy</Text>.
            </Text>

            {/* Divider */}
            <View style={s.dividerRow}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>already have an account?</Text>
              <View style={s.dividerLine} />
            </View>

            <TouchableOpacity style={s.loginBtn} onPress={() => router.push('/(auth)/login')}>
              <Text style={s.loginText}>Sign In</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 },

  logoWrap: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  logoCircle: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.teal,
    justifyContent: 'center', alignItems: 'center',
  },
  logoIcon: { fontSize: 22 },
  logoTitle: { color: Colors.textPrimary, fontSize: 19, fontWeight: '800' },
  logoTagRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  onlineDot: { width: 6, height: 6, borderRadius: 99, backgroundColor: Colors.teal },
  logoTag: { color: Colors.teal, fontSize: 12, fontWeight: '600' },

  stepsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  stepLine: { flex: 1, height: 2, marginHorizontal: 4 },
  stepLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  stepLbl: { fontSize: 11, fontWeight: '700', flex: 1, textAlign: 'center' },

  headWrap: { marginBottom: 20 },
  headline: { color: Colors.textPrimary, fontSize: 26, fontWeight: '800', marginBottom: 4 },
  sub: { color: Colors.textSecondary, fontSize: 14 },

  form: {},

  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  strengthBar: { flex: 1, height: 4, borderRadius: 99 },
  strengthLabel: { color: Colors.textMuted, fontSize: 11, fontWeight: '600', width: 45 },

  regBtn: {
    backgroundColor: Colors.teal, borderRadius: Radius.md,
    paddingVertical: 16, alignItems: 'center',
    shadowColor: Colors.teal, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  regBtnText: { color: Colors.bg, fontWeight: '800', fontSize: 16 },

  terms: { color: Colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 12, lineHeight: 18 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 18, gap: 8 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { color: Colors.textMuted, fontSize: 12 },

  loginBtn: {
    backgroundColor: '#111827', borderRadius: Radius.md,
    paddingVertical: 14, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  loginText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '600' },
});
