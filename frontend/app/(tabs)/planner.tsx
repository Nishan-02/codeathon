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
      <View style={[pb.fill, { width: `${fillPct}%` as any, backgroundColor: color || '#00C9A7' }]} />
    </View>
  );
}
const pb = StyleSheet.create({
  track: { height: 6, backgroundColor: '#161F30', borderRadius: 99, overflow: 'hidden', width: '100%' },
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
function CountdownTimer({ initialMinutes = 24 }: { initialMinutes?: number }) {
  const [seconds, setSeconds] = useState(initialMinutes * 60 + 18);
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
    backgroundColor: 'rgba(0, 201, 167, 0.12)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 201, 167, 0.3)',
  },
  icon: { fontSize: 13 },
  text: {
    color: '#00C9A7',
    fontWeight: '800',
    fontSize: 15,
    fontVariant: ['tabular-nums'],
  },
});

// Week strip days
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

interface TimelineItem {
  id: number;
  topic_name: string;
  subject_name?: string;
  rag_tag?: string;
  start_time: string;
  duration_minutes: number;
  completed: boolean;
  is_free_gap?: boolean;
}

const INITIAL_BLOCKS: TimelineItem[] = [
  {
    id: 1,
    topic_name: 'Data Structures',
    rag_tag: 'RAG: Core Midterm',
    start_time: '10:00',
    duration_minutes: 90,
    completed: true,
  },
  {
    id: 2,
    topic_name: 'Database Management',
    rag_tag: 'RAG: High Weightage (18 pts)',
    start_time: '02:00',
    duration_minutes: 75,
    completed: false,
  },
  {
    id: 3,
    topic_name: 'Operating Systems',
    rag_tag: 'RAG: Buffer +45m',
    start_time: '05:00',
    duration_minutes: 105,
    completed: false,
  },
  {
    id: 4,
    topic_name: 'Revision & Recall',
    rag_tag: 'Networks',
    start_time: '08:30',
    duration_minutes: 45,
    completed: false,
  },
];

export default function PlannerScreen() {
  const { loading, refresh } = usePlanner();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const router = useRouter();

  // Local interactive blocks state
  const [blocks, setBlocks] = useState<TimelineItem[]>(INITIAL_BLOCKS);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [freeGapInserted, setFreeGapInserted] = useState(false);

  // Modal State for Adding Block
  const [modalVisible, setModalVisible] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [newStartTime, setNewStartTime] = useState('03:30');
  const [newDuration, setNewDuration] = useState('60');
  const [newTag, setNewTag] = useState('RAG: Recommended');

  const firstName =
    user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'Ujwal';

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
      topic_name: 'Quick Quiz & Concept Recall',
      rag_tag: 'RAG: Rapid Practice',
      start_time: '03:30',
      duration_minutes: 30,
      completed: false,
    };
    setBlocks((prev) => {
      const copy = [...prev];
      copy.splice(2, 0, newGapBlock);
      return copy;
    });
    setFreeGapInserted(true);
    Alert.alert('Success', 'Free gap session inserted into your study plan!');
  };

  // Add Custom Study Block
  const handleAddBlock = () => {
    if (!newTopic.trim()) {
      Alert.alert('Validation Error', 'Please enter a topic name.');
      return;
    }
    const newBlock: TimelineItem = {
      id: Date.now(),
      topic_name: newTopic.trim(),
      rag_tag: newTag.trim() || 'RAG: Custom Sprint',
      start_time: newStartTime.trim() || '04:00',
      duration_minutes: parseInt(newDuration, 10) || 60,
      completed: false,
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
  const completedMinutes = blocks
    .filter((b) => b.completed)
    .reduce((acc, b) => acc + b.duration_minutes, 0);
  const pct = Math.round(Math.min((completedMinutes / targetMinutes) * 100, 100));
  const remainingMinutes = Math.max(0, targetMinutes - completedMinutes);

  const isWide = width > 768;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0E1A" />
      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.contentContainer, isWide && s.desktopContent]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={Colors.teal} />}
      >
        <View style={s.innerWrapper}>
          {/* ── 1. HEADER ── */}
          <View style={s.header}>
            <View style={s.headerLeft}>
              <View style={s.appLogoBox}>
                <Text style={s.appLogoIcon}>📖</Text>
              </View>
              <Text style={s.headerTitle}>Planner</Text>
            </View>
            <View style={s.headerRight}>
              <TouchableOpacity
                style={s.iconBtn}
                activeOpacity={0.8}
                onPress={() => Alert.alert('Notifications', 'All adaptive study sessions are on track.')}
              >
                <Text style={{ fontSize: 18 }}>🔔</Text>
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
                <Text style={{ fontSize: 20 }}>🌸</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={s.adaptiveTitleRow}>
                  <Text style={s.adaptiveTitle}>ML ADAPTIVE ENGINE</Text>
                  <View style={s.onlineDot} />
                </View>
                <Text style={s.adaptiveSub}>
                  ML Adaptive Pace: <Text style={{ color: '#00C9A7', fontWeight: '800' }}>+45m buffer</Text> inserted...
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={s.chevronBtn}
              onPress={() => Alert.alert('ML Engine Active', 'Dynamic pacing inserts revision buffers based on your topic retention.')}
            >
              <Text style={{ color: '#94A3B8', fontSize: 16 }}>˄</Text>
            </TouchableOpacity>
          </View>

          {/* ── 3. DATE SELECTOR ── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={s.weekScroll}
            contentContainerStyle={s.weekScrollContainer}
          >
            {DAYS.map((day, i) => {
              const isSelected = i === selectedDayIdx;
              const dayNumberStr = (i + 6).toString().padStart(2, '0');
              return (
                <TouchableOpacity
                  key={day}
                  style={[s.dayChip, isSelected ? s.dayChipActive : s.dayChipNormal]}
                  onPress={() => setSelectedDayIdx(i)}
                  activeOpacity={0.85}
                >
                  <Text style={[s.dayLabel, isSelected ? s.dayLabelActive : s.dayLabelNormal]}>{day}</Text>
                  <Text style={[s.dayNum, isSelected ? s.dayNumActive : s.dayNumNormal]}>{dayNumberStr}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* ── 4. DAILY TARGET CARD ── */}
          <View style={s.targetCard}>
            <View style={s.targetRow}>
              <Text style={s.targetLabel}>Daily Target</Text>
              <Text style={s.targetTime}>
                {Math.floor(completedMinutes / 60)}h {completedMinutes % 60}m <Text style={s.targetMuted}>/ 4h 30m</Text>
              </Text>
              <Badge label={`${pct}%`} color="#00C9A7" bg="rgba(0, 201, 167, 0.12)" borderColor="rgba(0, 201, 167, 0.25)" />
            </View>
            <View style={{ marginVertical: 12 }}>
              <ProgressBar pct={pct} color="#00C9A7" />
            </View>
            <View style={s.targetBottomRow}>
              <Text style={s.remainText}>
                Remaining: {Math.floor(remainingMinutes / 60)}h {remainingMinutes % 60}m
              </Text>
              <Text style={s.trackLabel}>{pct >= 40 ? '⚡ On Track' : '⏳ In Progress'}</Text>
            </View>
          </View>

          {/* ── 5. TIMELINE SECTION ── */}
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>TIMELINE</Text>
            <Text style={s.sectionMeta}>{blocks.length} Blocks Today</Text>
          </View>

          <View style={s.timelineList}>
            {blocks.map((block, idx) => {
              const isDone = block.completed;
              const isActive = !isDone && idx === blocks.findIndex((b) => !b.completed);

              if (isActive) {
                return (
                  <View key={block.id} style={tb.activeCard}>
                    <View style={tb.activeTopRow}>
                      <View style={tb.activeBadgeWrap}>
                        <View style={tb.activeGreenDot} />
                        <Text style={tb.activeBadgeText}>ACTIVE SPRINT</Text>
                      </View>
                      <Badge label={block.rag_tag || 'RAG: High Weightage (18 pts)'} color="#A5B4FC" bg="rgba(99, 102, 241, 0.18)" />
                    </View>
                    <View style={tb.activeRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={tb.activeName}>{block.topic_name}</Text>
                        <Text style={tb.activeTime}>
                          {block.start_time} • {Math.floor(block.duration_minutes / 60) ? `${Math.floor(block.duration_minutes / 60)}h ` : ''}{block.duration_minutes % 60 ? `${block.duration_minutes % 60}m` : ''}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => handleToggleBlock(block.id)} activeOpacity={0.8}>
                        <CountdownTimer initialMinutes={24} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }

              if (isDone) {
                return (
                  <TouchableOpacity
                    key={block.id}
                    style={tb.doneCard}
                    onPress={() => handleToggleBlock(block.id)}
                    activeOpacity={0.8}
                  >
                    <View style={tb.doneLeft}>
                      <View style={tb.doneCheckWrap}>
                        <Text style={{ color: '#00C9A7', fontSize: 13, fontWeight: '800' }}>✓</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={tb.doneName}>{block.topic_name}</Text>
                          {block.rag_tag && <Badge label={block.rag_tag} color="#94A3B8" bg="#1E293B" />}
                        </View>
                        <Text style={tb.doneTime}>{block.start_time} • {block.duration_minutes}m</Text>
                      </View>
                    </View>
                    <Text style={tb.doneStatusText}>Done</Text>
                  </TouchableOpacity>
                );
              }

              return (
                <TouchableOpacity
                  key={block.id}
                  style={tb.laterCard}
                  onPress={() => handleToggleBlock(block.id)}
                  activeOpacity={0.8}
                >
                  <View style={tb.laterLeft}>
                    <View style={tb.laterIconBox}>
                      <Text style={{ fontSize: 16 }}>{idx % 2 === 0 ? '🕒' : '🧠'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text style={tb.laterName}>{block.topic_name}</Text>
                        {block.rag_tag && <Badge label={block.rag_tag} color="#818CF8" bg="rgba(99, 102, 241, 0.15)" />}
                      </View>
                      <Text style={tb.laterTime}>{block.start_time} • {block.duration_minutes}m</Text>
                    </View>
                  </View>
                  <Text style={tb.laterStatusText}>Later</Text>
                </TouchableOpacity>
              );
            })}

            {/* Free gap card */}
            {!freeGapInserted && (
              <TouchableOpacity style={tb.freeGapCard} onPress={handleInsertFreeGap} activeOpacity={0.8}>
                <View style={tb.freeGapLeft}>
                  <View style={tb.freeGapPlusCircle}>
                    <Text style={{ color: '#00C9A7', fontSize: 16, fontWeight: '800' }}>+</Text>
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

          {/* ── 7. ADD BLOCK BUTTON ── */}
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

      {/* ── ADD STUDY BLOCK MODAL ── */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>⚡ Add Study Block</Text>
            
            <Text style={s.inputLabel}>TOPIC / TASK NAME *</Text>
            <TextInput
              style={s.modalInput}
              placeholder="e.g. Graph BFS & Dijkstra Algorithm"
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
              placeholder="e.g. RAG: High Probability"
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
    </SafeAreaView>
  );
}

// ── Timeline block styles ────────────────────────────────────────────────────
const tb = StyleSheet.create({
  // Active Sprint
  activeCard: {
    backgroundColor: '#0C1B2E',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#00C9A7',
    shadowColor: '#00C9A7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  activeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  activeBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeGreenDot: {
    width: 8,
    height: 8,
    borderRadius: 99,
    backgroundColor: '#00C9A7',
  },
  activeBadgeText: {
    color: '#00C9A7',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeName: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
  },
  activeTime: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 3,
    fontWeight: '500',
  },

  // Done Block
  doneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    opacity: 0.85,
  },
  doneLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  doneCheckWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 201, 167, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 201, 167, 0.3)',
  },
  doneName: {
    color: '#94A3B8',
    fontWeight: '700',
    fontSize: 14,
    textDecorationLine: 'line-through',
  },
  doneTime: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  doneStatusText: {
    color: '#00C9A7',
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 8,
  },

  // Later Block
  laterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  laterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  laterIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  laterName: {
    color: '#F8FAFC',
    fontWeight: '700',
    fontSize: 14,
  },
  laterTime: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  laterStatusText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Free gap
  freeGapCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 201, 167, 0.4)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(0, 201, 167, 0.05)',
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
    backgroundColor: 'rgba(0, 201, 167, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  freeGapTitle: {
    color: '#E2E8F0',
    fontWeight: '700',
    fontSize: 13,
  },
  freeGapHint: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 1,
  },
  insertLabel: {
    color: '#00C9A7',
    fontWeight: '800',
    fontSize: 14,
    marginLeft: 8,
  },
});

// ── Screen styles ─────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: {
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
    alignItems: 'center',
    justifyContent: 'space-between',
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
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  avatarSmall: {
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

  // ML Adaptive Engine Banner
  adaptiveBanner: {
    backgroundColor: 'rgba(0, 201, 167, 0.08)',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 201, 167, 0.25)',
  },
  adaptiveLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  adaptiveIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 201, 167, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adaptiveTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adaptiveTitle: {
    color: '#00C9A7',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 99,
    backgroundColor: '#00C9A7',
  },
  adaptiveSub: {
    color: '#CBD5E1',
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  chevronBtn: {
    padding: 4,
  },

  // Week Selector
  weekScroll: {
    marginBottom: 16,
  },
  weekScrollContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  dayChip: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 58,
    paddingVertical: 12,
    borderRadius: 16,
  },
  dayChipActive: {
    backgroundColor: '#00C9A7',
    shadowColor: '#00C9A7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  dayChipNormal: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  dayLabelActive: {
    color: '#0A0E1A',
  },
  dayLabelNormal: {
    color: '#64748B',
  },
  dayNum: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 3,
  },
  dayNumActive: {
    color: '#0A0E1A',
  },
  dayNumNormal: {
    color: '#F8FAFC',
  },

  // Target Card
  targetCard: {
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  targetLabel: {
    color: '#F8FAFC',
    fontWeight: '800',
    fontSize: 15,
  },
  targetTime: {
    color: '#F8FAFC',
    fontWeight: '700',
    fontSize: 14,
  },
  targetMuted: {
    color: '#94A3B8',
    fontWeight: '500',
  },
  targetBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  remainText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
  trackLabel: {
    color: '#818CF8',
    fontSize: 12,
    fontWeight: '700',
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  sectionMeta: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },

  // Timeline list
  timelineList: {
    gap: 10,
    marginBottom: 20,
  },

  // FAB
  fabWrapper: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  fab: {
    backgroundColor: '#4F46E5',
    borderRadius: 99,
    paddingHorizontal: 22,
    paddingVertical: 14,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fabPlusIcon: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 18,
    lineHeight: 18,
  },
  fabText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 480,
    borderWidth: 1,
    borderColor: '#1E293B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  modalTitle: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
  },
  inputLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingVertical: 12,
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
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#0A0E1A',
    fontWeight: '800',
    fontSize: 14,
  },
});
