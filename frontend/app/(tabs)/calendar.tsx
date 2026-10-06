import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, RefreshControl } from 'react-native';
import { CalendarView } from '../../components/calendar/CalendarView';
import { ExamService } from '../../services/exams';
import { AssignmentService } from '../../services/assignments';
import { PlannerService } from '../../services/planner';
import { Exam } from '../../types/exam';
import { Assignment } from '../../types/assignment';
import { StudySchedule } from '../../types/planner';

export default function CalendarScreen() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [schedules, setSchedules] = useState<StudySchedule[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [e, a, s] = await Promise.all([
        ExamService.getAll().catch(() => []),
        AssignmentService.getAll().catch(() => []),
        PlannerService.getSchedule().catch(() => []),
      ]);
      setExams(e);
      setAssignments(a);
      setSchedules(s);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Academic Timetable & Calendar</Text>
      <CalendarView exams={exams} assignments={assignments} schedules={schedules} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#13131D',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});
