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

// Week strip days
const DAYS_DATA = [
  { day: 'MON', num: '06' },
  { day: 'TUE', num: '07' },
  { day: 'WED', num: '08' },
  { day: 'THU', num: '09' },
  { day: 'FRI', num: '10' },
  { day: 'SUN', num: '12' },
];

interface TimelineItem {
  id: number;
  topic_name: string;
  subject_name?: string;
  rag_tag?: string;
  start_time: string;
  duration_minutes: number;
  duration_label?: string;
  completed: boolean;
  type?: 'done' | 'active' | 'later' | 'gap';
  badgeColor?: string;
  badgeBg?: string;
}

const INITIAL_BLOCKS: TimelineItem[] = [
  {
    id: 1,
    topic_name: 'Data-Structures',
    rag_tag: 'RAG: Core Midterm',
    start_time: '10:00',
    duration_minutes: 90,
    duration_label: '90m',
    completed: true,
    badgeColor: '#93C5FD',
    badgeBg: 'rgba(59, 130, 246, 0.2)',
  },
  {
    id: 2,
    topic_name: 'Database Management',
    rag_tag: 'RAG: High Weightage (18 pts)',
    start_time: '02:00',
    duration_minutes: 75,
    duration_label: '1h 15m',
    completed: false,
    badgeColor: '#A5B4FC',
    badgeBg: 'rgba(99, 102, 241, 0.25)',
  },
  {
    id: 3,
    topic_name: 'Operating Systems',
    rag_tag: 'RAG: Buffer +45m',
    start_time: '05:00',
    duration_minutes: 105,
    duration_label: '105m',
    completed: false,
    badgeColor: '#93C5FD',
    badgeBg: 'rgba(59, 130, 246, 0.2)',
  },
  {
    id: 4,
    topic_name: 'Revision & Recall',
    rag_tag: 'Networks',
    start_time: '08:30',
    duration_minutes: 45,
    duration_label: '45m',
    completed: false,
    badgeColor: '#C4B5FD',
    badgeBg: 'rgba(139, 92, 246, 0.2)',
  },
];

export default function PlannerScreen() {
  const { loading, refresh } = usePlanner();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const router = useRouter();

  const isDesktop = width >= 860;

  // Local interactive blocks state
  const [blocks, setBlocks] = useState<TimelineItem[]>(INITIAL_BLOCKS);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [freeGapInserted, setFreeGapInserted] = useState(false);

  // Modal State for Adding Block
  const [modalVisible, setModalVisible] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [newStartTime, setNewStartTime] = useState('03:30');
  const [newDuration, setNewDuration] = useState('60');
  const [newTag, setNewTag] = useState('RAG: Core Midterm');

  const firstName =
    user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'Harsha';

  // Toggle block completion
  const handleToggleBlock = (id: number) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, completed: !b.completed } : b))
    );
  };

  // Insert Free Gap into schedule
  const handleInsertFreeGap = () => {
    if (freeGapInserted) return;
    const newGapBlock: TimelineItem = {
      id: Date.now(),
      topic_name: 'Quick Quiz Review',
      rag_tag: 'RAG: Rapid Practice',
      start_time: '03:30 PM',
      duration_minutes: 30,
      duration_label: '30m',
      completed: false,
      badgeColor: '#6EE7B7',
      badgeBg: 'rgba(16, 185, 129, 0.2)',
    };
    setBlocks((prev) => {
      const copy = [...prev];
      copy.splice(2, 0, newGapBlock);
      return copy;
    });
    setFreeGapInserted(true);
    Alert.alert('Success', 'Free gap quiz review added to your schedule!');
  };

  // Add Custom Study Block
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
      badgeColor: '#A5B4FC',
      badgeBg: 'rgba(99, 102, 241, 0.25)',
    };
    setBlocks((prev) => [...prev, newBlock]);
    setNewTopic('');
    setNewStartTime('03:30');
    setNewDuration('60');
    setModalVisible(false);
    Alert.alert('Success', 'Study block added to timeline!');
  };

  // Daily target calculations
  const targetMinutes = 270; // 4h 30m
  const completedMinutes = 90; // Fixed 1h 30m as shown in design or calculated
  const pct = 33; // Exactly 33% as in reference image

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
                      <Text style={s.adaptiveTitle}>ML ADAPTIVE ENGINE</Text>
                      <View style={s.onlineDot} />
                    </View>
                    <Text style={s.adaptiveSub}>
                      ML Adaptive Pace • <Text style={{ color: '#00DFB2', fontWeight: '700' }}>+45m buffer</Text> inserted...
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={s.chevronBtn}
                  onPress={() => Alert.alert('ML Engine Active', 'Dynamic pacing inserts revision buffers based on your topic retention.')}
                >
                  <Text style={{ color: '#94A3B8', fontSize: 18 }}>⌄</Text>
                </TouchableOpacity>
              </View>

              {/* ── 3. DATE SELECTOR (MON 06, TUE 07, ...) ── */}
              <View style={s.weekRow}>
                {DAYS_DATA.map((item, i) => {
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
                    <Text style={s.targetLabel}>Daily Target</Text>
                  </View>
                  <View style={s.targetRightGroup}>
                    <Text style={s.targetTime}>
                      1h 30m <Text style={s.targetMuted}>/ 4h 30m</Text>
                    </Text>
                    <Badge label="33%" color="#00DFB2" bg="rgba(0, 223, 178, 0.15)" borderColor="rgba(0, 223, 178, 0.3)" />
                  </View>
                </View>
                <View style={{ marginVertical: 14 }}>
                  <ProgressBar pct={pct} color="#00DFB2" />
                </View>
                <View style={s.targetBottomRow}>
                  <Text style={s.remainText}>
                    Remaining: 3h 0m
                  </Text>
                  <Text style={s.trackLabel}>⌛ In Progress</Text>
                </View>
              </View>

              {/* ── 5. TIMELINE SECTION HEADER ── */}
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>TIMELINE</Text>
                <Text style={s.sectionMeta}>4 Blocks Today</Text>
              </View>

              {/* ── 6. TIMELINE BLOCKS ── */}
              <View style={s.timelineList}>
                {/* Block 1: Data-Structures (Done) */}
                <TouchableOpacity
                  style={tb.doneCard}
                  onPress={() => handleToggleBlock(1)}
                  activeOpacity={0.8}
                >
                  <View style={tb.doneLeft}>
                    <View style={tb.doneCheckWrap}>
                      <Text style={{ color: '#00DFB2', fontSize: 13, fontWeight: '900' }}>✓</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <Text style={tb.doneName}>Data-Structures</Text>
                        <Badge label="RAG: Core Midterm" color="#93C5FD" bg="rgba(59, 130, 246, 0.2)" />
                      </View>
                      <Text style={tb.doneTime}>10:00 • 90m</Text>
                    </View>
                  </View>
                  <Text style={tb.doneStatusText}>Done</Text>
                </TouchableOpacity>

                {/* Block 2: Database Management (Active Sprint) */}
                <View style={tb.activeCard}>
                  <View style={tb.activeTopRow}>
                    <View style={tb.activeBadgeWrap}>
                      <View style={tb.activeGreenDot} />
                      <Text style={tb.activeBadgeText}>ACTIVE SPRINT</Text>
                    </View>
                    <Badge label="RAG: High Weightage (18 pts)" color="#A5B4FC" bg="rgba(99, 102, 241, 0.25)" />
                  </View>
                  <View style={tb.activeRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={tb.activeName}>Database Management</Text>
                      <Text style={tb.activeTime}>02:00 • 1h 15m</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleToggleBlock(2)} activeOpacity={0.8}>
                      <CountdownTimer initialMinutes={24} initialSeconds={11} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Block 3: Operating Systems (Later) */}
                <TouchableOpacity
                  style={tb.laterCard}
                  onPress={() => handleToggleBlock(3)}
                  activeOpacity={0.8}
                >
                  <View style={tb.laterLeft}>
                    <View style={tb.laterIconBox}>
                      <Text style={{ fontSize: 16 }}>🕒</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <Text style={tb.laterName}>Operating Systems</Text>
                        <Badge label="RAG: Buffer +45m" color="#93C5FD" bg="rgba(59, 130, 246, 0.2)" />
                      </View>
                      <Text style={tb.laterTime}>05:00 • 105m</Text>
                    </View>
                  </View>
                  <Text style={tb.laterStatusText}>Later</Text>
                </TouchableOpacity>

                {/* Block 4: Revision & Recall (Later) */}
                <TouchableOpacity
                  style={tb.laterCard}
                  onPress={() => handleToggleBlock(4)}
                  activeOpacity={0.8}
                >
                  <View style={tb.laterLeft}>
                    <View style={tb.laterIconBox}>
                      <Text style={{ fontSize: 16 }}>🧠</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <Text style={tb.laterName}>Revision & Recall</Text>
                        <Badge label="Networks" color="#C4B5FD" bg="rgba(139, 92, 246, 0.2)" />
                      </View>
                      <Text style={tb.laterTime}>08:30 • 45m</Text>
                    </View>
                  </View>
                  <Text style={tb.laterStatusText}>Later</Text>
                </TouchableOpacity>

                {/* Free gap row */}
                {!freeGapInserted && (
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
