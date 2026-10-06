import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Text,
  ImageBackground,
  useWindowDimensions,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { ProgressService } from '../../services/progress';
import { OverallProgress } from '../../types/progress';

// ── Mini Helpers ─────────────────────────────────────────────────────────────
function ProgressBar({ pct, color }: { pct: number; color?: string }) {
  const fillPct = Math.min(Math.max(pct, 0), 100);
  return (
    <View style={pb.track}>
      <View style={[pb.fill, { width: `${fillPct}%` as any, backgroundColor: color || '#00DFB2' }]} />
    </View>
  );
}
const pb = StyleSheet.create({
  track: { height: 6, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 99, overflow: 'hidden', width: '100%' },
  fill: { height: '100%', borderRadius: 99 },
});

function Badge({
  label,
  color,
  bg,
  borderColor,
}: {
  label: string;
  color: string;
  bg: string;
  borderColor?: string;
}) {
  return (
    <View style={[badgeStyles.wrap, { backgroundColor: bg, borderColor: borderColor || 'transparent' }]}>
      <Text style={[badgeStyles.text, { color }]}>{label}</Text>
    </View>
  );
}
const badgeStyles = StyleSheet.create({
  wrap: {
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },
});

// ── Mock & Live Data ─────────────────────────────────────────────────────────
interface StudyDayData {
  day: string;
  dateStr: string;
  hours: number;
  goalHours: number;
  topicsDone: number;
  score: number;
}

const WEEKLY_STUDY_HOURS: StudyDayData[] = [
  { day: 'Mon', dateStr: 'Oct 06', hours: 3.5, goalHours: 4.0, topicsDone: 4, score: 92 },
  { day: 'Tue', dateStr: 'Oct 07', hours: 4.8, goalHours: 4.0, topicsDone: 5, score: 95 },
  { day: 'Wed', dateStr: 'Oct 08', hours: 5.2, goalHours: 4.5, topicsDone: 6, score: 98 },
  { day: 'Thu', dateStr: 'Oct 09', hours: 4.0, goalHours: 4.0, topicsDone: 4, score: 90 },
  { day: 'Fri', dateStr: 'Oct 10', hours: 6.5, goalHours: 4.5, topicsDone: 8, score: 99 },
  { day: 'Sat', dateStr: 'Oct 11', hours: 2.5, goalHours: 3.0, topicsDone: 3, score: 88 },
  { day: 'Sun', dateStr: 'Oct 12', hours: 4.5, goalHours: 4.0, topicsDone: 5, score: 94 },
];

const SUBJECT_MASTERY = [
  {
    name: 'Data Structures & Algorithms',
    code: 'CS301',
    progress: 88,
    completedTopics: 44,
    totalTopics: 50,
    retention: 94,
    grade: 'A+',
    color: '#00DFB2',
  },
  {
    name: 'Database Management Systems',
    code: 'CS304',
    progress: 76,
    completedTopics: 38,
    totalTopics: 50,
    retention: 88,
    grade: 'A',
    color: '#60A5FA',
  },
  {
    name: 'Computer Networks',
    code: 'CS306',
    progress: 92,
    completedTopics: 46,
    totalTopics: 50,
    retention: 96,
    grade: 'A+',
    color: '#A855F7',
  },
  {
    name: 'Software Engineering & CI/CD',
    code: 'CS310',
    progress: 84,
    completedTopics: 42,
    totalTopics: 50,
    retention: 90,
    grade: 'A',
    color: '#F59E0B',
  },
  {
    name: 'Operating Systems',
    code: 'CS308',
    progress: 68,
    completedTopics: 34,
    totalTopics: 50,
    retention: 82,
    grade: 'B+',
    color: '#EC4899',
  },
];

const LEADERBOARD_PEERS = [
  { rank: 1, name: 'Sarah K.', avatar: 'S', hours: 38.5, level: 9, xp: 4200, streak: 12, isUser: false },
  { rank: 2, name: 'Alex Rivera', avatar: 'A', hours: 34.2, level: 8, xp: 3890, streak: 9, isUser: false },
  { rank: 3, name: 'You (Harsha)', avatar: 'H', hours: 31.0, level: 8, xp: 3450, streak: 7, isUser: true },
  { rank: 4, name: 'Maya Chen', avatar: 'M', hours: 29.5, level: 7, xp: 3120, streak: 6, isUser: false },
  { rank: 5, name: 'Liam Vance', avatar: 'L', hours: 27.0, level: 7, xp: 2980, streak: 5, isUser: false },
];

const ACHIEVEMENTS = [
  { id: '1', title: '7-Day Streak Master', icon: '🔥', desc: 'Maintained 7 consecutive study sessions', unlocked: true, xp: '+250 XP' },
  { id: '2', title: 'Algorithm Prodigy', icon: '⚡', desc: 'Completed 40+ DSA problems with 90%+ retention', unlocked: true, xp: '+400 XP' },
  { id: '3', title: 'DocuQuery RAG Master', icon: '📑', desc: 'Synthesized 20+ study guides & notes', unlocked: true, xp: '+300 XP' },
  { id: '4', title: 'Night Owl Marathon', icon: '🦉', desc: 'Logged 10+ late evening focus blocks', unlocked: true, xp: '+200 XP' },
];

export default function ProgressScreen() {
  const [progressData, setProgressData] = useState<OverallProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDayIdx, setSelectedDayIdx] = useState(4); // Friday selected by default
  const [timeframe, setTimeframe] = useState<'week' | 'month'>('week');
  const [leaderboardTab, setLeaderboardTab] = useState<'study_hours' | 'xp'>('study_hours');

  const { user } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  const firstName = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'Harsha';

  const loadProgress = async () => {
    try {
      setLoading(true);
      const data = await ProgressService.getOverallProgress();
      setProgressData(data);
    } catch {
      // Keep rich mock defaults
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProgress();
  }, []);

  const selectedDay = WEEKLY_STUDY_HOURS[selectedDayIdx];
  const maxHours = Math.max(...WEEKLY_STUDY_HOURS.map((d) => d.hours), 7);

  return (
    <ImageBackground
      source={require('../../assets/images/calendar-bg.jpg')}
      style={styles.bgImage}
      resizeMode="cover"
    >
      <View style={styles.bgOverlay} />
      <SafeAreaView style={styles.safeArea} edges={isDesktop ? ['top'] : []}>
        <StatusBar barStyle="light-content" backgroundColor="#070D18" />

        <View style={styles.pageWrapper}>
          {/* ── Left Sidebar (Desktop) ── */}
          {isDesktop && (
            <View style={styles.sidebar}>
              <TouchableOpacity
                style={styles.sidebarLogo}
                onPress={() => router.push('/(tabs)')}
                activeOpacity={0.8}
              >
                <View style={styles.logoSquare}>
                  <Text style={styles.logoIcon}>📖</Text>
                </View>
                <View>
                  <Text style={styles.logoTitle}>StudyFlow</Text>
                  <Text style={styles.logoSubtitle}>AI-Powered Learning</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.navMenu}>
                <TouchableOpacity
                  style={styles.navItem}
                  onPress={() => router.push('/(tabs)')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.navIcon}>🏠</Text>
                  <Text style={styles.navLabel}>Today</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.navItem}
                  onPress={() => router.push('/(tabs)/subjects')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.navIcon}>📚</Text>
                  <Text style={styles.navLabel}>Subjects</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.navItem}
                  onPress={() => router.push('/(tabs)/planner')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.navIcon}>⚡</Text>
                  <Text style={styles.navLabel}>Planner</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.navItem}
                  onPress={() => router.push('/(tabs)/docuquery')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.navIcon}>📑</Text>
                  <Text style={styles.navLabel}>DocuQuery AI</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.navItem}
                  onPress={() => router.push('/(tabs)/calendar')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.navIcon}>📅</Text>
                  <Text style={styles.navLabel}>Calendar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.navItem, styles.navItemActive]}
                  activeOpacity={0.9}
                >
                  <Text style={[styles.navIcon, styles.navIconActive]}>📊</Text>
                  <Text style={[styles.navLabel, styles.navLabelActive]}>Progress</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.navItem}
                  onPress={() => router.push('/(tabs)/profile')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.navIcon}>👤</Text>
                  <Text style={styles.navLabel}>Profile</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── Content ScrollView ── */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.container, isDesktop && styles.desktopContainer]}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={loadProgress} tintColor="#00DFB2" />}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.innerWrapper, !isDesktop && styles.mobileInner]}>
              
              {/* ── 1. Header with Level & XP Badge ── */}
              <View style={styles.headerRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>Progress & Analytics</Text>
                  <Text style={styles.subtitle}>
                    Track your study hours, subject mastery & gamified XP
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.profileBadge}
                  onPress={() => router.push('/(tabs)/profile')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.profileBadgeText}>Lv. 8</Text>
                  <View style={styles.profileAvatar}>
                    <Text style={styles.avatarLetter}>{firstName.charAt(0).toUpperCase()}</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* ── 2. Level Progress & Streak Banner ── */}
              <View style={styles.levelCard}>
                <View style={styles.levelTop}>
                  <View style={styles.levelInfo}>
                    <View style={styles.levelTag}>
                      <Text style={styles.levelTagText}>⚡ LEVEL 8</Text>
                    </View>
                    <Text style={styles.levelTitle}>Neural Scholar</Text>
                  </View>
                  <View style={styles.streakWrap}>
                    <Text style={styles.streakIcon}>🔥</Text>
                    <Text style={styles.streakText}>7 Days Streak</Text>
                  </View>
                </View>

                <View style={styles.xpRow}>
                  <Text style={styles.xpLabel}>
                    <Text style={{ color: '#00DFB2', fontWeight: '800' }}>3,450 XP</Text> / 4,000 XP
                  </Text>
                  <Text style={styles.xpRemaining}>550 XP to Level 9</Text>
                </View>
                <ProgressBar pct={86.2} color="#00DFB2" />
              </View>

              {/* ── 3. High-Level Performance Metrics Row ── */}
              <View style={styles.metricsGrid}>
                <View style={[styles.metricCard, { borderColor: 'rgba(0, 223, 178, 0.3)' }]}>
                  <Text style={styles.metricEmoji}>⏱️</Text>
                  <Text style={[styles.metricValue, { color: '#00DFB2' }]}>31.0h</Text>
                  <Text style={styles.metricLabel}>Study Time</Text>
                  <Text style={styles.metricSub}>+4.2h vs last wk</Text>
                </View>

                <View style={[styles.metricCard, { borderColor: 'rgba(96, 165, 250, 0.3)' }]}>
                  <Text style={styles.metricEmoji}>🎯</Text>
                  <Text style={[styles.metricValue, { color: '#60A5FA' }]}>108%</Text>
                  <Text style={styles.metricLabel}>Goal Pace</Text>
                  <Text style={styles.metricSub}>Above target</Text>
                </View>

                <View style={[styles.metricCard, { borderColor: 'rgba(168, 85, 247, 0.3)' }]}>
                  <Text style={styles.metricEmoji}>📝</Text>
                  <Text style={[styles.metricValue, { color: '#A855F7' }]}>94.2%</Text>
                  <Text style={styles.metricLabel}>Assignment Avg</Text>
                  <Text style={styles.metricSub}>14/15 on time</Text>
                </View>
              </View>

              {/* ── 4. Study Hours Interactive Graph (User Progress Line/Bar Chart) ── */}
              <View style={styles.cardSection}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.cardTitle}>Study Hours Trend</Text>
                    <Text style={styles.cardSub}>Daily study time vs 4.0h target benchmark</Text>
                  </View>
                  <View style={styles.timeframeToggle}>
                    <TouchableOpacity
                      style={[styles.toggleBtn, timeframe === 'week' && styles.toggleBtnActive]}
                      onPress={() => setTimeframe('week')}
                    >
                      <Text style={[styles.toggleText, timeframe === 'week' && styles.toggleTextActive]}>Weekly</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.toggleBtn, timeframe === 'month' && styles.toggleBtnActive]}
                      onPress={() => setTimeframe('month')}
                    >
                      <Text style={[styles.toggleText, timeframe === 'month' && styles.toggleTextActive]}>Monthly</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Graph Visual Bars */}
                <View style={styles.chartContainer}>
                  {/* Dashed Benchmark Line */}
                  <View style={styles.benchmarkLine}>
                    <Text style={styles.benchmarkText}>Target 4.0h</Text>
                    <View style={styles.dashedLine} />
                  </View>

                  <View style={styles.barsRow}>
                    {WEEKLY_STUDY_HOURS.map((item, idx) => {
                      const isSelected = idx === selectedDayIdx;
                      const heightPct = Math.round((item.hours / maxHours) * 100);
                      const isAboveGoal = item.hours >= item.goalHours;

                      return (
                        <TouchableOpacity
                          key={item.day}
                          style={styles.barCol}
                          onPress={() => setSelectedDayIdx(idx)}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.barHoursText, isSelected && { color: '#00DFB2', fontWeight: '800' }]}>
                            {item.hours}h
                          </Text>
                          <View style={styles.barTrack}>
                            <View
                              style={[
                                styles.barFill,
                                { height: `${heightPct}%` },
                                isSelected ? styles.barFillSelected : isAboveGoal ? styles.barFillAbove : styles.barFillNormal,
                              ]}
                            />
                          </View>
                          <Text style={[styles.barDayLabel, isSelected && styles.barDayLabelActive]}>
                            {item.day}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Selected Day Inspector Callout */}
                {selectedDay && (
                  <View style={styles.inspectCard}>
                    <View style={styles.inspectLeft}>
                      <Text style={styles.inspectDate}>{selectedDay.dateStr} ({selectedDay.day})</Text>
                      <Text style={styles.inspectDetail}>
                        {selectedDay.hours} hours studied • {selectedDay.topicsDone} topics completed
                      </Text>
                    </View>
                    <Badge
                      label={selectedDay.hours >= selectedDay.goalHours ? 'Goal Achieved 🌟' : 'In Progress ⏳'}
                      color={selectedDay.hours >= selectedDay.goalHours ? '#00DFB2' : '#F59E0B'}
                      bg={selectedDay.hours >= selectedDay.goalHours ? 'rgba(0, 223, 178, 0.15)' : 'rgba(245, 158, 11, 0.15)'}
                    />
                  </View>
                )}
              </View>

              {/* ── 5. Subject Mastery Breakdown ── */}
              <View style={styles.cardSection}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.cardTitle}>Subject Mastery</Text>
                    <Text style={styles.cardSub}>Progress across core computer science courses</Text>
                  </View>
                  <Badge label="Overall: 84.8%" color="#00DFB2" bg="rgba(0, 223, 178, 0.15)" />
                </View>

                <View style={styles.subjectList}>
                  {SUBJECT_MASTERY.map((subj) => (
                    <View key={subj.code} style={styles.subjectCard}>
                      <View style={styles.subjectTop}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.subjectName}>{subj.name}</Text>
                            <Badge label={subj.grade} color={subj.color} bg={`${subj.color}22`} />
                          </View>
                          <Text style={styles.subjectTopics}>
                            {subj.completedTopics} / {subj.totalTopics} topics completed • {subj.retention}% retention
                          </Text>
                        </View>
                        <Text style={[styles.subjectPct, { color: subj.color }]}>{subj.progress}%</Text>
                      </View>
                      <ProgressBar pct={subj.progress} color={subj.color} />
                    </View>
                  ))}
                </View>
              </View>

              {/* ── 6. Gamified Class Leaderboard ── */}
              <View style={styles.cardSection}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.cardTitle}>Sprint Leaderboard 🏆</Text>
                    <Text style={styles.cardSub}>Weekly rank based on study consistency & XP</Text>
                  </View>
                  <View style={styles.timeframeToggle}>
                    <TouchableOpacity
                      style={[styles.toggleBtn, leaderboardTab === 'study_hours' && styles.toggleBtnActive]}
                      onPress={() => setLeaderboardTab('study_hours')}
                    >
                      <Text style={[styles.toggleText, leaderboardTab === 'study_hours' && styles.toggleTextActive]}>
                        Hours
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.toggleBtn, leaderboardTab === 'xp' && styles.toggleBtnActive]}
                      onPress={() => setLeaderboardTab('xp')}
                    >
                      <Text style={[styles.toggleText, leaderboardTab === 'xp' && styles.toggleTextActive]}>
                        XP Points
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.leaderboardList}>
                  {LEADERBOARD_PEERS.map((peer) => (
                    <View
                      key={peer.rank}
                      style={[styles.leaderboardRow, peer.isUser && styles.leaderboardRowUser]}
                    >
                      <View style={styles.rankBox}>
                        <Text style={[styles.rankNumber, peer.rank === 1 && { color: '#FBBF24' }, peer.rank === 2 && { color: '#CBD5E1' }, peer.rank === 3 && { color: '#F59E0B' }]}>
                          {peer.rank === 1 ? '🥇' : peer.rank === 2 ? '🥈' : peer.rank === 3 ? '🥉' : `#${peer.rank}`}
                        </Text>
                      </View>

                      <View style={[styles.peerAvatar, peer.isUser && styles.peerAvatarUser]}>
                        <Text style={styles.peerAvatarLetter}>{peer.avatar}</Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={[styles.peerName, peer.isUser && styles.peerNameUser]}>
                            {peer.name}
                          </Text>
                          {peer.isUser && <Badge label="YOU" color="#00DFB2" bg="rgba(0, 223, 178, 0.2)" />}
                        </View>
                        <Text style={styles.peerMeta}>
                          Level {peer.level} • {peer.streak}d streak 🔥
                        </Text>
                      </View>

                      <View style={styles.peerStatRight}>
                        <Text style={[styles.peerStatMain, peer.isUser && { color: '#00DFB2' }]}>
                          {leaderboardTab === 'study_hours' ? `${peer.hours} hrs` : `${peer.xp} XP`}
                        </Text>
                        <Text style={styles.peerStatSub}>
                          {leaderboardTab === 'study_hours' ? `${peer.xp} XP` : `${peer.hours} hrs`}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              {/* ── 7. Milestones & Achievements Badges ── */}
              <View style={styles.cardSection}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.cardTitle}>Milestone Badges 🌟</Text>
                    <Text style={styles.cardSub}>Gamified study milestones unlocked</Text>
                  </View>
                  <Badge label="4 / 4 Unlocked" color="#00DFB2" bg="rgba(0, 223, 178, 0.15)" />
                </View>

                <View style={styles.badgeGrid}>
                  {ACHIEVEMENTS.map((ach) => (
                    <View key={ach.id} style={styles.achieveCard}>
                      <View style={styles.achieveIconBox}>
                        <Text style={{ fontSize: 20 }}>{ach.icon}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Text style={styles.achieveTitle}>{ach.title}</Text>
                          <Text style={styles.achieveXp}>{ach.xp}</Text>
                        </View>
                        <Text style={styles.achieveDesc}>{ach.desc}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              <View style={{ height: 32 }} />
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bgImage: { flex: 1, width: '100%', height: '100%', backgroundColor: '#070D18' },
  bgOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(7, 13, 24, 0.65)' },
  safeArea: { flex: 1 },
  pageWrapper: { flex: 1, flexDirection: 'row' },

  // Sidebar (Desktop)
  sidebar: {
    width: 230,
    borderRightWidth: 1,
    borderRightColor: 'rgba(0, 223, 178, 0.15)',
    backgroundColor: 'rgba(7, 14, 26, 0.75)',
    paddingVertical: 24,
    paddingHorizontal: 16,
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(20px)' } as any) : {}),
  },
  sidebarLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 32,
    paddingHorizontal: 6,
  },
  logoSquare: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#00DFB2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00DFB2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  logoIcon: { fontSize: 18 },
  logoTitle: { color: '#FFFFFF', fontWeight: '800', fontSize: 17, letterSpacing: -0.2 },
  logoSubtitle: { color: '#00DFB2', fontSize: 10.5, fontWeight: '600' },
  navMenu: { gap: 6 },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  navItemActive: {
    backgroundColor: 'rgba(0, 223, 178, 0.12)',
    borderWidth: 1.5,
    borderColor: '#00DFB2',
  },
  navIcon: { fontSize: 16, opacity: 0.7 },
  navIconActive: { opacity: 1 },
  navLabel: { color: '#8E9BAE', fontSize: 13.5, fontWeight: '600' },
  navLabelActive: { color: '#00DFB2', fontWeight: '700' },

  // Scroll Container
  scroll: { flex: 1 },
  container: {
    padding: 16,
  },
  desktopContainer: {
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 32,
  },
  innerWrapper: {
    width: '100%',
    maxWidth: 820,
  },
  mobileInner: {
    maxWidth: '100%',
  },

  // 1. Header Row
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: '#8E9BAE',
    fontSize: 12.5,
    marginTop: 2,
  },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(11, 21, 38, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(0, 223, 178, 0.3)',
    borderRadius: 99,
    paddingLeft: 12,
    paddingRight: 4,
    paddingVertical: 4,
  },
  profileBadgeText: {
    color: '#00DFB2',
    fontSize: 12,
    fontWeight: '800',
  },
  profileAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  // 2. Level Card
  levelCard: {
    backgroundColor: 'rgba(11, 21, 38, 0.88)',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(0, 223, 178, 0.32)',
    padding: 16,
    marginBottom: 16,
    ...(Platform.OS === 'web'
      ? ({
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(16px)',
      } as any)
      : {}),
  },
  levelTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  levelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  levelTag: {
    backgroundColor: 'rgba(0, 223, 178, 0.15)',
    borderWidth: 1,
    borderColor: '#00DFB2',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  levelTagText: {
    color: '#00DFB2',
    fontSize: 11,
    fontWeight: '800',
  },
  levelTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  streakWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  streakIcon: {
    fontSize: 12,
  },
  streakText: {
    color: '#F59E0B',
    fontSize: 11.5,
    fontWeight: '700',
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  xpLabel: {
    color: '#CBD5E1',
    fontSize: 12.5,
    fontWeight: '600',
  },
  xpRemaining: {
    color: '#8E9BAE',
    fontSize: 11.5,
    fontWeight: '500',
  },

  // 3. Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'rgba(11, 21, 38, 0.85)',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
  },
  metricEmoji: {
    fontSize: 16,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  metricLabel: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  metricSub: {
    color: '#8E9BAE',
    fontSize: 9.5,
    marginTop: 2,
    textAlign: 'center',
  },

  // Card Section Common
  cardSection: {
    backgroundColor: 'rgba(11, 21, 38, 0.82)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(30, 41, 59, 0.8)',
    padding: 18,
    marginBottom: 16,
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(16px)' } as any) : {}),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 8,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  cardSub: {
    color: '#8E9BAE',
    fontSize: 11.5,
    marginTop: 2,
  },
  timeframeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(7, 14, 26, 0.8)',
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  toggleBtnActive: {
    backgroundColor: 'rgba(0, 223, 178, 0.18)',
    borderWidth: 1,
    borderColor: '#00DFB2',
  },
  toggleText: {
    color: '#8E9BAE',
    fontSize: 11,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#00DFB2',
    fontWeight: '700',
  },

  // Chart Container
  chartContainer: {
    height: 170,
    justifyContent: 'flex-end',
    position: 'relative',
    paddingTop: 24,
    marginBottom: 12,
  },
  benchmarkLine: {
    position: 'absolute',
    top: 55,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 1,
  },
  benchmarkText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '700',
    backgroundColor: 'rgba(7, 14, 26, 0.8)',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    borderStyle: 'dashed',
  },
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 130,
    paddingHorizontal: 4,
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  barHoursText: {
    color: '#8E9BAE',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 4,
  },
  barTrack: {
    width: 22,
    height: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 6,
  },
  barFillSelected: {
    backgroundColor: '#00DFB2',
    shadowColor: '#00DFB2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
  },
  barFillAbove: {
    backgroundColor: '#38BDF8',
  },
  barFillNormal: {
    backgroundColor: 'rgba(96, 165, 250, 0.55)',
  },
  barDayLabel: {
    color: '#8E9BAE',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
  },
  barDayLabelActive: {
    color: '#00DFB2',
    fontWeight: '800',
  },

  // Inspect Card
  inspectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(7, 14, 26, 0.75)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 223, 178, 0.25)',
    padding: 10,
  },
  inspectLeft: {
    flex: 1,
  },
  inspectDate: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  inspectDetail: {
    color: '#8E9BAE',
    fontSize: 11,
    marginTop: 2,
  },

  // Subject Mastery List
  subjectList: {
    gap: 12,
  },
  subjectCard: {
    backgroundColor: 'rgba(7, 14, 26, 0.65)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 12,
  },
  subjectTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  subjectName: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  subjectTopics: {
    color: '#8E9BAE',
    fontSize: 11,
    marginTop: 2,
  },
  subjectPct: {
    fontSize: 14,
    fontWeight: '800',
  },

  // Leaderboard List
  leaderboardList: {
    gap: 8,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(7, 14, 26, 0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 10,
    gap: 10,
  },
  leaderboardRowUser: {
    backgroundColor: 'rgba(0, 223, 178, 0.08)',
    borderColor: 'rgba(0, 223, 178, 0.45)',
  },
  rankBox: {
    width: 24,
    alignItems: 'center',
  },
  rankNumber: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '800',
  },
  peerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  peerAvatarUser: {
    backgroundColor: '#00DFB2',
  },
  peerAvatarLetter: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  peerName: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '700',
  },
  peerNameUser: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  peerMeta: {
    color: '#8E9BAE',
    fontSize: 11,
    marginTop: 1,
  },
  peerStatRight: {
    alignItems: 'flex-end',
  },
  peerStatMain: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  peerStatSub: {
    color: '#8E9BAE',
    fontSize: 10.5,
  },

  // Milestone Badges Grid
  badgeGrid: {
    gap: 8,
  },
  achieveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(7, 14, 26, 0.65)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 223, 178, 0.2)',
    padding: 10,
    gap: 10,
  },
  achieveIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 223, 178, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 223, 178, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  achieveTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  achieveXp: {
    color: '#00DFB2',
    fontSize: 11,
    fontWeight: '800',
  },
  achieveDesc: {
    color: '#8E9BAE',
    fontSize: 11,
    marginTop: 2,
  },
});
