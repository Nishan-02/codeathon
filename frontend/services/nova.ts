// ── NOVA AI Recommendation Engine ─────────────────────────────────────────────
// Generates personalized study nudges based on:
//   • Study score / overall progress %
//   • Study timings (time of day + streak)
//   • Ranking (relative performance vs target)
//   • Upcoming exam pressure
//   • Completion rate of today's tasks

export interface NovaContext {
  studyScore: number;          // 0–100 overall progress %
  todayCompletedPct: number;   // 0–100 % of today's tasks done
  streakDays: number;          // consecutive study days
  hoursStudiedToday: number;   // hours studied so far today
  upcomingExamDays: number | null;  // days until next exam (null if none)
  totalTopics: number;
  completedTopics: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
}

export interface NovaRecommendation {
  message: string;
  insight: string;      // short diagnostic line (e.g. "87% Retention")
  tag: string;          // e.g. "High Performer" | "Needs Focus" | ...
  tagColor: string;
  urgency: 'low' | 'medium' | 'high';
  icon: string;         // emoji
  tip: string;          // actionable micro-tip
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getTimeOfDay(): NovaContext['timeOfDay'] {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
}

// ── Rule Engine ───────────────────────────────────────────────────────────────
function evaluate(ctx: NovaContext): NovaRecommendation {
  const { studyScore, todayCompletedPct, streakDays, hoursStudiedToday,
    upcomingExamDays, completedTopics, totalTopics, timeOfDay } = ctx;

  // ── EXAM PRESSURE (highest priority) ─────────────────────────────────────
  if (upcomingExamDays !== null && upcomingExamDays <= 3) {
    return {
      message: `Exam in ${upcomingExamDays}d — your recall peaks NOW. Sprint the last mile.`,
      insight: `${upcomingExamDays} day${upcomingExamDays === 1 ? '' : 's'} to exam`,
      tag: '🔥 Sprint Mode',
      tagColor: '#EF4444',
      urgency: 'high',
      icon: '🧨',
      tip: 'Do active recall every 25 min — skip passive reading.',
    };
  }

  if (upcomingExamDays !== null && upcomingExamDays <= 7) {
    return {
      message: `${upcomingExamDays} days left — this is where elite students separate. Lock in.`,
      insight: `${completedTopics}/${totalTopics} topics covered`,
      tag: '⚡ High Priority',
      tagColor: '#F97316',
      urgency: 'high',
      icon: '📌',
      tip: `Cover ${Math.max(1, Math.ceil((totalTopics - completedTopics) / upcomingExamDays))} new topics per day to finish on time.`,
    };
  }

  // ── HIGH PERFORMER (score ≥ 80) ───────────────────────────────────────────
  if (studyScore >= 80 && todayCompletedPct >= 60) {
    const msgs = [
      `Your recall is at peak right now — let's conquer the hard stuff.`,
      `${studyScore}% score puts you in the top tier. Raise the bar today.`,
      `Consistency is your superpower. Keep the momentum alive.`,
    ];
    return {
      message: msgs[streakDays % msgs.length],
      insight: `${studyScore}% Retention`,
      tag: '🌟 Top Performer',
      tagColor: '#00C9A7',
      urgency: 'low',
      icon: '🏆',
      tip: 'Try teaching a concept out loud — best retention method at your level.',
    };
  }

  // ── MORNING ENERGIZER ─────────────────────────────────────────────────────
  if (timeOfDay === 'morning' && hoursStudiedToday < 1) {
    return {
      message: `Good morning! Your brain is freshest right now — tackle the hardest topic first.`,
      insight: 'Morning = peak cognitive window',
      tag: '☀️ Morning Mode',
      tagColor: '#F59E0B',
      urgency: 'medium',
      icon: '🌅',
      tip: 'Start with 1 Pomodoro on your weakest subject. Momentum builds from there.',
    };
  }

  // ── STREAK BUILDER ────────────────────────────────────────────────────────
  if (streakDays >= 5) {
    return {
      message: `${streakDays}-day streak 🔥 — you're in the top 8% of consistent learners. Don't break the chain.`,
      insight: `${streakDays} day streak active`,
      tag: '🔥 On Fire',
      tagColor: '#F97316',
      urgency: 'low',
      icon: '⛓️',
      tip: "Even 20 min counts. Protect the streak — quality compounds.",
    };
  }

  // ── STRUGGLING / LOW SCORE ────────────────────────────────────────────────
  if (studyScore < 40) {
    return {
      message: `You're at ${studyScore}%. Small wins compound fast — pick ONE topic and finish it today.`,
      insight: `${totalTopics - completedTopics} topics remaining`,
      tag: '💡 Needs Focus',
      tagColor: '#A855F7',
      urgency: 'high',
      icon: '🎯',
      tip: 'Break each session into 15-min chunks. Overwhelm kills more than hard topics.',
    };
  }

  // ── AFTERNOON SLUMP ───────────────────────────────────────────────────────
  if (timeOfDay === 'afternoon' && todayCompletedPct < 30) {
    return {
      message: `Afternoon slump detected — a 10-min break then 25-min sprint is scientifically optimal.`,
      insight: `${Math.round(todayCompletedPct)}% of today done`,
      tag: '☕ Recharge',
      tagColor: '#6366F1',
      urgency: 'medium',
      icon: '🧘',
      tip: 'Step away, hydrate, then come back with ONE clear goal for the next session.',
    };
  }

  // ── EVENING REVIEW ────────────────────────────────────────────────────────
  if (timeOfDay === 'evening') {
    return {
      message: `Evening review mode — light revision now cements today's learning while you sleep.`,
      insight: `${hoursStudiedToday.toFixed(1)}h studied today`,
      tag: '🌙 Review Mode',
      tagColor: '#3B82F6',
      urgency: 'low',
      icon: '📝',
      tip: 'Use spaced repetition: re-read notes from 3 days ago for max retention.',
    };
  }

  // ── NIGHT OWL ────────────────────────────────────────────────────────────
  if (timeOfDay === 'night') {
    return {
      message: `Late night studying? Wrap up in 30 min — sleep is where memories consolidate.`,
      insight: 'Sleep = memory consolidation',
      tag: '🦉 Night Owl',
      tagColor: '#94A3B8',
      urgency: 'medium',
      icon: '🌙',
      tip: 'Do a 5-min brain dump of what you learned before sleeping — triples retention.',
    };
  }

  // ── DEFAULT / MODERATE PERFORMER ─────────────────────────────────────────
  const defaultMsgs = [
    `One focused hour beats three distracted ones. You're at ${studyScore}% — push to 70.`,
    `${completedTopics} topics down, ${totalTopics - completedTopics} to go. Each one compounds.`,
    `Your consistency is your edge. ${studyScore}% and climbing — keep the rhythm.`,
  ];
  return {
    message: defaultMsgs[new Date().getMinutes() % defaultMsgs.length],
    insight: `${studyScore}% overall score`,
    tag: '📈 Progressing',
    tagColor: '#00C9A7',
    urgency: 'low',
    icon: '✨',
    tip: 'Aim for 2 focused sessions today — quality beats quantity every time.',
  };
}

// ── Public API ─────────────────────────────────────────────────────────────────
export function generateNovaRecommendation(partial: Partial<NovaContext>): NovaRecommendation {
  const ctx: NovaContext = {
    studyScore: partial.studyScore ?? 0,
    todayCompletedPct: partial.todayCompletedPct ?? 0,
    streakDays: partial.streakDays ?? 0,
    hoursStudiedToday: partial.hoursStudiedToday ?? 0,
    upcomingExamDays: partial.upcomingExamDays ?? null,
    totalTopics: partial.totalTopics ?? 1,
    completedTopics: partial.completedTopics ?? 0,
    timeOfDay: partial.timeOfDay ?? getTimeOfDay(),
  };
  return evaluate(ctx);
}

export { getTimeOfDay };
