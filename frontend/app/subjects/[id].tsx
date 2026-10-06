import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Modal, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SubjectService } from '../../services/subjects';
import { TopicService } from '../../services/topics';
import { ProgressService } from '../../services/progress';
import { Subject } from '../../types/subject';
import { Topic } from '../../types/topic';
import { SubjectProgress } from '../../types/progress';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { ProgressBar } from '../../components/common/ProgressBar';

export default function SubjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const subjectId = parseInt(id || '0', 10);
  const router = useRouter();

  const [subject, setSubject] = useState<Subject | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [progress, setProgress] = useState<SubjectProgress | null>(null);
  const [loading, setLoading] = useState(true);

  // Topic creation state
  const [modalVisible, setModalVisible] = useState(false);
  const [topicName, setTopicName] = useState('');
  const [topicDesc, setTopicDesc] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('1.0');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    if (!subjectId) return;
    try {
      setLoading(true);
      const [subjData, topicData, progData] = await Promise.all([
        SubjectService.getById(subjectId),
        TopicService.getBySubject(subjectId),
        ProgressService.getSubjectProgress(subjectId).catch(() => null),
      ]);
      setSubject(subjData);
      setTopics(topicData);
      if (progData) setProgress(progData);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load subject details.');
    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddTopic = async () => {
    if (!topicName.trim()) {
      Alert.alert('Validation Error', 'Topic name is required.');
      return;
    }

    try {
      setSubmitting(true);
      await TopicService.create(subjectId, {
        name: topicName.trim(),
        description: topicDesc.trim() || undefined,
        estimated_hours: parseFloat(estimatedHours) || 1.0,
        difficulty,
      });
      setTopicName('');
      setTopicDesc('');
      setEstimatedHours('1.0');
      setDifficulty('medium');
      setModalVisible(false);
      loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create topic.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleTopic = async (topic: Topic) => {
    try {
      await TopicService.update(topic.id, { completed: !topic.completed });
      loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update topic status.');
    }
  };

  return (
    <View style={styles.container}>
      {subject && (
        <Card style={styles.headerCard}>
          <Text style={styles.title}>{subject.name}</Text>
          {subject.description ? <Text style={styles.desc}>{subject.description}</Text> : null}
          <ProgressBar progress={progress?.progress_percentage || 0} />
        </Card>
      )}

      <View style={styles.topRow}>
        <Text style={styles.sectionTitle}>Topics List</Text>
        <Button
          title="+ Add Topic"
          onPress={() => setModalVisible(true)}
          style={styles.addBtn}
        />
      </View>

      <FlatList
        data={topics}
        keyExtractor={(item) => item.id.toString()}
        onRefresh={loadData}
        refreshing={loading}
        renderItem={({ item }) => (
          <Card style={styles.topicCard}>
            <TouchableOpacity style={styles.topicRow} onPress={() => handleToggleTopic(item)}>
              <View style={[styles.checkbox, item.completed ? styles.checkboxChecked : null]}>
                {item.completed && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.topicInfo}>
                <Text style={[styles.topicName, item.completed ? styles.completedText : null]}>
                  {item.name}
                </Text>
                <Text style={styles.topicMeta}>
                  ⏱ {item.estimated_hours}h  •  Difficulty: {item.difficulty}
                </Text>
              </View>
            </TouchableOpacity>
          </Card>
        )}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.emptyText}>No topics added yet. Tap "+ Add Topic" to add one.</Text>
          ) : null
        }
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Topic to Subject</Text>
            <Input
              label="Topic Name"
              placeholder="e.g. Integration by Parts"
              value={topicName}
              onChangeText={setTopicName}
            />
            <Input
              label="Description (Optional)"
              placeholder="e.g. Chapter 4 concepts"
              value={topicDesc}
              onChangeText={setTopicDesc}
            />
            <Input
              label="Estimated Study Hours"
              placeholder="1.5"
              keyboardType="numeric"
              value={estimatedHours}
              onChangeText={setEstimatedHours}
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setModalVisible(false)}
                style={styles.actionBtn}
              />
              <Button
                title="Save Topic"
                onPress={handleAddTopic}
                loading={submitting}
                style={styles.actionBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#13131D',
  },
  headerCard: {
    marginBottom: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  desc: {
    color: '#9CA3AF',
    fontSize: 14,
    marginVertical: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  topicCard: {
    marginVertical: 4,
  },
  topicRow: {
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
  topicInfo: {
    flex: 1,
  },
  topicName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  topicMeta: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  emptyText: {
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 30,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1E1E2E',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionBtn: {
    flex: 1,
  },
});
