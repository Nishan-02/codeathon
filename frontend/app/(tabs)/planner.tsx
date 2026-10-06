import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { usePlanner } from '../../hooks/usePlanner';
import { ScheduleItem } from '../../components/planner/ScheduleItem';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';

export default function PlannerScreen() {
  const { schedule, loading, refresh, generateSchedule, toggleTaskCompleted } = usePlanner();
  const [dailyHours, setDailyHours] = useState('4.0');
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    const hours = parseFloat(dailyHours);
    if (isNaN(hours) || hours <= 0) {
      Alert.alert('Invalid Hours', 'Please enter a valid number of daily study hours.');
      return;
    }

    try {
      setGenerating(true);
      await generateSchedule({ available_daily_hours: hours });
      Alert.alert('Schedule Generated', 'Your study planner has been updated.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to generate schedule.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.configCard}>
        <Text style={styles.configTitle}>Auto Study Planner</Text>
        <Input
          label="Available Daily Study Hours"
          placeholder="e.g. 4.0"
          keyboardType="numeric"
          value={dailyHours}
          onChangeText={setDailyHours}
        />
        <Button
          title="⚡ Generate Study Schedule"
          onPress={handleGenerate}
          loading={generating}
        />
      </Card>

      <Text style={styles.sectionTitle}>Your Schedule Plan</Text>
      <FlatList
        data={schedule}
        keyExtractor={(item) => item.id.toString()}
        onRefresh={refresh}
        refreshing={loading}
        renderItem={({ item }) => (
          <ScheduleItem
            item={item}
            onToggleComplete={() => toggleTaskCompleted(item.id, !item.completed)}
          />
        )}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.emptyText}>
              No scheduled study sessions. Enter your available hours above and tap Generate.
            </Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#13131D',
  },
  configCard: {
    marginBottom: 16,
  },
  configTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  emptyText: {
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 30,
    fontSize: 14,
  },
});
