import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { Colors, Radius } from '../../constants/theme';

function StatPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={sp.wrap}>
      <Text style={[sp.value, { color }]}>{value}</Text>
      <Text style={sp.label}>{label}</Text>
    </View>
  );
}
const sp = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: Radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  value: { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  label: { color: Colors.textMuted, fontSize: 11, fontWeight: '600' },
});

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={ir.row}>
      <View style={ir.iconWrap}><Text style={{ fontSize: 16 }}>{icon}</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={ir.label}>{label}</Text>
        <Text style={ir.value} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}
const ir = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: { color: Colors.textMuted, fontSize: 12, marginBottom: 2 },
  value: { color: Colors.textPrimary, fontWeight: '600', fontSize: 14 },
});

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const initials = (user?.displayName || user?.email || 'Student')
    .split(' ')
    .map((n: string) => n.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');

  const executeSignOut = async () => {
    try {
      setSigningOut(true);
      await signOut();
      router.replace('/(auth)/login');
    } catch {
      router.replace('/(auth)/login');
    } finally {
      setSigningOut(false);
    }
  };

  const handleSignOut = () => {
    if (Platform.OS === 'web') {
      const ok = typeof window !== 'undefined' ? window.confirm('Are you sure you want to sign out?') : true;
      if (ok) {
        executeSignOut();
      }
    } else {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out of StudyFlow?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign Out',
            style: 'destructive',
            onPress: executeSignOut,
          },
        ]
      );
    }
  };

  const memberSince = (user as any)?.metadata?.creationTime
    ? new Date((user as any).metadata.creationTime).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : 'October 2026';

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* ── Header ── */}
        <Text style={s.pageTitle}>Profile</Text>

        {/* ── Avatar card ── */}
        <View style={s.avatarCard}>
          {/* Gradient backdrop strip */}
          <View style={s.avatarBg} />
          <View style={s.avatarCircle}>
            <Text style={s.avatarInitials}>{initials}</Text>
          </View>
          <Text style={s.userName}>
            {user?.displayName || user?.email?.split('@')[0] || 'Student'}
          </Text>
          <Text style={s.userEmail}>{user?.email || 'student@studyflow.ai'}</Text>
          <View style={s.chipRow}>
            <View style={s.chip}>
              <View style={s.chipDot} />
              <Text style={s.chipText}>Active Learner</Text>
            </View>
            <View style={[s.chip, { backgroundColor: '#1E1B4B' }]}>
              <Text style={[s.chipText, { color: Colors.indigo }]}>📖 Pro Scholar</Text>
            </View>
          </View>
        </View>

        {/* ── Stats row ── */}
        <View style={s.statsRow}>
          <StatPill label="Sessions" value="12" color={Colors.teal} />
          <View style={{ width: 8 }} />
          <StatPill label="Streak" value="5🔥" color={Colors.amber} />
          <View style={{ width: 8 }} />
          <StatPill label="Topics" value="28" color={Colors.indigo} />
        </View>

        {/* ── Account info ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Account Details</Text>
          <InfoRow icon="✉️" label="Email" value={user?.email || 'student@studyflow.ai'} />
          <InfoRow icon="🆔" label="User ID" value={user?.uid?.slice(0, 18) || 'usr_active_student'} />
          <InfoRow icon="📅" label="Member since" value={memberSince} />
          <InfoRow
            icon="✅"
            label="Account Status"
            value="Verified Active"
          />
        </View>

        {/* ── Preferences ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Preferences</Text>
          <TouchableOpacity style={s.prefRow} activeOpacity={0.7} onPress={() => Alert.alert('Notifications', 'All study reminder alerts are enabled.')}>
            <View style={ir.iconWrap}><Text style={{ fontSize: 16 }}>🔔</Text></View>
            <Text style={[ir.value, { flex: 1 }]}>Study Reminders</Text>
            <Text style={s.prefArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.prefRow} activeOpacity={0.7} onPress={() => Alert.alert('Theme', 'Dark cyber theme is active.')}>
            <View style={ir.iconWrap}><Text style={{ fontSize: 16 }}>🌙</Text></View>
            <Text style={[ir.value, { flex: 1 }]}>Dark Theme</Text>
            <Text style={s.prefArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.prefRow, { borderBottomWidth: 0 }]} activeOpacity={0.7} onPress={() => Alert.alert('Security', 'Password change link sent to email.')}>
            <View style={ir.iconWrap}><Text style={{ fontSize: 16 }}>🔒</Text></View>
            <Text style={[ir.value, { flex: 1 }]}>Security & Password</Text>
            <Text style={s.prefArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* ── Sign out Button ── */}
        <TouchableOpacity
          style={[s.signOutBtn, signingOut && { opacity: 0.7 }]}
          onPress={handleSignOut}
          disabled={signingOut}
          activeOpacity={0.8}
        >
          {signingOut ? (
            <ActivityIndicator color={Colors.red} />
          ) : (
            <Text style={s.signOutText}>🚪  Sign Out</Text>
          )}
        </TouchableOpacity>

        {/* ── Version ── */}
        <Text style={s.version}>StudyFlow v1.0.0  •  AI-Powered Study Planner</Text>
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: 16, paddingTop: 8 },

  pageTitle: { color: Colors.textPrimary, fontSize: 22, fontWeight: '800', marginBottom: 16 },

  // Avatar card
  avatarCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    alignItems: 'center',
    paddingBottom: 20,
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarBg: {
    height: 80,
    width: '100%',
    backgroundColor: Colors.tealDark,
    opacity: 0.3,
    marginBottom: -40,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.teal,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.bg,
    zIndex: 1,
  },
  avatarInitials: { color: Colors.bg, fontWeight: '800', fontSize: 28 },
  userName: { color: Colors.textPrimary, fontWeight: '700', fontSize: 18, marginTop: 10 },
  userEmail: { color: Colors.textMuted, fontSize: 13, marginTop: 3, marginBottom: 12 },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#002E27',
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  chipDot: { width: 6, height: 6, borderRadius: 99, backgroundColor: Colors.teal },
  chipText: { color: Colors.teal, fontSize: 12, fontWeight: '700' },

  // Stats
  statsRow: { flexDirection: 'row', marginBottom: 14 },

  // Cards
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: { color: Colors.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 0.5, marginBottom: 4 },

  // Prefs
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  prefArrow: { color: Colors.textMuted, fontSize: 20 },

  // Sign out
  signOutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: Radius.md,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  signOutText: { color: Colors.red, fontWeight: '700', fontSize: 15 },

  version: { color: Colors.textMuted, fontSize: 12, textAlign: 'center', marginBottom: 8 },
});
