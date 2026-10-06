import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Exam } from '../../types/exam';
import { Assignment } from '../../types/assignment';
import { StudySchedule } from '../../types/planner';
import { Card } from '../common/Card';
import { formatDate } from '../../utils/helpers';

interface CalendarViewProps {
  exams: Exam[];
  assignments: Assignment[];
  schedules: StudySchedule[];
}

export const CalendarView: React.FC<CalendarViewProps> = ({ exams, assignments, schedules }) => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionHeader}>Upcoming Exams 📝</Text>
      {exams.length === 0 ? (
        <Text style={styles.emptyText}>No upcoming exams scheduled.</Text>
      ) : (
        exams.map((exam) => (
          <Card key={`exam-${exam.id}`} style={styles.examCard}>
            <Text style={styles.eventTitle}>{exam.title}</Text>
            <Text style={styles.eventDate}>Date: {formatDate(exam.exam_date)}</Text>
          </Card>
        ))
      )}

      <Text style={[styles.sectionHeader, { marginTop: 16 }]}>Assignment Deadlines ⏳</Text>
      {assignments.length === 0 ? (
        <Text style={styles.emptyText}>No pending assignment deadlines.</Text>
      ) : (
        assignments.map((assignment) => (
          <Card key={`assignment-${assignment.id}`} style={styles.assignmentCard}>
            <Text style={styles.eventTitle}>{assignment.title}</Text>
            <Text style={styles.eventDate}>Due: {formatDate(assignment.due_date)}</Text>
          </Card>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionHeader: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyText: {
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  examCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  assignmentCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  eventTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  eventDate: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 4,
  },
});
