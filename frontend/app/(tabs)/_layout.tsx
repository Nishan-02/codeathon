import React, { useState, useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomTabHeaderProps } from '@react-navigation/bottom-tabs';
import { ExamService } from '../../services/exams';
import { AssignmentService } from '../../services/assignments';
import { PlannerService } from '../../services/planner';
import { Exam } from '../../types/exam';
import { Assignment } from '../../types/assignment';
import { StudySchedule } from '../../types/planner';

export interface AttentionItem {
  id: string | number;
  type: 'exam' | 'assignment' | 'task';
  title: string;
  subject: string;
  daysLeft: number;
  formattedDate: string;
  urgency: 'critical' | 'urgent' | 'upcoming';
  categoryLabel: string;
}

// ── Mobile Top Navigation Bar ────────────────────────────────────────────────
function MobileTopNavBar(props: BottomTabHeaderProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  // Attention & Urgent Deadlines (Exams, Assignments, Study Tasks)
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'exam' | 'assignment' | 'task'>('all');
  const [isSectionCollapsed, setIsSectionCollapsed] = useState(false);
  const [attentionItems, setAttentionItems] = useState<AttentionItem[]>([
    {
      id: 'crit-task-1',
      type: 'task',
      title: 'Complete B-Tree Indexing & Query Optimizations',
      subject: 'Database Systems',
      daysLeft: 0,
      formattedDate: 'Today',
      urgency: 'critical',
      categoryLabel: 'TASK DUE TODAY',
    },
    {
      id: 'crit-asg-1',
      type: 'assignment',
      title: 'OS Kernel Synchronization & Lock Lab',
      subject: 'Operating Systems',
      daysLeft: 1,
      formattedDate: 'Oct 07',
      urgency: 'critical',
      categoryLabel: 'ASSIGNMENT DUE TOMORROW',
    },
    {
      id: 'urg-task-2',
      type: 'task',
      title: 'Backprop & Gradient Descent Calculus Review',
      subject: 'Machine Learning',
      daysLeft: 2,
      formattedDate: 'Oct 08',
      urgency: 'urgent',
      categoryLabel: 'PRIORITY STUDY BLOCK',
    },
    {
      id: 'urg-exam-1',
      type: 'exam',
      title: 'Database Management Systems Midterm',
      subject: 'Database Systems',
      daysLeft: 3,
      formattedDate: 'Oct 09',
      urgency: 'urgent',
      categoryLabel: 'MIDTERM EXAM',
    },
    {
      id: 'urg-asg-2',
      type: 'assignment',
      title: 'Distributed Systems MapReduce Project',
      subject: 'Distributed Systems',
      daysLeft: 4,
      formattedDate: 'Oct 10',
      urgency: 'urgent',
      categoryLabel: 'COURSEWORK LAB',
    },
    {
      id: 'up-exam-2',
      type: 'exam',
      title: 'Machine Learning Model Assessment',
      subject: 'Machine Learning',
      daysLeft: 7,
      formattedDate: 'Oct 13',
      urgency: 'upcoming',
      categoryLabel: 'SEMESTER EXAM',
    },
  ]);

  useEffect(() => {
    Promise.all([
      ExamService.getAll().catch(() => [] as Exam[]),
      AssignmentService.getAll().catch(() => [] as Assignment[]),
      PlannerService.getSchedule().catch(() => [] as StudySchedule[]),
    ]).then(([exams, assignments, schedules]) => {
      const list: AttentionItem[] = [];
      const now = Date.now();

      // 1. Process Exams
      exams.forEach((ex) => {
        if (ex.exam_date) {
          const d = new Date(ex.exam_date).getTime();
          const days = Math.ceil((d - now) / 86400000);
          if (days >= 0 && days <= 14) {
            list.push({
              id: ex.id || `exam-${ex.exam_date}`,
              type: 'exam',
              title: `${ex.subject_name || 'Subject'} Exam Assessment`,
              subject: ex.subject_name || 'Core Exam',
              daysLeft: days,
              formattedDate: new Date(ex.exam_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              }),
              urgency: days <= 1 ? 'critical' : days <= 3 ? 'urgent' : 'upcoming',
              categoryLabel: days === 0 ? '🚨 EXAM TODAY' : days === 1 ? '⚡ EXAM TOMORROW' : '📅 EXAM DEADLINE',
            });
          }
        }
      });

      // 2. Process Pending Assignments
      assignments
        .filter((a) => !a.completed)
        .forEach((asg) => {
          if (asg.due_date) {
            const d = new Date(asg.due_date).getTime();
            const days = Math.ceil((d - now) / 86400000);
            if (days >= 0 && days <= 14) {
              list.push({
                id: asg.id || `asg-${asg.due_date}`,
                type: 'assignment',
                title: asg.title || 'Course Assignment',
                subject: asg.subject_name || 'Coursework',
                daysLeft: days,
                formattedDate: new Date(asg.due_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                }),
                urgency: days <= 1 ? 'critical' : days <= 3 ? 'urgent' : 'upcoming',
                categoryLabel: days === 0 ? '🚨 DUE TODAY' : days === 1 ? '🚨 DUE TOMORROW' : '📝 ASSIGNMENT DUE',
              });
            }
          }
        });

      // 3. Process Pending Study Tasks
      schedules
        .filter((s) => !s.completed)
        .forEach((sch) => {
          if (sch.scheduled_date) {
            const d = new Date(sch.scheduled_date).getTime();
            const days = Math.ceil((d - now) / 86400000);
            if (days >= 0 && days <= 7) {
              list.push({
                id: sch.id || `task-${sch.scheduled_date}-${sch.topic_name}`,
                type: 'task',
                title: sch.topic_name || 'Study Focus Session',
                subject: sch.subject_name || 'Target Subject',
                daysLeft: days,
                formattedDate: days === 0 ? 'Today' : new Date(sch.scheduled_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                }),
                urgency: days <= 1 ? 'critical' : days <= 3 ? 'urgent' : 'upcoming',
                categoryLabel: days === 0 ? '🎯 DUE TODAY' : '🎯 STUDY TASK',
              });
            }
          }
        });

      if (list.length > 0) {
        list.sort((a, b) => a.daysLeft - b.daysLeft);
        setAttentionItems(list);
      }
    });
  }, []);

  if (isDesktop) return null;

  const currentRouteName = props.route.name;

  const filteredItems = attentionItems.filter((item) => {
    if (selectedFilter === 'all') return true;
    return item.type === selectedFilter;
  });

  const examCount = attentionItems.filter((i) => i.type === 'exam').length;
  const asgCount = attentionItems.filter((i) => i.type === 'assignment').length;
  const taskCount = attentionItems.filter((i) => i.type === 'task').length;

  const TAB_ITEMS = [
    { name: 'index', label: 'Today', icon: '🏠', path: '/(tabs)' },
    { name: 'subjects', label: 'Subjects', icon: '📚', path: '/(tabs)/subjects' },
    { name: 'planner', label: 'Planner', icon: '⚡', path: '/(tabs)/planner' },
    { name: 'docuquery', label: 'DocuQuery AI', icon: '📑', path: '/(tabs)/docuquery' },
    { name: 'calendar', label: 'Calendar', icon: '📅', path: '/(tabs)/calendar' },
    { name: 'progress', label: 'Progress', icon: '📊', path: '/(tabs)/progress' },
    { name: 'profile', label: 'Profile', icon: '👤', path: '/(tabs)/profile' },
  ];

  const handleCardPress = (item: AttentionItem) => {
    if (item.type === 'exam') {
      router.push('/exams' as any);
    } else if (item.type === 'assignment') {
      router.push('/(tabs)/planner' as any);
    } else {
      router.push('/(tabs)/planner' as any);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={topS.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#070D18" />
      <View style={topS.headerContainer}>
        {/* Brand & Profile Row */}
        <View style={topS.brandRow}>
          <TouchableOpacity
            style={topS.brandLeft}
            onPress={() => router.push('/(tabs)')}
            activeOpacity={0.8}
          >
            <View style={topS.logoBox}>
              <Text style={topS.logoEmoji}>📖</Text>
            </View>
            <View>
              <Text style={topS.brandTitle}>StudyFlow</Text>
              <Text style={topS.brandSub}>AI-Powered Learning</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={topS.avatarCircle}
            onPress={() => router.push('/(tabs)/profile')}
            activeOpacity={0.8}
          >
            <Text style={topS.avatarText}>H</Text>
          </TouchableOpacity>
        </View>

        {/* ── ATTENTION NEEDED / URGENT DEADLINES SECTION ── */}
        <View style={topS.attentionSection}>
          <View style={topS.attentionHeaderRow}>
            <View style={topS.attentionTitleGroup}>
              <View style={topS.pulsingDot} />
              <Text style={topS.attentionHeading}>⚡ ATTENTION NEEDED</Text>
              <View style={topS.countBadge}>
                <Text style={topS.countBadgeText}>{attentionItems.length} Due Soon</Text>
              </View>
            </View>

            <TouchableOpacity
              style={topS.collapseBtn}
              onPress={() => setIsSectionCollapsed(!isSectionCollapsed)}
              activeOpacity={0.7}
            >
              <Text style={topS.collapseBtnText}>{isSectionCollapsed ? 'Show ▲' : 'Hide ▼'}</Text>
            </TouchableOpacity>
          </View>

          {!isSectionCollapsed && (
            <>
              {/* Category Filter Chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={topS.filterRow}
              >
                <TouchableOpacity
                  style={[topS.filterChip, selectedFilter === 'all' && topS.filterChipActive]}
                  onPress={() => setSelectedFilter('all')}
                  activeOpacity={0.75}
                >
                  <Text style={[topS.filterChipText, selectedFilter === 'all' && topS.filterChipTextActive]}>
                    All ({attentionItems.length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[topS.filterChip, selectedFilter === 'task' && topS.filterChipActive]}
                  onPress={() => setSelectedFilter('task')}
                  activeOpacity={0.75}
                >
                  <Text style={[topS.filterChipText, selectedFilter === 'task' && topS.filterChipTextActive]}>
                    🎯 Tasks ({taskCount})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[topS.filterChip, selectedFilter === 'exam' && topS.filterChipActive]}
                  onPress={() => setSelectedFilter('exam')}
                  activeOpacity={0.75}
                >
                  <Text style={[topS.filterChipText, selectedFilter === 'exam' && topS.filterChipTextActive]}>
                    📅 Exams ({examCount})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[topS.filterChip, selectedFilter === 'assignment' && topS.filterChipActive]}
                  onPress={() => setSelectedFilter('assignment')}
                  activeOpacity={0.75}
                >
                  <Text style={[topS.filterChipText, selectedFilter === 'assignment' && topS.filterChipTextActive]}>
                    📝 Assignments ({asgCount})
                  </Text>
                </TouchableOpacity>
              </ScrollView>

              {/* Multi-Card Attention Tray */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={topS.cardsScroll}
              >
                {filteredItems.map((item) => {
                  const isCritical = item.urgency === 'critical';
                  const isUrgent = item.urgency === 'urgent';

                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        topS.card,
                        isCritical ? topS.cardCritical : isUrgent ? topS.cardUrgent : topS.cardUpcoming,
                      ]}
                      onPress={() => handleCardPress(item)}
                      activeOpacity={0.85}
                    >
                      {/* Top Meta Bar */}
                      <View style={topS.cardTopRow}>
                        <View
                          style={[
                            topS.urgencyTag,
                            isCritical ? topS.tagCritical : isUrgent ? topS.tagUrgent : topS.tagUpcoming,
                          ]}
                        >
                          <Text style={topS.urgencyTagText}>
                            {item.type === 'exam' ? '📅' : item.type === 'assignment' ? '📝' : '🎯'}{' '}
                            {item.categoryLabel}
                          </Text>
                        </View>
                        <View
                          style={[
                            topS.daysPill,
                            isCritical ? topS.daysPillCritical : isUrgent ? topS.daysPillUrgent : topS.daysPillUpcoming,
                          ]}
                        >
                          <Text
                            style={[
                              topS.daysPillText,
                              isCritical
                                ? topS.daysPillTextCritical
                                : isUrgent
                                ? topS.daysPillTextUrgent
                                : topS.daysPillTextUpcoming,
                            ]}
                          >
                            ⏳ {item.daysLeft === 0 ? 'Today!' : `${item.daysLeft}d left`}
                          </Text>
                        </View>
                      </View>

                      {/* Title */}
                      <Text style={topS.cardTitle} numberOfLines={2}>
                        {item.title}
                      </Text>

                      {/* Footer Row */}
                      <View style={topS.cardFooter}>
                        <View style={topS.subjectPill}>
                          <Text style={topS.subjectPillText} numberOfLines={1}>
                            📚 {item.subject}
                          </Text>
                        </View>
                        <View style={topS.dateActionGroup}>
                          <Text style={topS.dateText}>{item.formattedDate}</Text>
                          <Text style={topS.actionChevron}>›</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </>
          )}
        </View>

        {/* Horizontal Navigation Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={topS.tabsScroll}
        >
          {TAB_ITEMS.map((tab) => {
            const isFocused = currentRouteName === tab.name;

            return (
              <TouchableOpacity
                key={tab.name}
                style={[topS.tabChip, isFocused && topS.tabChipActive]}
                onPress={() => {
                  if (!isFocused) {
                    props.navigation.navigate(tab.name);
                  }
                }}
                activeOpacity={0.75}
              >
                <Text style={topS.tabIcon}>{tab.icon}</Text>
                <Text style={[topS.tabLabel, isFocused && topS.tabLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const topS = StyleSheet.create({
  safe: {
    backgroundColor: '#070D18',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 223, 178, 0.15)',
  },
  headerContainer: {
    backgroundColor: 'rgba(7, 14, 26, 0.96)',
    paddingTop: 8,
    paddingBottom: 8,
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(16px)' } as any) : {}),
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#00DFB2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00DFB2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
  },
  logoEmoji: {
    fontSize: 16,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  brandSub: {
    color: '#00DFB2',
    fontSize: 10,
    fontWeight: '600',
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },

  // ── Attention Needed Section Styles ──
  attentionSection: {
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  attentionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  attentionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulsingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  attentionHeading: {
    color: '#F87171',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  countBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderRadius: 99,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  countBadgeText: {
    color: '#FCA5A5',
    fontSize: 9.5,
    fontWeight: '800',
  },
  collapseBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  collapseBtnText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  },

  // Filter Row
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  filterChip: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.7)',
  },
  filterChipActive: {
    backgroundColor: 'rgba(0, 223, 178, 0.16)',
    borderColor: '#00DFB2',
  },
  filterChipText: {
    color: '#94A3B8',
    fontSize: 10.5,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: '#00DFB2',
  },

  // Cards Scroll
  cardsScroll: {
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 4,
  },
  card: {
    width: 250,
    borderRadius: 14,
    padding: 11,
    backgroundColor: 'rgba(11, 21, 38, 0.95)',
    borderWidth: 1.2,
    ...(Platform.OS === 'web'
      ? ({
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.45)',
        cursor: 'pointer',
      } as any)
      : {}),
  },
  cardCritical: {
    borderColor: 'rgba(239, 68, 68, 0.55)',
    backgroundColor: 'rgba(28, 14, 24, 0.95)',
  },
  cardUrgent: {
    borderColor: 'rgba(245, 158, 11, 0.5)',
    backgroundColor: 'rgba(28, 21, 14, 0.95)',
  },
  cardUpcoming: {
    borderColor: 'rgba(0, 223, 178, 0.35)',
    backgroundColor: 'rgba(11, 25, 34, 0.95)',
  },

  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 6,
  },
  urgencyTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagCritical: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  tagUrgent: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  tagUpcoming: {
    backgroundColor: 'rgba(0, 223, 178, 0.15)',
  },
  urgencyTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  daysPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 99,
    borderWidth: 1,
  },
  daysPillCritical: {
    backgroundColor: 'rgba(239, 68, 68, 0.22)',
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  daysPillUrgent: {
    backgroundColor: 'rgba(245, 158, 11, 0.22)',
    borderColor: 'rgba(245, 158, 11, 0.5)',
  },
  daysPillUpcoming: {
    backgroundColor: 'rgba(0, 223, 178, 0.16)',
    borderColor: 'rgba(0, 223, 178, 0.4)',
  },
  daysPillText: {
    fontSize: 10,
    fontWeight: '900',
  },
  daysPillTextCritical: {
    color: '#F87171',
  },
  daysPillTextUrgent: {
    color: '#FBBF24',
  },
  daysPillTextUpcoming: {
    color: '#00DFB2',
  },

  cardTitle: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
    lineHeight: 16,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subjectPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    maxWidth: '65%',
  },
  subjectPillText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  },
  dateActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dateText: {
    color: '#CBD5E1',
    fontSize: 10.5,
    fontWeight: '700',
  },
  actionChevron: {
    color: '#00DFB2',
    fontSize: 14,
    fontWeight: '800',
  },

  // ── Tabs Pills ──
  tabsScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 2,
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 99,
    backgroundColor: 'rgba(10, 20, 36, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(30, 41, 59, 0.7)',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  tabChipActive: {
    backgroundColor: 'rgba(0, 223, 178, 0.15)',
    borderColor: '#00DFB2',
  },
  tabIcon: {
    fontSize: 13,
  },
  tabLabel: {
    color: '#8E9BAE',
    fontSize: 12,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#00DFB2',
    fontWeight: '700',
  },
});

export default function TabsLayout() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  return (
    <Tabs
      screenOptions={{
        headerShown: !isDesktop,
        header: (props) => <MobileTopNavBar {...props} />,
        tabBarStyle: {
          display: 'none', // Completely removes the bottom navigation bar from website & mobile
          height: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
        }}
      />
      <Tabs.Screen
        name="subjects"
        options={{
          title: 'Subjects',
        }}
      />
      <Tabs.Screen
        name="planner"
        options={{
          title: 'Planner',
        }}
      />
      <Tabs.Screen
        name="docuquery"
        options={{
          title: 'DocuQuery AI',
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}
