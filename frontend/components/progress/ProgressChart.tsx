import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SubjectProgress } from '../../types/progress';
import { ProgressBar } from '../common/ProgressBar';
import { Card } from '../common/Card';

interface ProgressChartProps {
  overallPercentage: number;
  subjectProgressList: SubjectProgress[];
}

export const ProgressChart: React.FC<ProgressChartProps> = ({
  overallPercentage,
  subjectProgressList,
}) => {
  return (
    <View style={styles.container}>
      <Card style={styles.overallCard}>
        <Text style={styles.overallTitle}>Overall Completion Progress</Text>
        <Text style={styles.overallValue}>{`${Math.round(overallPercentage)}%`}</Text>
        <ProgressBar progress={overallPercentage} showLabel={false} color="#6366F1" />
      </Card>

      <Text style={styles.sectionTitle}>Subject Breakdown</Text>
      {subjectProgressList.length === 0 ? (
        <Text style={styles.emptyText}>No subjects available to display progress.</Text>
      ) : (
        subjectProgressList.map((item) => (
          <Card key={`progress-${item.subject_id}`} style={styles.itemCard}>
            <View style={styles.header}>
              <Text style={styles.subjectText}>Subject #{item.subject_id}</Text>
              <Text style={styles.statsText}>{`${item.completed_topics} / ${item.total_topics} topics`}</Text>
            </View>
            <ProgressBar progress={item.progress_percentage} color="#10B981" />
          </Card>
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overallCard: {
    backgroundColor: '#2A2B3D',
    alignItems: 'center',
    paddingVertical: 20,
  },
  overallTitle: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
  overallValue: {
    color: '#6366F1',
    fontSize: 36,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    color: '#6B7280',
    fontStyle: 'italic',
  },
  itemCard: {
    marginVertical: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  subjectText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  statsText: {
    color: '#9CA3AF',
    fontSize: 13,
  },
});
