import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Modal, Alert, TouchableOpacity } from 'react-native';
import { AssignmentService } from '../services/assignments';
import { SubjectService } from '../services/subjects';
import { Assignment } from '../types/assignment';
import { Subject } from '../types/subject';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { formatDate } from '../utils/helpers';
import { useAuth } from '../hooks/useAuth';

export default function AssignmentsScreen() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [a, s] = await Promise.all([
        AssignmentService.getAll().catch(() => []),
        SubjectService.getAll().catch(() => []),
      ]);
      if (Array.isArray(a)) setAssignments(a);
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
  }, [user]);

  const handleOpenModal = () => {
    if (subjects.length > 0) {
      setSelectedSubjectId(subjects[0].id);
    } else {
      setSelectedSubjectId('general');
    }
    setModalVisible(true);
  };

  const handleCreateAssignment = async () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter an assignment title.');
      return;
    }

    try {
      setSubmitting(true);
      let rawDate = dueDate.trim();
      let isoDate: string;

      if (!rawDate) {
        isoDate = new Date(Date.now() + 5 * 86400000).toISOString();
      } else {
        const normalized = rawDate.replace(/[\s/.]+/g, '-');
        const parsed = new Date(normalized);
        if (!isNaN(parsed.getTime())) {
          isoDate = parsed.toISOString();
        } else {
          isoDate = new Date(Date.now() + 5 * 86400000).toISOString();
        }
      }

      const targetSubjectId = selectedSubjectId || (subjects.length > 0 ? subjects[0].id : 'general');

      await AssignmentService.create({
        title: title.trim(),
        subject_id: targetSubjectId,
        due_date: isoDate,
      });

      setTitle('');
      setDueDate('');
      setModalVisible(false);
      await loadData();
      Alert.alert('Success', 'Assignment added successfully!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create assignment in Firestore.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleComplete = async (assignment: Assignment) => {
    try {
      setAssignments((prev) =>
        prev.map((a) => (a.id === assignment.id ? { ...a, completed: !a.completed } : a))
      );
      await AssignmentService.update(assignment.id, { completed: !assignment.completed });
      await loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update assignment in Firestore.');
      await loadData();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.headerTitle}>Assignments</Text>
        <Button
          title="+ Add Assignment"
          onPress={handleOpenModal}
          style={styles.addBtn}
        />
      </View>

      <FlatList
        data={assignments}
        keyExtractor={(item) => String(item.id)}
        onRefresh={loadData}
        refreshing={loading}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <TouchableOpacity style={styles.row} onPress={() => handleToggleComplete(item)} activeOpacity={0.8}>
              <View style={[styles.checkbox, item.completed ? styles.checkboxChecked : null]}>
                {item.completed && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.info}>
                <Text style={[styles.title, item.completed ? styles.completedText : null]}>
                  {item.title}
                </Text>
                <Text style={styles.date}>Due: {formatDate(item.due_date)}</Text>
              </View>
            </TouchableOpacity>
          </Card>
        )}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.emptyText}>No assignments created yet. Tap "+ Add Assignment" to create one.</Text>
          ) : null
        }
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Assignment</Text>

            <Input
              label="Assignment Title"
              placeholder="e.g. Problem Set #3"
              value={title}
              onChangeText={setTitle}
            />

            <Input
              label="Due Date (YYYY-MM-DD)"
              placeholder="2026-10-25"
              value={dueDate}
              onChangeText={setDueDate}
            />

            <Text style={styles.label}>Select Subject</Text>
            <View style={styles.subjectPicker}>
              {subjects.length === 0 ? (
                <TouchableOpacity
                  style={[styles.subChip, styles.subChipSelected]}
                  onPress={() => setSelectedSubjectId('general')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.chipText}>General / All Subjects</Text>
                </TouchableOpacity>
              ) : (
                subjects.map((sub) => {
                  const isSelected = String(selectedSubjectId) === String(sub.id);
                  return (
                    <TouchableOpacity
                      key={`picker-ass-${sub.id}`}
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
                title="Save Assignment"
                onPress={handleCreateAssignment}
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
    borderLeftColor: '#F59E0B',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#F59E0B',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  info: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
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
    backgroundColor: '#F59E0B',
    borderColor: '#FBBF24',
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
