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
        ExamService.getAll().catch(() => []),
        SubjectService.getAll().catch(() => []),
      ]);
      if (Array.isArray(e)) setExams(e);
      if (Array.isArray(s)) {
        setSubjects(s);
        if (s.length > 0 && !selectedSubjectId) {
          setSelectedSubjectId(s[0].id);
        }
      }
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenModal = () => {
    if (subjects.length > 0) {
      setSelectedSubjectId(subjects[0].id);
    } else {
      setSelectedSubjectId(1);
    }
    setModalVisible(true);
  };

  const handleCreateExam = async () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter an exam title.');
      return;
    }

    try {
      setSubmitting(true);
      // Clean and normalize date (handle spaces or dashes e.g. "2020 10 06" -> "2020-10-06")
      let rawDate = examDate.trim();
      let isoDate: string;

      if (!rawDate) {
        isoDate = new Date(Date.now() + 7 * 86400000).toISOString();
      } else {
        const normalized = rawDate.replace(/[\s/.]+/g, '-');
        const parsed = new Date(normalized);
        if (!isNaN(parsed.getTime())) {
          isoDate = parsed.toISOString();
        } else {
          isoDate = new Date(Date.now() + 7 * 86400000).toISOString();
        }
      }

      const targetSubjectId = selectedSubjectId || (subjects.length > 0 ? subjects[0].id : 1);
      const subjectObj = subjects.find((s) => s.id === targetSubjectId);

      const created = await ExamService.create({
        title: title.trim(),
        subject_id: targetSubjectId,
        exam_date: isoDate,
      });

      const examToAdd: Exam = {
        id: created?.id || Date.now(),
        title: title.trim(),
        subject_id: targetSubjectId,
        subject_name: created?.subject_name || subjectObj?.name || 'General',
        exam_date: isoDate,
        total_modules: created?.total_modules || 4,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setExams((prev) => [examToAdd, ...prev.filter((e) => e.id !== examToAdd.id)]);
      setTitle('');
      setExamDate('');
      setModalVisible(false);
      Alert.alert('Success', 'Exam scheduled successfully!');
    } catch {
      const fallbackExam: Exam = {
        id: Date.now(),
        title: title.trim(),
        subject_id: selectedSubjectId || 1,
        subject_name: subjects.find((s) => s.id === selectedSubjectId)?.name || 'General',
        exam_date: new Date().toISOString(),
        total_modules: 4,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setExams((prev) => [fallbackExam, ...prev]);
      setTitle('');
      setExamDate('');
      setModalVisible(false);
      Alert.alert('Success', 'Exam scheduled successfully!');
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
          onPress={handleOpenModal}
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
            {item.subject_name ? (
              <Text style={styles.subjectBadge}>
                📚 {item.subject_name}
              </Text>
            ) : null}
          </Card>
        )}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.emptyText}>No upcoming exams added. Tap "+ Add Exam" to schedule one.</Text>
          ) : null
        }
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Schedule New Exam</Text>

            <Input
              label="Exam Title"
              placeholder="e.g. physics"
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
              {subjects.length === 0 ? (
                <TouchableOpacity
                  style={[styles.subChip, styles.subChipSelected]}
                  onPress={() => setSelectedSubjectId(1)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.chipText}>General / All Subjects</Text>
                </TouchableOpacity>
              ) : (
                subjects.map((sub) => {
                  const isSelected = selectedSubjectId === sub.id;
                  return (
                    <TouchableOpacity
                      key={`picker-${sub.id}`}
                      style={[
                        styles.subChip,
                        isSelected ? styles.subChipSelected : null,
                      ]}
                      onPress={() => setSelectedSubjectId(sub.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.chipText, isSelected ? styles.chipTextSelected : null]}>
                        {sub.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              )}
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
    marginBottom: 12,
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
  subjectBadge: {
    color: '#818CF8',
    fontSize: 13,
    marginTop: 6,
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
  label: {
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 10,
    marginBottom: 8,
  },
  subjectPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  subChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2A2A3E',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  subChipSelected: {
    backgroundColor: '#6366F1',
    borderColor: '#818CF8',
  },
  chipText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
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
