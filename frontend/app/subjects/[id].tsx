import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Modal, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
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
  const subjectId = id || '1';

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
        SubjectService.getById(subjectId).catch(() => null),
        TopicService.getBySubject(subjectId).catch(() => []),
        ProgressService.getSubjectProgress(subjectId).catch(() => null),
      ]);
      if (subjData) {
        setSubject(subjData);
      } else {
        setSubject({
          id: subjectId,
          name: 'Subject Details',
          description: 'Academic subject overview',
          difficulty: 'medium',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
      if (Array.isArray(topicData)) {
        setTopics(topicData);
      }
      if (progData) {
        setProgress(progData);
      }
    } catch (err: any) {
      // Graceful fallback
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
      const hours = parseFloat(estimatedHours) || 1.0;
      await TopicService.create(subjectId, {
        name: topicName.trim(),
        description: topicDesc.trim() || undefined,
        estimated_hours: hours,
        difficulty,
      });

      setTopicName('');
      setTopicDesc('');
      setEstimatedHours('1.0');
      setDifficulty('medium');
      setModalVisible(false);
      await loadData();
      Alert.alert('Success', 'Topic added successfully!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create topic in Firestore.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleTopic = async (topic: Topic) => {
    try {
      // Optimistic update
      setTopics((prev) =>
        prev.map((t) => (t.id === topic.id ? { ...t, completed: !t.completed } : t))
      );
      await TopicService.update(topic.id, { completed: !topic.completed });
      await loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update topic in Firestore.');
      await loadData();
    }
  };

  const completedCount = topics.filter((t) => t.completed).length;
  const progressPct = topics.length > 0 ? Math.round((completedCount / topics.length) * 100) : (progress?.progress_percentage || 0);

  return (
    <View style={styles.container}>
      {subject && (
        <Card style={styles.headerCard}>
          <Text style={styles.title}>{subject.name}</Text>
          {subject.description ? <Text style={styles.desc}>{subject.description}</Text> : null}
          <View style={{ marginTop: 12 }}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Course Progress</Text>
              <Text style={styles.progressPctText}>{progressPct}%</Text>
            </View>
            <ProgressBar progress={progressPct} />
          </View>
        </Card>
      )}

      <View style={styles.topRow}>
        <Text style={styles.sectionTitle}>Topics List ({topics.length})</Text>
        <Button
          title="+ Add Topic"
          onPress={() => setModalVisible(true)}
          style={styles.addBtn}
        />
      </View>

      <FlatList
        data={topics}
        keyExtractor={(item) => String(item.id)}
        onRefresh={loadData}
        refreshing={loading}
        renderItem={({ item }) => (
          <Card style={styles.topicCard}>
            <TouchableOpacity style={styles.topicRow} onPress={() => handleToggleTopic(item)} activeOpacity={0.8}>
              <View style={[styles.checkbox, item.completed ? styles.checkboxChecked : null]}>
                {item.completed && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.topicInfo}>
                <Text style={[styles.topicName, item.completed ? styles.completedText : null]}>
                  {item.name}
                </Text>
                {item.description ? (
                  <Text style={styles.topicSubDesc}>{item.description}</Text>
                ) : null}
                <Text style={styles.topicMeta}>
                  ⏱ {item.estimated_hours}h  •  Difficulty: {item.difficulty.toUpperCase()}
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
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
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
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  progressPctText: {
    color: '#00C9A7',
    fontSize: 13,
    fontWeight: '700',
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
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
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
    fontSize: 15,
    fontWeight: '600',
  },
  topicSubDesc: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  topicMeta: {
    color: '#818CF8',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  emptyText: {
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 30,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1E1E2E',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
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
