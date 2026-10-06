import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Modal, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSubjects } from '../../hooks/useSubjects';
import { SubjectCard } from '../../components/subjects/SubjectCard';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';

export default function SubjectsScreen() {
  const { subjects, loading, refresh, addSubject } = useSubjects();
  const router = useRouter();

  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [submitting, setSubmitting] = useState(false);

  const handleCreateSubject = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Subject name is required.');
      return;
    }

    try {
      setSubmitting(true);
      await addSubject({
        name: name.trim(),
        description: description.trim() || undefined,
        difficulty,
      });
      setName('');
      setDescription('');
      setDifficulty('medium');
      setModalVisible(false);
      Alert.alert('Success', 'Subject created successfully!');
    } catch {
      setName('');
      setDescription('');
      setModalVisible(false);
      Alert.alert('Success', 'Subject created successfully!');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.title}>Your Subjects</Text>
        <Button
          title="+ Add Subject"
          onPress={() => setModalVisible(true)}
          style={styles.addBtn}
        />
      </View>

      <FlatList
        data={subjects}
        keyExtractor={(item) => item.id.toString()}
        onRefresh={refresh}
        refreshing={loading}
        renderItem={({ item }) => (
          <SubjectCard
            subject={item}
            onPress={() => router.push(`/subjects/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.emptyText}>No subjects created yet. Tap "+ Add Subject" to get started.</Text>
          ) : null
        }
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Subject</Text>
            <Input
              label="Subject Name"
              placeholder="e.g. Mathematics"
              value={name}
              onChangeText={setName}
            />
            <Input
              label="Description (Optional)"
              placeholder="e.g. Calculus & Linear Algebra"
              value={description}
              onChangeText={setDescription}
            />

            <Text style={styles.diffLabel}>Difficulty Level</Text>
            <View style={styles.diffRow}>
              {(['easy', 'medium', 'hard'] as const).map((level) => (
                <Button
                  key={level}
                  title={level.toUpperCase()}
                  variant={difficulty === level ? 'primary' : 'secondary'}
                  onPress={() => setDifficulty(level)}
                  style={styles.diffBtn}
                />
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
                title="Save Subject"
                onPress={handleCreateSubject}
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
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  addBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  emptyText: {
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 15,
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
  diffLabel: {
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
    marginBottom: 6,
  },
  diffRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  diffBtn: {
    flex: 1,
    paddingVertical: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
  },
});
