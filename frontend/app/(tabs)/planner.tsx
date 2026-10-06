import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePlanner } from '../../hooks/usePlanner';
import { Colors, Spacing, Radius, FontSize } from '../../constants/theme';
import { StudySchedule } from '../../types/planner';

// ── Mini helpers ──────────────────────────────────────────────────────────────
function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <View style={pb.track}>
      <View style={[pb.fill, { width: `${Math.min(pct, 100)}%` as any, backgroundColor: color }]} />
    </View>
  );
}
const pb = StyleSheet.create({
  track: { height: 5, backgroundColor: '#1E293B', borderRadius: 99, overflow: 'hidden', flex: 1 },
  fill: { height: '100%', borderRadius: 99 },
});

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <View style={{ backgroundColor: bg, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 }}>
      <Text style={{ color, fontSize: 11, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}

// ── Countdown timer ───────────────────────────────────────────────────────────
function CountdownTimer({ durationMinutes }: { durationMinutes: number }) {
  const [seconds, setSeconds] = useState(durationMinutes * 60);
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
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#0A1E35',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, gap: 6,
  },
  icon: { fontSize: 14 },
  text: { color: Colors.textPrimary, fontWeight: '700', fontSize: 14, fontVariant: ['tabular-nums'] },
});

// Week strip
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

// ── Main ──────────────────────────────────────────────────────────────────────
export default function PlannerScreen() {
  const { schedule, loading, refresh, toggleTaskCompleted } = usePlanner();
  const router = useRouter();

  // Week day selection
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const [selectedDayIdx, setSelectedDayIdx] = useState(dayOfWeek === 0 ? 6 : dayOfWeek - 1);

  const weekDates = DAYS.map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + mondayOffset + i);
    return d;
  });

  // Daily target
  const targetMinutes = 4.5 * 60; // 4h 30m
  const completedMinutes = schedule
    .filter((s) => s.completed)
    .reduce((acc, s) => acc + (s.duration_minutes || 60), 0);
  const pct = Math.min((completedMinutes / targetMinutes) * 100, 100);

  const activeTask = schedule.find((s) => !s.completed);
  const onTrack = pct >= 50;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={Colors.teal} />}
      >
        {/* ── Top header ── */}
        <View style={s.header}>
          <Text style={s.headerTitle}>Planner</Text>
          <View style={s.headerRight}>
            <TouchableOpacity style={s.iconBtn}><Text style={{ fontSize: 18 }}>🔔</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={s.avatarSmall}>
              <Text style={s.avatarInitial}>U</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── ML Adaptive Engine banner ── */}
        <View style={s.adaptiveBanner}>
          <View style={s.adaptiveLeft}>
            <View style={s.adaptiveIconWrap}><Text style={{ fontSize: 18 }}>⚙️</Text></View>
            <View>
              <View style={s.adaptiveTitleRow}>
                <Text style={s.adaptiveTitle}>ML ADAPTIVE ENGINE</Text>
                <View style={s.onlineDot} />
              </View>
              <Text style={s.adaptiveSub}>
                ML Adaptive Pace: <Text style={{ color: Colors.teal, fontWeight: '700' }}>+45m buffer</Text> inserted...
              </Text>
            </View>
          </View>
          <TouchableOpacity><Text style={{ color: Colors.textMuted, fontSize: 18 }}>˄</Text></TouchableOpacity>
        </View>

        {/* ── Week strip ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.weekScroll}>
          {DAYS.map((day, i) => {
            const isSelected = i === selectedDayIdx;
            const date = weekDates[i];
            return (
              <TouchableOpacity
                key={day}
                style={[s.dayChip, isSelected && s.dayChipActive]}
                onPress={() => setSelectedDayIdx(i)}
              >
                <Text style={[s.dayLabel, isSelected && s.dayLabelActive]}>{day}</Text>
                <Text style={[s.dayNum, isSelected && s.dayNumActive]}>{date.getDate()}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Daily target ── */}
        <View style={s.targetCard}>
          <View style={s.targetRow}>
            <Text style={s.targetLabel}>Daily Target</Text>
            <Text style={s.targetTime}>
              {Math.floor(completedMinutes / 60)}h {completedMinutes % 60}m{' '}
              <Text style={s.targetMuted}>/ 4h 30m</Text>
            </Text>
            <Badge label={`${Math.round(pct)}%`} color={Colors.textPrimary} bg="#1E293B" />
          </View>
          <View style={{ marginVertical: 8 }}>
            <ProgressBar pct={pct} color={Colors.indigo} />
          </View>
          <View style={s.targetBottomRow}>
            <Text style={s.remainText}>
              Remaining: {Math.floor((targetMinutes - completedMinutes) / 60)}h{' '}
              {(targetMinutes - completedMinutes) % 60}m
            </Text>
            <Text style={[s.trackLabel, { color: onTrack ? Colors.teal : Colors.amber }]}>
              ⚡ {onTrack ? 'On Track' : 'Behind'}
            </Text>
          </View>
        </View>

        {/* ── Timeline section ── */}
        <View style={s.sectionRow}>
          <Text style={s.sectionTitle}>TIMELINE</Text>
          <Text style={s.sectionMeta}>{schedule.length} Blocks Today</Text>
        </View>

        {schedule.length === 0 && !loading ? (
          <View style={s.emptyCard}>
            <Text style={s.emptyEmoji}>📅</Text>
            <Text style={s.emptyText}>No study blocks scheduled.</Text>
            <Text style={s.emptyHint}>Go to Dashboard → Generate to create your plan.</Text>
          </View>
        ) : (
          schedule.map((item, idx) => {
            const isActive = !item.completed && idx === schedule.findIndex((t) => !t.completed);
            const isDone = item.completed;
            return (
              <TimelineBlock
                key={item.id}
                item={item}
                isActive={isActive}
                isDone={isDone}
                onToggle={() => toggleTaskCompleted(item.id, !item.completed)}
              />
            );
          })
        )}

        {/* ── Add block FAB placeholder area ── */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* ── FAB ── */}
      <TouchableOpacity style={s.fab}>
        <Text style={s.fabText}>+ Add Block</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ── Timeline block ──────────────────────────────────────────────────────────
function TimelineBlock({
  item,
  isActive,
  isDone,
  onToggle,
}: {
  item: StudySchedule;
  isActive: boolean;
  isDone: boolean;
  onToggle: () => void;
}) {
  if (isActive) {
    return (
      <View style={tb.activeCard}>
        <View style={tb.activePulse} />
        <View style={tb.activeTopRow}>
          <View style={tb.activeBadge}>
            <Text style={tb.activeBadgeText}>● ACTIVE SPRINT</Text>
          </View>
          <Badge label="RAG: High Weightage (18 pts)" color={Colors.indigo} bg="#1E1B4B" />
        </View>
        <View style={tb.activeRow}>
          <View style={{ flex: 1 }}>
            <Text style={tb.activeName}>{item.topic_name || 'Study Block'}</Text>
            <Text style={tb.activeTime}>
              {item.start_time || '02:00'} • {item.duration_minutes || 60} min
            </Text>
          </View>
          <CountdownTimer durationMinutes={item.duration_minutes || 25} />
        </View>
      </View>
    );
  }

  if (isDone) {
    return (
      <TouchableOpacity style={tb.doneCard} onPress={onToggle} activeOpacity={0.7}>
        <View style={tb.doneLeft}>
          <View style={tb.doneCheckWrap}>
            <Text style={{ color: Colors.teal, fontSize: 13 }}>✓</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[tb.doneName, { textDecorationLine: 'line-through' }]}>
              {item.topic_name || 'Study Block'}
            </Text>
            <Text style={tb.doneTime}>{item.start_time || '--'} • {item.duration_minutes || 60} min</Text>
          </View>
        </View>
        <Badge label="Done" color={Colors.teal} bg="#002E27" />
      </TouchableOpacity>
    );
  }

  const isBuffer = item.topic_name?.toLowerCase().includes('buffer');
  const isFreeGap = item.topic_name?.toLowerCase().includes('gap') || item.topic_name?.toLowerCase().includes('break');

  if (isFreeGap) {
    return (
      <TouchableOpacity style={tb.freeGapCard} onPress={onToggle} activeOpacity={0.8}>
        <View style={tb.freeGapLeft}>
          <Text style={{ color: Colors.teal, fontSize: 18 }}>+</Text>
          <View style={{ flex: 1 }}>
            <Text style={tb.freeGapTitle}>Free gap: {item.start_time || '--'} ({item.duration_minutes || 30}m)</Text>
            <Text style={tb.freeGapHint}>Tap to insert quick quiz review</Text>
          </View>
        </View>
        <Text style={tb.insertLabel}>Insert</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={tb.laterCard} onPress={onToggle} activeOpacity={0.7}>
      <View style={tb.laterLeft}>
        <View style={tb.laterIcon}>
          <Text style={{ fontSize: 16 }}>{isBuffer ? '🕐' : '🧠'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Text style={tb.laterName}>{item.topic_name || 'Study Block'}</Text>
            {isBuffer && <Badge label="RAG: Buffer +45m" color={Colors.teal} bg="#002E27" />}
          </View>
          <Text style={tb.laterTime}>{item.start_time || '--'} • {item.duration_minutes || 60} min</Text>
        </View>
      </View>
      <Badge label="Later" color={Colors.textMuted} bg="#1E293B" />
    </TouchableOpacity>
  );
}

const tb = StyleSheet.create({
  // Active
  activeCard: {
    backgroundColor: '#0A1A2E', borderRadius: Radius.lg, padding: 16, marginBottom: 12,
    borderWidth: 1.5, borderColor: Colors.indigo, position: 'relative', overflow: 'hidden',
  },
  activePulse: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
    backgroundColor: Colors.indigo, borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg,
  },
  activeTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  activeBadge: { flexDirection: 'row', alignItems: 'center' },
  activeBadgeText: { color: Colors.teal, fontWeight: '800', fontSize: 12 },
  activeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  activeName: { color: Colors.white, fontSize: 18, fontWeight: '800' },
  activeTime: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 },

  // Done
  doneCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: Colors.border, opacity: 0.75,
  },
  doneLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  doneCheckWrap: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: '#002E27',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.teal,
  },
  doneName: { color: Colors.textSecondary, fontWeight: '600', fontSize: 14 },
  doneTime: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },

  // Later
  laterCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: Colors.border,
  },
  laterLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  laterIcon: {
    width: 36, height: 36, borderRadius: 8, backgroundColor: '#1E293B',
    justifyContent: 'center', alignItems: 'center',
  },
  laterName: { color: Colors.textPrimary, fontWeight: '700', fontSize: 14 },
  laterTime: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },

  // Free gap
  freeGapCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: Radius.lg, padding: 14, marginBottom: 10,
    borderWidth: 1.5, borderColor: Colors.teal, borderStyle: 'dashed',
    backgroundColor: '#071A13',
  },
  freeGapLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  freeGapTitle: { color: Colors.textSecondary, fontWeight: '600', fontSize: 13 },
  freeGapHint: { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  insertLabel: { color: Colors.teal, fontWeight: '700', fontSize: 14 },
});

// ── Screen styles ─────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: 16 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, marginBottom: 14 },
  headerTitle: { color: Colors.textPrimary, fontSize: 22, fontWeight: '800' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: { padding: 4 },
  avatarSmall: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.indigo,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitial: { color: Colors.white, fontWeight: '700', fontSize: 15 },

  adaptiveBanner: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 14, borderWidth: 1, borderColor: Colors.border,
  },
  adaptiveLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  adaptiveIconWrap: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: '#1E293B',
    justifyContent: 'center', alignItems: 'center',
  },
  adaptiveTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  adaptiveTitle: { color: Colors.teal, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  onlineDot: { width: 7, height: 7, borderRadius: 99, backgroundColor: Colors.teal },
  adaptiveSub: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 },

  weekScroll: { marginBottom: 14 },
  dayChip: {
    alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: Radius.md, marginRight: 8,
  },
  dayChipActive: { backgroundColor: Colors.teal },
  dayLabel: { color: Colors.textMuted, fontSize: 11, fontWeight: '700' },
  dayLabelActive: { color: Colors.bg },
  dayNum: { color: Colors.textPrimary, fontSize: 18, fontWeight: '800', marginTop: 2 },
  dayNumActive: { color: Colors.bg },

  targetCard: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: 14,
    marginBottom: 18, borderWidth: 1, borderColor: Colors.border,
  },
  targetRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  targetLabel: { color: Colors.textPrimary, fontWeight: '700', fontSize: 14 },
  targetTime: { flex: 1, color: Colors.textPrimary, fontWeight: '600', fontSize: 13 },
  targetMuted: { color: Colors.textMuted },
  targetBottomRow: { flexDirection: 'row', justifyContent: 'space-between' },
  remainText: { color: Colors.textMuted, fontSize: 12 },
  trackLabel: { fontSize: 12, fontWeight: '700' },

  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { color: Colors.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  sectionMeta: { color: Colors.textMuted, fontSize: 12 },

  emptyCard: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: 28,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  emptyEmoji: { fontSize: 32, marginBottom: 8 },
  emptyText: { color: Colors.textPrimary, fontWeight: '700', fontSize: 15, marginBottom: 4 },
  emptyHint: { color: Colors.textMuted, fontSize: 13, textAlign: 'center' },

  fab: {
    position: 'absolute', bottom: 24, right: 20,
    backgroundColor: Colors.teal, borderRadius: Radius.full,
    paddingHorizontal: 20, paddingVertical: 14,
    shadowColor: Colors.teal, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  fabText: { color: Colors.bg, fontWeight: '800', fontSize: 14 },
});
