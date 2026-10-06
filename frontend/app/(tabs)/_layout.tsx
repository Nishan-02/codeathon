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
import { Colors } from '../../constants/theme';
import { BottomTabHeaderProps } from '@react-navigation/bottom-tabs';
import { ExamService } from '../../services/exams';
import { AssignmentService } from '../../services/assignments';
import { Exam } from '../../types/exam';
import { Assignment } from '../../types/assignment';

// ── Mobile Top Navigation Bar ────────────────────────────────────────────────
function MobileTopNavBar(props: BottomTabHeaderProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  // Upcoming Deadlines State (Exams & Assignments)
  const [deadlines, setDeadlines] = useState<
    Array<{
      id: string | number;
      type: 'exam' | 'assignment';
      title: string;
      daysLeft: number;
      formattedDate: string;
    }>
  >([
    {
      id: 'default-1',
      type: 'exam',
      title: 'Database Management Midterm',
      daysLeft: 3,
      formattedDate: 'Oct 09',
    },
    {
      id: 'default-2',
      type: 'assignment',
      title: 'Operating Systems Lab Assignment',
      daysLeft: 5,
      formattedDate: 'Oct 11',
    },
  ]);
  const [activeDeadlineIdx, setActiveDeadlineIdx] = useState(0);

  useEffect(() => {
    Promise.all([
      ExamService.getAll().catch(() => [] as Exam[]),
      AssignmentService.getAll().catch(() => [] as Assignment[]),
    ]).then(([exams, assignments]) => {
      const list: Array<{
        id: string | number;
        type: 'exam' | 'assignment';
        title: string;
        daysLeft: number;
        formattedDate: string;
      }> = [];

      const now = Date.now();

      exams.forEach((ex) => {
        if (ex.exam_date) {
          const d = new Date(ex.exam_date).getTime();
          const days = Math.ceil((d - now) / 86400000);
          if (days >= 0) {
            list.push({
              id: ex.id || `exam-${ex.exam_date}`,
              type: 'exam',
              title: `${ex.subject_name || 'Exam'} Midterm`,
              daysLeft: days,
              formattedDate: new Date(ex.exam_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              }),
            });
          }
        }
      });

      assignments
        .filter((a) => !a.completed)
        .forEach((asg) => {
          if (asg.due_date) {
            const d = new Date(asg.due_date).getTime();
            const days = Math.ceil((d - now) / 86400000);
            if (days >= 0) {
              list.push({
                id: asg.id || `asg-${asg.due_date}`,
                type: 'assignment',
                title: asg.title || 'Course Assignment',
                daysLeft: days,
                formattedDate: new Date(asg.due_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                }),
              });
            }
          }
        });

      if (list.length > 0) {
        list.sort((a, b) => a.daysLeft - b.daysLeft);
        setDeadlines(list);
      }
    });
  }, []);

  if (isDesktop) return null;

  const currentRouteName = props.route.name;
  const currentDeadline = deadlines[activeDeadlineIdx % deadlines.length];

  const TAB_ITEMS = [
    { name: 'index', label: 'Today', icon: '🏠', path: '/(tabs)' },
    { name: 'subjects', label: 'Subjects', icon: '📚', path: '/(tabs)/subjects' },
    { name: 'planner', label: 'Planner', icon: '⚡', path: '/(tabs)/planner' },
    { name: 'docuquery', label: 'DocuQuery AI', icon: '📑', path: '/(tabs)/docuquery' },
    { name: 'calendar', label: 'Calendar', icon: '📅', path: '/(tabs)/calendar' },
    { name: 'progress', label: 'Progress', icon: '📊', path: '/(tabs)/progress' },
    { name: 'profile', label: 'Profile', icon: '👤', path: '/(tabs)/profile' },
  ];

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

        {/* ── Upcoming Deadline & Days Remaining Card Section ── */}
        {currentDeadline && (
          <TouchableOpacity
            style={topS.deadlineCard}
            onPress={() => {
              if (deadlines.length > 1) {
                setActiveDeadlineIdx((prev) => (prev + 1) % deadlines.length);
              } else {
                router.push(currentDeadline.type === 'exam' ? ('/exams' as any) : ('/assignments' as any));
              }
            }}
            activeOpacity={0.85}
          >
            <View style={topS.deadlineLeft}>
              <View style={[
                topS.deadlineIconBox,
                currentDeadline.type === 'exam' ? topS.iconBoxExam : topS.iconBoxAsg
              ]}>
                <Text style={topS.deadlineEmoji}>
                  {currentDeadline.type === 'exam' ? '📅' : '📝'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={topS.deadlineMetaRow}>
                  <Text style={topS.deadlineTag}>
                    {currentDeadline.type === 'exam' ? 'EXAM DEADLINE' : 'ASSIGNMENT DUE'}
                  </Text>
                  <View style={topS.daysLeftPill}>
                    <Text style={topS.daysLeftText}>
                      ⏳ {currentDeadline.daysLeft === 0 ? 'Today!' : `${currentDeadline.daysLeft}d left`}
                    </Text>
                  </View>
                </View>
                <Text style={topS.deadlineTitle} numberOfLines={1}>
                  {currentDeadline.title}
                </Text>
              </View>
            </View>
            <View style={topS.deadlineRightActions}>
              <Text style={topS.deadlineDateText}>{currentDeadline.formattedDate}</Text>
              <Text style={topS.deadlineChevron}>›</Text>
            </View>
          </TouchableOpacity>
        )}

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
    backgroundColor: 'rgba(7, 14, 26, 0.95)',
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

  // ── Deadline Card Section Styles ──
  deadlineCard: {
    marginHorizontal: 14,
    marginBottom: 8,
    backgroundColor: 'rgba(11, 21, 38, 0.92)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 223, 178, 0.28)',
    paddingVertical: 7,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...(Platform.OS === 'web'
      ? ({
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
        cursor: 'pointer',
      } as any)
      : {}),
  },
  deadlineLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    flex: 1,
  },
  deadlineIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  iconBoxExam: {
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  iconBoxAsg: {
    backgroundColor: 'rgba(0, 223, 178, 0.14)',
    borderColor: 'rgba(0, 223, 178, 0.35)',
  },
  deadlineEmoji: {
    fontSize: 14,
  },
  deadlineMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 1,
  },
  deadlineTag: {
    color: '#8E9BAE',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  daysLeftPill: {
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    borderRadius: 99,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  daysLeftText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '800',
  },
  deadlineTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  deadlineRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 8,
  },
  deadlineDateText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  deadlineChevron: {
    color: '#00DFB2',
    fontSize: 16,
    fontWeight: '700',
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
