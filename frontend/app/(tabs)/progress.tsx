import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Text } from 'react-native';
import { ProgressChart } from '../../components/progress/ProgressChart';
import { ProgressService } from '../../services/progress';
import { OverallProgress } from '../../types/progress';

export default function ProgressScreen() {
  const [progressData, setProgressData] = useState<OverallProgress | null>(null);
  const [loading, setLoading] = useState(false);

  const loadProgress = async () => {
    try {
      setLoading(true);
      const data = await ProgressService.getOverallProgress();
      setProgressData(data);
    } catch (err) {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProgress();
  }, []);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadProgress} tintColor="#6366F1" />}
    >
      <Text style={styles.title}>Study Progress Analytics</Text>
      <ProgressChart
        overallPercentage={progressData?.overall_percentage || 0}
        subjectProgressList={progressData?.subject_progress || []}
      />
    </ScrollView>
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
