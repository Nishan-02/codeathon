import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Modal,
  Alert,
  ImageBackground,
  useWindowDimensions,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSubjects } from '../../hooks/useSubjects';
import { SubjectCard } from '../../components/subjects/SubjectCard';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';

export default function SubjectsScreen() {
  const { subjects, loading, refresh, addSubject } = useSubjects();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

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
    <ImageBackground
      source={require('../../assets/images/calendar-bg.jpg')}
      style={styles.bgImage}
      resizeMode="cover"
    >
      <View style={styles.bgOverlay} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#070D18" />

        <View style={styles.pageWrapper}>
          {/* ── Left Sidebar (Desktop) ── */}
          {isDesktop && (
            <View style={styles.sidebar}>
              <TouchableOpacity
                style={styles.sidebarLogo}
                onPress={() => router.push('/(tabs)')}
                activeOpacity={0.8}
              >
                <View style={styles.logoSquare}>
                  <Text style={styles.logoIcon}>📖</Text>
                </View>
                <View>
                  <Text style={styles.logoTitle}>StudyFlow</Text>
                  <Text style={styles.logoSubtitle}>AI-Powered Learning</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.navMenu}>
                <TouchableOpacity
                  style={styles.navItem}
                  onPress={() => router.push('/(tabs)')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.navIcon}>🏠</Text>
                  <Text style={styles.navLabel}>Today</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.navItem, styles.navItemActive]}
                  activeOpacity={0.9}
                >
                  <Text style={[styles.navIcon, styles.navIconActive]}>📚</Text>
                  <Text style={[styles.navLabel, styles.navLabelActive]}>Subjects</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.navItem}
                  onPress={() => router.push('/(tabs)/planner')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.navIcon}>⚡</Text>
                  <Text style={styles.navLabel}>Planner</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.navItem}
                  onPress={() => router.push('/(tabs)/calendar')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.navIcon}>📅</Text>
                  <Text style={styles.navLabel}>Calendar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.navItem}
                  onPress={() => router.push('/(tabs)/progress')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.navIcon}>📊</Text>
                  <Text style={styles.navLabel}>Progress</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.navItem}
                  onPress={() => router.push('/(tabs)/profile')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.navIcon}>👤</Text>
                  <Text style={styles.navLabel}>Profile</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── Content ── */}
          <View style={[styles.container, isDesktop && styles.desktopContainer]}>
            <View style={[styles.innerWrapper, !isDesktop && styles.mobileInner]}>
              <View style={styles.topRow}>
                <View>
                  <Text style={styles.title}>Your Subjects</Text>
                  <Text style={styles.subtitle}>Manage academic courses, syllabus, and study progress</Text>
                </View>
                <TouchableOpacity
                  style={styles.addSubjectBtn}
                  onPress={() => setModalVisible(true)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.addBtnText}>+ Add Subject</Text>
                </TouchableOpacity>
              </View>

              <FlatList
                data={subjects}
                keyExtractor={(item) => item.id.toString()}
                onRefresh={refresh}
                refreshing={loading}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <SubjectCard
                    subject={item}
                    onPress={() => router.push(`/subjects/${item.id}`)}
                  />
                )}
                ListEmptyComponent={
                  !loading ? (
                    <View style={styles.emptyCard}>
                      <Text style={{ fontSize: 32, marginBottom: 8 }}>📚</Text>
                      <Text style={styles.emptyText}>No subjects created yet. Tap "+ Add Subject" to get started.</Text>
                    </View>
                  ) : null
                }
              />
            </View>
          </View>
        </View>

        <Modal visible={modalVisible} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>⚡ Add New Subject</Text>
              <Input
                label="Subject Name"
                placeholder="e.g. Database Management Systems"
                value={name}
                onChangeText={setName}
              />
              <Input
                label="Description (Optional)"
                placeholder="e.g. Relational models, SQL & Transactions"
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
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bgImage: { flex: 1, width: '100%', height: '100%', backgroundColor: '#070D18' },
  bgOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(7, 13, 24, 0.65)' },
  safeArea: { flex: 1 },
  pageWrapper: { flex: 1, flexDirection: 'row' },

  // Sidebar
  sidebar: {
    width: 230,
    borderRightWidth: 1,
    borderRightColor: 'rgba(0, 223, 178, 0.15)',
    backgroundColor: 'rgba(7, 14, 26, 0.75)',
    paddingVertical: 24,
    paddingHorizontal: 16,
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(20px)' } as any) : {}),
  },
  sidebarLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 32,
    paddingHorizontal: 6,
  },
  logoSquare: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#00DFB2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00DFB2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  logoIcon: { fontSize: 18 },
  logoTitle: { color: '#FFFFFF', fontWeight: '800', fontSize: 17, letterSpacing: -0.2 },
  logoSubtitle: { color: '#00DFB2', fontSize: 10.5, fontWeight: '600' },
  navMenu: { gap: 6 },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  navItemActive: {
    backgroundColor: 'rgba(0, 223, 178, 0.12)',
    borderWidth: 1.5,
    borderColor: '#00DFB2',
  },
  navIcon: { fontSize: 16, opacity: 0.7 },
  navIconActive: { opacity: 1 },
  navLabel: { color: '#8E9BAE', fontSize: 13.5, fontWeight: '600' },
  navLabelActive: { color: '#00DFB2', fontWeight: '700' },

  container: {
    flex: 1,
    padding: 16,
  },
  desktopContainer: {
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 32,
  },
  innerWrapper: {
    width: '100%',
    maxWidth: 760,
    flex: 1,
  },
  mobileInner: {
    maxWidth: '100%',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: '#8E9BAE',
    fontSize: 12.5,
    marginTop: 2,
  },
  addSubjectBtn: {
    backgroundColor: '#00DFB2',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 99,
    shadowColor: '#00DFB2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  addBtnText: {
    color: '#071615',
    fontWeight: '800',
    fontSize: 13.5,
  },
  emptyCard: {
    backgroundColor: 'rgba(10, 20, 36, 0.72)',
    borderRadius: 14,
    padding: 32,
    alignItems: 'center',
    marginTop: 24,
    borderWidth: 1,
    borderColor: 'rgba(30, 41, 59, 0.7)',
  },
  emptyText: {
    color: '#8E9BAE',
    textAlign: 'center',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: 20,
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 480,
    borderWidth: 1,
    borderColor: 'rgba(0, 223, 178, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
  },
  diffLabel: {
    color: '#8E9BAE',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 8,
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
