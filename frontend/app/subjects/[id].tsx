import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Modal, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SubjectService } from '../../services/subjects';
import { TopicService } from '../../services/topics';
import { ProgressService } from '../../services/progress';
import { getSubjectAssessments } from '../../services/aiAssessment';
import { Subject } from '../../types/subject';
import { Topic } from '../../types/topic';
import { SubjectProgress } from '../../types/progress';
import { Assessment } from '../../types/assessment';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { ProgressBar } from '../../components/common/ProgressBar';

export default function SubjectDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const subjectId = id || '1';

  const [subject, setSubject] = useState<Subject | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [progress, setProgress] = useState<SubjectProgress | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  // Topic creation state
  const [modalVisible, setModalVisible] = useState(false);
  const [topicName, setTopicName] = useState('');
  const [topicDesc, setTopicDesc] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('1.0');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [submitting, setSubmitting] = useState(false);

  // Selected assessment modal state
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);

  const loadData = useCallback(async () => {
    if (!subjectId) return;
    try {
      setLoading(true);
      const [subjData, topicData, progData, assessData] = await Promise.all([
        SubjectService.getById(subjectId).catch(() => null),
        TopicService.getBySubject(subjectId).catch(() => []),
        ProgressService.getSubjectProgress(subjectId).catch(() => null),
        getSubjectAssessments(subjectId).catch(() => []),
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
      if (Array.isArray(assessData)) {
        setAssessments(assessData.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()));
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
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{subject.name}</Text>
              {subject.description ? <Text style={styles.desc}>{subject.description}</Text> : null}
            </View>
            <TouchableOpacity
              style={styles.voiceAssessmentBtn}
              onPress={() => router.push(`/assessment/${subjectId}` as any)}
              activeOpacity={0.85}
            >
              <Text style={styles.voiceBtnText}>🎙️ Voice Assessment</Text>
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: 12 }}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Course Progress</Text>
              <Text style={styles.progressPctText}>{progressPct}%</Text>
            </View>
            <ProgressBar progress={progressPct} />
          </View>
        </Card>
      )}

      {/* Previous Voice Assessments Section */}
      {assessments.length > 0 && (
        <View style={styles.assessmentSection}>
          <Text style={styles.sectionTitle}>Previous Voice Assessments ({assessments.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.assessScroll}>
            {assessments.map((item) => {
              const pred = item.prediction || {};
              return (
                <TouchableOpacity
                  key={item.id || item.createdAt}
                  style={styles.assessmentCard}
                  onPress={() => setSelectedAssessment(item)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.assessDate}>
                    {new Date(item.createdAt || Date.now()).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                  <Text style={styles.assessScore}>Readiness: {pred.readinessScore ?? 60}%</Text>
                  <Text style={styles.assessRisk}>Risk: {(pred.riskLevel || 'Medium').toUpperCase()}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
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

      {/* Add Topic Modal */}
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

      {/* View Selected Previous Assessment Modal */}
      <Modal visible={!!selectedAssessment} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📊 Assessment Details</Text>
            {selectedAssessment && (
              <ScrollView style={{ maxHeight: 380 }}>
                <Text style={styles.assessDetailText}>
                  Date: {new Date(selectedAssessment.createdAt || Date.now()).toLocaleString()}
                </Text>
                <Text style={styles.assessDetailText}>
                  Readiness Score: {selectedAssessment.prediction?.readinessScore ?? 60}%
                </Text>
                <Text style={styles.assessDetailText}>
                  Risk Level: {(selectedAssessment.prediction?.riskLevel || 'MEDIUM').toUpperCase()}
                </Text>
                <Text style={styles.assessDetailText}>
                  Recommended Hours: {selectedAssessment.prediction?.estimatedStudyHoursPerDay ?? 2.0} hrs/day
                </Text>

                {selectedAssessment.prediction?.weakAreas && (
                  <View style={{ marginTop: 8 }}>
                    <Text style={{ color: '#F87171', fontWeight: '700', fontSize: 13 }}>Weak Areas:</Text>
                    {selectedAssessment.prediction.weakAreas.map((w: string, idx: number) => (
                      <Text key={idx} style={{ color: '#E2E8F0', fontSize: 12, marginTop: 2 }}>• {w}</Text>
                    ))}
                  </View>
                )}

                {selectedAssessment.recommendations && (
                  <View style={{ marginTop: 8 }}>
                    <Text style={{ color: '#38BDF8', fontWeight: '700', fontSize: 13 }}>Recommendations:</Text>
                    {selectedAssessment.recommendations.map((r: string, idx: number) => (
                      <Text key={idx} style={{ color: '#E2E8F0', fontSize: 12, marginTop: 2 }}>• {r}</Text>
                    ))}
                  </View>
                )}
              </ScrollView>
            )}

            <Button
              title="Close"
              onPress={() => setSelectedAssessment(null)}
              style={{ marginTop: 16 }}
            />
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
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
  voiceAssessmentBtn: {
    backgroundColor: '#00C9A7',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  voiceBtnText: {
    color: '#0B132B',
    fontSize: 12,
    fontWeight: '800',
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

  // Assessment Section
  assessmentSection: { marginBottom: 16 },
  assessScroll: { marginTop: 8 },
  assessmentCard: {
    backgroundColor: '#1C2541',
    borderRadius: 12,
    padding: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#334155',
    minWidth: 130,
  },
  assessDate: { color: '#94A3B8', fontSize: 11, fontWeight: '600' },
  assessScore: { color: '#00C9A7', fontSize: 13, fontWeight: '700', marginTop: 4 },
  assessRisk: { color: '#F87171', fontSize: 11, fontWeight: '600', marginTop: 2 },
  assessDetailText: { color: '#FFFFFF', fontSize: 14, marginTop: 4 },

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
