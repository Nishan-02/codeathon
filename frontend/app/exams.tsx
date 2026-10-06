import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Modal, Alert, TouchableOpacity } from 'react-native';
import { ExamService } from '../services/exams';
import { SubjectService } from '../services/subjects';
import { Exam } from '../types/exam';
import { Subject } from '../types/subject';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { formatDate } from '../utils/helpers';

export default function ExamsScreen() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [examDate, setExamDate] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [e, s] = await Promise.all([
        ExamService.getAll(),
        SubjectService.getAll(),
      ]);
      setExams(e);
      setSubjects(s);
      if (s.length > 0 && !selectedSubjectId) {
        setSelectedSubjectId(s[0].id);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateExam = async () => {
    if (!title || !examDate || !selectedSubjectId) {
      Alert.alert('Validation Error', 'Please fill in title, date (YYYY-MM-DD), and choose a subject.');
      return;
    }

    try {
      setSubmitting(true);
      const isoDate = new Date(examDate).toISOString();
      await ExamService.create({
        title: title.trim(),
        subject_id: selectedSubjectId,
        exam_date: isoDate,
      });
      setTitle('');
      setExamDate('');
      setModalVisible(false);
      loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create exam');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.headerTitle}>Exams Schedule</Text>
        <Button
          title="+ Add Exam"
          onPress={() => setModalVisible(true)}
          style={styles.addBtn}
        />
      </View>

      <FlatList
        data={exams}
        keyExtractor={(item) => item.id.toString()}
        onRefresh={loadData}
        refreshing={loading}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.date}>Date: {formatDate(item.exam_date)}</Text>
          </Card>
        )}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.emptyText}>No upcoming exams added.</Text>
          ) : null
        }
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Schedule New Exam</Text>

            <Input
              label="Exam Title"
              placeholder="e.g. Midterm Physics Exam"
              value={title}
              onChangeText={setTitle}
            />

            <Input
              label="Exam Date (YYYY-MM-DD)"
              placeholder="2026-11-15"
              value={examDate}
              onChangeText={setExamDate}
            />

            <Text style={styles.label}>Select Subject</Text>
            <View style={styles.subjectPicker}>
              {subjects.map((sub) => (
                <TouchableOpacity
                  key={`picker-${sub.id}`}
                  style={[
                    styles.subChip,
                    selectedSubjectId === sub.id ? styles.subChipSelected : null,
                  ]}
                  onPress={() => setSelectedSubjectId(sub.id)}
                >
                  <Text style={styles.chipText}>{sub.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setModalVisible(false)}
                style={styles.actionBtn}
              />
              <Button
                title="Save Exam"
                onPress={handleCreateExam}
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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  addBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  card: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  date: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 4,
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
  label: {
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
    marginBottom: 6,
  },
  subjectPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  subChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#374151',
  },
  subChipSelected: {
    backgroundColor: '#6366F1',
  },
  chipText: {
    color: '#FFFFFF',
    fontSize: 13,
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
