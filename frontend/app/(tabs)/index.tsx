import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  useWindowDimensions,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { ProgressService } from '../../services/progress';
import { ExamService } from '../../services/exams';
import { AssignmentService } from '../../services/assignments';
import { PlannerService } from '../../services/planner';
import { OverallProgress } from '../../types/progress';
import { Exam } from '../../types/exam';
import { Assignment } from '../../types/assignment';
import { StudySchedule } from '../../types/planner';
import { Colors } from '../../constants/theme';

// ── Mini Helpers ─────────────────────────────────────────────────────────────
function ProgressBar({
  value,
  max,
  color = Colors.teal,
  height = 6,
}: {
  value: number;
  max: number;
  color?: string;
  height?: number;
}) {
  const pct = max > 0 ? Math.min(Math.max((value / max) * 100, 0), 100) : 0;
  return (
    <View style={[barStyles.track, { height }]}>
      <View style={[barStyles.fill, { width: `${pct}%` as any, backgroundColor: color }]} />
    </View>
  );
}
const barStyles = StyleSheet.create({
  track: { backgroundColor: '#161F30', borderRadius: 99, overflow: 'hidden', width: '100%' },
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
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },
});

// Fallback sample sessions for rich display
const INITIAL_DEMO_SESSIONS = [
  {
    id: 101,
    topic_name: 'SQL Joins & Indexing',
    time_range: '02:00 – 03:15 PM',
    duration_str: '1h 15m',
    completed: false,
    icon: '🗄️',
  },
  {
    id: 102,
    topic_name: 'Binary Search Trees',
    time_range: '10:00 – 11:30 AM',
    duration_str: 'Completed',
    completed: true,
    icon: '🌳',
  },
  {
    id: 103,
    topic_name: 'CPU Scheduling',
    time_range: '05:00 – 06:45 PM',
    duration_str: '1h 45m',
    completed: false,
    icon: '⚙️',
  },
];

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const [refreshing, setRefreshing] = useState(false);
  const [progress, setProgress] = useState<OverallProgress | null>(null);
  const [upcomingExams, setUpcomingExams] = useState<Exam[]>([]);
  const [upcomingAssignments, setUpcomingAssignments] = useState<Assignment[]>([]);
  const [todayTasks, setTodayTasks] = useState<any[]>(INITIAL_DEMO_SESSIONS);
  const [activeAction, setActiveAction] = useState<'start' | 'session' | 'assignment' | 'exams'>('start');

  // Focus Timer Modal State
  const [focusModalVisible, setFocusModalVisible] = useState(false);
  const [focusSeconds, setFocusSeconds] = useState(25 * 60);
  const [focusRunning, setFocusRunning] = useState(false);
  const [focusTopic, setFocusTopic] = useState('SQL Joins & Indexing');

  // Nova Nudge dynamic messages
  const nudges = [
    'Your recall is highest right now — let\'s conquer SQL Joins!',
    'Peak cognitive window starts in 25 minutes. Ready to sprint?',
    'Consistency beats cramming — 3 sessions scheduled today.',
  ];
  const [nudgeIdx, setNudgeIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setNudgeIdx((i) => (i + 1) % nudges.length), 6000);
    return () => clearInterval(t);
  }, []);

  // Timer tick effect
  useEffect(() => {
    let interval: any = null;
    if (focusRunning) {
      interval = setInterval(() => {
        setFocusSeconds((prev) => {
          if (prev <= 1) {
            setFocusRunning(false);
            Alert.alert('🎉 Sprint Finished!', 'Great job! 25 minutes of deep focus completed.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [focusRunning]);

  const loadData = async () => {
    try {
      setRefreshing(true);
      const [progData, examsData, assignmentsData, plannerData] = await Promise.all([
        ProgressService.getOverallProgress().catch(() => null),
        ExamService.getAll().catch(() => []),
        AssignmentService.getAll().catch(() => []),
        PlannerService.getSchedule().catch(() => []),
      ]);
      if (progData) setProgress(progData);
      setUpcomingExams(examsData);
      setUpcomingAssignments(assignmentsData.filter((a) => !a.completed));
      const todayStr = new Date().toISOString().split('T')[0];
      const realToday = plannerData.filter((s) => s.scheduled_date === todayStr);
      if (realToday.length > 0) {
        setTodayTasks(realToday);
      }
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const firstName =
    user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'Ujwal';
  const displaySessionsCount = todayTasks.length;

  const mlReadiness =
    progress?.overall_percentage && progress.overall_percentage > 0
      ? Math.round(progress.overall_percentage)
      : 87;

  const dsaCoverage =
    progress?.total_topics && progress.total_topics > 0
      ? Math.round(((progress.completed_topics || 0) / progress.total_topics) * 100)
      : 82;

  const dsaCompleted = progress?.completed_topics || 28;
  const dsaTotal = progress?.total_topics || 34;

  const nextExam = upcomingExams.sort(
    (a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime()
  )[0];

  const daysLeft = nextExam
    ? Math.max(1, Math.ceil((new Date(nextExam.exam_date).getTime() - Date.now()) / 86400000))
    : 9;

  // Toggle session done state
  const handleToggleTask = (id: number) => {
    setTodayTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  // Start 25m Focus Sprint
  const handleStartSprint = (topicName?: string) => {
    setFocusTopic(topicName || 'SQL Joins & Indexing');
    setFocusSeconds(25 * 60);
    setFocusRunning(true);
    setFocusModalVisible(true);
  };

  const isWide = width > 768;

  const mStr = Math.floor(focusSeconds / 60).toString().padStart(2, '0');
  const sStr = (focusSeconds % 60).toString().padStart(2, '0');

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0E1A" />
      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.contentContainer, isWide && s.desktopContent]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor={Colors.teal} />
        }
      >
        <View style={s.innerWrapper}>
          {/* ── 1. TOP HEADER ── */}
          <View style={s.header}>
            <View style={s.headerLeft}>
              <View style={s.appLogoBox}>
                <Text style={s.appLogoIcon}>📖</Text>
              </View>
              <View>
                <Text style={s.headerName}>{firstName}</Text>
                <Text style={s.headerSub}>{displaySessionsCount} sessions today</Text>
              </View>
            </View>
            <View style={s.headerRight}>
              <TouchableOpacity
                style={s.novaChip}
                onPress={() => Alert.alert('Nova Assistant', 'Nova AI is analyzing your retention peaks.')}
                activeOpacity={0.8}
              >
                <Text style={s.novaChipEmoji}>🦉</Text>
                <Text style={s.novaChipText}>Nova</Text>
                <View style={s.novaOnlineDot} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/profile')}
                style={s.avatarCircle}
                activeOpacity={0.8}
              >
                <Text style={s.avatarInitial}>{firstName.charAt(0).toUpperCase()}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── 2. NOVA NUDGE CARD ── */}
          <TouchableOpacity
            style={s.nudgeCard}
            activeOpacity={0.85}
            onPress={() => handleStartSprint('SQL Joins & Indexing')}
          >
            <View style={s.nudgeAvatarBox}>
              <Text style={s.nudgeAvatarEmoji}>✨</Text>
            </View>
            <View style={s.nudgeContent}>
              <View style={s.nudgeHeaderRow}>
                <Text style={s.nudgeTitle}>Nova Nudge</Text>
                <Badge label="Active" color="#00C9A7" bg="rgba(0, 201, 167, 0.15)" borderColor="rgba(0, 201, 167, 0.3)" />
              </View>
              <Text style={s.nudgeText}>{nudges[nudgeIdx]}</Text>
            </View>
          </TouchableOpacity>

          {/* ── 3. TOP ANALYTICS GRID (Side by Side) ── */}
          <View style={s.analyticsGrid}>
            {/* Card 1: ML Readiness */}
            <TouchableOpacity
              style={[s.analyticsCard, { marginRight: 8 }]}
              activeOpacity={0.85}
              onPress={() => router.push('/(tabs)/progress')}
            >
              <View style={s.cardHeaderRow}>
                <Text style={s.cardLabelSmall}>ML READINESS</Text>
                <Text style={s.analyticsIcon}>🧠</Text>
              </View>
              <Text style={s.bigNumber}>{mlReadiness}%</Text>
              <View style={s.pillWrapper}>
                <Badge label="● High Retention" color="#00C9A7" bg="rgba(0, 201, 167, 0.12)" />
              </View>
              <View style={s.progressRow}>
                <ProgressBar value={mlReadiness} max={100} color="#00C9A7" height={6} />
              </View>
            </TouchableOpacity>

            {/* Card 2: Peak Window */}
            <TouchableOpacity
              style={[s.analyticsCard, { marginLeft: 8 }]}
              activeOpacity={0.85}
              onPress={() => handleStartSprint('Peak Window Focus')}
            >
              <View style={s.cardHeaderRow}>
                <Text style={s.cardLabelSmall}>PEAK WINDOW</Text>
                <Text style={s.analyticsIcon}>🕒</Text>
              </View>
              <Text style={s.peakTimeText}>2:00 – 3:30 PM</Text>
              <View style={s.pillWrapper}>
                <Badge label="Peak Recall (94%)" color="#A5B4FC" bg="rgba(99, 102, 241, 0.18)" />
              </View>
              <Text style={s.peakStartsText}>● Starts in 25 min</Text>
            </TouchableOpacity>
          </View>

          {/* ── 4. RAG KNOWLEDGE ENGINE ── */}
          <TouchableOpacity
            style={s.ragCard}
            activeOpacity={0.85}
            onPress={() => handleStartSprint('Graph BFS')}
          >
            <View style={s.ragHeader}>
              <View style={s.ragIconWrap}>
                <Text style={s.ragIconEmoji}>⚙️</Text>
              </View>
              <Text style={s.ragTitle}>RAG Knowledge Engine</Text>
              <Badge label="5 Syllabi Sync" color="#94A3B8" bg="#1E293B" />
            </View>
            <View style={s.ragInnerBanner}>
              <Text style={s.ragLightning}>⚡</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.ragSuggestionText}>
                  <Text style={s.ragBold}>RAG Suggests: </Text>Review Graph BFS
                </Text>
                <View style={{ marginTop: 4 }}>
                  <Badge label="64% Midterm prob" color="#C084FC" bg="rgba(168, 85, 247, 0.16)" />
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {/* ── 5. QUICK ACTION BUTTONS ── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={s.quickScroll}
            contentContainerStyle={s.quickActionsRow}
          >
            <TouchableOpacity
              style={[s.quickBtn, activeAction === 'start' ? s.quickBtnActive : s.quickBtnOutline]}
              onPress={() => {
                setActiveAction('start');
                handleStartSprint('25m Pomodoro Sprint');
              }}
              activeOpacity={0.8}
            >
              <Text style={[s.quickBtnIcon, activeAction === 'start' && s.quickBtnTextActive]}>▶</Text>
              <Text style={[s.quickBtnText, activeAction === 'start' && s.quickBtnTextActive]}>Start 25m</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.quickBtn, activeAction === 'session' ? s.quickBtnActive : s.quickBtnOutline]}
              onPress={() => {
                setActiveAction('session');
                router.push('/(tabs)/planner');
              }}
              activeOpacity={0.8}
            >
              <Text style={s.quickBtnIconOutline}>⟳</Text>
              <Text style={s.quickBtnTextOutline}>Session</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.quickBtn, activeAction === 'assignment' ? s.quickBtnActive : s.quickBtnOutline]}
              onPress={() => {
                setActiveAction('assignment');
                router.push('/assignments');
              }}
              activeOpacity={0.8}
            >
              <Text style={s.quickBtnIconOutline}>📄</Text>
              <Text style={s.quickBtnTextOutline}>Assignment</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.quickBtn, activeAction === 'exams' ? s.quickBtnActive : s.quickBtnOutline]}
              onPress={() => {
                setActiveAction('exams');
                router.push('/exams');
              }}
              activeOpacity={0.8}
            >
              <Text style={s.quickBtnIconOutline}>📅</Text>
              <Text style={s.quickBtnTextOutline}>Exams</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* ── 6. TODAY'S SCHEDULE ── */}
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Today's Schedule</Text>
            <Text style={s.sectionSubtitle}>2h 45m / 4h 30m</Text>
          </View>

          {/* Schedule list */}
          <View style={s.scheduleList}>
            {todayTasks.map((item: any, idx) => {
              const isDone = item.completed;
              const isActive = !isDone && idx === todayTasks.findIndex((t) => !t.completed);
              const topicTitle = item.topic_name || item.title || 'SQL Joins & Indexing';
              const timeRange = item.time_range || `${item.start_time || '02:00'} • ${item.duration_minutes || 60}m`;
              const iconEmoji = item.icon || (isDone ? '✓' : isActive ? '💾' : '⚙️');

              return (
                <View
                  key={item.id || idx}
                  style={[
                    s.sessionCard,
                    isActive && s.sessionCardActive,
                    isDone && s.sessionCardDone,
                  ]}
                >
                  <TouchableOpacity
                    style={s.sessionLeft}
                    activeOpacity={0.8}
                    onPress={() => handleToggleTask(item.id)}
                  >
                    <View
                      style={[
                        s.sessionIconBox,
                        isActive && s.sessionIconBoxActive,
                        isDone && s.sessionIconBoxDone,
                      ]}
                    >
                      <Text style={s.sessionIconText}>{iconEmoji}</Text>
                    </View>
                    <View style={s.sessionMeta}>
                      <Text
                        style={[
                          s.sessionTitle,
                          isDone && s.sessionTitleDone,
                        ]}
                        numberOfLines={1}
                      >
                        {topicTitle}
                      </Text>
                      <Text style={s.sessionTime}>{timeRange}</Text>
                    </View>
                  </TouchableOpacity>

                  <View style={s.sessionRight}>
                    {isActive ? (
                      <TouchableOpacity
                        style={s.focusButton}
                        onPress={() => handleStartSprint(topicTitle)}
                        activeOpacity={0.8}
                      >
                        <Text style={s.focusButtonText}>▶ Focus</Text>
                      </TouchableOpacity>
                    ) : isDone ? (
                      <TouchableOpacity onPress={() => handleToggleTask(item.id)}>
                        <Badge label="✓ Done" color="#00C9A7" bg="rgba(0, 201, 167, 0.12)" />
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity onPress={() => handleToggleTask(item.id)}>
                        <Badge label="Later" color="#94A3B8" bg="#1E293B" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          {/* ── 7. EXAM + COVERAGE CARDS (Bottom Grid) ── */}
          <View style={s.bottomCardsGrid}>
            {/* Midterm Exam Card */}
            <TouchableOpacity
              style={[s.bottomCard, { marginRight: 8 }]}
              activeOpacity={0.85}
              onPress={() => router.push('/exams')}
            >
              <View style={s.cardHeaderRow}>
                <Text style={s.examAlertLabel}>⚠️ MIDTERM EXAM</Text>
                <Badge label={`${daysLeft}d left`} color="#F87171" bg="rgba(239, 68, 68, 0.14)" />
              </View>
              <Text style={s.bottomCardTitle} numberOfLines={1}>
                {nextExam?.subject_name || 'Database Systems'}
              </Text>
              <Text style={s.bottomCardSub}>
                {nextExam
                  ? `${new Date(nextExam.exam_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • ${nextExam.total_modules || 4} modules`
                  : 'Oct 15 • 4 modules'}
              </Text>
              <View style={{ marginTop: 10 }}>
                <ProgressBar value={35} max={100} color="#EF4444" height={5} />
              </View>
            </TouchableOpacity>

            {/* DSA Coverage Card */}
            <TouchableOpacity
              style={[s.bottomCard, { marginLeft: 8 }]}
              activeOpacity={0.85}
              onPress={() => router.push('/(tabs)/subjects')}
            >
              <View style={s.cardHeaderRow}>
                <Text style={s.coverageLabel}>DSA COVERAGE</Text>
                <Text style={s.coveragePctText}>{dsaCoverage}%</Text>
              </View>
              <Text style={s.bottomCardTitle} numberOfLines={1}>
                Data Structures
              </Text>
              <Text style={s.bottomCardSub}>
                {dsaCompleted}/{dsaTotal} topics complete
              </Text>
              <View style={{ marginTop: 10 }}>
                <ProgressBar value={dsaCoverage} max={100} color="#00C9A7" height={5} />
              </View>
            </TouchableOpacity>
          </View>

          <View style={{ height: 32 }} />
        </View>
      </ScrollView>

      {/* ── FOCUS SPRINT MODAL ── */}
      <Modal visible={focusModalVisible} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.focusModalTopic}>{focusTopic}</Text>
            <Text style={s.focusTimerText}>{mStr}:{sStr}</Text>
            <Text style={s.focusSubText}>
              {focusRunning ? '⚡ Deep focus sprint in progress' : '⏸ Sprint Paused'}
            </Text>

            <View style={s.modalActions}>
              <TouchableOpacity
                style={s.cancelBtn}
                onPress={() => setFocusModalVisible(false)}
              >
                <Text style={s.cancelBtnText}>Minimize</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.saveBtn}
                onPress={() => setFocusRunning(!focusRunning)}
              >
                <Text style={s.saveBtnText}>{focusRunning ? 'Pause' : 'Resume'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0E1A',
  },
  scroll: {
    flex: 1,
    backgroundColor: '#0A0E1A',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
  },
  desktopContent: {
    alignItems: 'center',
  },
  innerWrapper: {
    width: '100%',
    maxWidth: 680,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  appLogoBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#1E40AF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  appLogoIcon: {
    fontSize: 20,
  },
  headerName: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSub: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  novaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 6,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  novaChipEmoji: {
    fontSize: 14,
  },
  novaChipText: {
    color: '#F1F5F9',
    fontSize: 13,
    fontWeight: '700',
  },
  novaOnlineDot: {
    width: 7,
    height: 7,
    borderRadius: 99,
    backgroundColor: '#00C9A7',
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },

  // Nova Nudge Card
  nudgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 201, 167, 0.08)',
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 201, 167, 0.25)',
  },
  nudgeAvatarBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 201, 167, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  nudgeAvatarEmoji: {
    fontSize: 22,
  },
  nudgeContent: {
    flex: 1,
  },
  nudgeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  nudgeTitle: {
    color: '#00C9A7',
    fontWeight: '800',
    fontSize: 14,
  },
  nudgeText: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },

  // Analytics Grid
  analyticsGrid: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  analyticsCard: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardLabelSmall: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  analyticsIcon: {
    fontSize: 16,
  },
  bigNumber: {
    color: '#F8FAFC',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  pillWrapper: {
    marginBottom: 8,
  },
  progressRow: {
    marginTop: 4,
  },
  peakTimeText: {
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 8,
  },
  peakStartsText: {
    color: '#818CF8',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },

  // RAG Card
  ragCard: {
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  ragHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  ragIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ragIconEmoji: {
    fontSize: 16,
  },
  ragTitle: {
    flex: 1,
    color: '#F1F5F9',
    fontWeight: '700',
    fontSize: 14,
  },
  ragInnerBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    gap: 10,
  },
  ragLightning: {
    fontSize: 18,
  },
  ragSuggestionText: {
    color: '#CBD5E1',
    fontSize: 14,
    lineHeight: 20,
  },
  ragBold: {
    color: '#F8FAFC',
    fontWeight: '800',
  },

  // Quick Action Buttons
  quickScroll: {
    marginBottom: 20,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  quickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 99,
  },
  quickBtnActive: {
    backgroundColor: '#00C9A7',
    shadowColor: '#00C9A7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  quickBtnOutline: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  quickBtnIcon: {
    color: '#0A0E1A',
    fontSize: 12,
    fontWeight: '800',
  },
  quickBtnText: {
    color: '#0A0E1A',
    fontSize: 13,
    fontWeight: '800',
  },
  quickBtnTextActive: {
    color: '#0A0E1A',
  },
  quickBtnIconOutline: {
    fontSize: 13,
    color: '#94A3B8',
  },
  quickBtnTextOutline: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },

  // Schedule list
  scheduleList: {
    marginBottom: 18,
    gap: 10,
  },
  sessionCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  sessionCardActive: {
    backgroundColor: '#0E1E38',
    borderColor: '#3B82F6',
    borderWidth: 1.5,
  },
  sessionCardDone: {
    opacity: 0.65,
  },
  sessionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  sessionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionIconBoxActive: {
    backgroundColor: '#1E3A8A',
  },
  sessionIconBoxDone: {
    backgroundColor: 'rgba(0, 201, 167, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 201, 167, 0.3)',
  },
  sessionIconText: {
    fontSize: 18,
  },
  sessionMeta: {
    flex: 1,
  },
  sessionTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
  },
  sessionTitleDone: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  sessionTime: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  sessionRight: {
    marginLeft: 8,
  },
  focusButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  focusButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },

  // Bottom Cards Grid
  bottomCardsGrid: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  bottomCard: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  examAlertLabel: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bottomCardTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 4,
  },
  bottomCardSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  coverageLabel: {
    color: '#00C9A7',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  coveragePctText: {
    color: '#00C9A7',
    fontSize: 15,
    fontWeight: '800',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#111827',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 440,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00C9A7',
  },
  focusModalTopic: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  focusTimerText: {
    color: '#00C9A7',
    fontSize: 64,
    fontWeight: '900',
    marginVertical: 12,
    fontVariant: ['tabular-nums'],
    letterSpacing: -2,
  },
  focusSubText: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#94A3B8',
    fontWeight: '700',
    fontSize: 14,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: '#00C9A7',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#0A0E1A',
    fontWeight: '800',
    fontSize: 14,
  },
});
