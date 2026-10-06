import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  useWindowDimensions,
  StatusBar,
  Modal,
  TextInput,
  Alert,
  Platform,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePlanner } from '../../hooks/usePlanner';
import { useAuth } from '../../hooks/useAuth';
import { Colors } from '../../constants/theme';

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
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },
});

// ── Live Countdown Timer ───────────────────────────────────────────────────────
function CountdownTimer({ initialMinutes = 24, initialSeconds = 11 }: { initialMinutes?: number; initialSeconds?: number }) {
  const [seconds, setSeconds] = useState(initialMinutes * 60 + initialSeconds);
  useEffect(() => {
    const interval = setInterval(() => setSeconds((s) => Math.max(s - 1, 0)), 1000);
    return () => clearInterval(interval);
  }, []);
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s2 = (seconds % 60).toString().padStart(2, '0');
  return (
    <View style={ct.box}>
      <Text style={ct.icon}>⏱</Text>
      <Text style={ct.text}>{m}:{s2}</Text>
    </View>
  );
}
const ct = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 223, 178, 0.12)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 223, 178, 0.35)',
  },
  icon: { fontSize: 12, color: '#00DFB2' },
  text: {
    color: '#00DFB2',
    fontWeight: '800',
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
});

// Week strip days & multi-day schedules
interface TimelineItem {
  id: number;
  topic_name: string;
  subject_name?: string;
  rag_tag?: string;
  start_time: string;
  duration_minutes: number;
  duration_label?: string;
  completed: boolean;
  type?: 'done' | 'active' | 'later';
  icon?: string;
  timerMinutes?: number;
  timerSeconds?: number;
  badgeColor?: string;
  badgeBg?: string;
}

interface DaySchedule {
  day: string;
  num: string;
  dateStr: string;
  mlBanner: {
    title: string;
    subPrefix: string;
    bufferHighlight: string;
    subSuffix: string;
  };
  target: {
    completedStr: string;
    totalStr: string;
    pct: number;
    remainingStr: string;
    status: string;
  };
  blocks: TimelineItem[];
  freeGapInserted?: boolean;
}

const INITIAL_DAY_SCHEDULES: DaySchedule[] = [
  {
    day: 'MON',
    num: '06',
    dateStr: 'Monday, Oct 06',
    mlBanner: {
      title: 'ML ADAPTIVE ENGINE',
      subPrefix: 'ML Adaptive Pace • ',
      bufferHighlight: '+45m buffer',
      subSuffix: ' inserted...',
    },
    target: {
      completedStr: '1h 30m',
      totalStr: '4h 30m',
      pct: 33,
      remainingStr: '3h 0m',
      status: '⌛ In Progress',
    },
    blocks: [
      {
        id: 101,
        topic_name: 'Data-Structures',
        rag_tag: 'RAG: Core Midterm',
        start_time: '10:00',
        duration_minutes: 90,
        duration_label: '90m',
        completed: true,
        type: 'done',
        badgeColor: '#93C5FD',
        badgeBg: 'rgba(59, 130, 246, 0.2)',
      },
      {
        id: 102,
        topic_name: 'Database Management',
        rag_tag: 'RAG: High Weightage (18 pts)',
        start_time: '02:00',
        duration_minutes: 75,
        duration_label: '1h 15m',
        completed: false,
        type: 'active',
        timerMinutes: 24,
        timerSeconds: 11,
        badgeColor: '#A5B4FC',
        badgeBg: 'rgba(99, 102, 241, 0.25)',
      },
      {
        id: 103,
        topic_name: 'Operating Systems',
        rag_tag: 'RAG: Buffer +45m',
        start_time: '05:00',
        duration_minutes: 105,
        duration_label: '105m',
        completed: false,
        type: 'later',
        icon: '🕒',
        badgeColor: '#93C5FD',
        badgeBg: 'rgba(59, 130, 246, 0.2)',
      },
      {
        id: 104,
        topic_name: 'Revision & Recall',
        rag_tag: 'Networks',
        start_time: '08:30',
        duration_minutes: 45,
        duration_label: '45m',
        completed: false,
        type: 'later',
        icon: '🧠',
        badgeColor: '#C4B5FD',
        badgeBg: 'rgba(139, 92, 246, 0.2)',
      },
    ],
  },
  {
    day: 'TUE',
    num: '07',
    dateStr: 'Tuesday, Oct 07',
    mlBanner: {
      title: 'ML ADAPTIVE ENGINE',
      subPrefix: 'ML Adaptive Pace • ',
      bufferHighlight: 'Spaced Repetition',
      subSuffix: ' prioritized for DP & Architecture',
    },
    target: {
      completedStr: '3h 15m',
      totalStr: '4h 00m',
      pct: 81,
      remainingStr: '45m',
      status: '🔥 On Track',
    },
    blocks: [
      {
        id: 201,
        topic_name: 'Algorithms: Dynamic Programming',
        rag_tag: 'RAG: LeetCode Hard Patterns',
        start_time: '09:30',
        duration_minutes: 90,
        duration_label: '90m',
        completed: true,
        type: 'done',
        badgeColor: '#6EE7B7',
        badgeBg: 'rgba(16, 185, 129, 0.2)',
      },
      {
        id: 202,
        topic_name: 'Computer Architecture',
        rag_tag: 'RAG: Cache Hierarchy & Pipeline',
        start_time: '11:30',
        duration_minutes: 60,
        duration_label: '1h 00m',
        completed: true,
        type: 'done',
        badgeColor: '#93C5FD',
        badgeBg: 'rgba(59, 130, 246, 0.2)',
      },
      {
        id: 203,
        topic_name: 'Software Engineering & CI/CD',
        rag_tag: 'RAG: Midterm Practice',
        start_time: '02:30',
        duration_minutes: 45,
        duration_label: '45m',
        completed: false,
        type: 'active',
        timerMinutes: 18,
        timerSeconds: 45,
        badgeColor: '#A5B4FC',
        badgeBg: 'rgba(99, 102, 241, 0.25)',
      },
      {
        id: 204,
        topic_name: 'Database Query Optimization',
        rag_tag: 'RAG: Indexing & B-Trees',
        start_time: '05:00',
        duration_minutes: 45,
        duration_label: '45m',
        completed: false,
        type: 'later',
        icon: '📊',
        badgeColor: '#C4B5FD',
        badgeBg: 'rgba(139, 92, 246, 0.2)',
      },
    ],
  },
  {
    day: 'WED',
    num: '08',
    dateStr: 'Wednesday, Oct 08',
    mlBanner: {
      title: 'ML ADAPTIVE ENGINE',
      subPrefix: 'ML Adaptive Pace • ',
      bufferHighlight: 'High focus session',
      subSuffix: ' on Deep Learning & Neural Nets',
    },
    target: {
      completedStr: '0h 00m',
      totalStr: '3h 30m',
      pct: 0,
      remainingStr: '3h 30m',
      status: '📅 Scheduled',
    },
    blocks: [
      {
        id: 301,
        topic_name: 'Artificial Intelligence & Neural Nets',
        rag_tag: 'RAG: Backprop & Loss Functions',
        start_time: '10:00',
        duration_minutes: 75,
        duration_label: '1h 15m',
        completed: false,
        type: 'active',
        timerMinutes: 75,
        timerSeconds: 0,
        badgeColor: '#F472B6',
        badgeBg: 'rgba(244, 114, 182, 0.2)',
      },
      {
        id: 302,
        topic_name: 'Calculus & Matrix Algebra',
        rag_tag: 'RAG: Eigenvalues & Vectors',
        start_time: '01:30',
        duration_minutes: 60,
        duration_label: '1h 00m',
        completed: false,
        type: 'later',
        icon: '📐',
        badgeColor: '#93C5FD',
        badgeBg: 'rgba(59, 130, 246, 0.2)',
      },
      {
        id: 303,
        topic_name: 'OS Memory Management',
        rag_tag: 'RAG: Virtual Memory & Paging',
        start_time: '04:00',
        duration_minutes: 45,
        duration_label: '45m',
        completed: false,
        type: 'later',
        icon: '💻',
        badgeColor: '#A5B4FC',
        badgeBg: 'rgba(99, 102, 241, 0.25)',
      },
      {
        id: 304,
        topic_name: 'Evening Flashcard Drill',
        rag_tag: 'RAG: Spaced Recall',
        start_time: '08:00',
        duration_minutes: 30,
        duration_label: '30m',
        completed: false,
        type: 'later',
        icon: '🧠',
        badgeColor: '#C4B5FD',
        badgeBg: 'rgba(139, 92, 246, 0.2)',
      },
    ],
  },
  {
    day: 'THU',
    num: '09',
    dateStr: 'Thursday, Oct 09',
    mlBanner: {
      title: 'ML ADAPTIVE ENGINE',
      subPrefix: 'ML Adaptive Pace • ',
      bufferHighlight: 'Deep Work Sprint',
      subSuffix: ' (Heavy Midterm Coverage)',
    },
    target: {
      completedStr: '2h 00m',
      totalStr: '5h 00m',
      pct: 40,
      remainingStr: '3h 0m',
      status: '⌛ In Progress',
    },
    blocks: [
      {
        id: 401,
        topic_name: 'Computer Networks: TCP/IP',
        rag_tag: 'RAG: Protocol Stack & Handshakes',
        start_time: '09:00',
        duration_minutes: 60,
        duration_label: '1h 00m',
        completed: true,
        type: 'done',
        badgeColor: '#6EE7B7',
        badgeBg: 'rgba(16, 185, 129, 0.2)',
      },
      {
        id: 402,
        topic_name: 'Cybersecurity Fundamentals',
        rag_tag: 'RAG: Cryptography & RSA Keys',
        start_time: '10:30',
        duration_minutes: 60,
        duration_label: '1h 00m',
        completed: true,
        type: 'done',
        badgeColor: '#93C5FD',
        badgeBg: 'rgba(59, 130, 246, 0.2)',
      },
      {
        id: 403,
        topic_name: 'Graph Algorithms: Dijkstra & A*',
        rag_tag: 'RAG: Priority Queue & Heuristics',
        start_time: '02:00',
        duration_minutes: 90,
        duration_label: '1h 30m',
        completed: false,
        type: 'active',
        timerMinutes: 31,
        timerSeconds: 20,
        badgeColor: '#A5B4FC',
        badgeBg: 'rgba(99, 102, 241, 0.25)',
      },
      {
        id: 404,
        topic_name: 'System Design: Load Balancers',
        rag_tag: 'RAG: High Availability & Caching',
        start_time: '06:00',
        duration_minutes: 90,
        duration_label: '1h 30m',
        completed: false,
        type: 'later',
        icon: '⚙️',
        badgeColor: '#C4B5FD',
        badgeBg: 'rgba(139, 92, 246, 0.2)',
      },
    ],
  },
  {
    day: 'FRI',
    num: '10',
    dateStr: 'Friday, Oct 10',
    mlBanner: {
      title: 'ML ADAPTIVE ENGINE',
      subPrefix: 'ML Adaptive Pace • ',
      bufferHighlight: '96% retention',
      subSuffix: ' cleared across all targets! 🌟',
    },
    target: {
      completedStr: '4h 00m',
      totalStr: '4h 00m',
      pct: 100,
      remainingStr: '0m',
      status: '🎉 Completed',
    },
    blocks: [
      {
        id: 501,
        topic_name: 'Full Mock Exam: DSA & OS',
        rag_tag: 'RAG: Comprehensive Assessment',
        start_time: '09:00',
        duration_minutes: 120,
        duration_label: '2h 00m',
        completed: true,
        type: 'done',
        badgeColor: '#6EE7B7',
        badgeBg: 'rgba(16, 185, 129, 0.2)',
      },
      {
        id: 502,
        topic_name: 'Mock Exam Mistake Analysis',
        rag_tag: 'RAG: Weak Area Remediation',
        start_time: '01:00',
        duration_minutes: 60,
        duration_label: '1h 00m',
        completed: true,
        type: 'done',
        badgeColor: '#6EE7B7',
        badgeBg: 'rgba(16, 185, 129, 0.2)',
      },
      {
        id: 503,
        topic_name: 'Web Dev: REST API Security',
        rag_tag: 'RAG: JWT Auth & RBAC',
        start_time: '03:30',
        duration_minutes: 60,
        duration_label: '1h 00m',
        completed: true,
        type: 'done',
        badgeColor: '#6EE7B7',
        badgeBg: 'rgba(16, 185, 129, 0.2)',
      },
    ],
  },
  {
    day: 'SUN',
    num: '12',
    dateStr: 'Sunday, Oct 12',
    mlBanner: {
      title: 'ML ADAPTIVE ENGINE',
      subPrefix: 'ML Adaptive Pace • ',
      bufferHighlight: 'Weekly Synthesis',
      subSuffix: ', Formula Sheet & Roadmap',
    },
    target: {
      completedStr: '0h 00m',
      totalStr: '3h 00m',
      pct: 0,
      remainingStr: '3h 0m',
      status: '⚡ Upcoming Sprint',
    },
    blocks: [
      {
        id: 601,
        topic_name: 'Weekly High-Yield Formula Sheet',
        rag_tag: 'RAG: Cheat-Sheet Master',
        start_time: '10:30',
        duration_minutes: 60,
        duration_label: '1h 00m',
        completed: false,
        type: 'active',
        timerMinutes: 60,
        timerSeconds: 0,
        badgeColor: '#A5B4FC',
        badgeBg: 'rgba(99, 102, 241, 0.25)',
      },
      {
        id: 602,
        topic_name: 'Distributed Systems Basics',
        rag_tag: 'RAG: CAP Theorem & Consensus',
        start_time: '02:00',
        duration_minutes: 75,
        duration_label: '1h 15m',
        completed: false,
        type: 'later',
        icon: '🌐',
        badgeColor: '#93C5FD',
        badgeBg: 'rgba(59, 130, 246, 0.2)',
      },
      {
        id: 603,
        topic_name: 'Weekly Retrospective & Next Week Plan',
        rag_tag: 'RAG: ML Auto-Scheduler',
        start_time: '05:00',
        duration_minutes: 45,
        duration_label: '45m',
        completed: false,
        type: 'later',
        icon: '📋',
        badgeColor: '#C4B5FD',
        badgeBg: 'rgba(139, 92, 246, 0.2)',
      },
    ],
  },
];

export default function PlannerScreen() {
  const { loading, refresh } = usePlanner();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const router = useRouter();

  const isDesktop = width >= 860;

  // Multi-day schedules state
  const [daySchedules, setDaySchedules] = useState<DaySchedule[]>(INITIAL_DAY_SCHEDULES);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);

  // Modal State for Adding Block
  const [modalVisible, setModalVisible] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [newStartTime, setNewStartTime] = useState('03:30');
  const [newDuration, setNewDuration] = useState('60');
  const [newTag, setNewTag] = useState('RAG: Core Midterm');

  const firstName =
    user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'Harsha';

  const currentDayData = daySchedules[selectedDayIdx] || daySchedules[0];

  // Toggle block completion and recalculate daily target
  const handleToggleBlock = (id: number) => {
    setDaySchedules((prev) => {
      const next = prev.map((d, dIdx) => {
        if (dIdx !== selectedDayIdx) return d;
        const updatedBlocks = d.blocks.map((b) =>
          b.id === id ? { ...b, completed: !b.completed } : b
        );
        const totalMinutes = updatedBlocks.reduce((acc, b) => acc + (b.duration_minutes || 60), 0);
        const completedMinutes = updatedBlocks
          .filter((b) => b.completed)
          .reduce((acc, b) => acc + (b.duration_minutes || 60), 0);
        const newPct = totalMinutes > 0 ? Math.round((completedMinutes / totalMinutes) * 100) : 0;
        const compHours = Math.floor(completedMinutes / 60);
        const compMins = completedMinutes % 60;
        const remMinutes = Math.max(totalMinutes - completedMinutes, 0);
        const remHours = Math.floor(remMinutes / 60);
        const remMins = remMinutes % 60;

        return {
          ...d,
          blocks: updatedBlocks,
          target: {
            ...d.target,
            completedStr: `${compHours}h ${compMins > 0 ? `${compMins}m` : '00m'}`,
            pct: newPct,
            remainingStr: `${remHours}h ${remMins > 0 ? `${remMins}m` : '0m'}`,
            status: newPct === 100 ? '🎉 Completed' : newPct > 50 ? '🔥 On Track' : '⌛ In Progress',
          },
        };
      });
      return next;
    });
  };

  // Insert Free Gap into current day schedule
  const handleInsertFreeGap = () => {
    if (currentDayData.freeGapInserted) return;
    const newGapBlock: TimelineItem = {
      id: Date.now(),
      topic_name: 'Quick Quiz Review',
      rag_tag: 'RAG: Rapid Practice',
      start_time: '03:30 PM',
      duration_minutes: 30,
      duration_label: '30m',
      completed: false,
      type: 'later',
      icon: '⚡',
      badgeColor: '#6EE7B7',
      badgeBg: 'rgba(16, 185, 129, 0.2)',
    };

    setDaySchedules((prev) => {
      const next = prev.map((d, dIdx) => {
        if (dIdx !== selectedDayIdx) return d;
        return {
          ...d,
          blocks: [...d.blocks, newGapBlock],
          freeGapInserted: true,
        };
      });
      return next;
    });

    Alert.alert('Success', `Free gap quiz review added to ${currentDayData.day} ${currentDayData.num} schedule!`);
  };

  // Add Custom Study Block to current day
  const handleAddBlock = () => {
    if (!newTopic.trim()) {
      Alert.alert('Validation Error', 'Please enter a topic name.');
      return;
    }
    const mins = parseInt(newDuration, 10) || 60;
    const hours = Math.floor(mins / 60);
    const remainderMins = mins % 60;
    let durStr = `${mins}m`;
    if (hours > 0 && remainderMins > 0) durStr = `${hours}h ${remainderMins}m`;
    else if (hours > 0) durStr = `${hours}h`;

    const newBlock: TimelineItem = {
      id: Date.now(),
      topic_name: newTopic.trim(),
      rag_tag: newTag.trim() || 'RAG: Custom Sprint',
      start_time: newStartTime.trim() || '04:00',
      duration_minutes: mins,
      duration_label: durStr,
      completed: false,
      type: 'later',
      icon: '📝',
      badgeColor: '#A5B4FC',
      badgeBg: 'rgba(99, 102, 241, 0.25)',
    };

    setDaySchedules((prev) => {
      const next = prev.map((d, dIdx) => {
        if (dIdx !== selectedDayIdx) return d;
        const updatedBlocks = [...d.blocks, newBlock];
        const totalMinutes = updatedBlocks.reduce((acc, b) => acc + (b.duration_minutes || 60), 0);
        const completedMinutes = updatedBlocks
          .filter((b) => b.completed)
          .reduce((acc, b) => acc + (b.duration_minutes || 60), 0);
        const newPct = totalMinutes > 0 ? Math.round((completedMinutes / totalMinutes) * 100) : 0;
        const compHours = Math.floor(completedMinutes / 60);
        const compMins = completedMinutes % 60;
        const totHours = Math.floor(totalMinutes / 60);
        const totMins = totalMinutes % 60;
        const remMinutes = Math.max(totalMinutes - completedMinutes, 0);
        const remHours = Math.floor(remMinutes / 60);
        const remMins = remMinutes % 60;

        return {
          ...d,
          blocks: updatedBlocks,
          target: {
            ...d.target,
            completedStr: `${compHours}h ${compMins > 0 ? `${compMins}m` : '00m'}`,
            totalStr: `${totHours}h ${totMins > 0 ? `${totMins}m` : '00m'}`,
            pct: newPct,
            remainingStr: `${remHours}h ${remMins > 0 ? `${remMins}m` : '0m'}`,
          },
        };
      });
      return next;
    });

    setNewTopic('');
    setNewStartTime('03:30');
    setNewDuration('60');
    setModalVisible(false);
    Alert.alert('Success', `Study block added to ${currentDayData.day} ${currentDayData.num} timeline!`);
  };

  return (
    <ImageBackground
      source={require('../../assets/images/calendar-bg.jpg')}
      style={s.bgImage}
      resizeMode="cover"
    >
      <View style={s.bgOverlay} />
      <SafeAreaView style={s.safe} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#070D18" />

        <View style={s.pageWrapper}>
          {/* ══════════════════════════════════════════════════════════════════════
              1. LEFT SIDEBAR (Desktop width >= 860)
          ══════════════════════════════════════════════════════════════════════ */}
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
                  style={s.navItem}
                  onPress={() => router.push('/(tabs)')}
                  activeOpacity={0.7}
                >
                  <Text style={s.navIcon}>🏠</Text>
                  <Text style={s.navLabel}>Today</Text>
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
                  style={[s.navItem, s.navItemActive]}
                  activeOpacity={0.9}
                >
                  <Text style={[s.navIcon, s.navIconActive]}>⚡</Text>
                  <Text style={[s.navLabel, s.navLabelActive]}>Planner</Text>
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

          {/* ══════════════════════════════════════════════════════════════════════
              2. MAIN PLANNER CONTENT
          ══════════════════════════════════════════════════════════════════════ */}
          <ScrollView
            style={s.scroll}
            contentContainerStyle={[s.contentContainer, isDesktop && s.desktopContent]}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#00DFB2" />}
          >
            <View style={[s.innerWrapper, !isDesktop && s.mobileInner]}>
              {/* ── 1. HEADER (Icon + Planner title + subtitle + bell & avatar) ── */}
              <View style={s.header}>
                <View style={s.headerLeft}>
                  <View style={s.appLogoBox}>
                    <Text style={s.appLogoIcon}>📖</Text>
                  </View>
                  <View>
                    <Text style={s.headerTitle}>Planner</Text>
                    <Text style={s.headerSubtitle}>Plan your study, stay consistent, achieve more.</Text>
                  </View>
                </View>

                <View style={s.headerRight}>
                  <TouchableOpacity
                    style={s.iconBtn}
                    activeOpacity={0.8}
                    onPress={() => Alert.alert('Notifications', 'All study goals on track for today.')}
                  >
                    <Text style={{ fontSize: 17 }}>🔔</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => router.push('/(tabs)/profile')}
                    style={s.avatarSmall}
                    activeOpacity={0.8}
                  >
                    <Text style={s.avatarInitial}>{firstName.charAt(0).toUpperCase()}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* ── 2. ML ADAPTIVE ENGINE BANNER ── */}
              <View style={s.adaptiveBanner}>
                <View style={s.adaptiveLeft}>
                  <View style={s.adaptiveIconWrap}>
                    <Text style={{ fontSize: 18 }}>🌸</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={s.adaptiveTitleRow}>
                      <Text style={s.adaptiveTitle}>{currentDayData.mlBanner.title}</Text>
                      <View style={s.onlineDot} />
                    </View>
                    <Text style={s.adaptiveSub}>
                      {currentDayData.mlBanner.subPrefix}
                      <Text style={{ color: '#00DFB2', fontWeight: '700' }}>
                        {currentDayData.mlBanner.bufferHighlight}
                      </Text>
                      {currentDayData.mlBanner.subSuffix}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={s.chevronBtn}
                  onPress={() => Alert.alert('ML Engine Active', `Dynamic pacing calculates retention schedules for ${currentDayData.dateStr}.`)}
                >
                  <Text style={{ color: '#94A3B8', fontSize: 18 }}>⌄</Text>
                </TouchableOpacity>
              </View>

              {/* ── 3. DATE SELECTOR (MON 06, TUE 07, ...) ── */}
              <View style={s.weekRow}>
                {daySchedules.map((item, i) => {
                  const isSelected = i === selectedDayIdx;
                  return (
                    <TouchableOpacity
                      key={item.day}
                      style={[s.dayChip, isSelected ? s.dayChipActive : s.dayChipNormal]}
                      onPress={() => setSelectedDayIdx(i)}
                      activeOpacity={0.85}
                    >
                      <Text style={[s.dayLabel, isSelected ? s.dayLabelActive : s.dayLabelNormal]}>{item.day}</Text>
                      <Text style={[s.dayNum, isSelected ? s.dayNumActive : s.dayNumNormal]}>{item.num}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* ── 4. DAILY TARGET CARD ── */}
              <View style={s.targetCard}>
                <View style={s.targetRow}>
                  <View style={s.targetLeftGroup}>
                    <View style={s.targetIconBox}>
                      <Text style={{ fontSize: 16 }}>🎯</Text>
                    </View>
                    <Text style={s.targetLabel}>Daily Target ({currentDayData.day})</Text>
                  </View>
                  <View style={s.targetRightGroup}>
                    <Text style={s.targetTime}>
                      {currentDayData.target.completedStr} <Text style={s.targetMuted}>/ {currentDayData.target.totalStr}</Text>
                    </Text>
                    <Badge
                      label={`${currentDayData.target.pct}%`}
                      color="#00DFB2"
                      bg="rgba(0, 223, 178, 0.15)"
                      borderColor="rgba(0, 223, 178, 0.3)"
                    />
                  </View>
                </View>
                <View style={{ marginVertical: 14 }}>
                  <ProgressBar pct={currentDayData.target.pct} color="#00DFB2" />
                </View>
                <View style={s.targetBottomRow}>
                  <Text style={s.remainText}>
                    Remaining: {currentDayData.target.remainingStr}
                  </Text>
                  <Text style={s.trackLabel}>{currentDayData.target.status}</Text>
                </View>
              </View>

              {/* ── 5. TIMELINE SECTION HEADER ── */}
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>TIMELINE</Text>
                <Text style={s.sectionMeta}>
                  {currentDayData.blocks.length} Blocks {currentDayData.day === 'MON' ? 'Today' : `on ${currentDayData.day}`}
                </Text>
              </View>

              {/* ── 6. TIMELINE BLOCKS (DYNAMIC PER SELECTED DAY) ── */}
              <View style={s.timelineList}>
                {currentDayData.blocks.map((block) => {
                  // Block Type 1: Completed
                  if (block.completed) {
                    return (
                      <TouchableOpacity
                        key={block.id}
                        style={tb.doneCard}
                        onPress={() => handleToggleBlock(block.id)}
                        activeOpacity={0.8}
                      >
                        <View style={tb.doneLeft}>
                          <View style={tb.doneCheckWrap}>
                            <Text style={{ color: '#00DFB2', fontSize: 13, fontWeight: '900' }}>✓</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <Text style={tb.doneName}>{block.topic_name}</Text>
                              {block.rag_tag && (
                                <Badge
                                  label={block.rag_tag}
                                  color={block.badgeColor || '#93C5FD'}
                                  bg={block.badgeBg || 'rgba(59, 130, 246, 0.2)'}
                                />
                              )}
                            </View>
                            <Text style={tb.doneTime}>
                              {block.start_time} • {block.duration_label || `${block.duration_minutes}m`}
                            </Text>
                          </View>
                        </View>
                        <Text style={tb.doneStatusText}>Done</Text>
                      </TouchableOpacity>
                    );
                  }

                  // Block Type 2: Active Sprint
                  if (block.type === 'active') {
                    return (
                      <View key={block.id} style={tb.activeCard}>
                        <View style={tb.activeTopRow}>
                          <View style={tb.activeBadgeWrap}>
                            <View style={tb.activeGreenDot} />
                            <Text style={tb.activeBadgeText}>ACTIVE SPRINT</Text>
                          </View>
                          {block.rag_tag && (
                            <Badge
                              label={block.rag_tag}
                              color={block.badgeColor || '#A5B4FC'}
                              bg={block.badgeBg || 'rgba(99, 102, 241, 0.25)'}
                            />
                          )}
                        </View>
                        <View style={tb.activeRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={tb.activeName}>{block.topic_name}</Text>
                            <Text style={tb.activeTime}>
                              {block.start_time} • {block.duration_label || `${block.duration_minutes}m`}
                            </Text>
                          </View>
                          <TouchableOpacity onPress={() => handleToggleBlock(block.id)} activeOpacity={0.8}>
                            <CountdownTimer
                              initialMinutes={block.timerMinutes || 24}
                              initialSeconds={block.timerSeconds || 11}
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  }

                  // Block Type 3: Later / Scheduled
                  return (
                    <TouchableOpacity
                      key={block.id}
                      style={tb.laterCard}
                      onPress={() => handleToggleBlock(block.id)}
                      activeOpacity={0.8}
                    >
                      <View style={tb.laterLeft}>
                        <View style={tb.laterIconBox}>
                          <Text style={{ fontSize: 16 }}>{block.icon || '🕒'}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <Text style={tb.laterName}>{block.topic_name}</Text>
                            {block.rag_tag && (
                              <Badge
                                label={block.rag_tag}
                                color={block.badgeColor || '#93C5FD'}
                                bg={block.badgeBg || 'rgba(59, 130, 246, 0.2)'}
                              />
                            )}
                          </View>
                          <Text style={tb.laterTime}>
                            {block.start_time} • {block.duration_label || `${block.duration_minutes}m`}
                          </Text>
                        </View>
                      </View>
                      <Text style={tb.laterStatusText}>Later</Text>
                    </TouchableOpacity>
                  );
                })}

                {/* Free gap row for current day */}
                {!currentDayData.freeGapInserted && (
                  <TouchableOpacity style={tb.freeGapCard} onPress={handleInsertFreeGap} activeOpacity={0.8}>
                    <View style={tb.freeGapLeft}>
                      <View style={tb.freeGapPlusCircle}>
                        <Text style={{ color: '#00DFB2', fontSize: 16, fontWeight: '800' }}>+</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={tb.freeGapTitle}>Free gap: 03:30 PM (30m)</Text>
                        <Text style={tb.freeGapHint}>Tap to insert quick quiz review</Text>
                      </View>
                    </View>
                    <Text style={tb.insertLabel}>Insert</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* ── 7. ADD BLOCK BUTTON (Floating / Right aligned pill) ── */}
              <View style={s.fabWrapper}>
                <TouchableOpacity
                  style={s.fab}
                  activeOpacity={0.85}
                  onPress={() => setModalVisible(true)}
                >
                  <Text style={s.fabPlusIcon}>+</Text>
                  <Text style={s.fabText}>Add Block</Text>
                </TouchableOpacity>
              </View>

              <View style={{ height: 40 }} />
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>

      {/* ── ADD STUDY BLOCK MODAL ── */}
      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>⚡ Add Study Block</Text>
            
            <Text style={s.inputLabel}>TOPIC / TASK NAME *</Text>
            <TextInput
              style={s.modalInput}
              placeholder="e.g. Graph Algorithms & Shortest Path"
              placeholderTextColor="#64748B"
              value={newTopic}
              onChangeText={setNewTopic}
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={s.inputLabel}>START TIME</Text>
                <TextInput
                  style={s.modalInput}
                  placeholder="03:30 PM"
                  placeholderTextColor="#64748B"
                  value={newStartTime}
                  onChangeText={setNewStartTime}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.inputLabel}>DURATION (MINS)</Text>
                <TextInput
                  style={s.modalInput}
                  placeholder="60"
                  keyboardType="numeric"
                  placeholderTextColor="#64748B"
                  value={newDuration}
                  onChangeText={setNewDuration}
                />
              </View>
            </View>

            <Text style={[s.inputLabel, { marginTop: 12 }]}>RAG / REVISION TAG</Text>
            <TextInput
              style={s.modalInput}
              placeholder="e.g. RAG: Core Midterm"
              placeholderTextColor="#64748B"
              value={newTag}
              onChangeText={setNewTag}
            />

            <View style={s.modalActions}>
              <TouchableOpacity
                style={s.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.saveBtn}
                onPress={handleAddBlock}
              >
                <Text style={s.saveBtnText}>Save Block</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

// ── Timeline block styles ────────────────────────────────────────────────────
const tb = StyleSheet.create({
  // Active Sprint (Glowing Cyan Card)
  activeCard: {
    backgroundColor: 'rgba(8, 28, 36, 0.82)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#00DFB2',
    shadowColor: '#00DFB2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(16px)' } as any) : {}),
  },
  activeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  activeBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 99,
    backgroundColor: '#00DFB2',
  },
  activeBadgeText: {
    color: '#00DFB2',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.6,
  },
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  activeTime: {
    color: '#8E9BAE',
    fontSize: 12.5,
    marginTop: 2,
    fontWeight: '500',
  },

  // Done Block
  doneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(10, 20, 36, 0.72)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(30, 41, 59, 0.7)',
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(16px)' } as any) : {}),
  },
  doneLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  doneCheckWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 223, 178, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 223, 178, 0.35)',
  },
  doneName: {
    color: '#E2E8F0',
    fontWeight: '700',
    fontSize: 14,
  },
  doneTime: {
    color: '#8E9BAE',
    fontSize: 12,
    marginTop: 2,
  },
  doneStatusText: {
    color: '#00DFB2',
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 8,
  },

  // Later Block
  laterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(10, 20, 36, 0.72)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(30, 41, 59, 0.7)',
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(16px)' } as any) : {}),
  },
  laterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  laterIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  laterName: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  laterTime: {
    color: '#8E9BAE',
    fontSize: 12,
    marginTop: 2,
  },
  laterStatusText: {
    color: '#8E9BAE',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Free gap
  freeGapCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 223, 178, 0.4)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(0, 223, 178, 0.05)',
  },
  freeGapLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  freeGapPlusCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 223, 178, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  freeGapTitle: {
    color: '#E2E8F0',
    fontWeight: '700',
    fontSize: 13.5,
  },
  freeGapHint: {
    color: '#8E9BAE',
    fontSize: 12,
    marginTop: 1,
  },
  insertLabel: {
    color: '#00DFB2',
    fontWeight: '800',
    fontSize: 13.5,
    marginLeft: 8,
  },
});

// ── Screen styles ─────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  bgImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#070D18',
  },
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 13, 24, 0.65)',
  },
  safe: {
    flex: 1,
  },
  pageWrapper: {
    flex: 1,
    flexDirection: 'row',
  },

  // ── Desktop Sidebar ────────────────────────────────────────────────────────
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
  logoIcon: {
    fontSize: 18,
  },
  logoTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 17,
    letterSpacing: -0.2,
  },
  logoSubtitle: {
    color: '#00DFB2',
    fontSize: 10.5,
    fontWeight: '600',
  },
  navMenu: {
    gap: 6,
  },
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
  navIcon: {
    fontSize: 16,
    opacity: 0.7,
  },
  navIconActive: {
    opacity: 1,
  },
  navLabel: {
    color: '#8E9BAE',
    fontSize: 13.5,
    fontWeight: '600',
  },
  navLabelActive: {
    color: '#00DFB2',
    fontWeight: '700',
  },

  // ── Scroll & Content Layout ────────────────────────────────────────────────
  scroll: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  desktopContent: {
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 32,
  },
  innerWrapper: {
    width: '100%',
    maxWidth: 720,
  },
  mobileInner: {
    maxWidth: '100%',
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  appLogoBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#1E40AF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  appLogoIcon: {
    fontSize: 20,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    color: '#8E9BAE',
    fontSize: 12,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  avatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },

  // ── ML Adaptive Engine Banner ──
  adaptiveBanner: {
    backgroundColor: 'rgba(10, 32, 28, 0.65)',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 223, 178, 0.25)',
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(16px)' } as any) : {}),
  },
  adaptiveLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  adaptiveIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 223, 178, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adaptiveTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  adaptiveTitle: {
    color: '#00DFB2',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 99,
    backgroundColor: '#00DFB2',
  },
  adaptiveSub: {
    color: '#CBD5E1',
    fontSize: 12,
    marginTop: 1,
    fontWeight: '500',
  },
  chevronBtn: {
    padding: 4,
  },

  // ── Date Selector Row ──
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  dayChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    maxWidth: 70,
  },
  dayChipActive: {
    backgroundColor: '#00DFB2',
    shadowColor: '#00DFB2',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  dayChipNormal: {
    backgroundColor: 'rgba(10, 20, 36, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(30, 41, 59, 0.7)',
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(16px)' } as any) : {}),
  },
  dayLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  dayLabelActive: {
    color: '#071615',
  },
  dayLabelNormal: {
    color: '#8E9BAE',
  },
  dayNum: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  dayNumActive: {
    color: '#071615',
  },
  dayNumNormal: {
    color: '#FFFFFF',
  },

  // ── Target Card ──
  targetCard: {
    backgroundColor: 'rgba(10, 20, 36, 0.72)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(30, 41, 59, 0.7)',
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(16px)' } as any) : {}),
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  targetLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  targetIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 223, 178, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 223, 178, 0.3)',
  },
  targetLabel: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14.5,
  },
  targetRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  targetTime: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13.5,
  },
  targetMuted: {
    color: '#8E9BAE',
    fontWeight: '500',
  },
  targetBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  remainText: {
    color: '#8E9BAE',
    fontSize: 12,
    fontWeight: '500',
  },
  trackLabel: {
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: '700',
  },

  // ── Section Header ──
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#8E9BAE',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  sectionMeta: {
    color: '#8E9BAE',
    fontSize: 12,
    fontWeight: '600',
  },

  // ── Timeline list ──
  timelineList: {
    gap: 10,
    marginBottom: 16,
  },

  // ── Add Block Floating Button ──
  fabWrapper: {
    alignItems: 'flex-end',
    marginTop: 4,
  },
  fab: {
    backgroundColor: '#6366F1',
    borderRadius: 99,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    elevation: 5,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  fabPlusIcon: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
    lineHeight: 16,
  },
  fabText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13.5,
  },

  // ── Modal Styles ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 460,
    borderWidth: 1,
    borderColor: 'rgba(0, 223, 178, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 16,
  },
  inputLabel: {
    color: '#8E9BAE',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...(Platform.OS === 'web' ? ({ outline: 'none' } as any) : {}),
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#8E9BAE',
    fontWeight: '700',
    fontSize: 13.5,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: '#00DFB2',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#071615',
    fontWeight: '800',
    fontSize: 13.5,
  },
});
