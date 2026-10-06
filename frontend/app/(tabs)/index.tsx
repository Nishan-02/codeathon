import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  ImageBackground,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { ProgressService } from '../../services/progress';
import { ExamService } from '../../services/exams';
import { AssignmentService } from '../../services/assignments';
import { PlannerService } from '../../services/planner';
import { generateNovaRecommendation, getTimeOfDay, NovaRecommendation } from '../../services/nova';
import { NovaCard } from '../../components/nova/NovaCard';
import { OverallProgress } from '../../types/progress';
import { Exam } from '../../types/exam';
import { Assignment } from '../../types/assignment';
import { StudySchedule } from '../../types/planner';
import { Colors, Radius } from '../../constants/theme';

// ── Mini helpers ──────────────────────────────────────────────────────────────
function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <View style={barS.track}>
      <View style={[barS.fill, { width: `${pct}%` as any, backgroundColor: color }]} />
    </View>
  );
}
const barS = StyleSheet.create({
  track: { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 99, overflow: 'hidden', flex: 1 },
  fill: { height: '100%', borderRadius: 99 },
});

function Badge({ label, color, bg, borderColor }: { label: string; color: string; bg: string; borderColor?: string }) {
  return (
    <View style={{ backgroundColor: bg, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3, borderWidth: borderColor ? 1 : 0, borderColor: borderColor || 'transparent' }}>
      <Text style={{ color, fontSize: 11, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  const [refreshing, setRefreshing] = useState(false);
  const [progress, setProgress] = useState<OverallProgress | null>(null);
  const [upcomingExams, setUpcomingExams] = useState<Exam[]>([]);
  const [upcomingAssignments, setUpcomingAssignments] = useState<Assignment[]>([]);
  const [todayTasks, setTodayTasks] = useState<StudySchedule[]>([]);
  const [novaRec, setNovaRec] = useState<NovaRecommendation | null>(null);

  // ── Load data + generate NOVA recommendation ──────────────────────────────
  const loadData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [progData, examsData, assignmentsData, plannerData] = await Promise.all([
        ProgressService.getOverallProgress().catch(() => null),
        ExamService.getAll().catch(() => [] as Exam[]),
        AssignmentService.getAll().catch(() => [] as Assignment[]),
        PlannerService.getSchedule().catch(() => [] as StudySchedule[]),
      ]);

      if (progData) setProgress(progData);
      setUpcomingExams(examsData);
      setUpcomingAssignments(assignmentsData.filter((a) => !a.completed));

      const todayStr = new Date().toISOString().split('T')[0];
      const todayList = plannerData.filter((s) => s.scheduled_date === todayStr);
      setTodayTasks(todayList);

      // ── Compute NOVA context ──────────────────────────────────────────────
      const studyScore = Math.round(progData?.overall_percentage ?? 0);
      const completedToday = todayList.filter((t) => t.completed).length;
      const totalToday = todayList.length;
      const todayCompletedPct = totalToday > 0 ? (completedToday / totalToday) * 100 : 0;
      const hoursStudiedToday = todayList
        .filter((t) => t.completed)
        .reduce((acc, t) => acc + (t.duration_minutes ?? 60) / 60, 0);

      const sortedExams = [...examsData].sort(
        (a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime()
      );
      const upcomingExamDays = sortedExams.length > 0
        ? Math.ceil((new Date(sortedExams[0].exam_date).getTime() - Date.now()) / 86400000)
        : null;

      const rec = generateNovaRecommendation({
        studyScore,
        todayCompletedPct,
        streakDays: 0,
        hoursStudiedToday,
        upcomingExamDays: upcomingExamDays && upcomingExamDays > 0 ? upcomingExamDays : null,
        totalTopics: progData?.total_topics ?? 1,
        completedTopics: progData?.completed_topics ?? 0,
        timeOfDay: getTimeOfDay(),
      });
      setNovaRec(rec);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Derived values ────────────────────────────────────────────────────────
  const firstName = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'Student';
  const mlReadiness = Math.round(progress?.overall_percentage ?? 0);
  const dsaCoverage = Math.round(
    ((progress?.completed_topics ?? 0) / Math.max(progress?.total_topics ?? 1, 1)) * 100
  );
  const completedToday = todayTasks.filter((t) => t.completed).length;
  const totalToday = todayTasks.length;

  const nextExam = [...upcomingExams].sort(
    (a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime()
  )[0];
  const daysLeft = nextExam
    ? Math.ceil((new Date(nextExam.exam_date).getTime() - Date.now()) / 86400000)
    : null;

  // Refresh NOVA recommendation without reloading all data
  const refreshNova = useCallback(() => {
    const rec = generateNovaRecommendation({
      studyScore: mlReadiness,
      todayCompletedPct: totalToday > 0 ? (completedToday / totalToday) * 100 : 0,
      hoursStudiedToday: todayTasks.filter((t) => t.completed)
        .reduce((a, t) => a + (t.duration_minutes ?? 60) / 60, 0),
      upcomingExamDays: daysLeft && daysLeft > 0 ? daysLeft : null,
      totalTopics: progress?.total_topics ?? 1,
      completedTopics: progress?.completed_topics ?? 0,
      timeOfDay: getTimeOfDay(),
      streakDays: Math.floor(Math.random() * 10),
    });
    setNovaRec(rec);
  }, [mlReadiness, completedToday, totalToday, daysLeft, progress, todayTasks]);

  return (
    <ImageBackground
      source={require('../../assets/images/calendar-bg.jpg')}
      style={s.bgImage}
      resizeMode="cover"
    >
      <View style={s.bgOverlay} />
      <SafeAreaView style={s.safeArea} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#070D18" />

        <View style={s.pageWrapper}>
          {/* ── Left Sidebar on Desktop ── */}
          {isDesktop && (
            <View style={s.sidebar}>
              <TouchableOpacity
                style={s.sidebarLogo}
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

              <View style={s.navMenu}>
                <TouchableOpacity
                  style={[s.navItem, s.navItemActive]}
                  activeOpacity={0.9}
                >
                  <Text style={[s.navIcon, s.navIconActive]}>🏠</Text>
                  <Text style={[s.navLabel, s.navLabelActive]}>Today</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.navItem}
                  onPress={() => router.push('/(tabs)/subjects')}
                  activeOpacity={0.7}
                >
                  <Text style={s.navIcon}>📚</Text>
                  <Text style={s.navLabel}>Subjects</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.navItem}
                  onPress={() => router.push('/(tabs)/planner')}
                  activeOpacity={0.7}
                >
                  <Text style={s.navIcon}>⚡</Text>
                  <Text style={s.navLabel}>Planner</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.navItem}
                  onPress={() => router.push('/(tabs)/calendar')}
                  activeOpacity={0.7}
                >
                  <Text style={s.navIcon}>📅</Text>
                  <Text style={s.navLabel}>Calendar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.navItem}
                  onPress={() => router.push('/(tabs)/progress')}
                  activeOpacity={0.7}
                >
                  <Text style={s.navIcon}>📊</Text>
                  <Text style={s.navLabel}>Progress</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.navItem}
                  onPress={() => router.push('/(tabs)/profile')}
                  activeOpacity={0.7}
                >
                  <Text style={s.navIcon}>👤</Text>
                  <Text style={s.navLabel}>Profile</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <ScrollView
            style={s.scroll}
            contentContainerStyle={[s.content, isDesktop && s.desktopContent]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor="#00DFB2" />
            }
          >
            <View style={[s.innerWrapper, !isDesktop && s.mobileInner]}>
              {/* ── HEADER ── */}
              <View style={s.header}>
                <View>
                  <Text style={s.headerName}>{firstName}</Text>
                  <Text style={s.headerSub}>{totalToday} sessions today</Text>
                </View>
                <View style={s.headerRight}>
                  <TouchableOpacity style={s.novaChip} onPress={() => router.push('/(tabs)/profile')}>
                    <Text style={s.novaEmoji}>🦥</Text>
                    <Text style={s.novaChipText}>Nova</Text>
                    <View style={s.novaOnline} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={s.avatarCircle}>
                    <Text style={s.avatarInitial}>{firstName.charAt(0).toUpperCase()}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* ── NOVA CARD (AI Recommendation Engine) ── */}
              {novaRec && (
                <NovaCard
                  recommendation={novaRec}
                  onRefresh={refreshNova}
                />
              )}

              {/* ── ML READINESS + PEAK WINDOW ── */}
              <View style={s.twoCol}>
                <View style={[s.statCard, { flex: 1, marginRight: 8 }]}>
                  <View style={s.statCardHeader}>
                    <Text style={s.statCardLabel}>ML READINESS</Text>
                    <Text style={s.statIcon}>🧠</Text>
                  </View>
                  <Text style={s.statBigNum}>{mlReadiness}%</Text>
                  <Badge label="High Retention" color="#00DFB2" bg="rgba(0, 223, 178, 0.15)" borderColor="rgba(0, 223, 178, 0.3)" />
                  <View style={{ marginTop: 10 }}>
                    <ProgressBar value={mlReadiness} max={100} color="#00DFB2" />
                  </View>
                </View>

                <View style={[s.statCard, { flex: 1, marginLeft: 8 }]}>
                  <View style={s.statCardHeader}>
                    <Text style={s.statCardLabel}>PEAK WINDOW</Text>
                    <Text style={s.statIcon}>🕐</Text>
                  </View>
                  <Text style={s.peakTime}>2:00 – 3:30 PM</Text>
                  <View style={s.peakBadgeRow}>
                    <Badge label="Peak Recall (94%)" color="#A5B4FC" bg="rgba(99, 102, 241, 0.2)" borderColor="rgba(99, 102, 241, 0.3)" />
                  </View>
                  <Text style={s.peakSub}>● Starts in 25 min</Text>
                </View>
              </View>

              {/* ── RAG KNOWLEDGE ENGINE & DOCUQUERY AI ── */}
              <TouchableOpacity
                style={s.ragCard}
                activeOpacity={0.88}
                onPress={() => router.push('/(tabs)/docuquery' as any)}
              >
                <View style={s.ragHeader}>
                  <View style={s.ragIconWrap}>
                    <Text style={s.ragIcon}>📑</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.ragTitle}>DocuQuery AI & RAG Engine</Text>
                    <Text style={s.ragDescSub}>Drop syllabus, notes, or books for instant study plans & Q&A</Text>
                  </View>
                  <Badge label="Open AI ⚡" color="#00DFB2" bg="rgba(0, 223, 178, 0.15)" borderColor="rgba(0, 223, 178, 0.3)" />
                </View>
                <View style={s.ragBody}>
                  <Text style={s.ragEmoji}>📥</Text>
                  <Text style={s.ragText}>
                    <Text style={s.ragBold}>Drop Your Files: </Text>
                    Generate personalized weekly roadmap & query document
                  </Text>
                </View>
                <View style={s.ragActionFooter}>
                  <Text style={s.ragActionText}>Launch DocuQuery AI →</Text>
                </View>
              </TouchableOpacity>

              {/* ── QUICK ACTIONS ── */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.quickScroll}>
                <TouchableOpacity style={s.qBtn} onPress={() => router.push('/(tabs)/planner')}>
                  <Text style={s.qBtnIcon}>▶</Text>
                  <Text style={s.qBtnText}>Start 25m</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.qBtn, s.qBtnOutline]} onPress={() => router.push('/(tabs)/docuquery' as any)}>
                  <Text style={[s.qBtnText, { color: '#00DFB2' }]}>📑 Drop Files</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.qBtn, s.qBtnOutline]} onPress={() => router.push('/assignments' as any)}>
                  <Text style={[s.qBtnText, { color: '#CBD5E1' }]}>📄 Assignment</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.qBtn, s.qBtnOutline]} onPress={() => router.push('/exams' as any)}>
                  <Text style={[s.qBtnText, { color: '#CBD5E1' }]}>📅 Exams</Text>
                </TouchableOpacity>
              </ScrollView>

              {/* ── TODAY'S SCHEDULE ── */}
              <View style={s.sectionRow}>
                <Text style={s.sectionTitle}>Today's Schedule</Text>
                <Text style={s.sectionMeta}>
                  {completedToday}/{totalToday} done
                </Text>
              </View>

              {todayTasks.length === 0 ? (
                <View style={s.emptyCard}>
                  <Text style={s.emptyEmoji}>📚</Text>
                  <Text style={s.emptyTitle}>No sessions scheduled</Text>
                  <Text style={s.emptyHint}>Go to Planner or DocuQuery AI to generate today's study plan</Text>
                </View>
              ) : (
                todayTasks.map((task, idx) => {
                  const isActive = !task.completed && idx === todayTasks.findIndex((t) => !t.completed);
                  const isDone = task.completed;
                  return (
                    <View
                      key={task.id}
                      style={[
                        s.scheduleCard,
                        isActive && s.scheduleCardActive,
                        isDone && s.scheduleCardDone,
                      ]}
                    >
                      <View style={s.scheduleLeft}>
                        {isDone ? (
                          <View style={s.doneIcon}>
                            <Text style={{ color: '#00DFB2', fontSize: 13, fontWeight: '700' }}>✓</Text>
                          </View>
                        ) : (
                          <View style={[s.scheduleIcon, isActive && { backgroundColor: 'rgba(0, 223, 178, 0.2)' }]}>
                            <Text style={{ fontSize: 18 }}>🗃️</Text>
                          </View>
                        )}
                        <View style={{ flex: 1 }}>
                          <Text style={[s.scheduleSubject, isDone && s.strikethrough]}>
                            {task.topic_name || 'Study Session'}
                          </Text>
                          <Text style={s.scheduleTime}>
                            {task.start_time || '--'} • {task.duration_minutes || 60} min
                          </Text>
                        </View>
                      </View>
                      {isActive ? (
                        <TouchableOpacity style={s.focusBtn} onPress={() => router.push('/(tabs)/planner')}>
                          <Text style={s.focusBtnText}>Focus</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  );
                })
              )}

              {/* ── UPCOMING EXAM & DSA COVERAGE ── */}
              <View style={s.twoCol}>
                {nextExam && (
                  <View style={[s.examCard, { flex: 1, marginRight: 8 }]}>
                    <Text style={s.examAlert}>UPCOMING EXAM</Text>
                    {daysLeft !== null && (
                      <Text style={s.examDaysLeft}>
                        {daysLeft <= 0 ? 'Today' : `${daysLeft}d left`}
                      </Text>
                    )}
                    <Text style={s.examName} numberOfLines={1}>
                      {nextExam.subject_name || 'Exam'}
                    </Text>
                    <Text style={s.examDate}>
                      {new Date(nextExam.exam_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                )}

                <View style={[s.coverCard, { flex: 1, marginLeft: nextExam ? 8 : 0 }]}>
                  <Text style={s.coverLabel}>DSA COVERAGE</Text>
                  <Text style={s.coverPct}>{dsaCoverage}%</Text>
                  <Text style={s.coverName}>Data Structures</Text>
                  <Text style={s.coverSub}>
                    {progress?.completed_topics || 0}/{progress?.total_topics || 0} topics complete
                  </Text>
                  <View style={{ marginTop: 8 }}>
                    <ProgressBar value={dsaCoverage} max={100} color="#00DFB2" />
                  </View>
                </View>
              </View>

              <View style={{ height: 24 }} />
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  bgImage: { flex: 1, width: '100%', height: '100%', backgroundColor: '#070D18' },
  bgOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(7, 13, 24, 0.65)' },
  safeArea: { flex: 1 },
  pageWrapper: { flex: 1, flexDirection: 'row' },

  // Sidebar
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

  // Scroll & Content
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },
  desktopContent: { alignItems: 'center', paddingTop: 24, paddingHorizontal: 32 },
  innerWrapper: { width: '100%', maxWidth: 740 },
  mobileInner: { maxWidth: '100%' },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  headerName: { color: '#FFFFFF', fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  headerSub: { color: '#8E9BAE', fontSize: 13, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  novaChip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(10, 20, 36, 0.75)',
    borderRadius: 99, paddingHorizontal: 10, paddingVertical: 6, gap: 5,
    borderWidth: 1, borderColor: 'rgba(0, 223, 178, 0.3)',
  },
  novaEmoji: { fontSize: 14 },
  novaChipText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  novaOnline: { width: 6, height: 6, borderRadius: 99, backgroundColor: '#00DFB2' },
  avatarCircle: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#6366F1',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarInitial: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },

  // Two-col
  twoCol: { flexDirection: 'row', marginBottom: 14 },

  // Stat card
  statCard: {
    backgroundColor: 'rgba(10, 20, 36, 0.72)', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: 'rgba(30, 41, 59, 0.7)',
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(16px)' } as any) : {}),
  },
  statCardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  statCardLabel: { color: '#8E9BAE', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  statIcon: { fontSize: 16 },
  statBigNum: { color: '#FFFFFF', fontSize: 32, fontWeight: '800', marginBottom: 6 },

  // Peak
  peakTime: { color: '#FFFFFF', fontSize: 17, fontWeight: '700', marginBottom: 6 },
  peakBadgeRow: { marginBottom: 6 },
  peakSub: { color: '#8E9BAE', fontSize: 12, marginTop: 6 },

  // RAG card
  ragCard: {
    backgroundColor: 'rgba(10, 20, 36, 0.72)', borderRadius: 14, padding: 16, marginBottom: 14,
    borderWidth: 1, borderColor: 'rgba(0, 223, 178, 0.35)',
    shadowColor: '#00DFB2', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 8,
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(16px)' } as any) : {}),
  },
  ragHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  ragIconWrap: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(0, 223, 178, 0.15)',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0, 223, 178, 0.3)',
  },
  ragIcon: { fontSize: 18 },
  ragTitle: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  ragDescSub: { color: '#8E9BAE', fontSize: 11, marginTop: 2 },
  ragBody: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: 10, borderRadius: 10,
  },
  ragEmoji: { fontSize: 16 },
  ragText: { color: '#CBD5E1', fontSize: 13, flex: 1 },
  ragBold: { color: '#00DFB2', fontWeight: '700' },
  ragActionFooter: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  ragActionText: {
    color: '#00DFB2',
    fontWeight: '700',
    fontSize: 12,
  },

  // Quick scroll
  quickScroll: { marginBottom: 18 },
  qBtn: {
    backgroundColor: '#00DFB2', borderRadius: 99, paddingHorizontal: 16,
    paddingVertical: 10, marginRight: 8, flexDirection: 'row', alignItems: 'center', gap: 6,
    shadowColor: '#00DFB2', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6,
  },
  qBtnOutline: { backgroundColor: 'rgba(10, 20, 36, 0.72)', borderWidth: 1, borderColor: 'rgba(30, 41, 59, 0.7)' },
  qBtnIcon: { color: '#071615', fontSize: 13, fontWeight: '800' },
  qBtnText: { color: '#071615', fontWeight: '800', fontSize: 13 },

  // Section row
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  sectionMeta: { color: '#8E9BAE', fontSize: 13 },

  // Empty
  emptyCard: {
    backgroundColor: 'rgba(10, 20, 36, 0.72)', borderRadius: 14, padding: 28,
    alignItems: 'center', marginBottom: 14,
    borderWidth: 1, borderColor: 'rgba(30, 41, 59, 0.7)',
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(16px)' } as any) : {}),
  },
  emptyEmoji: { fontSize: 32, marginBottom: 8 },
  emptyTitle: { color: '#FFFFFF', fontWeight: '700', fontSize: 15, marginBottom: 4 },
  emptyHint: { color: '#8E9BAE', fontSize: 13, textAlign: 'center' },

  // Schedule cards
  scheduleCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(10, 20, 36, 0.72)', borderRadius: 14, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(30, 41, 59, 0.7)',
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(16px)' } as any) : {}),
  },
  scheduleCardActive: {
    borderColor: '#00DFB2',
    backgroundColor: 'rgba(8, 28, 36, 0.82)',
  },
  scheduleCardDone: { opacity: 0.7 },
  scheduleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  scheduleIcon: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center', alignItems: 'center',
  },
  doneIcon: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(0, 223, 178, 0.15)',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0, 223, 178, 0.35)',
  },
  scheduleSubject: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  scheduleTime: { color: '#8E9BAE', fontSize: 12, marginTop: 2 },
  strikethrough: { textDecorationLine: 'line-through', color: '#8E9BAE' },
  focusBtn: {
    backgroundColor: '#00DFB2', borderRadius: 99, paddingHorizontal: 14, paddingVertical: 6,
  },
  focusBtnText: { color: '#071615', fontWeight: '800', fontSize: 12 },

  // Exam card
  examCard: {
    backgroundColor: 'rgba(10, 20, 36, 0.72)', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.35)',
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(16px)' } as any) : {}),
  },
  examAlert: { color: '#EF4444', fontSize: 11, fontWeight: '800', letterSpacing: 0.5, marginBottom: 4 },
  examDaysLeft: { color: '#EF4444', fontSize: 20, fontWeight: '800', marginBottom: 4 },
  examName: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  examDate: { color: '#8E9BAE', fontSize: 12, marginTop: 2 },

  // Cover card
  coverCard: {
    backgroundColor: 'rgba(10, 20, 36, 0.72)', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: 'rgba(30, 41, 59, 0.7)',
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(16px)' } as any) : {}),
  },
  coverLabel: { color: '#8E9BAE', fontSize: 11, fontWeight: '800', letterSpacing: 0.5, marginBottom: 4 },
  coverPct: { color: '#00DFB2', fontSize: 20, fontWeight: '800', marginBottom: 4 },
  coverName: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  coverSub: { color: '#8E9BAE', fontSize: 12, marginTop: 2 },
});
