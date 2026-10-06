import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
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
  track: { height: 6, backgroundColor: '#1E293B', borderRadius: 99, overflow: 'hidden', flex: 1 },
  fill: { height: '100%', borderRadius: 99 },
});

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <View style={{ backgroundColor: bg, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 }}>
      <Text style={{ color, fontSize: 11, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();

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
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor={Colors.teal} />
        }
      >
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
            <Badge label="High Retention" color={Colors.teal} bg="#00291F" />
            <View style={{ marginTop: 10 }}>
              <ProgressBar value={mlReadiness} max={100} color={Colors.teal} />
            </View>
          </View>

          <View style={[s.statCard, { flex: 1, marginLeft: 8 }]}>
            <View style={s.statCardHeader}>
              <Text style={s.statCardLabel}>PEAK WINDOW</Text>
              <Text style={s.statIcon}>🕐</Text>
            </View>
            <Text style={s.peakTime}>2:00 – 3:30 PM</Text>
            <View style={s.peakBadgeRow}>
              <Badge label="Peak Recall (94%)" color={Colors.indigo} bg="#1E1B4B" />
            </View>
            <Text style={s.peakSub}>● Starts in 25 min</Text>
          </View>
        </View>

        {/* ── RAG KNOWLEDGE ENGINE & DOCUQUERY AI ── */}
        <TouchableOpacity
          style={s.ragCard}
          activeOpacity={0.88}
          onPress={() => router.push('/(tabs)/docuquery')}
        >
          <View style={s.ragHeader}>
            <View style={s.ragIconWrap}>
              <Text style={s.ragIcon}>📑</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.ragTitle}>DocuQuery AI & RAG Engine</Text>
              <Text style={s.ragDescSub}>Drop syllabus, notes, or books for instant study plans & Q&A</Text>
            </View>
            <Badge label="Open AI ⚡" color={Colors.teal} bg="#00291F" />
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
          <TouchableOpacity style={[s.qBtn, s.qBtnOutline]} onPress={() => router.push('/(tabs)/docuquery')}>
            <Text style={[s.qBtnText, { color: Colors.teal }]}>📑 Drop Files</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.qBtn, s.qBtnOutline]} onPress={() => router.push('/assignments')}>
            <Text style={[s.qBtnText, { color: Colors.textSecondary }]}>📄 Assignment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.qBtn, s.qBtnOutline]} onPress={() => router.push('/exams')}>
            <Text style={[s.qBtnText, { color: Colors.textSecondary }]}>📅 Exams</Text>
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
                      <Text style={{ color: Colors.teal, fontSize: 13, fontWeight: '700' }}>✓</Text>
                    </View>
                  ) : (
                    <View style={[s.scheduleIcon, isActive && { backgroundColor: '#0D3352' }]}>
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
              <ProgressBar value={dsaCoverage} max={100} color={Colors.teal} />
            </View>
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20 },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerName: { color: Colors.textPrimary, fontSize: 22, fontWeight: '700' },
  headerSub: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  novaChip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827',
    borderRadius: 99, paddingHorizontal: 10, paddingVertical: 6, gap: 4,
    borderWidth: 1, borderColor: '#1E293B',
  },
  novaEmoji: { fontSize: 14 },
  novaChipText: { color: Colors.textPrimary, fontSize: 13, fontWeight: '600' },
  novaOnline: { width: 7, height: 7, borderRadius: 99, backgroundColor: Colors.teal },
  avatarCircle: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.indigo,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitial: { color: Colors.white, fontWeight: '700', fontSize: 16 },

  // Two-col
  twoCol: { flexDirection: 'row', marginBottom: 14 },

  // Stat card
  statCard: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  statCardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  statCardLabel: { color: Colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  statIcon: { fontSize: 16 },
  statBigNum: { color: Colors.textPrimary, fontSize: 32, fontWeight: '800', marginBottom: 6 },

  // Peak
  peakTime: { color: Colors.textPrimary, fontSize: 17, fontWeight: '700', marginBottom: 6 },
  peakBadgeRow: { marginBottom: 6 },
  peakSub: { color: Colors.textMuted, fontSize: 12, marginTop: 6 },

  // RAG card
  ragCard: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: 16, marginBottom: 14,
    borderWidth: 1, borderColor: Colors.tealDark,
    shadowColor: Colors.teal, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 10,
  },
  ragHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  ragIconWrap: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#0F2A22',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#00C9A744',
  },
  ragIcon: { fontSize: 18 },
  ragTitle: { color: Colors.textPrimary, fontWeight: '800', fontSize: 15 },
  ragDescSub: { color: Colors.textSecondary, fontSize: 11, marginTop: 2 },
  ragBody: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#0F172A', padding: 10, borderRadius: Radius.md,
  },
  ragEmoji: { fontSize: 16 },
  ragText: { color: Colors.textSecondary, fontSize: 13, flex: 1 },
  ragBold: { color: Colors.teal, fontWeight: '700' },
  ragActionFooter: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  ragActionText: {
    color: Colors.teal,
    fontWeight: '700',
    fontSize: 12,
  },

  // Quick scroll
  quickScroll: { marginBottom: 18 },
  qBtn: {
    backgroundColor: Colors.teal, borderRadius: Radius.full, paddingHorizontal: 16,
    paddingVertical: 10, marginRight: 8, flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  qBtnOutline: { backgroundColor: '#111827', borderWidth: 1, borderColor: Colors.border },
  qBtnIcon: { color: Colors.bg, fontSize: 13, fontWeight: '700' },
  qBtnText: { color: Colors.bg, fontWeight: '700', fontSize: 13 },

  // Section row
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },
  sectionMeta: { color: Colors.textMuted, fontSize: 13 },

  // Empty
  emptyCard: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: 28,
    alignItems: 'center', marginBottom: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  emptyEmoji: { fontSize: 32, marginBottom: 8 },
  emptyTitle: { color: Colors.textPrimary, fontWeight: '700', fontSize: 15, marginBottom: 4 },
  emptyHint: { color: Colors.textMuted, fontSize: 13, textAlign: 'center' },

  // Schedule cards
  scheduleCard: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 10, borderWidth: 1, borderColor: Colors.border,
  },
  scheduleCardActive: {
    backgroundColor: '#0A1E35', borderColor: Colors.indigo,
  },
  scheduleCardDone: { opacity: 0.65 },
  scheduleLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  scheduleIcon: {
    width: 38, height: 38, borderRadius: 10, backgroundColor: '#1E293B',
    justifyContent: 'center', alignItems: 'center',
  },
  doneIcon: {
    width: 38, height: 38, borderRadius: 10, backgroundColor: '#002E27',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.teal,
  },
  scheduleSubject: { color: Colors.textPrimary, fontWeight: '700', fontSize: 14 },
  scheduleTime: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  strikethrough: { textDecorationLine: 'line-through', color: Colors.textMuted },
  focusBtn: {
    backgroundColor: Colors.indigo, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  focusBtnText: { color: Colors.white, fontWeight: '700', fontSize: 13 },

  // Exam card
  examCard: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  examAlert: { color: Colors.red, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  examDaysLeft: { color: Colors.red, fontSize: 13, fontWeight: '700', position: 'absolute', top: 14, right: 14 },
  examName: { color: Colors.textPrimary, fontWeight: '700', fontSize: 15, marginTop: 4 },
  examDate: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },

  // Coverage card
  coverCard: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  coverLabel: { color: Colors.teal, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  coverPct: { color: Colors.textPrimary, fontSize: 22, fontWeight: '800', marginTop: 4 },
  coverName: { color: Colors.textPrimary, fontWeight: '700', fontSize: 14, marginTop: 2 },
  coverSub: { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
});
