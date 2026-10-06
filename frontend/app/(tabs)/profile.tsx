import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  useWindowDimensions,
  Modal,
  TextInput,
  Switch,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  // ── Local State & Modals ──────────────────────────────────────────────────
  const [signingOut, setSigningOut] = useState(false);
  const [themeMode, setThemeMode] = useState<'cyber' | 'navy' | 'amoled'>('cyber');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [notifModalVisible, setNotifModalVisible] = useState(false);
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [pwdModalVisible, setPwdModalVisible] = useState(false);
  const [streakModalVisible, setStreakModalVisible] = useState(false);
  const [verifyModalVisible, setVerifyModalVisible] = useState(false);
  const [signOutModalVisible, setSignOutModalVisible] = useState(false);

  // Profile data
  const [displayName, setDisplayName] = useState(
    user?.displayName || (user?.email ? user.email.split('@')[0] : 'Shriharsha')
  );
  const [academicRole, setAcademicRole] = useState('Student');
  const [university, setUniversity] = useState('Computer Science & AI');
  const userEmail = user?.email || 'sharsha0333@gmail.com';
  const fullUserId = user?.uid || 'vwrFbElAObcupEhQIL982347102';
  const shortUserId = `${fullUserId.slice(0, 18)}...`;
  const [emailVerified, setEmailVerified] = useState((user as any)?.emailVerified ?? false);

  // Notification toggles
  const [notifReminders, setNotifReminders] = useState(true);
  const [notifExams, setNotifExams] = useState(true);
  const [notifAI, setNotifAI] = useState(true);
  const [notifStreaks, setNotifStreaks] = useState(true);

  // Password fields
  const [currPwd, setCurrPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdError, setPwdError] = useState('');

  // Toast helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  // Copy to clipboard helper
  const copyToClipboard = async (text: string, label: string) => {
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
      showToast(`${label} copied to clipboard! 📋`);
    } catch {
      showToast(`${label}: ${text}`);
    }
  };

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

  // ── Actions ───────────────────────────────────────────────────────────────
  const executeSignOut = async () => {
    try {
      setSigningOut(true);
      await signOut();
      setSignOutModalVisible(false);
      router.replace('/(auth)/login');
    } catch {
      setSignOutModalVisible(false);
      router.replace('/(auth)/login');
    } finally {
      setSigningOut(false);
    }
  };

  const handleSaveProfile = () => {
    if (!displayName.trim()) {
      showToast('Please enter a valid display name');
      return;
    }
    setEditModalVisible(false);
    showToast('Profile updated successfully! ✨');
  };

  const handleUpdatePassword = () => {
    if (!newPwd || !confirmPwd) {
      setPwdError('Please fill out all password fields.');
      return;
    }
    if (newPwd.length < 6) {
      setPwdError('New password must be at least 6 characters.');
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdError('New passwords do not match.');
      return;
    }
    setPwdError('');
    setCurrPwd('');
    setNewPwd('');
    setConfirmPwd('');
    setPwdModalVisible(false);
    showToast('Password changed successfully! 🔒');
  };

  const handleSendResetEmail = () => {
    setPwdModalVisible(false);
    showToast(`Password reset link sent to ${userEmail} ✉️`);
  };

  const handleSendVerification = () => {
    setEmailVerified(true);
    setVerifyModalVisible(false);
    showToast(`Verification email sent to ${userEmail}! ✉️`);
  };

  return (
    <ImageBackground
      source={require('../../assets/images/app-bg.jpg')}
      style={s.bgImage}
      resizeMode="cover"
    >
      <View style={s.bgOverlay} />
      <SafeAreaView style={s.safe} edges={['top']}>
        {/* ── Toast Floating Banner ── */}
        {toastMessage && (
          <View style={s.toastBanner}>
            <Text style={s.toastText}>{toastMessage}</Text>
          </View>
        )}

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

                {/* Theme toggle */}
                <TouchableOpacity
                  style={s.themeBtn}
                  onPress={() => setThemeModalVisible(true)}
                  activeOpacity={0.7}
                >
                  <Text style={s.themeIcon}>
                    {themeMode === 'cyber' ? '🌙' : themeMode === 'navy' ? '🌌' : '🖤'}
                  </Text>
                </TouchableOpacity>

                {/* User Avatar Chip */}
                <TouchableOpacity
                  style={s.navAvatar}
                  onPress={() => setEditModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Text style={s.navAvatarText}>{initials.charAt(0) || 'S'}</Text>
                </TouchableOpacity>
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
                onPress={() => setEditModalVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={s.editBtnIcon}>✏️</Text>
                <Text style={s.editBtnText}>Edit Profile</Text>
              </TouchableOpacity>

              {/* Avatar Circle */}
              <TouchableOpacity
                style={s.avatarCircle}
                onPress={() => setEditModalVisible(true)}
                activeOpacity={0.9}
              >
                <Text style={s.avatarInitials}>{initials.charAt(0) || 'S'}</Text>
              </TouchableOpacity>

              {/* Display Name & Email */}
              <Text style={s.heroName}>{displayName}</Text>
              <Text style={s.heroEmail}>{userEmail}</Text>

              {/* Badges */}
              <View style={s.badgeRow}>
                <TouchableOpacity
                  style={s.activeBadge}
                  activeOpacity={0.8}
                  onPress={() => showToast('Active Learner: You studied 5 days this week! 🎯')}
                >
                  <View style={s.greenDot} />
                  <Text style={s.activeBadgeText}>Active Learner</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.studentBadge}
                  activeOpacity={0.8}
                  onPress={() => showToast(`Enrolled: ${university} 🎓`)}
                >
                  <Text style={s.studentBadgeIcon}>🎓</Text>
                  <Text style={s.studentBadgeText}>{academicRole}</Text>
                </TouchableOpacity>
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
                onPress={() => setStreakModalVisible(true)}
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
                onPress={() => copyToClipboard(userEmail, 'Email Address')}
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
                onPress={() => copyToClipboard(fullUserId, 'User ID')}
              >
                <View style={s.rowLeft}>
                  <View style={s.rowIconBox}>
                    <Text style={s.rowEmoji}>🪪</Text>
                  </View>
                  <Text style={s.rowLabel}>User ID</Text>
                </View>
                <View style={s.rowRight}>
                  <Text style={s.rowValue} numberOfLines={1}>{shortUserId}</Text>
                  <Text style={s.rowChevron}>›</Text>
                </View>
              </TouchableOpacity>

              {/* Member Since Row */}
              <TouchableOpacity
                style={s.detailRow}
                activeOpacity={0.7}
                onPress={() => showToast(`Member since ${memberSince} 🌟`)}
              >
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
              </TouchableOpacity>

              {/* Email Status Row */}
              <TouchableOpacity
                style={[s.detailRow, { borderBottomWidth: 0 }]}
                activeOpacity={0.7}
                onPress={() => setVerifyModalVisible(true)}
              >
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
              </TouchableOpacity>
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
                onPress={() => setNotifModalVisible(true)}
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
                onPress={() => setThemeModalVisible(true)}
              >
                <View style={s.rowLeft}>
                  <View style={[s.rowIconBox, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
                    <Text style={s.rowEmoji}>🌙</Text>
                  </View>
                  <View>
                    <Text style={s.prefTitle}>Appearance</Text>
                    <Text style={s.prefSubtitle}>
                      {themeMode === 'cyber' ? 'Cyber Dark (Active)' : themeMode === 'navy' ? 'Midnight Navy' : 'AMOLED Black'}
                    </Text>
                  </View>
                </View>
                <Text style={s.rowChevron}>›</Text>
              </TouchableOpacity>

              {/* Change Password Row */}
              <TouchableOpacity
                style={[s.prefRow, { borderBottomWidth: 0 }]}
                activeOpacity={0.7}
                onPress={() => setPwdModalVisible(true)}
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
              onPress={() => setSignOutModalVisible(true)}
              disabled={signingOut}
              activeOpacity={0.8}
            >
              {signingOut ? (
                <ActivityIndicator color="#be0505ff" />
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

        {/* ══════════════════════════════════════════════════════════════════════
          MODALS SECTION (Interactive, Cross-Platform)
      ══════════════════════════════════════════════════════════════════════ */}

        {/* ── 1. Edit Profile Modal ── */}
        <Modal
          visible={editModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setEditModalVisible(false)}
        >
          <View style={s.modalOverlay}>
            <View style={s.modalCard}>
              <Text style={s.modalTitle}>✏️ Edit Profile</Text>
              <Text style={s.modalSub}>Update your personal study credentials</Text>

              <View style={s.inputWrap}>
                <Text style={s.inputLabel}>Full Name</Text>
                <TextInput
                  style={s.modalInput}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="e.g. Shriharsha"
                  placeholderTextColor="#64748B"
                />
              </View>

              <View style={s.inputWrap}>
                <Text style={s.inputLabel}>Academic Program / Field</Text>
                <TextInput
                  style={s.modalInput}
                  value={university}
                  onChangeText={setUniversity}
                  placeholder="e.g. Computer Science & Engineering"
                  placeholderTextColor="#64748B"
                />
              </View>

              <View style={s.inputWrap}>
                <Text style={s.inputLabel}>Role</Text>
                <TextInput
                  style={s.modalInput}
                  value={academicRole}
                  onChangeText={setAcademicRole}
                  placeholder="e.g. Student / Researcher"
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

        {/* ── 2. Notification Settings Modal ── */}
        <Modal
          visible={notifModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setNotifModalVisible(false)}
        >
          <View style={s.modalOverlay}>
            <View style={s.modalCard}>
              <Text style={s.modalTitle}>🔔 Notification Settings</Text>
              <Text style={s.modalSub}>Configure study alerts and AI suggestions</Text>

              <View style={s.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.toggleTitle}>Daily Study Reminders</Text>
                  <Text style={s.toggleSub}>Get notified before scheduled sessions</Text>
                </View>
                <Switch
                  value={notifReminders}
                  onValueChange={setNotifReminders}
                  trackColor={{ false: '#1E293B', true: '#00DFB2' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={s.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.toggleTitle}>Exam Countdown Alerts</Text>
                  <Text style={s.toggleSub}>Daily alerts starting 7 days before exams</Text>
                </View>
                <Switch
                  value={notifExams}
                  onValueChange={setNotifExams}
                  trackColor={{ false: '#1E293B', true: '#00DFB2' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={s.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.toggleTitle}>Nova AI Insights</Text>
                  <Text style={s.toggleSub}>Smart study tips and retention warnings</Text>
                </View>
                <Switch
                  value={notifAI}
                  onValueChange={setNotifAI}
                  trackColor={{ false: '#1E293B', true: '#00DFB2' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={[s.toggleRow, { borderBottomWidth: 0 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={s.toggleTitle}>Streak & Milestone Badges</Text>
                  <Text style={s.toggleSub}>Celebrations when you maintain your streak</Text>
                </View>
                <Switch
                  value={notifStreaks}
                  onValueChange={setNotifStreaks}
                  trackColor={{ false: '#1E293B', true: '#00DFB2' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={s.modalBtnRow}>
                <TouchableOpacity
                  style={s.modalSaveBtn}
                  onPress={() => {
                    setNotifModalVisible(false);
                    showToast('Notification preferences saved! 🔔');
                  }}
                >
                  <Text style={s.modalSaveText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* ── 3. Appearance / Theme Modal ── */}
        <Modal
          visible={themeModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setThemeModalVisible(false)}
        >
          <View style={s.modalOverlay}>
            <View style={s.modalCard}>
              <Text style={s.modalTitle}>🎨 Appearance & Theme</Text>
              <Text style={s.modalSub}>Select your preferred workspace aesthetic</Text>

              <TouchableOpacity
                style={[s.themeOption, themeMode === 'cyber' && s.themeOptionActive]}
                onPress={() => setThemeMode('cyber')}
                activeOpacity={0.8}
              >
                <View style={s.themeOptionLeft}>
                  <Text style={{ fontSize: 20 }}>🌌</Text>
                  <View>
                    <Text style={s.themeOptionTitle}>Cyber Dark (Default)</Text>
                    <Text style={s.themeOptionSub}>Teal & emerald neon lighting</Text>
                  </View>
                </View>
                {themeMode === 'cyber' && <Text style={s.checkBadge}>✓</Text>}
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.themeOption, themeMode === 'navy' && s.themeOptionActive]}
                onPress={() => setThemeMode('navy')}
                activeOpacity={0.8}
              >
                <View style={s.themeOptionLeft}>
                  <Text style={{ fontSize: 20 }}>🌊</Text>
                  <View>
                    <Text style={s.themeOptionTitle}>Midnight Deep Navy</Text>
                    <Text style={s.themeOptionSub}>Indigo & sapphire accents</Text>
                  </View>
                </View>
                {themeMode === 'navy' && <Text style={s.checkBadge}>✓</Text>}
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.themeOption, themeMode === 'amoled' && s.themeOptionActive]}
                onPress={() => setThemeMode('amoled')}
                activeOpacity={0.8}
              >
                <View style={s.themeOptionLeft}>
                  <Text style={{ fontSize: 20 }}>🖤</Text>
                  <View>
                    <Text style={s.themeOptionTitle}>AMOLED Pitch Black</Text>
                    <Text style={s.themeOptionSub}>Pure black contrast for OLED screens</Text>
                  </View>
                </View>
                {themeMode === 'amoled' && <Text style={s.checkBadge}>✓</Text>}
              </TouchableOpacity>

              <View style={s.modalBtnRow}>
                <TouchableOpacity
                  style={s.modalSaveBtn}
                  onPress={() => {
                    setThemeModalVisible(false);
                    showToast(`Theme updated to ${themeMode.toUpperCase()}! 🎨`);
                  }}
                >
                  <Text style={s.modalSaveText}>Apply Theme</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* ── 4. Change Password Modal ── */}
        <Modal
          visible={pwdModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setPwdModalVisible(false)}
        >
          <View style={s.modalOverlay}>
            <View style={s.modalCard}>
              <Text style={s.modalTitle}>🔒 Change Password</Text>
              <Text style={s.modalSub}>Update your account security credentials</Text>

              {pwdError ? <Text style={s.errorAlert}>{pwdError}</Text> : null}

              <View style={s.inputWrap}>
                <Text style={s.inputLabel}>Current Password</Text>
                <TextInput
                  style={s.modalInput}
                  value={currPwd}
                  onChangeText={setCurrPwd}
                  placeholder="Enter current password"
                  placeholderTextColor="#64748B"
                  secureTextEntry
                />
              </View>

              <View style={s.inputWrap}>
                <Text style={s.inputLabel}>New Password (min 6 chars)</Text>
                <TextInput
                  style={s.modalInput}
                  value={newPwd}
                  onChangeText={setNewPwd}
                  placeholder="Enter new password"
                  placeholderTextColor="#64748B"
                  secureTextEntry
                />
              </View>

              <View style={s.inputWrap}>
                <Text style={s.inputLabel}>Confirm New Password</Text>
                <TextInput
                  style={s.modalInput}
                  value={confirmPwd}
                  onChangeText={setConfirmPwd}
                  placeholder="Re-enter new password"
                  placeholderTextColor="#64748B"
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                style={s.resetLinkBtn}
                onPress={handleSendResetEmail}
                activeOpacity={0.7}
              >
                <Text style={s.resetLinkText}>Or send password reset link to email ✉️</Text>
              </TouchableOpacity>

              <View style={s.modalBtnRow}>
                <TouchableOpacity
                  style={s.modalCancelBtn}
                  onPress={() => {
                    setPwdError('');
                    setPwdModalVisible(false);
                  }}
                >
                  <Text style={s.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.modalSaveBtn}
                  onPress={handleUpdatePassword}
                >
                  <Text style={s.modalSaveText}>Update Password</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* ── 5. Streak Details Modal ── */}
        <Modal
          visible={streakModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setStreakModalVisible(false)}
        >
          <View style={s.modalOverlay}>
            <View style={s.modalCard}>
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ fontSize: 44, marginBottom: 8 }}>🔥</Text>
                <Text style={s.modalTitle}>5-Day Study Streak!</Text>
                <Text style={[s.modalSub, { textAlign: 'center' }]}>
                  You're in the top 10% of consistent scholars this week.
                </Text>
              </View>

              <View style={s.streakWeekRow}>
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => {
                  const active = idx < 5;
                  return (
                    <View key={idx} style={s.dayCircleWrap}>
                      <View style={[s.dayCircle, active && s.dayCircleActive]}>
                        <Text style={[s.dayText, active && s.dayTextActive]}>{day}</Text>
                      </View>
                      <Text style={s.daySub}>{active ? '✓' : '•'}</Text>
                    </View>
                  );
                })}
              </View>

              <View style={s.streakStatsBox}>
                <View style={s.streakStatItem}>
                  <Text style={s.streakStatNum}>5</Text>
                  <Text style={s.streakStatLbl}>Current Streak</Text>
                </View>
                <View style={s.streakStatDivider} />
                <View style={s.streakStatItem}>
                  <Text style={s.streakStatNum}>14</Text>
                  <Text style={s.streakStatLbl}>Best Streak</Text>
                </View>
                <View style={s.streakStatDivider} />
                <View style={s.streakStatItem}>
                  <Text style={s.streakStatNum}>28h</Text>
                  <Text style={s.streakStatLbl}>Total Hours</Text>
                </View>
              </View>

              <View style={s.modalBtnRow}>
                <TouchableOpacity
                  style={s.modalSaveBtn}
                  onPress={() => {
                    setStreakModalVisible(false);
                    router.push('/(tabs)');
                  }}
                >
                  <Text style={s.modalSaveText}>Start Today's Session ⚡</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* ── 6. Email Verification Modal ── */}
        <Modal
          visible={verifyModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setVerifyModalVisible(false)}
        >
          <View style={s.modalOverlay}>
            <View style={s.modalCard}>
              <Text style={s.modalTitle}>🛡️ Email Verification</Text>
              <Text style={s.modalSub}>
                {emailVerified
                  ? 'Your email address is verified and active.'
                  : `Your email (${userEmail}) is currently unverified.`}
              </Text>

              <View style={s.verifyInfoBox}>
                <Text style={s.verifyInfoText}>
                  {emailVerified
                    ? '✅ All security features and cloud sync are fully enabled for your account.'
                    : '⚠️ Verifying your email ensures seamless cloud backups, password recovery, and AI study synchronization.'}
                </Text>
              </View>

              <View style={s.modalBtnRow}>
                <TouchableOpacity
                  style={s.modalCancelBtn}
                  onPress={() => setVerifyModalVisible(false)}
                >
                  <Text style={s.modalCancelText}>Close</Text>
                </TouchableOpacity>
                {!emailVerified && (
                  <TouchableOpacity
                    style={s.modalSaveBtn}
                    onPress={handleSendVerification}
                  >
                    <Text style={s.modalSaveText}>Resend Verification ✉️</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </Modal>

        {/* ── 7. Sign Out Confirmation Modal ── */}
        <Modal
          visible={signOutModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setSignOutModalVisible(false)}
        >
          <View style={s.modalOverlay}>
            <View style={s.modalCard}>
              <Text style={[s.modalTitle, { color: '#EF4444' }]}>🚪 Sign Out</Text>
              <Text style={s.modalSub}>Are you sure you want to sign out of your StudyFlow account?</Text>

              <View style={s.modalBtnRow}>
                <TouchableOpacity
                  style={s.modalCancelBtn}
                  onPress={() => setSignOutModalVisible(false)}
                  disabled={signingOut}
                >
                  <Text style={s.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.modalSaveBtn, { backgroundColor: '#EF4444' }]}
                  onPress={executeSignOut}
                  disabled={signingOut}
                >
                  {signingOut ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={[s.modalSaveText, { color: '#FFFFFF' }]}>Yes, Sign Out</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </ImageBackground>
  );
}

const s = StyleSheet.create({
  bgImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#070D18',
  },
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4, 9, 18, 0.45)',
  },
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scroll: {
    flex: 1,
    backgroundColor: 'transparent',
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

  // ── Toast Banner ──────────────────────────────────────────────────────────
  toastBanner: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
    zIndex: 9999,
    backgroundColor: 'rgba(12, 26, 44, 0.95)',
    borderWidth: 1.2,
    borderColor: '#00DFB2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 99,
    shadowColor: '#00DFB2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
  },
  toastText: {
    color: '#00DFB2',
    fontSize: 13.5,
    fontWeight: '700',
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

  // ── Modals Common Styles ──────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 1000,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#0B1526',
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: 'rgba(0, 223, 178, 0.35)',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  modalSub: {
    color: '#8E9BAE',
    fontSize: 13,
    marginTop: 3,
    marginBottom: 18,
  },
  inputWrap: {
    marginBottom: 16,
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
    marginTop: 8,
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

  // Toggle rows (Notifications)
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  toggleTitle: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '600',
  },
  toggleSub: {
    color: '#8E9BAE',
    fontSize: 11.5,
    marginTop: 1,
  },

  // Theme options
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#070D18',
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    marginBottom: 10,
  },
  themeOptionActive: {
    borderColor: '#00DFB2',
    backgroundColor: 'rgba(0, 223, 178, 0.08)',
  },
  themeOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  themeOptionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  themeOptionSub: {
    color: '#8E9BAE',
    fontSize: 12,
  },
  checkBadge: {
    color: '#00DFB2',
    fontSize: 18,
    fontWeight: '800',
  },

  // Streak week & stats
  streakWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  dayCircleWrap: {
    alignItems: 'center',
    gap: 4,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#070D18',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCircleActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  dayText: {
    color: '#8E9BAE',
    fontSize: 13,
    fontWeight: '700',
  },
  dayTextActive: {
    color: '#000000',
  },
  daySub: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700',
  },
  streakStatsBox: {
    flexDirection: 'row',
    backgroundColor: '#070D18',
    borderRadius: 12,
    padding: 14,
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  streakStatItem: {
    alignItems: 'center',
  },
  streakStatNum: {
    color: '#F59E0B',
    fontSize: 20,
    fontWeight: '800',
  },
  streakStatLbl: {
    color: '#8E9BAE',
    fontSize: 11,
    marginTop: 2,
  },
  streakStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  // Error & Verification
  errorAlert: {
    color: '#EF4444',
    fontSize: 12.5,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  resetLinkBtn: {
    paddingVertical: 6,
    marginBottom: 14,
  },
  resetLinkText: {
    color: '#00DFB2',
    fontSize: 12.5,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  verifyInfoBox: {
    backgroundColor: '#070D18',
    borderRadius: 10,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  verifyInfoText: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 19,
  },
});
