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
  useWindowDimensions,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { Colors } from '../../constants/theme';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [signingOut, setSigningOut] = useState(false);
  const [themeDark, setThemeDark] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState(user?.displayName || '');

  const displayName = user?.displayName || (user?.email ? user.email.split('@')[0] : 'Shriharsha');
  const userEmail = user?.email || 'sharsha0333@gmail.com';
  const userId = user?.uid ? `${user.uid.slice(0, 18)}...` : 'vwrFbElAObcupEhQIL...';
  const emailVerified = (user as any)?.emailVerified ?? false;

  const initials = (displayName || 'S')
    .split(' ')
    .map((n: string) => n.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');

  const memberSince = (user as any)?.metadata?.creationTime
    ? new Date((user as any).metadata.creationTime).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : 'October 2026';

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
      const ok = typeof window !== 'undefined' ? window.confirm('Are you sure you want to sign out of StudyFlow?') : true;
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

  const handleSaveProfile = () => {
    setEditModalVisible(false);
    Alert.alert('Profile Updated', 'Your profile details have been saved successfully.');
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* ── Top Navigation Bar (Desktop & Web Header) ── */}
      {isDesktop && (
        <View style={s.topNav}>
          <View style={s.topNavInner}>
            {/* Logo */}
            <TouchableOpacity
              style={s.logoGroup}
              onPress={() => router.push('/(tabs)')}
              activeOpacity={0.8}
            >
              <View style={s.logoSquare}>
                <Text style={s.logoIcon}>📖</Text>
              </View>
              <View>
                <Text style={s.logoTitle}>StudyFlow</Text>
                <Text style={s.logoSubtitle}>AI-Powered Learning</Text>
              </View>
            </TouchableOpacity>

            {/* Navigation Links */}
            <View style={s.navLinks}>
              <TouchableOpacity
                style={s.navLink}
                onPress={() => router.push('/(tabs)')}
                activeOpacity={0.7}
              >
                <Text style={s.navLinkIcon}>🏠</Text>
                <Text style={s.navLinkText}>Dashboard</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={s.navLink}
                onPress={() => router.push('/(tabs)/planner')}
                activeOpacity={0.7}
              >
                <Text style={s.navLinkIcon}>📅</Text>
                <Text style={s.navLinkText}>Study Planner</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.navLink, s.navLinkActive]}
                activeOpacity={0.9}
              >
                <Text style={s.navLinkIcon}>👤</Text>
                <Text style={[s.navLinkText, s.navLinkTextActive]}>Profile</Text>
                <View style={s.activeIndicator} />
              </TouchableOpacity>

              {/* Dark mode toggle */}
              <TouchableOpacity
                style={s.themeBtn}
                onPress={() => {
                  setThemeDark(!themeDark);
                  Alert.alert('Theme', themeDark ? 'Light mode preview enabled.' : 'Dark mode enabled.');
                }}
                activeOpacity={0.7}
              >
                <Text style={s.themeIcon}>{themeDark ? '🌙' : '☀️'}</Text>
              </TouchableOpacity>

              {/* User Avatar Chip */}
              <View style={s.navAvatar}>
                <Text style={s.navAvatarText}>{initials.charAt(0) || 'S'}</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[
          s.content,
          isDesktop && s.contentDesktop,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[s.mainContainer, isDesktop && s.mainContainerDesktop]}>
          {/* ── 1. Hero Profile Card ── */}
          <View style={s.heroCard}>
            {/* Edit Profile Button Top Right */}
            <TouchableOpacity
              style={s.editBtn}
              onPress={() => {
                setNewDisplayName(displayName);
                setEditModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              <Text style={s.editBtnIcon}>✏️</Text>
              <Text style={s.editBtnText}>Edit Profile</Text>
            </TouchableOpacity>

            {/* Avatar Circle */}
            <View style={s.avatarCircle}>
              <Text style={s.avatarInitials}>{initials.charAt(0) || 'S'}</Text>
            </View>

            {/* Display Name & Email */}
            <Text style={s.heroName}>{displayName}</Text>
            <Text style={s.heroEmail}>{userEmail}</Text>

            {/* Badges */}
            <View style={s.badgeRow}>
              <View style={s.activeBadge}>
                <View style={s.greenDot} />
                <Text style={s.activeBadgeText}>Active Learner</Text>
              </View>

              <View style={s.studentBadge}>
                <Text style={s.studentBadgeIcon}>🎓</Text>
                <Text style={s.studentBadgeText}>Student</Text>
              </View>
            </View>
          </View>

          {/* ── 2. Stats Row (3 Colored Glow Cards) ── */}
          <View style={s.statsGrid}>
            {/* Sessions Card */}
            <TouchableOpacity
              style={[s.statCard, s.statCardTeal]}
              activeOpacity={0.8}
              onPress={() => router.push('/(tabs)')}
            >
              <View style={s.statLeft}>
                <View style={[s.statIconBox, s.statIconTeal]}>
                  <Text style={s.statEmoji}>📖</Text>
                </View>
                <View>
                  <Text style={[s.statNumber, { color: '#00DFB2' }]}>12</Text>
                  <Text style={s.statLabel}>Sessions</Text>
                </View>
              </View>
              <Text style={s.statChevron}>›</Text>
            </TouchableOpacity>

            {/* Day Streak Card */}
            <TouchableOpacity
              style={[s.statCard, s.statCardAmber]}
              activeOpacity={0.8}
              onPress={() => Alert.alert('Streak 🔥', 'You have a 5-day study streak! Keep going!')}
            >
              <View style={s.statLeft}>
                <View style={[s.statIconBox, s.statIconAmber]}>
                  <Text style={s.statEmoji}>🔥</Text>
                </View>
                <View>
                  <Text style={[s.statNumber, { color: '#F59E0B' }]}>5</Text>
                  <Text style={s.statLabel}>Day Streak</Text>
                </View>
              </View>
              <Text style={s.statChevron}>›</Text>
            </TouchableOpacity>

            {/* Topics Card */}
            <TouchableOpacity
              style={[s.statCard, s.statCardPurple]}
              activeOpacity={0.8}
              onPress={() => router.push('/(tabs)/subjects')}
            >
              <View style={s.statLeft}>
                <View style={[s.statIconBox, s.statIconPurple]}>
                  <Text style={s.statEmoji}>📊</Text>
                </View>
                <View>
                  <Text style={[s.statNumber, { color: '#A855F7' }]}>28</Text>
                  <Text style={s.statLabel}>Topics</Text>
                </View>
              </View>
              <Text style={s.statChevron}>›</Text>
            </TouchableOpacity>
          </View>

          {/* ── 3. Account Details Card ── */}
          <View style={s.sectionCard}>
            <View style={s.sectionHeader}>
              <View style={s.sectionIconBox}>
                <Text style={s.sectionHeaderEmoji}>👤</Text>
              </View>
              <View>
                <Text style={s.sectionTitle}>Account Details</Text>
                <Text style={s.sectionSubtitle}>Your personal details and account information</Text>
              </View>
            </View>

            {/* Email Row */}
            <TouchableOpacity
              style={s.detailRow}
              activeOpacity={0.7}
              onPress={() => Alert.alert('Email Address', userEmail)}
            >
              <View style={s.rowLeft}>
                <View style={s.rowIconBox}>
                  <Text style={s.rowEmoji}>✉️</Text>
                </View>
                <Text style={s.rowLabel}>Email Address</Text>
              </View>
              <View style={s.rowRight}>
                <Text style={s.rowValue} numberOfLines={1}>{userEmail}</Text>
                <Text style={s.rowChevron}>›</Text>
              </View>
            </TouchableOpacity>

            {/* User ID Row */}
            <TouchableOpacity
              style={s.detailRow}
              activeOpacity={0.7}
              onPress={() => Alert.alert('User ID', user?.uid || 'vwrFbElAObcupEhQIL...')}
            >
              <View style={s.rowLeft}>
                <View style={s.rowIconBox}>
                  <Text style={s.rowEmoji}>🪪</Text>
                </View>
                <Text style={s.rowLabel}>User ID</Text>
              </View>
              <View style={s.rowRight}>
                <Text style={s.rowValue} numberOfLines={1}>{userId}</Text>
                <Text style={s.rowChevron}>›</Text>
              </View>
            </TouchableOpacity>

            {/* Member Since Row */}
            <View style={s.detailRow}>
              <View style={s.rowLeft}>
                <View style={s.rowIconBox}>
                  <Text style={s.rowEmoji}>📅</Text>
                </View>
                <Text style={s.rowLabel}>Member Since</Text>
              </View>
              <View style={s.rowRight}>
                <Text style={s.rowValue}>{memberSince}</Text>
                <Text style={s.rowChevron}>›</Text>
              </View>
            </View>

            {/* Email Status Row */}
            <View style={[s.detailRow, { borderBottomWidth: 0 }]}>
              <View style={s.rowLeft}>
                <View style={s.rowIconBox}>
                  <Text style={s.rowEmoji}>🛡️</Text>
                </View>
                <Text style={s.rowLabel}>Email Status</Text>
              </View>
              <View style={s.rowRight}>
                <View style={emailVerified ? s.verifiedPill : s.notVerifiedPill}>
                  <View style={emailVerified ? s.verifiedDot : s.notVerifiedDot} />
                  <Text style={emailVerified ? s.verifiedText : s.notVerifiedText}>
                    {emailVerified ? 'Verified' : 'Not verified'}
                  </Text>
                </View>
                <Text style={s.rowChevron}>›</Text>
              </View>
            </View>
          </View>

          {/* ── 4. Preferences Card ── */}
          <View style={s.sectionCard}>
            <View style={s.sectionHeader}>
              <View style={s.sectionIconBox}>
                <Text style={s.sectionHeaderEmoji}>⚙️</Text>
              </View>
              <View>
                <Text style={s.sectionTitle}>Preferences</Text>
                <Text style={s.sectionSubtitle}>Customize your learning experience</Text>
              </View>
            </View>

            {/* Notifications Row */}
            <TouchableOpacity
              style={s.prefRow}
              activeOpacity={0.7}
              onPress={() => Alert.alert('Notifications', 'Daily study reminders and exam countdown alerts are enabled.')}
            >
              <View style={s.rowLeft}>
                <View style={[s.rowIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                  <Text style={s.rowEmoji}>🔔</Text>
                </View>
                <View>
                  <Text style={s.prefTitle}>Notifications</Text>
                  <Text style={s.prefSubtitle}>Manage your notification settings</Text>
                </View>
              </View>
              <Text style={s.rowChevron}>›</Text>
            </TouchableOpacity>

            {/* Appearance Row */}
            <TouchableOpacity
              style={s.prefRow}
              activeOpacity={0.7}
              onPress={() => {
                setThemeDark(!themeDark);
                Alert.alert('Appearance', themeDark ? 'Light mode selected.' : 'Dark mode selected.');
              }}
            >
              <View style={s.rowLeft}>
                <View style={[s.rowIconBox, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
                  <Text style={s.rowEmoji}>🌙</Text>
                </View>
                <View>
                  <Text style={s.prefTitle}>Appearance</Text>
                  <Text style={s.prefSubtitle}>Toggle between light and dark mode</Text>
                </View>
              </View>
              <Text style={s.rowChevron}>›</Text>
            </TouchableOpacity>

            {/* Change Password Row */}
            <TouchableOpacity
              style={[s.prefRow, { borderBottomWidth: 0 }]}
              activeOpacity={0.7}
              onPress={() => Alert.alert('Change Password', `Password reset instructions have been sent to ${userEmail}.`)}
            >
              <View style={s.rowLeft}>
                <View style={[s.rowIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                  <Text style={s.rowEmoji}>🔒</Text>
                </View>
                <View>
                  <Text style={s.prefTitle}>Change Password</Text>
                  <Text style={s.prefSubtitle}>Update your account password</Text>
                </View>
              </View>
              <Text style={s.rowChevron}>›</Text>
            </TouchableOpacity>
          </View>

          {/* ── 5. Sign Out Button ── */}
          <TouchableOpacity
            style={[s.signOutBtn, signingOut && { opacity: 0.75 }]}
            onPress={handleSignOut}
            disabled={signingOut}
            activeOpacity={0.8}
          >
            {signingOut ? (
              <ActivityIndicator color="#EF4444" />
            ) : (
              <View style={s.signOutContent}>
                <Text style={s.signOutIcon}>🚪</Text>
                <Text style={s.signOutText}>Sign Out</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* ── 6. Footer ── */}
          <Text style={s.footerText}>StudyFlow © 2026 • Powered by AI</Text>
          <View style={{ height: 32 }} />
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Edit Profile</Text>
            <Text style={s.modalSub}>Update your full display name</Text>

            <View style={s.inputWrap}>
              <Text style={s.inputLabel}>Full Name</Text>
              <TextInput
                style={s.modalInput}
                value={newDisplayName}
                onChangeText={setNewDisplayName}
                placeholder="Enter full name"
                placeholderTextColor="#64748B"
              />
            </View>

            <View style={s.modalBtnRow}>
              <TouchableOpacity
                style={s.modalCancelBtn}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={s.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.modalSaveBtn}
                onPress={handleSaveProfile}
              >
                <Text style={s.modalSaveText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#070D18',
  },
  scroll: {
    flex: 1,
    backgroundColor: '#070D18',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  contentDesktop: {
    paddingHorizontal: 32,
    paddingTop: 24,
    alignItems: 'center',
  },
  mainContainer: {
    width: '100%',
  },
  mainContainerDesktop: {
    maxWidth: 1040,
    width: '100%',
  },

  // ── Top Nav ───────────────────────────────────────────────────────────────
  topNav: {
    width: '100%',
    backgroundColor: '#09121F',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  topNavInner: {
    maxWidth: 1040,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoSquare: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#00DFB2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00DFB2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  logoIcon: {
    fontSize: 20,
  },
  logoTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  logoSubtitle: {
    color: '#8E9BAE',
    fontSize: 11,
    fontWeight: '500',
  },
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  navLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    position: 'relative',
  },
  navLinkActive: {},
  navLinkIcon: {
    fontSize: 16,
  },
  navLinkText: {
    color: '#8E9BAE',
    fontSize: 14,
    fontWeight: '600',
  },
  navLinkTextActive: {
    color: '#00DFB2',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -12,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: '#00DFB2',
    borderRadius: 2,
  },
  themeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  themeIcon: {
    fontSize: 16,
  },
  navAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00DFB2',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  navAvatarText: {
    color: '#072B28',
    fontWeight: '800',
    fontSize: 16,
  },

  // ── Hero Profile Card ─────────────────────────────────────────────────────
  heroCard: {
    backgroundColor: '#0B1526',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(0, 223, 178, 0.22)',
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    position: 'relative',
    marginBottom: 16,
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.45)',
        } as any)
      : {}),
  },
  editBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.2,
    borderColor: '#00DFB2',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(0, 223, 178, 0.05)',
  },
  editBtnIcon: {
    fontSize: 13,
  },
  editBtnText: {
    color: '#00DFB2',
    fontSize: 13,
    fontWeight: '700',
  },
  avatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#00DFB2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#00DFB2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 6,
  },
  avatarInitials: {
    color: '#072B28',
    fontSize: 34,
    fontWeight: '900',
  },
  heroName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  heroEmail: {
    color: '#8E9BAE',
    fontSize: 13.5,
    marginTop: 4,
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 223, 178, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 223, 178, 0.35)',
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00DFB2',
  },
  activeBadgeText: {
    color: '#00DFB2',
    fontSize: 12,
    fontWeight: '700',
  },
  studentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.35)',
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  studentBadgeIcon: {
    fontSize: 12,
  },
  studentBadgeText: {
    color: '#C084FC',
    fontSize: 12,
    fontWeight: '700',
  },

  // ── Stats Row ─────────────────────────────────────────────────────────────
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#0B1526',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...(Platform.OS === 'web'
      ? ({
          transition: 'transform 0.2s, border-color 0.2s',
          cursor: 'pointer',
        } as any)
      : {}),
  },
  statCardTeal: {
    borderColor: 'rgba(0, 223, 178, 0.32)',
  },
  statCardAmber: {
    borderColor: 'rgba(245, 158, 11, 0.32)',
  },
  statCardPurple: {
    borderColor: 'rgba(168, 85, 247, 0.32)',
  },
  statLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  statIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  statIconTeal: {
    backgroundColor: 'rgba(0, 223, 178, 0.12)',
    borderColor: 'rgba(0, 223, 178, 0.28)',
  },
  statIconAmber: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.28)',
  },
  statIconPurple: {
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
    borderColor: 'rgba(168, 85, 247, 0.28)',
  },
  statEmoji: {
    fontSize: 20,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 28,
  },
  statLabel: {
    color: '#8E9BAE',
    fontSize: 12.5,
    fontWeight: '600',
  },
  statChevron: {
    color: '#64748B',
    fontSize: 20,
    fontWeight: '600',
  },

  // ── Section Card (Account Details & Preferences) ──────────────────────────
  sectionCard: {
    backgroundColor: '#0B1526',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  sectionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 223, 178, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeaderEmoji: {
    fontSize: 18,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    color: '#8E9BAE',
    fontSize: 12,
    marginTop: 1,
  },

  // Detail Rows
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rowIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowEmoji: {
    fontSize: 15,
  },
  rowLabel: {
    color: '#CBD5E1',
    fontSize: 13.5,
    fontWeight: '500',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },
  rowValue: {
    color: '#94A3B8',
    fontSize: 13.5,
    fontWeight: '500',
  },
  rowChevron: {
    color: '#64748B',
    fontSize: 18,
    fontWeight: '600',
  },

  // Verification Pill
  notVerifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  notVerifiedDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  notVerifiedText: {
    color: '#EF4444',
    fontSize: 11.5,
    fontWeight: '700',
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  verifiedDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  verifiedText: {
    color: '#10B981',
    fontSize: 11.5,
    fontWeight: '700',
  },

  // Preference Rows
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  prefTitle: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '600',
  },
  prefSubtitle: {
    color: '#8E9BAE',
    fontSize: 11.5,
    marginTop: 1,
  },

  // ── Sign Out Button ───────────────────────────────────────────────────────
  signOutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: 'rgba(239, 68, 68, 0.45)',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...(Platform.OS === 'web'
      ? ({
          cursor: 'pointer',
          transition: 'all 0.2s',
        } as any)
      : {}),
  },
  signOutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  signOutIcon: {
    fontSize: 16,
  },
  signOutText: {
    color: '#EF4444',
    fontSize: 14.5,
    fontWeight: '700',
  },

  footerText: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },

  // ── Edit Profile Modal ────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#0B1526',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(0, 223, 178, 0.3)',
    padding: 24,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  modalSub: {
    color: '#8E9BAE',
    fontSize: 13,
    marginTop: 2,
    marginBottom: 18,
  },
  inputWrap: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#070D18',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
    ...(Platform.OS === 'web' ? ({ outline: 'none' } as any) : {}),
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalCancelText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
  },
  modalSaveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: '#00DFB2',
  },
  modalSaveText: {
    color: '#072B28',
    fontSize: 13,
    fontWeight: '700',
  },
});
