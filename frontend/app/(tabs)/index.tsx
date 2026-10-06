import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { OverviewCard } from '../../components/dashboard/OverviewCard';
import { ScheduleItem } from '../../components/planner/ScheduleItem';
import { ProgressService } from '../../services/progress';
import { ExamService } from '../../services/exams';
import { AssignmentService } from '../../services/assignments';
import { PlannerService } from '../../services/planner';
import { OverallProgress } from '../../types/progress';
import { Exam } from '../../types/exam';
import { Assignment } from '../../types/assignment';
import { StudySchedule } from '../../types/planner';

export default function DashboardScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [progress, setProgress] = useState<OverallProgress | null>(null);
  const [upcomingExams, setUpcomingExams] = useState<Exam[]>([]);
  const [upcomingAssignments, setUpcomingAssignments] = useState<Assignment[]>([]);
  const [todayTasks, setTodayTasks] = useState<StudySchedule[]>([]);

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
      setTodayTasks(plannerData.filter((s) => s.scheduled_date === todayStr));
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor="#6366F1" />}
    >
      <Text style={styles.headerTitle}>Dashboard Overview</Text>

      <View style={styles.grid}>
        <OverviewCard
          title="Overall Progress"
          value={`${Math.round(progress?.overall_percentage || 0)}%`}
          subtitle={`${progress?.completed_topics || 0}/${progress?.total_topics || 0} topics`}
          iconColor="#6366F1"
        />
        <OverviewCard
          title="Upcoming Exams"
          value={upcomingExams.length}
          subtitle="Next 30 days"
          iconColor="#EF4444"
        />
      </View>

      <View style={styles.grid}>
        <OverviewCard
          title="Pending Assignments"
          value={upcomingAssignments.length}
          subtitle="Assignments due"
          iconColor="#F59E0B"
        />
        <OverviewCard
          title="Today's Tasks"
          value={todayTasks.length}
          subtitle="Study sessions today"
          iconColor="#10B981"
        />
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Today's Study Schedule ⏰</Text>
      </View>
      {todayTasks.length === 0 ? (
        <Text style={styles.emptyText}>No tasks scheduled for today.</Text>
      ) : (
        todayTasks.map((task) => <ScheduleItem key={`today-${task.id}`} item={task} />)
      )}

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Quick Navigation</Text>
      </View>
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#374151' }]}
          onPress={() => router.push('/exams')}
        >
          <Text style={styles.actionBtnText}>📝 Manage Exams</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#374151' }]}
          onPress={() => router.push('/assignments')}
        >
          <Text style={styles.actionBtnText}>⏳ Manage Assignments</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#13131D',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 30,
  },
  actionBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
