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
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { Colors, Radius, FontSize } from '../../constants/theme';

const { width } = Dimensions.get('window');

// ── Fancy text input ──────────────────────────────────────────────────────────
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
  wrap: { marginBottom: 16 },
  label: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 6 },
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827',
    borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: 14, gap: 10,
  },
  rowFocused: { borderColor: Colors.teal },
  icon: { fontSize: 16 },
  input: {
    flex: 1, color: Colors.textPrimary, fontSize: 15, paddingVertical: 14,
  },
});

// ── Main ──────────────────────────────────────────────────────────────────────
export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();
  const btnScale = useRef(new Animated.Value(1)).current;

  const pressIn = () => Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(btnScale, { toValue: 1, useNativeDriver: true }).start();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Validation Error', 'Please enter email and password.');
      return;
    }
    try {
      setLoading(true);
      await signIn(email, password);
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Login Failed', err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          {/* Logo / branding */}
          <View style={s.logoWrap}>
            <View style={s.logoCircle}>
              <Text style={s.logoIcon}>📖</Text>
            </View>
            <View style={s.logoRight}>
              <Text style={s.logoTitle}>StudyFlow</Text>
              <View style={s.logoTagRow}>
                <View style={s.novaOnlineDot} />
                <Text style={s.logoTag}>AI-Powered Learning</Text>
              </View>
            </View>
          </View>

          {/* Headline */}
          <View style={s.headWrap}>
            <Text style={s.headline}>Welcome back 👋</Text>
            <Text style={s.sub}>Sign in to continue your learning journey</Text>
          </View>

          {/* Form */}
          <View style={s.form}>
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
              placeholder="Enter your password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              icon="🔒"
            />

            <TouchableOpacity style={s.forgotRow}>
              <Text style={s.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Sign in button */}
            <Animated.View style={{ transform: [{ scale: btnScale }] }}>
              <TouchableOpacity
                style={[s.signInBtn, loading && { opacity: 0.7 }]}
                onPress={handleLogin}
                onPressIn={pressIn}
                onPressOut={pressOut}
                disabled={loading}
                activeOpacity={1}
              >
                {loading ? (
                  <Text style={s.signInText}>Signing in...</Text>
                ) : (
                  <Text style={s.signInText}>Sign In  →</Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Divider */}
            <View style={s.dividerRow}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>or</Text>
              <View style={s.dividerLine} />
            </View>

            {/* Register link */}
            <TouchableOpacity
              style={s.regBtn}
              onPress={() => router.push('/(auth)/register')}
            >
              <Text style={s.regText}>
                New here?{' '}
                <Text style={{ color: Colors.teal, fontWeight: '700' }}>Create account</Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Bottom feature pills */}
          <View style={s.pillRow}>
            {['🧠 ML Engine', '⚡ RAG System', '📅 Smart Planner'].map((p) => (
              <View key={p} style={s.pill}>
                <Text style={s.pillText}>{p}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 },

  logoWrap: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 36 },
  logoCircle: {
    width: 48, height: 48, borderRadius: 14, backgroundColor: Colors.teal,
    justifyContent: 'center', alignItems: 'center',
  },
  logoIcon: { fontSize: 24 },
  logoRight: {},
  logoTitle: { color: Colors.textPrimary, fontSize: 20, fontWeight: '800' },
  logoTagRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  novaOnlineDot: { width: 6, height: 6, borderRadius: 99, backgroundColor: Colors.teal },
  logoTag: { color: Colors.teal, fontSize: 12, fontWeight: '600' },

  headWrap: { marginBottom: 28 },
  headline: { color: Colors.textPrimary, fontSize: 28, fontWeight: '800', marginBottom: 6 },
  sub: { color: Colors.textSecondary, fontSize: 14 },

  form: { flex: 1 },

  forgotRow: { alignItems: 'flex-end', marginBottom: 20, marginTop: -4 },
  forgotText: { color: Colors.teal, fontSize: 13, fontWeight: '600' },

  signInBtn: {
    backgroundColor: Colors.teal, borderRadius: Radius.md,
    paddingVertical: 16, alignItems: 'center',
    shadowColor: Colors.teal, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  signInText: { color: Colors.bg, fontWeight: '800', fontSize: 16 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { color: Colors.textMuted, fontSize: 13 },

  regBtn: {
    backgroundColor: '#111827', borderRadius: Radius.md,
    paddingVertical: 14, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  regText: { color: Colors.textSecondary, fontSize: 14 },

  pillRow: { flexDirection: 'row', gap: 8, marginTop: 28, flexWrap: 'wrap' },
  pill: {
    backgroundColor: '#111827', borderRadius: Radius.full,
    paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: Colors.border,
  },
  pillText: { color: Colors.textSecondary, fontSize: 12 },
});
