import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StudySchedule } from '../../types/planner';
import { Card } from '../common/Card';
import { formatDate, formatTime } from '../../utils/helpers';

interface ScheduleItemProps {
  item: StudySchedule;
  subjectName?: string;
  topicName?: string;
  onToggleComplete?: () => void;
}

export const ScheduleItem: React.FC<ScheduleItemProps> = ({
  item,
  subjectName = 'Subject',
  topicName = 'Study Session',
  onToggleComplete,
}) => {
  return (
    <Card style={[styles.card, item.completed ? styles.completedCard : null]}>
      <View style={styles.container}>
        <TouchableOpacity
          style={[styles.checkbox, item.completed ? styles.checkboxChecked : null]}
          onPress={onToggleComplete}
        >
          {item.completed && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>

        <View style={styles.info}>
          <Text style={styles.subjectText}>{subjectName}</Text>
          <Text style={[styles.topicText, item.completed ? styles.strikethrough : null]}>
            {topicName}
          </Text>
          <Text style={styles.timeText}>
            📅 {formatDate(item.scheduled_date)}
            {item.start_time ? `  ⏰ ${formatTime(item.start_time)} - ${formatTime(item.end_time)}` : ''}
          </Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 4,
  },
  completedCard: {
    opacity: 0.6,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#6366F1',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  info: {
    flex: 1,
  },
  subjectText: {
    color: '#6366F1',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  topicText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginVertical: 2,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  timeText: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
});
