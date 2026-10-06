import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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
import { ExamService } from '../../services/exams';
import { AssignmentService } from '../../services/assignments';
import { Exam } from '../../types/exam';
import { Assignment } from '../../types/assignment';

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

// ── Types for Planner Calendar & Timeline ───────────────────────────────────
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

interface CalendarEventItem {
  id: string | number;
  type: 'exam' | 'assignment' | 'task';
  title: string;
  subject: string;
  dateStr: string; // YYYY-MM-DD
  timeStr?: string;
  locationOrDetails?: string;
  weightage?: string;
}

interface DayData {
  dateISO: string; // YYYY-MM-DD
  dayOfWeek: string;
  dayNumber: number;
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

// ── Known Academic Calendar Events (Exams & Assignments) ─────────────────────
const ACADEMIC_EVENTS: CalendarEventItem[] = [
  // Exams
  {
    id: 'exam-1',
    type: 'exam',
    title: 'Database Management Systems Midterm',
    subject: 'Database Systems',
    dateStr: '2026-10-09',
    timeStr: '10:00 AM - 12:00 PM',
    locationOrDetails: 'Examination Hall 3B • Closed Book',
    weightage: '20% Semester Weight',
  },
  {
    id: 'exam-2',
    type: 'exam',
    title: 'Machine Learning Model Assessment',
    subject: 'Machine Learning',
    dateStr: '2026-10-13',
    timeStr: '02:00 PM - 04:30 PM',
    locationOrDetails: 'AI Computing Lab A',
    weightage: '25% Semester Weight',
  },
  {
    id: 'exam-3',
    type: 'exam',
    title: 'Computer Networks Practical Lab Exam',
    subject: 'Computer Networks',
    dateStr: '2026-10-16',
    timeStr: '11:00 AM - 01:00 PM',
    locationOrDetails: 'Networks & Systems Lab',
    weightage: '15% Practical Weight',
  },
  {
    id: 'exam-4',
    type: 'exam',
    title: 'Data Structures & Algorithms Semester Final',
    subject: 'Algorithms',
    dateStr: '2026-10-24',
    timeStr: '09:00 AM - 12:00 PM',
    locationOrDetails: 'Main Auditorium',
    weightage: '35% Final Weight',
  },
  {
    id: 'exam-5',
    type: 'exam',
    title: 'Operating Systems Theory Assessment',
    subject: 'Operating Systems',
    dateStr: '2026-10-28',
    timeStr: '02:00 PM - 05:00 PM',
    locationOrDetails: 'Engineering Hall 1A',
    weightage: '30% Final Weight',
  },

  // Assignments
  {
    id: 'asg-1',
    type: 'assignment',
    title: 'OS Kernel Synchronization & Lock Lab',
    subject: 'Operating Systems',
    dateStr: '2026-10-07',
    timeStr: 'Due 11:59 PM',
    locationOrDetails: '50 Points • GitHub Classroom Submission',
    weightage: 'Hard Deadline',
  },
  {
    id: 'asg-2',
    type: 'assignment',
    title: 'Distributed Systems MapReduce Project',
    subject: 'Distributed Systems',
    dateStr: '2026-10-10',
    timeStr: 'Due 05:00 PM',
    locationOrDetails: '100 Points • Code & Benchmark Report',
    weightage: 'Group Project',
  },
  {
    id: 'asg-3',
    type: 'assignment',
    title: 'DSA Graph & Dynamic Programming Problem Set',
    subject: 'Algorithms',
    dateStr: '2026-10-11',
    timeStr: 'Due 11:59 PM',
    locationOrDetails: '30 Points • LeetCode Hard Patterns',
    weightage: 'Individual Pset',
  },
  {
    id: 'asg-4',
    type: 'assignment',
    title: 'Database Query Optimization & B-Tree Indexing',
    subject: 'Database Systems',
    dateStr: '2026-10-15',
    timeStr: 'Due 06:00 PM',
    locationOrDetails: '40 Points • SQL Query Plan Analysis',
    weightage: 'Lab Work',
  },
  {
    id: 'asg-5',
    type: 'assignment',
    title: 'Computer Vision & CNN Classification Notebook',
    subject: 'Machine Learning',
    dateStr: '2026-10-20',
    timeStr: 'Due 11:59 PM',
    locationOrDetails: '60 Points • PyTorch ResNet Model',
    weightage: 'Term Project',
  },
  {
    id: 'asg-6',
    type: 'assignment',
    title: 'Software Engineering Sprint Retrospective Report',
    subject: 'Software Engineering',
    dateStr: '2026-10-27',
    timeStr: 'Due 04:00 PM',
    locationOrDetails: '25 Points • Agile Review PDF',
    weightage: 'Weekly Deliverable',
  },
];

// Pre-built base schedules for key dates
const PREBUILT_SCHEDULES: Record<string, Partial<DayData>> = {
  '2026-10-06': {
    mlBanner: {
      title: 'ML ADAPTIVE ENGINE',
      subPrefix: 'ML Adaptive Pace • ',
      bufferHighlight: '+45m buffer',
      subSuffix: ' inserted before OS Lab deadline...',
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
        topic_name: 'Data-Structures: Graph Traversals',
        rag_tag: 'RAG: Core Midterm',
        start_time: '10:00 AM',
        duration_minutes: 90,
        duration_label: '90m',
        completed: true,
        type: 'done',
        badgeColor: '#93C5FD',
        badgeBg: 'rgba(59, 130, 246, 0.2)',
      },
      {
        id: 102,
        topic_name: 'Database Management: B-Trees',
        rag_tag: 'RAG: High Weightage (18 pts)',
        start_time: '02:00 PM',
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
        topic_name: 'Operating Systems: Kernel Locks',
        rag_tag: 'RAG: Buffer +45m',
        start_time: '05:00 PM',
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
        topic_name: 'Revision & Recall: Spaced Quizzes',
        rag_tag: 'Networks',
        start_time: '08:30 PM',
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
  '2026-10-07': {
    mlBanner: {
      title: 'ML ADAPTIVE ENGINE',
      subPrefix: 'ML Adaptive Pace • ',
      bufferHighlight: '🚨 Assignment Deadline Today',
      subSuffix: ' (OS Kernel Lab due 11:59 PM)',
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
        topic_name: 'OS Kernel Synchronization Code Polish',
        rag_tag: 'RAG: Final Lab Submission',
        start_time: '09:30 AM',
        duration_minutes: 90,
        duration_label: '90m',
        completed: true,
        type: 'done',
        badgeColor: '#6EE7B7',
        badgeBg: 'rgba(16, 185, 129, 0.2)',
      },
      {
        id: 202,
        topic_name: 'Computer Architecture & Cache Hierarchy',
        rag_tag: 'RAG: Pipeline Hazards',
        start_time: '11:30 AM',
        duration_minutes: 60,
        duration_label: '1h 00m',
        completed: true,
        type: 'done',
        badgeColor: '#93C5FD',
        badgeBg: 'rgba(59, 130, 246, 0.2)',
      },
      {
        id: 203,
        topic_name: 'Database Indexing & Query Plans',
        rag_tag: 'RAG: Midterm Prep',
        start_time: '02:30 PM',
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
        topic_name: 'OS Lab Final Verification & Push',
        rag_tag: 'Assignment Due',
        start_time: '05:00 PM',
        duration_minutes: 45,
        duration_label: '45m',
        completed: false,
        type: 'later',
        icon: '📝',
        badgeColor: '#F87171',
        badgeBg: 'rgba(239, 68, 68, 0.2)',
      },
    ],
  },
  '2026-10-09': {
    mlBanner: {
      title: 'ML ADAPTIVE ENGINE',
      subPrefix: 'ML Adaptive Pace • ',
      bufferHighlight: '🚨 MIDTERM EXAM TODAY',
      subSuffix: ' — Database Management Systems (10:00 AM)',
    },
    target: {
      completedStr: '2h 00m',
      totalStr: '5h 00m',
      pct: 40,
      remainingStr: '3h 0m',
      status: '⚡ Exam Day Focus',
    },
    blocks: [
      {
        id: 401,
        topic_name: 'Morning Exam Warmup & SQL Formula Recap',
        rag_tag: 'RAG: Final Recall',
        start_time: '08:30 AM',
        duration_minutes: 60,
        duration_label: '1h 00m',
        completed: true,
        type: 'done',
        badgeColor: '#FBBF24',
        badgeBg: 'rgba(245, 158, 11, 0.2)',
      },
      {
        id: 402,
        topic_name: 'DATABASE MIDTERM EXAM SESSION',
        rag_tag: 'EXAM • Hall 3B',
        start_time: '10:00 AM',
        duration_minutes: 120,
        duration_label: '2h 00m',
        completed: true,
        type: 'done',
        badgeColor: '#F87171',
        badgeBg: 'rgba(239, 68, 68, 0.25)',
      },
      {
        id: 403,
        topic_name: 'Post-Exam Decompression & Networks Review',
        rag_tag: 'RAG: TCP/IP Stack',
        start_time: '03:00 PM',
        duration_minutes: 60,
        duration_label: '1h 00m',
        completed: false,
        type: 'active',
        timerMinutes: 30,
        timerSeconds: 0,
        badgeColor: '#93C5FD',
        badgeBg: 'rgba(59, 130, 246, 0.2)',
      },
    ],
  },
  '2026-10-10': {
    mlBanner: {
      title: 'ML ADAPTIVE ENGINE',
      subPrefix: 'ML Adaptive Pace • ',
      bufferHighlight: '📝 Project Due Today',
      subSuffix: ' (Distributed Systems MapReduce)',
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
        topic_name: 'MapReduce Cluster Benchmarking & Test Runs',
        rag_tag: 'Project Deadline',
        start_time: '09:00 AM',
        duration_minutes: 120,
        duration_label: '2h 00m',
        completed: true,
        type: 'done',
        badgeColor: '#6EE7B7',
        badgeBg: 'rgba(16, 185, 129, 0.2)',
      },
      {
        id: 502,
        topic_name: 'DSA LeetCode Hard Patterns & DP Drill',
        rag_tag: 'RAG: Dynamic Programming',
        start_time: '01:00 PM',
        duration_minutes: 60,
        duration_label: '1h 00m',
        completed: true,
        type: 'done',
        badgeColor: '#6EE7B7',
        badgeBg: 'rgba(16, 185, 129, 0.2)',
      },
    ],
  },
};

// Generate dynamic day data for any selected date
function getDayDataForDate(dateISO: string, customSchedules: Record<string, Partial<DayData>>): DayData {
  const dateObj = new Date(dateISO);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayOfWeek = dayNames[dateObj.getDay()];
  const dayNumber = dateObj.getDate();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dateStr = `${dayOfWeek}, ${monthNames[dateObj.getMonth()]} ${String(dayNumber).padStart(2, '0')}`;

  const hasExam = ACADEMIC_EVENTS.some((e) => e.type === 'exam' && e.dateStr === dateISO);
  const hasAsg = ACADEMIC_EVENTS.some((e) => e.type === 'assignment' && e.dateStr === dateISO);

  if (customSchedules[dateISO]) {
    const custom = customSchedules[dateISO];
    return {
      dateISO,
      dayOfWeek,
      dayNumber,
      dateStr,
      mlBanner: custom.mlBanner || {
        title: 'ML ADAPTIVE ENGINE',
        subPrefix: 'ML Adaptive Pace • ',
        bufferHighlight: hasExam ? '🚨 High Intensity Exam Day' : hasAsg ? '⚡ Assignment Deadline Pace' : 'Optimal Retention Schedule',
        subSuffix: ` active for ${dateStr}.`,
      },
      target: custom.target || {
        completedStr: '1h 30m',
        totalStr: '4h 00m',
        pct: 38,
        remainingStr: '2h 30m',
        status: '⌛ In Progress',
      },
      blocks: (custom.blocks as TimelineItem[]) || [],
      freeGapInserted: custom.freeGapInserted,
    };
  }

  // Auto-generated schedule for standard dates
  return {
    dateISO,
    dayOfWeek,
    dayNumber,
    dateStr,
    mlBanner: {
      title: 'ML ADAPTIVE ENGINE',
      subPrefix: 'ML Adaptive Pace • ',
      bufferHighlight: hasExam ? '🚨 Exam Focused Schedule' : hasAsg ? '⚡ Assignment Delivery Track' : '+30m Spaced Repetition',
      subSuffix: ` aligned with semester curriculum targets.`,
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
        id: Math.floor(Math.random() * 100000),
        topic_name: hasExam
          ? 'Exam Preparation & High-Yield Summary'
          : hasAsg
          ? 'Assignment Problem Solving & Implementation'
          : 'Core Curriculum Deep Work Session',
        rag_tag: hasExam ? 'RAG: High Weightage' : 'RAG: Core Concept',
        start_time: '10:00 AM',
        duration_minutes: 90,
        duration_label: '1h 30m',
        completed: false,
        type: 'active',
        timerMinutes: 90,
        timerSeconds: 0,
        badgeColor: '#A5B4FC',
        badgeBg: 'rgba(99, 102, 241, 0.25)',
      },
      {
        id: Math.floor(Math.random() * 100000) + 1,
        topic_name: 'Practice Problem Drill & Active Recall Quiz',
        rag_tag: 'RAG: Spaced Repetition',
        start_time: '02:30 PM',
        duration_minutes: 60,
        duration_label: '1h 00m',
        completed: false,
        type: 'later',
        icon: '🧠',
        badgeColor: '#93C5FD',
        badgeBg: 'rgba(59, 130, 246, 0.2)',
      },
      {
        id: Math.floor(Math.random() * 100000) + 2,
        topic_name: 'Summary Notes Synthesis & Concept Check',
        rag_tag: 'Review',
        start_time: '05:00 PM',
        duration_minutes: 45,
        duration_label: '45m',
        completed: false,
        type: 'later',
        icon: '📋',
        badgeColor: '#C4B5FD',
        badgeBg: 'rgba(139, 92, 246, 0.2)',
      },
    ],
  };
}

export default function PlannerScreen() {
  const { loading, refresh } = usePlanner();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const router = useRouter();

  const isDesktop = width >= 860;

  // Calendar State: October 2026 (Month is 9 in 0-indexed JS Date)
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(9); // October
  const [selectedDateISO, setSelectedDateISO] = useState('2026-10-06');

  // Schedules state per date
  const [schedulesMap, setSchedulesMap] = useState<Record<string, Partial<DayData>>>(PREBUILT_SCHEDULES);

  // Modal State for Adding Block
  const [modalVisible, setModalVisible] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [newStartTime, setNewStartTime] = useState('03:30 PM');
  const [newDuration, setNewDuration] = useState('60');
  const [newTag, setNewTag] = useState('RAG: Core Midterm');

  const firstName =
    user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'Harsha';

  const currentDayData = getDayDataForDate(selectedDateISO, schedulesMap);

  // Events on the currently selected date
  const dayEvents = ACADEMIC_EVENTS.filter((e) => e.dateStr === selectedDateISO);
  const examEvents = dayEvents.filter((e) => e.type === 'exam');
  const assignmentEvents = dayEvents.filter((e) => e.type === 'assignment');

  // Calendar matrix calculations
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleJumpToToday = () => {
    setCurrentYear(2026);
    setCurrentMonth(9);
    setSelectedDateISO('2026-10-06');
  };

  // Toggle block completion and recalculate daily target
  const handleToggleBlock = (id: number) => {
    const updatedBlocks = currentDayData.blocks.map((b) =>
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

    setSchedulesMap((prev) => ({
      ...prev,
      [selectedDateISO]: {
        ...prev[selectedDateISO],
        blocks: updatedBlocks,
        target: {
          completedStr: `${compHours}h ${compMins > 0 ? `${compMins}m` : '00m'}`,
          totalStr: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60 > 0 ? `${totalMinutes % 60}m` : '00m'}`,
          pct: newPct,
          remainingStr: `${remHours}h ${remMins > 0 ? `${remMins}m` : '0m'}`,
          status: newPct === 100 ? '🎉 Completed' : newPct > 50 ? '🔥 On Track' : '⌛ In Progress',
        },
      },
    }));
  };

  // Insert Free Gap Quiz
  const handleInsertFreeGap = () => {
    const newBlock: TimelineItem = {
      id: Date.now(),
      topic_name: 'Rapid Fire Quiz: Neural Networks & Paging',
      rag_tag: 'RAG: Quick Recall (+30m)',
      start_time: '03:30 PM',
      duration_minutes: 30,
      duration_label: '30m',
      completed: false,
      type: 'later',
      icon: '⚡',
      badgeColor: '#6EE7B7',
      badgeBg: 'rgba(16, 185, 129, 0.2)',
    };

    const updatedBlocks = [...currentDayData.blocks, newBlock];
    const totalMinutes = updatedBlocks.reduce((acc, b) => acc + (b.duration_minutes || 60), 0);
    const completedMinutes = updatedBlocks
      .filter((b) => b.completed)
      .reduce((acc, b) => acc + (b.duration_minutes || 60), 0);
    const newPct = totalMinutes > 0 ? Math.round((completedMinutes / totalMinutes) * 100) : 0;

    setSchedulesMap((prev) => ({
      ...prev,
      [selectedDateISO]: {
        ...prev[selectedDateISO],
        blocks: updatedBlocks,
        freeGapInserted: true,
        target: {
          ...currentDayData.target,
          totalStr: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60 > 0 ? `${totalMinutes % 60}m` : '00m'}`,
          pct: newPct,
        },
      },
    }));

    Alert.alert('Buffer Inserted', '30-minute Rapid Fire Quiz added to your timeline for this day!');
  };

  // Add Custom Study Block
  const handleAddBlock = () => {
    if (!newTopic.trim()) {
      Alert.alert('Missing Field', 'Please enter a topic name.');
      return;
    }
    const durNum = parseInt(newDuration, 10) || 60;
    const newBlock: TimelineItem = {
      id: Date.now(),
      topic_name: newTopic.trim(),
      rag_tag: newTag.trim() || 'Custom Session',
      start_time: newStartTime.trim() || '04:00 PM',
      duration_minutes: durNum,
      duration_label: `${durNum}m`,
      completed: false,
      type: 'later',
      icon: '🎯',
      badgeColor: '#A5B4FC',
      badgeBg: 'rgba(99, 102, 241, 0.25)',
    };

    const updatedBlocks = [...currentDayData.blocks, newBlock];
    setSchedulesMap((prev) => ({
      ...prev,
      [selectedDateISO]: {
        ...prev[selectedDateISO],
        blocks: updatedBlocks,
      },
    }));

    setNewTopic('');
    setModalVisible(false);
    Alert.alert('Study Block Added', `Added "${newBlock.topic_name}" to your schedule for ${currentDayData.dateStr}.`);
  };

  // Build Calendar Cells Array
  const calendarCells = [];
  // Blank prefix days
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push({ key: `blank-${i}`, isBlank: true });
  }
  // Days of current month
  for (let d = 1; d <= daysInMonth; d++) {
    const monthStr = String(currentMonth + 1).padStart(2, '0');
    const dayStr = String(d).padStart(2, '0');
    const cellDateISO = `${currentYear}-${monthStr}-${dayStr}`;

    const hasExam = ACADEMIC_EVENTS.some((e) => e.type === 'exam' && e.dateStr === cellDateISO);
    const hasAssignment = ACADEMIC_EVENTS.some((e) => e.type === 'assignment' && e.dateStr === cellDateISO);
    const isSelected = cellDateISO === selectedDateISO;
    const isToday = cellDateISO === '2026-10-06';

    calendarCells.push({
      key: cellDateISO,
      isBlank: false,
      dayNum: d,
      dateISO: cellDateISO,
      hasExam,
      hasAssignment,
      isSelected,
      isToday,
    });
  }

  return (
    <ImageBackground
      source={require('../../assets/images/calendar-bg.jpg')}
      style={s.bgImage}
      resizeMode="cover"
    >
      <View style={s.bgOverlay} />

      <SafeAreaView edges={['top']} style={s.safe}>
        <StatusBar barStyle="light-content" backgroundColor="#070D18" />

        <View style={s.pageWrapper}>
          {/* ── 1. LEFT SIDEBAR (Desktop width >= 860) ── */}
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
                  <Text style={s.logoSubtitle}>AI Learning OS</Text>
                </View>
              </TouchableOpacity>

              <View style={s.navMenu}>
                <TouchableOpacity style={s.navItem} onPress={() => router.push('/(tabs)')}>
                  <Text style={s.navIcon}>🏠</Text>
                  <Text style={s.navLabel}>Today</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.navItem} onPress={() => router.push('/(tabs)/subjects')}>
                  <Text style={s.navIcon}>📚</Text>
                  <Text style={s.navLabel}>Subjects</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.navItem, s.navItemActive]} onPress={() => router.push('/(tabs)/planner')}>
                  <Text style={[s.navIcon, s.navIconActive]}>⚡</Text>
                  <Text style={[s.navLabel, s.navLabelActive]}>Planner</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.navItem} onPress={() => router.push('/(tabs)/docuquery')}>
                  <Text style={s.navIcon}>📑</Text>
                  <Text style={s.navLabel}>DocuQuery AI</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.navItem} onPress={() => router.push('/(tabs)/calendar')}>
                  <Text style={s.navIcon}>📅</Text>
                  <Text style={s.navLabel}>Calendar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.navItem} onPress={() => router.push('/(tabs)/progress')}>
                  <Text style={s.navIcon}>📊</Text>
                  <Text style={s.navLabel}>Progress</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.navItem} onPress={() => router.push('/(tabs)/profile')}>
                  <Text style={s.navIcon}>👤</Text>
                  <Text style={s.navLabel}>Profile</Text>
                </TouchableOpacity>
              </View>

              <View style={s.sidebarSpacer} />

              <View style={s.sidebarFooter}>
                <View style={s.avatarBox}>
                  <Text style={s.avatarBoxText}>{firstName.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.sidebarUserName} numberOfLines={1}>
                    {user?.displayName || 'Harsha'}
                  </Text>
                  <Text style={s.sidebarUserRole}>Student • Pro</Text>
                </View>
              </View>
            </View>
          )}

          {/* ── 2. MAIN SCROLLABLE CONTENT ── */}
          <ScrollView
            style={s.mainContent}
            contentContainerStyle={s.mainScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={[s.innerWrapper, !isDesktop && s.mobileInner]}>
              {/* ── 1. HEADER ── */}
              <View style={s.header}>
                <View style={s.headerLeft}>
                  <View style={s.appLogoBox}>
                    <Text style={s.appLogoIcon}>📖</Text>
                  </View>
                  <View>
                    <Text style={s.headerTitle}>Planner & Academic Calendar</Text>
                    <Text style={s.headerSubtitle}>
                      Interactive monthly planner with marked exam dates & assignment deadlines.
                    </Text>
                  </View>
                </View>

                <View style={s.headerRight}>
                  <TouchableOpacity
                    style={s.todayJumpBtn}
                    onPress={handleJumpToToday}
                    activeOpacity={0.8}
                  >
                    <Text style={s.todayJumpText}>🎯 Today</Text>
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

              {/* ── 2. COMPLETE MONTHLY CALENDAR GRID ── */}
              <View style={calS.calendarCard}>
                {/* Calendar Navigation Header */}
                <View style={calS.calHeaderRow}>
                  <View style={calS.monthTitleGroup}>
                    <Text style={calS.monthTitle}>
                      {monthNames[currentMonth]} {currentYear}
                    </Text>
                    <Text style={calS.calSubText}>
                      Select a date to inspect exams, assignments, & study blocks
                    </Text>
                  </View>

                  <View style={calS.navBtnsRow}>
                    <TouchableOpacity
                      style={calS.navArrowBtn}
                      onPress={handlePrevMonth}
                      activeOpacity={0.7}
                    >
                      <Text style={calS.navArrowText}>◀</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={calS.navArrowBtn}
                      onPress={handleNextMonth}
                      activeOpacity={0.7}
                    >
                      <Text style={calS.navArrowText}>▶</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Weekday Labels (SUN - SAT) */}
                <View style={calS.weekDaysRow}>
                  {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((dayName, idx) => (
                    <Text
                      key={dayName}
                      style={[
                        calS.weekDayLabel,
                        (idx === 0 || idx === 6) && calS.weekendLabel,
                      ]}
                    >
                      {dayName}
                    </Text>
                  ))}
                </View>

                {/* 7-Column Grid Cells */}
                <View style={calS.daysGrid}>
                  {calendarCells.map((cell) => {
                    if (cell.isBlank) {
                      return <View key={cell.key} style={calS.blankCell} />;
                    }

                    return (
                      <TouchableOpacity
                        key={cell.key}
                        style={[
                          calS.dayCell,
                          cell.isSelected && calS.dayCellSelected,
                          cell.isToday && !cell.isSelected && calS.dayCellToday,
                        ]}
                        onPress={() => setSelectedDateISO(cell.dateISO!)}
                        activeOpacity={0.75}
                      >
                        <Text
                          style={[
                            calS.dayNumberText,
                            cell.isSelected && calS.dayNumberSelected,
                            cell.isToday && !cell.isSelected && calS.dayNumberToday,
                          ]}
                        >
                          {cell.dayNum}
                        </Text>

                        {/* Event Indicators on Day Cell */}
                        <View style={calS.indicatorRow}>
                          {cell.hasExam && (
                            <View style={calS.examDot}>
                              <Text style={calS.miniDotIcon}>🔴</Text>
                            </View>
                          )}
                          {cell.hasAssignment && (
                            <View style={calS.asgDot}>
                              <Text style={calS.miniDotIcon}>🟢</Text>
                            </View>
                          )}
                          {!cell.hasExam && !cell.hasAssignment && (
                            <View style={calS.taskDot} />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Calendar Markers Legend */}
                <View style={calS.legendRow}>
                  <View style={calS.legendItem}>
                    <View style={calS.legendRedDot} />
                    <Text style={calS.legendText}>🔴 Exam Scheduled</Text>
                  </View>
                  <View style={calS.legendItem}>
                    <View style={calS.legendGreenDot} />
                    <Text style={calS.legendText}>🟢 Assignment Due</Text>
                  </View>
                  <View style={calS.legendItem}>
                    <View style={calS.legendPurpleDot} />
                    <Text style={calS.legendText}>🟣 Study Session</Text>
                  </View>
                  <View style={calS.legendItem}>
                    <View style={calS.legendCyanDot} />
                    <Text style={calS.legendText}>✨ Selected Date</Text>
                  </View>
                </View>
              </View>

              {/* ── 3. SELECTED DATE SPECIFIC NOTICES & DEADLINES ── */}
              <View style={s.dateFocusCard}>
                <View style={s.dateFocusTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.dateFocusDayName}>{currentDayData.dateStr}</Text>
                    <Text style={s.dateFocusSub}>
                      {dayEvents.length > 0
                        ? `${examEvents.length} Exam(s) • ${assignmentEvents.length} Assignment(s) Due`
                        : '✨ Regular Study Day • Focus on Scheduled Target Blocks'}
                    </Text>
                  </View>

                  <Badge
                    label={selectedDateISO === '2026-10-06' ? 'TODAY' : currentDayData.dayOfWeek.toUpperCase()}
                    color="#00DFB2"
                    bg="rgba(0, 223, 178, 0.15)"
                    borderColor="rgba(0, 223, 178, 0.35)"
                  />
                </View>

                {/* Specific Exam Alert Card(s) on this date */}
                {examEvents.map((exam) => (
                  <View key={exam.id} style={s.examAlertCard}>
                    <View style={s.examAlertHeader}>
                      <View style={s.examAlertBadge}>
                        <Text style={s.examAlertBadgeText}>🚨 EXAM SCHEDULED ON THIS DATE</Text>
                      </View>
                      <Text style={s.examWeightText}>{exam.weightage}</Text>
                    </View>
                    <Text style={s.examTitleText}>{exam.title}</Text>
                    <View style={s.examMetaRow}>
                      <Text style={s.examMetaText}>📚 {exam.subject}</Text>
                      <Text style={s.examMetaText}>⏱ {exam.timeStr}</Text>
                      <Text style={s.examMetaText}>📍 {exam.locationOrDetails}</Text>
                    </View>
                  </View>
                ))}

                {/* Specific Assignment Alert Card(s) on this date */}
                {assignmentEvents.map((asg) => (
                  <View key={asg.id} style={s.asgAlertCard}>
                    <View style={s.asgAlertHeader}>
                      <View style={s.asgAlertBadge}>
                        <Text style={s.asgAlertBadgeText}>📝 ASSIGNMENT DEADLINE ON THIS DATE</Text>
                      </View>
                      <Text style={s.asgWeightText}>{asg.weightage}</Text>
                    </View>
                    <Text style={s.asgTitleText}>{asg.title}</Text>
                    <View style={s.asgMetaRow}>
                      <Text style={s.asgMetaText}>📚 {asg.subject}</Text>
                      <Text style={s.asgMetaText}>⏳ {asg.timeStr}</Text>
                      <Text style={s.asgMetaText}>📋 {asg.locationOrDetails}</Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* ── 4. ML ADAPTIVE ENGINE BANNER ── */}
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
                  onPress={() =>
                    Alert.alert('ML Engine Active', `Dynamic pacing calculates retention schedules for ${currentDayData.dateStr}.`)
                  }
                >
                  <Text style={{ color: '#94A3B8', fontSize: 18 }}>⌄</Text>
                </TouchableOpacity>
              </View>

              {/* ── 5. DAILY TARGET CARD ── */}
              <View style={s.targetCard}>
                <View style={s.targetRow}>
                  <View style={s.targetLeftGroup}>
                    <View style={s.targetIconBox}>
                      <Text style={{ fontSize: 16 }}>🎯</Text>
                    </View>
                    <Text style={s.targetLabel}>Daily Target ({currentDayData.dayOfWeek})</Text>
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
                  <Text style={s.remainText}>Remaining: {currentDayData.target.remainingStr}</Text>
                  <Text style={s.trackLabel}>{currentDayData.target.status}</Text>
                </View>
              </View>

              {/* ── 6. TIMELINE SECTION HEADER ── */}
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>TIMELINE & STUDY BLOCKS</Text>
                <Text style={s.sectionMeta}>
                  {currentDayData.blocks.length} Blocks on {currentDayData.dateStr}
                </Text>
              </View>

              {/* ── 7. TIMELINE BLOCKS ── */}
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
                        <Text style={tb.freeGapHint}>Tap to insert rapid-fire recall quiz</Text>
                      </View>
                    </View>
                    <Text style={tb.insertLabel}>Insert</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* ── 8. ADD BLOCK BUTTON ── */}
              <View style={s.fabWrapper}>
                <TouchableOpacity
                  style={s.fab}
                  activeOpacity={0.85}
                  onPress={() => setModalVisible(true)}
                >
                  <Text style={s.fabPlusIcon}>+</Text>
                  <Text style={s.fabText}>Add Study Block</Text>
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
            <Text style={s.modalTitle}>⚡ Add Study Block for {currentDayData.dateStr}</Text>

            <Text style={s.inputLabel}>TOPIC / TASK NAME *</Text>
            <TextInput
              style={s.modalInput}
              placeholder="e.g. Graph Algorithms & Dijkstra Practice"
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

// ── Calendar Specific Styles ────────────────────────────────────────────────
const calS = StyleSheet.create({
  calendarCard: {
    backgroundColor: 'rgba(10, 20, 36, 0.88)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(0, 223, 178, 0.25)',
    ...(Platform.OS === 'web'
      ? ({
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(20px)',
      } as any)
      : {}),
  },
  calHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  monthTitleGroup: {
    flex: 1,
  },
  monthTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  calSubText: {
    color: '#94A3B8',
    fontSize: 11.5,
    marginTop: 2,
  },
  navBtnsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  navArrowBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  navArrowText: {
    color: '#00DFB2',
    fontSize: 13,
    fontWeight: '800',
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 10,
  },
  weekDayLabel: {
    flex: 1,
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  weekendLabel: {
    color: '#F472B6',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
  },
  blankCell: {
    width: '13.5%',
    height: 52,
  },
  dayCell: {
    width: '13.5%',
    height: 52,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 27, 48, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(30, 48, 77, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    position: 'relative',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  dayCellSelected: {
    backgroundColor: 'rgba(0, 223, 178, 0.22)',
    borderColor: '#00DFB2',
    borderWidth: 1.8,
    ...(Platform.OS === 'web'
      ? ({
        boxShadow: '0 0 14px rgba(0, 223, 178, 0.45)',
      } as any)
      : {}),
  },
  dayCellToday: {
    borderColor: 'rgba(245, 158, 11, 0.8)',
    borderWidth: 1.4,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  dayNumberText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '700',
  },
  dayNumberSelected: {
    color: '#00DFB2',
    fontWeight: '900',
    fontSize: 14,
  },
  dayNumberToday: {
    color: '#FBBF24',
    fontWeight: '800',
  },
  indicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
    height: 10,
  },
  examDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  asgDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  taskDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(148, 163, 184, 0.4)',
  },
  miniDotIcon: {
    fontSize: 0,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendRedDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  legendGreenDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  legendPurpleDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#A855F7',
  },
  legendCyanDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#00DFB2',
  },
  legendText: {
    color: '#94A3B8',
    fontSize: 10.5,
    fontWeight: '700',
  },
});

// ── Timeline block styles ────────────────────────────────────────────────────
const tb = StyleSheet.create({
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
    fontSize: 15,
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

  // Desktop Sidebar
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
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  navLabelActive: {
    color: '#00DFB2',
    fontWeight: '700',
  },
  sidebarSpacer: {
    flex: 1,
  },
  sidebarFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  avatarBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarBoxText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  sidebarUserName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  sidebarUserRole: {
    color: '#94A3B8',
    fontSize: 11,
  },

  // Main Content
  mainContent: {
    flex: 1,
  },
  mainScrollContent: {
    paddingBottom: 60,
  },
  innerWrapper: {
    maxWidth: 920,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  mobileInner: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  appLogoBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 223, 178, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 223, 178, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
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
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  todayJumpBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 223, 178, 0.16)',
    borderWidth: 1,
    borderColor: '#00DFB2',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  todayJumpText: {
    color: '#00DFB2',
    fontWeight: '800',
    fontSize: 12.5,
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
    fontSize: 14,
  },

  // ── Date Focus Card ──
  dateFocusCard: {
    backgroundColor: 'rgba(10, 20, 36, 0.85)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  dateFocusTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dateFocusDayName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  dateFocusSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },

  // Specific Exam Alert
  examAlertCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: 'rgba(239, 68, 68, 0.5)',
    padding: 12,
    marginTop: 8,
  },
  examAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  examAlertBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  examAlertBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  examWeightText: {
    color: '#FCA5A5',
    fontSize: 11,
    fontWeight: '700',
  },
  examTitleText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
    marginVertical: 4,
  },
  examMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 2,
  },
  examMetaText: {
    color: '#E2E8F0',
    fontSize: 11.5,
    fontWeight: '600',
  },

  // Specific Assignment Alert
  asgAlertCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: 'rgba(16, 185, 129, 0.5)',
    padding: 12,
    marginTop: 8,
  },
  asgAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  asgAlertBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  asgAlertBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  asgWeightText: {
    color: '#6EE7B7',
    fontSize: 11,
    fontWeight: '700',
  },
  asgTitleText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
    marginVertical: 4,
  },
  asgMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 2,
  },
  asgMetaText: {
    color: '#E2E8F0',
    fontSize: 11.5,
    fontWeight: '600',
  },

  // Adaptive Engine Banner
  adaptiveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(10, 20, 36, 0.75)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 223, 178, 0.25)',
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(16px)' } as any) : {}),
  },
  adaptiveLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  adaptiveIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(244, 114, 182, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adaptiveTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  adaptiveTitle: {
    color: '#F472B6',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.8,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 99,
    backgroundColor: '#00DFB2',
  },
  adaptiveSub: {
    color: '#CBD5E1',
    fontSize: 12.5,
    marginTop: 2,
  },
  chevronBtn: {
    padding: 6,
  },

  // Target Card
  targetCard: {
    backgroundColor: 'rgba(10, 20, 36, 0.75)',
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
    backgroundColor: 'rgba(0, 223, 178, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  targetLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  targetRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  targetTime: {
    color: '#00DFB2',
    fontWeight: '800',
    fontSize: 14,
  },
  targetMuted: {
    color: '#94A3B8',
    fontWeight: '500',
  },
  targetBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  remainText: {
    color: '#8E9BAE',
    fontSize: 12,
  },
  trackLabel: {
    color: '#00DFB2',
    fontSize: 12,
    fontWeight: '700',
  },

  // Timeline Header & List
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#8E9BAE',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  sectionMeta: {
    color: '#94A3B8',
    fontSize: 12,
  },
  timelineList: {
    gap: 12,
    marginBottom: 24,
  },

  // FAB
  fabWrapper: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00DFB2',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 99,
    gap: 8,
    shadowColor: '#00DFB2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  fabPlusIcon: {
    color: '#050D1A',
    fontSize: 18,
    fontWeight: '900',
  },
  fabText: {
    color: '#050D1A',
    fontWeight: '800',
    fontSize: 13,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#0B1526',
    width: '100%',
    maxWidth: 480,
    borderRadius: 18,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 223, 178, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 16,
  },
  inputLabel: {
    color: '#8E9BAE',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: 'rgba(15, 27, 48, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    color: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 24,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  cancelBtnText: {
    color: '#94A3B8',
    fontWeight: '700',
    fontSize: 13,
  },
  saveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#00DFB2',
  },
  saveBtnText: {
    color: '#050D1A',
    fontWeight: '800',
    fontSize: 13,
  },
});
