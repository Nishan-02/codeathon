import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
    flex: 1, alignItems: 'center', backgroundColor: '#111827',
    borderRadius: Radius.md, padding: 14, borderWidth: 1, borderColor: Colors.border,
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
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  iconWrap: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#1E293B',
    justifyContent: 'center', alignItems: 'center',
  },
  label: { color: Colors.textMuted, fontSize: 12, marginBottom: 2 },
  value: { color: Colors.textPrimary, fontWeight: '600', fontSize: 14 },
});

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  const initials = (user?.displayName || user?.email || 'S')
    .split(' ')
    .map((n: string) => n.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
      ]
    );
  };

  const memberSince = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : 'Unknown';

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
          <Text style={s.userEmail}>{user?.email}</Text>
          <View style={s.chipRow}>
            <View style={s.chip}>
              <View style={s.chipDot} />
              <Text style={s.chipText}>Active Learner</Text>
            </View>
            <View style={[s.chip, { backgroundColor: '#1E1B4B' }]}>
              <Text style={[s.chipText, { color: Colors.indigo }]}>📖 Student</Text>
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
          <InfoRow icon="✉️" label="Email" value={user?.email || 'Not set'} />
          <InfoRow icon="🆔" label="User ID" value={user?.uid?.slice(0, 18) + '...' || 'N/A'} />
          <InfoRow icon="📅" label="Member since" value={memberSince} />
          <InfoRow
            icon="✅"
            label="Email verified"
            value={user?.emailVerified ? 'Verified' : 'Not verified'}
          />
        </View>

        {/* ── Preferences ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Preferences</Text>
          <TouchableOpacity style={s.prefRow}>
            <View style={ir.iconWrap}><Text style={{ fontSize: 16 }}>🔔</Text></View>
            <Text style={[ir.value, { flex: 1 }]}>Notifications</Text>
            <Text style={s.prefArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.prefRow}>
            <View style={ir.iconWrap}><Text style={{ fontSize: 16 }}>🌙</Text></View>
            <Text style={[ir.value, { flex: 1 }]}>Theme</Text>
            <Text style={s.prefArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.prefRow, { borderBottomWidth: 0 }]}>
            <View style={ir.iconWrap}><Text style={{ fontSize: 16 }}>🔒</Text></View>
            <Text style={[ir.value, { flex: 1 }]}>Change Password</Text>
            <Text style={s.prefArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* ── Sign out ── */}
        <TouchableOpacity style={s.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
          <Text style={s.signOutText}>🚪  Sign Out</Text>
        </TouchableOpacity>

        {/* ── Version ── */}
        <Text style={s.version}>StudyFlow v1.0.0  •  Powered by AI</Text>
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
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
    alignItems: 'center', paddingBottom: 20, marginBottom: 14,
    overflow: 'hidden', borderWidth: 1, borderColor: Colors.border,
  },
  avatarBg: {
    height: 80, width: '100%', backgroundColor: Colors.tealDark,
    opacity: 0.3, marginBottom: -40,
  },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.teal,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: Colors.bg, zIndex: 1,
  },
  avatarInitials: { color: Colors.bg, fontWeight: '800', fontSize: 28 },
  userName: { color: Colors.textPrimary, fontWeight: '700', fontSize: 18, marginTop: 10 },
  userEmail: { color: Colors.textMuted, fontSize: 13, marginTop: 3, marginBottom: 12 },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#002E27', borderRadius: Radius.full,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  chipDot: { width: 6, height: 6, borderRadius: 99, backgroundColor: Colors.teal },
  chipText: { color: Colors.teal, fontSize: 12, fontWeight: '700' },

  // Stats
  statsRow: { flexDirection: 'row', marginBottom: 14 },

  // Cards
  card: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: 14,
    marginBottom: 14, borderWidth: 1, borderColor: Colors.border,
  },
  cardTitle: { color: Colors.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 0.5, marginBottom: 4 },

  // Prefs
  prefRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  prefArrow: { color: Colors.textMuted, fontSize: 20 },

  // Sign out
  signOutBtn: {
    backgroundColor: '#1A0A0A', borderRadius: Radius.md, paddingVertical: 15,
    alignItems: 'center', marginBottom: 16,
    borderWidth: 1, borderColor: '#3D1515',
  },
  signOutText: { color: Colors.red, fontWeight: '700', fontSize: 15 },

  version: { color: Colors.textMuted, fontSize: 12, textAlign: 'center', marginBottom: 8 },
});
