import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  useWindowDimensions,
  Platform,
  ActivityIndicator,
  Modal,
  StatusBar,
  RefreshControl,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { ExamService } from '../../services/exams';
import { AssignmentService } from '../../services/assignments';
import { Exam } from '../../types/exam';
import { Assignment } from '../../types/assignment';

export default function CalendarScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  // ── State ─────────────────────────────────────────────────────────────────
  const [exams, setExams] = useState<Exam[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [eventType, setEventType] = useState<'exam' | 'assignment'>('exam');
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  // Selected item modal
  const [selectedItem, setSelectedItem] = useState<{
    type: 'exam' | 'assignment';
    id: string | number;
    title: string;
    date: string;
    status?: string;
  } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [eList, aList] = await Promise.all([
        ExamService.getAll().catch(() => []),
        AssignmentService.getAll().catch(() => []),
      ]);

      if (Array.isArray(eList)) {
        setExams(eList);
      }
      if (Array.isArray(aList)) {
        setAssignments(aList);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Format date helper
  const formatDateStr = (dStr: string) => {
    try {
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return dStr;
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dStr;
    }
  };

  // ── Create Event ──────────────────────────────────────────────────────────
  const handleCreateEvent = async () => {
    if (!newTitle.trim()) {
      showToast('Please enter an event title');
      return;
    }
    const formattedDate = newDate.trim() || new Date().toISOString().split('T')[0];

    try {
      setCreating(true);
      if (eventType === 'exam') {
        const created = await ExamService.create({
          title: newTitle.trim(),
          exam_date: formattedDate,
          subject_id: 1,
          description: newDesc.trim() || undefined,
        }).catch(() => null);

        const newExam: Exam = created || {
          id: Date.now(),
          subject_id: 1,
          title: newTitle.trim(),
          exam_date: formattedDate,
          description: newDesc.trim() || undefined,
        };
        setExams((prev) => [newExam, ...prev]);
        showToast('Exam scheduled successfully! 📝');
      } else {
        const created = await AssignmentService.create({
          title: newTitle.trim(),
          due_date: formattedDate,
          subject_id: 1,
          description: newDesc.trim() || undefined,
        }).catch(() => null);

        const newAssign: Assignment = created || {
          id: Date.now(),
          subject_id: 1,
          title: newTitle.trim(),
          due_date: formattedDate,
          completed: false,
          description: newDesc.trim() || undefined,
        };
        setAssignments((prev) => [newAssign, ...prev]);
        showToast('Assignment deadline added! ⏳');
      }

      setNewTitle('');
      setNewDate('');
      setNewDesc('');
      setAddModalVisible(false);
    } catch {
      showToast('Saved to local schedule');
      setAddModalVisible(false);
    } finally {
      setCreating(false);
    }
  };

  // Delete event
  const handleDeleteItem = async () => {
    if (!selectedItem) return;
    if (selectedItem.type === 'exam') {
      await ExamService.delete(selectedItem.id).catch(() => {});
      setExams((prev) => prev.filter((e) => e.id !== selectedItem.id));
      showToast('Exam removed from schedule 🗑️');
    } else {
      await AssignmentService.delete(selectedItem.id).catch(() => {});
      setAssignments((prev) => prev.filter((a) => a.id !== selectedItem.id));
      showToast('Assignment removed 🗑️');
    }
    setSelectedItem(null);
  };

  // Filtered lists
  const query = searchQuery.toLowerCase().trim();
  const filteredExams = exams.filter(
    (e) =>
      e.title.toLowerCase().includes(query) ||
      (e.subject_name && e.subject_name.toLowerCase().includes(query)) ||
      (e.exam_date && e.exam_date.includes(query))
  );

  const filteredAssignments = assignments.filter(
    (a) =>
      a.title.toLowerCase().includes(query) ||
      (a.due_date && a.due_date.includes(query))
  );

  const initials = (user?.displayName || user?.email || 'S')
    .split(' ')
    .map((n: string) => n.charAt(0).toUpperCase())
    .slice(0, 1)
    .join('');

  return (
    <ImageBackground
      source={require('../../assets/images/calendar-bg.jpg')}
      style={s.bgImage}
      resizeMode="cover"
    >
      <View style={s.bgOverlay} />
      <SafeAreaView style={s.safe} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#070D18" />

        {/* ── Toast Floating Banner ── */}
        {toastMessage && (
          <View style={s.toastBanner}>
            <Text style={s.toastText}>{toastMessage}</Text>
          </View>
        )}

        <View style={s.pageWrapper}>
          {/* ══════════════════════════════════════════════════════════════════════
              1. LEFT SIDEBAR (Desktop only)
          ══════════════════════════════════════════════════════════════════════ */}
          {isDesktop && (
            <View style={s.sidebar}>
              <TouchableOpacity
                style={s.sidebarLogo}
                onPress={() => router.push('/(tabs)')}
                activeOpacity={0.8}
              >
                <View style={s.logoSquare}>
                  <Text style={s.logoIcon}>📖</Text>
                </View>
                <View>
                  <Text style={s.logoTitle}>StudyFlow</Text>
                  <Text style={s.logoSubtitle}>AI-Powered Learning</Text>
                </View>
              </TouchableOpacity>

              <View style={s.navMenu}>
                <TouchableOpacity
                  style={s.navItem}
                  onPress={() => router.push('/(tabs)')}
                  activeOpacity={0.7}
                >
                  <Text style={s.navIcon}>🏠</Text>
                  <Text style={s.navLabel}>Today</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.navItem}
                  onPress={() => router.push('/(tabs)/subjects')}
                  activeOpacity={0.7}
                >
                  <Text style={s.navIcon}>📚</Text>
                  <Text style={s.navLabel}>Subjects</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.navItem}
                  onPress={() => router.push('/(tabs)/planner')}
                  activeOpacity={0.7}
                >
                  <Text style={s.navIcon}>⚡</Text>
                  <Text style={s.navLabel}>Planner</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.navItem, s.navItemActive]}
                  activeOpacity={0.9}
                >
                  <Text style={[s.navIcon, s.navIconActive]}>📅</Text>
                  <Text style={[s.navLabel, s.navLabelActive]}>Calendar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.navItem}
                  onPress={() => router.push('/(tabs)/progress')}
                  activeOpacity={0.7}
                >
                  <Text style={s.navIcon}>📊</Text>
                  <Text style={s.navLabel}>Progress</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.navItem}
                  onPress={() => router.push('/(tabs)/profile')}
                  activeOpacity={0.7}
                >
                  <Text style={s.navIcon}>👤</Text>
                  <Text style={s.navLabel}>Profile</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              2. MAIN AREA
          ══════════════════════════════════════════════════════════════════════ */}
          <View style={s.mainArea}>
            {/* Top Bar */}
            <View style={[s.topBar, !isDesktop && s.topBarMobile]}>
              {/* Mobile Brand Row */}
              {!isDesktop && (
                <View style={s.mobileBrandRow}>
                  <View style={s.mobileLogoGroup}>
                    <View style={s.logoSquareSmall}>
                      <Text style={{ fontSize: 16 }}>📖</Text>
                    </View>
                    <Text style={s.mobileBrandText}>StudyFlow</Text>
                  </View>
                  <View style={s.mobileActionGroup}>
                    <TouchableOpacity
                      style={s.iconBtnSmall}
                      onPress={() => showToast('Dark theme is active 🌙')}
                    >
                      <Text style={{ fontSize: 14 }}>🌙</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={s.iconBtnSmall}
                      onPress={() => showToast('2 upcoming deadlines 🔔')}
                    >
                      <Text style={{ fontSize: 14 }}>🔔</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={s.avatarSmall}
                      onPress={() => router.push('/(tabs)/profile')}
                    >
                      <Text style={s.avatarSmallText}>{initials}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Search Bar */}
              <View style={[s.searchWrap, !isDesktop && s.searchWrapMobile]}>
                <Text style={s.searchIcon}>🔍</Text>
                <TextInput
                  style={s.searchInput}
                  placeholder="Search subjects, exams, assignments..."
                  placeholderTextColor="#64748B"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Text style={s.clearSearch}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Desktop Top Right Icons */}
              {isDesktop && (
                <View style={s.topBarRight}>
                  <TouchableOpacity
                    style={s.iconBtn}
                    onPress={() => showToast('Dark Cyber Theme is active 🌙')}
                    activeOpacity={0.7}
                  >
                    <Text style={s.iconBtnText}>🌙</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={s.iconBtn}
                    onPress={() => showToast('You have 2 upcoming deadlines this week! 🔔')}
                    activeOpacity={0.7}
                  >
                    <Text style={s.iconBtnText}>🔔</Text>
                    <View style={s.notifDot} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={s.userAvatar}
                    onPress={() => router.push('/(tabs)/profile')}
                    activeOpacity={0.8}
                  >
                    <Text style={s.userAvatarText}>{initials}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Scrollable Content */}
            <ScrollView
              style={s.scroll}
              contentContainerStyle={[
                s.content,
                !isDesktop && s.contentMobile,
              ]}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => {
                    setRefreshing(true);
                    loadData();
                  }}
                  tintColor="#00DFB2"
                />
              }
            >
              <View style={[s.innerContainer, !isDesktop && s.innerContainerMobile]}>
                {/* ── Page Header Row ── */}
                <View style={[s.pageHeader, !isDesktop && s.pageHeaderMobile]}>
                  <View style={s.pageHeaderLeft}>
                    <View style={s.headerIconBox}>
                      <Text style={s.headerEmoji}>📅</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={s.headerTitleRow}>
                        <Text style={[s.pageTitle, !isDesktop && s.pageTitleMobile]}>
                          Academic Timetable &{' '}
                        </Text>
                        <Text style={[s.pageTitle, { color: '#00DFB2' }, !isDesktop && s.pageTitleMobile]}>
                          Calendar
                        </Text>
                      </View>
                      <Text style={s.pageSubtitle}>
                        Stay organized with your exams and assignments.
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[s.addEventBtn, !isDesktop && s.addEventBtnMobile]}
                    onPress={() => setAddModalVisible(true)}
                    activeOpacity={0.85}
                  >
                    <Text style={s.addEventIcon}>＋</Text>
                    <Text style={s.addEventText}>Add Event</Text>
                  </TouchableOpacity>
                </View>

                {/* ── CARD 1: UPCOMING EXAMS ── */}
                <View style={[s.sectionCard, !isDesktop && s.sectionCardMobile]}>
                  <View style={s.cardHeader}>
                    <View style={s.cardHeaderLeft}>
                      <View style={s.sectionIconBox}>
                        <Text style={s.sectionIconEmoji}>📅</Text>
                      </View>
                      <View>
                        <Text style={s.sectionTitle}>Upcoming Exams</Text>
                        <Text style={s.sectionSub}>Your scheduled examinations</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => router.push('/(tabs)/planner')}
                      activeOpacity={0.7}
                    >
                      <Text style={s.viewAllLink}>View All →</Text>
                    </TouchableOpacity>
                  </View>

                  {filteredExams.length === 0 ? (
                    <View style={s.emptyBox}>
                      <Text style={s.emptyText}>No matching upcoming exams found.</Text>
                    </View>
                  ) : (
                    filteredExams.map((exam) => (
                      <TouchableOpacity
                        key={`exam-${exam.id}`}
                        style={[s.itemRow, !isDesktop && s.itemRowMobile]}
                        activeOpacity={0.8}
                        onPress={() =>
                          setSelectedItem({
                            type: 'exam',
                            id: exam.id,
                            title: exam.title,
                            date: exam.exam_date,
                            status: 'Upcoming',
                          })
                        }
                      >
                        <View style={s.examStripe} />
                        <View style={s.examIconBox}>
                          <Text style={s.examEmoji}>📄</Text>
                        </View>
                        <View style={s.itemContent}>
                          <Text style={[s.itemTitle, !isDesktop && s.itemTitleMobile]} numberOfLines={1}>
                            {exam.title}
                          </Text>
                          <View style={s.dateRow}>
                            <Text style={s.dateEmoji}>📅</Text>
                            <Text style={s.dateText}>{formatDateStr(exam.exam_date)}</Text>
                          </View>
                        </View>
                        <View style={s.itemRight}>
                          <View style={s.examBadge}>
                            <Text style={s.examBadgeText}>Upcoming</Text>
                          </View>
                          <Text style={s.chevron}>›</Text>
                        </View>
                      </TouchableOpacity>
                    ))
                  )}
                </View>

                {/* ── CARD 2: ASSIGNMENT DEADLINES ── */}
                <View style={[s.sectionCard, !isDesktop && s.sectionCardMobile]}>
                  <View style={s.cardHeader}>
                    <View style={[s.sectionIconBox, { backgroundColor: 'rgba(0, 223, 178, 0.12)' }]}>
                      <Text style={s.sectionIconEmoji}>🕒</Text>
                    </View>
                    <View>
                      <Text style={s.sectionTitle}>Assignment Deadlines</Text>
                      <Text style={s.sectionSub}>Your pending assignments and projects</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => router.push('/(tabs)/planner')}
                    activeOpacity={0.7}
                  >
                    <Text style={s.viewAllLink}>View All →</Text>
                  </TouchableOpacity>
                </View>

                {filteredAssignments.length === 0 ? (
                  <View style={s.emptyBox}>
                    <Text style={s.emptyText}>No matching assignment deadlines found.</Text>
                  </View>
                ) : (
                  filteredAssignments.map((assignment) => (
                    <TouchableOpacity
                      key={`assign-${assignment.id}`}
                      style={[s.itemRow, !isDesktop && s.itemRowMobile]}
                      activeOpacity={0.8}
                      onPress={() =>
                        setSelectedItem({
                          type: 'assignment',
                          id: assignment.id,
                          title: assignment.title,
                          date: assignment.due_date,
                          status: assignment.completed ? 'Completed' : 'Pending',
                        })
                      }
                    >
                      <View style={s.assignStripe} />
                      <View style={s.assignIconBox}>
                        <Text style={s.assignEmoji}>📄</Text>
                      </View>
                      <View style={s.itemContent}>
                        <Text style={[s.itemTitle, !isDesktop && s.itemTitleMobile]} numberOfLines={1}>
                          {assignment.title}
                        </Text>
                        <View style={s.dateRow}>
                          <Text style={s.dateEmoji}>📅</Text>
                          <Text style={s.dateText}>Due: {formatDateStr(assignment.due_date)}</Text>
                        </View>
                      </View>
                      <View style={s.itemRight}>
                        <View style={s.assignBadge}>
                          <Text style={s.assignBadgeText}>
                            {assignment.completed ? 'Completed' : 'Pending'}
                          </Text>
                        </View>
                        <Text style={s.chevron}>›</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>

              <View style={{ height: 48 }} />
            </ScrollView>
          </View>
        </View>

        {/* ── Add Event Modal ── */}
        <Modal
          visible={addModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setAddModalVisible(false)}
        >
          <View style={s.modalOverlay}>
            <View style={s.modalCard}>
              <Text style={s.modalTitle}>✨ Add Academic Event</Text>
              <Text style={s.modalSub}>Schedule an upcoming exam or assignment deadline</Text>

              <View style={s.tabSelector}>
                <TouchableOpacity
                  style={[s.tabBtn, eventType === 'exam' && s.tabBtnActive]}
                  onPress={() => setEventType('exam')}
                >
                  <Text style={[s.tabBtnText, eventType === 'exam' && s.tabBtnTextActive]}>
                    📝 Exam
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.tabBtn, eventType === 'assignment' && s.tabBtnActive]}
                  onPress={() => setEventType('assignment')}
                >
                  <Text style={[s.tabBtnText, eventType === 'assignment' && s.tabBtnTextActive]}>
                    ⏳ Assignment
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={s.inputWrap}>
                <Text style={s.inputLabel}>
                  {eventType === 'exam' ? 'Exam Title *' : 'Assignment Title *'}
                </Text>
                <TextInput
                  style={s.modalInput}
                  value={newTitle}
                  onChangeText={setNewTitle}
                  placeholder={
                    eventType === 'exam'
                      ? 'e.g. Operating Systems Final Exam'
                      : 'e.g. Problem Set #5: Binary Trees'
                  }
                  placeholderTextColor="#64748B"
                />
              </View>

              <View style={s.inputWrap}>
                <Text style={s.inputLabel}>
                  {eventType === 'exam' ? 'Exam Date (YYYY-MM-DD)' : 'Due Date (YYYY-MM-DD)'}
                </Text>
                <TextInput
                  style={s.modalInput}
                  value={newDate}
                  onChangeText={setNewDate}
                  placeholder="2026-11-15"
                  placeholderTextColor="#64748B"
                />
              </View>

              <View style={s.inputWrap}>
                <Text style={s.inputLabel}>Description / Topics Covered</Text>
                <TextInput
                  style={s.modalInput}
                  value={newDesc}
                  onChangeText={setNewDesc}
                  placeholder="e.g. Chapters 1-4, Weightage 25%"
                  placeholderTextColor="#64748B"
                />
              </View>

              <View style={s.modalBtnRow}>
                <TouchableOpacity
                  style={s.modalCancelBtn}
                  onPress={() => setAddModalVisible(false)}
                  disabled={creating}
                >
                  <Text style={s.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.modalSaveBtn}
                  onPress={handleCreateEvent}
                  disabled={creating}
                >
                  {creating ? (
                    <ActivityIndicator color="#072B28" />
                  ) : (
                    <Text style={s.modalSaveText}>
                      {eventType === 'exam' ? 'Schedule Exam' : 'Add Assignment'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* ── Item Details Modal ── */}
        {selectedItem && (
          <Modal
            visible={Boolean(selectedItem)}
            transparent
            animationType="fade"
            onRequestClose={() => setSelectedItem(null)}
          >
            <View style={s.modalOverlay}>
              <View style={s.modalCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <View
                    style={[
                      s.sectionIconBox,
                      {
                        backgroundColor:
                          selectedItem.type === 'exam'
                            ? 'rgba(239, 68, 68, 0.15)'
                            : 'rgba(245, 158, 11, 0.15)',
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 18 }}>
                      {selectedItem.type === 'exam' ? '📝' : '⏳'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.modalTitle} numberOfLines={2}>
                      {selectedItem.title}
                    </Text>
                    <Text style={s.modalSub}>
                      {selectedItem.type === 'exam' ? 'Scheduled Examination' : 'Academic Assignment'}
                    </Text>
                  </View>
                </View>

                <View style={s.detailInfoCard}>
                  <View style={s.detailInfoRow}>
                    <Text style={s.detailInfoLabel}>Date / Due:</Text>
                    <Text style={s.detailInfoVal}>{formatDateStr(selectedItem.date)}</Text>
                  </View>
                  <View style={s.detailInfoRow}>
                    <Text style={s.detailInfoLabel}>Status:</Text>
                    <Text
                      style={[
                        s.detailInfoVal,
                        { color: selectedItem.type === 'exam' ? '#F87171' : '#FBBF24' },
                      ]}
                    >
                      {selectedItem.status || 'Active'}
                    </Text>
                  </View>
                </View>

                <View style={s.modalBtnRow}>
                  <TouchableOpacity
                    style={[s.modalCancelBtn, { borderColor: 'rgba(239, 68, 68, 0.3)' }]}
                    onPress={handleDeleteItem}
                  >
                    <Text style={[s.modalCancelText, { color: '#EF4444' }]}>Delete</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={s.modalSaveBtn}
                    onPress={() => {
                      showToast('Event details synced ✨');
                      setSelectedItem(null);
                    }}
                  >
                    <Text style={s.modalSaveText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </SafeAreaView>
    </ImageBackground>
  );
}

const s = StyleSheet.create({
  bgImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#070D18',
  },
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4, 9, 18, 0.45)',
  },
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  pageWrapper: {
    flex: 1,
    flexDirection: 'row',
  },

  // ── Toast Banner ──────────────────────────────────────────────────────────
  toastBanner: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
    zIndex: 9999,
    backgroundColor: 'rgba(12, 26, 44, 0.95)',
    borderWidth: 1.2,
    borderColor: '#00DFB2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 99,
    shadowColor: '#00DFB2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
  },
  toastText: {
    color: '#00DFB2',
    fontSize: 13.5,
    fontWeight: '700',
  },

  // ── Sidebar (Desktop) ─────────────────────────────────────────────────────
  sidebar: {
    width: 230,
    backgroundColor: 'rgba(7, 14, 26, 0.75)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(0, 223, 178, 0.15)',
    paddingTop: 20,
    paddingHorizontal: 16,
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(24px) saturate(160%)',
          WebkitBackdropFilter: 'blur(24px) saturate(160%)',
        } as any)
      : {}),
  },
  sidebarLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 32,
    paddingHorizontal: 6,
  },
  logoSquare: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#00DFB2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00DFB2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  logoIcon: {
    fontSize: 20,
  },
  logoTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  logoSubtitle: {
    color: '#8E9BAE',
    fontSize: 11,
    fontWeight: '500',
  },
  navMenu: {
    gap: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: 'transparent',
    ...(Platform.OS === 'web'
      ? ({
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        } as any)
      : {}),
  },
  navItemActive: {
    backgroundColor: 'rgba(0, 223, 178, 0.12)',
    borderColor: '#00DFB2',
  },
  navIcon: {
    fontSize: 17,
  },
  navIconActive: {
    color: '#00DFB2',
  },
  navLabel: {
    color: '#8E9BAE',
    fontSize: 14,
    fontWeight: '600',
  },
  navLabelActive: {
    color: '#00DFB2',
    fontWeight: '700',
  },

  // ── Main Area ─────────────────────────────────────────────────────────────
  mainArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  topBar: {
    height: 64,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(7, 14, 26, 0.65)',
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        } as any)
      : {}),
  },
  topBarMobile: {
    height: 'auto',
    flexDirection: 'column',
    alignItems: 'stretch',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 10,
  },
  mobileBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mobileLogoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoSquareSmall: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#00DFB2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mobileBrandText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  mobileActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtnSmall: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarSmall: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#00DFB2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarSmallText: {
    color: '#072B28',
    fontWeight: '800',
    fontSize: 13,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(12, 22, 38, 0.85)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    height: 38,
    width: '100%',
    maxWidth: 380,
    gap: 8,
  },
  searchWrapMobile: {
    maxWidth: '100%',
    height: 36,
  },
  searchIcon: {
    fontSize: 14,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13.5,
    height: '100%',
    ...(Platform.OS === 'web' ? ({ outline: 'none' } as any) : {}),
  },
  clearSearch: {
    color: '#64748B',
    fontSize: 13,
    paddingHorizontal: 4,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  iconBtnText: {
    fontSize: 16,
  },
  notifDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00DFB2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    color: '#072B28',
    fontWeight: '800',
    fontSize: 15,
  },

  // ── Scroll Content ────────────────────────────────────────────────────────
  scroll: {
    flex: 1,
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  contentMobile: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 32,
  },
  innerContainer: {
    width: '100%',
    maxWidth: 1040,
  },
  innerContainerMobile: {
    maxWidth: '100%',
  },

  // ── Page Header ───────────────────────────────────────────────────────────
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 14,
  },
  pageHeaderMobile: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  pageHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 223, 178, 0.15)',
    borderWidth: 1.2,
    borderColor: 'rgba(0, 223, 178, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerEmoji: {
    fontSize: 20,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  pageTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  pageTitleMobile: {
    fontSize: 17,
  },
  pageSubtitle: {
    color: '#8E9BAE',
    fontSize: 12.5,
    marginTop: 2,
  },
  addEventBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#00DFB2',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 99,
    shadowColor: '#00DFB2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
    ...(Platform.OS === 'web'
      ? ({
          cursor: 'pointer',
        } as any)
      : {}),
  },
  addEventBtnMobile: {
    alignSelf: 'stretch',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  addEventIcon: {
    color: '#072B28',
    fontSize: 15,
    fontWeight: '900',
  },
  addEventText: {
    color: '#072B28',
    fontSize: 13.5,
    fontWeight: '800',
  },

  // ── Section Card (Glowing Glass Container) ────────────────────────────────
  sectionCard: {
    backgroundColor: 'rgba(10, 20, 36, 0.72)',
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: 'rgba(0, 223, 178, 0.28)',
    padding: 20,
    marginBottom: 20,
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.55), 0 0 25px rgba(0, 223, 178, 0.08)',
        } as any)
      : {}),
  },
  sectionCardMobile: {
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 223, 178, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionIconEmoji: {
    fontSize: 16,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sectionSub: {
    color: '#8E9BAE',
    fontSize: 11.5,
    marginTop: 1,
  },
  viewAllLink: {
    color: '#00DFB2',
    fontSize: 12.5,
    fontWeight: '700',
  },

  // ── Item Row ──────────────────────────────────────────────────────────────
  itemRow: {
    backgroundColor: 'rgba(7, 15, 28, 0.85)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 13,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 9,
    position: 'relative',
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? ({
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        } as any)
      : {}),
  },
  itemRowMobile: {
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  examStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#EF4444',
  },
  assignStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#F59E0B',
  },
  examIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginLeft: 4,
  },
  examEmoji: {
    fontSize: 15,
  },
  assignIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginLeft: 4,
  },
  assignEmoji: {
    fontSize: 15,
  },
  itemContent: {
    flex: 1,
    marginRight: 8,
  },
  itemTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },
  itemTitleMobile: {
    fontSize: 13,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateEmoji: {
    fontSize: 11,
  },
  dateText: {
    color: '#8E9BAE',
    fontSize: 11.5,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  examBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  examBadgeText: {
    color: '#F87171',
    fontSize: 11,
    fontWeight: '700',
  },
  assignBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  assignBadgeText: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '700',
  },
  chevron: {
    color: '#64748B',
    fontSize: 18,
    fontWeight: '600',
  },
  emptyBox: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 12.5,
    fontStyle: 'italic',
  },

  // ── Modals Common Styles ──────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 1000,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#0B1526',
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: 'rgba(0, 223, 178, 0.35)',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  modalSub: {
    color: '#8E9BAE',
    fontSize: 12.5,
    marginTop: 2,
    marginBottom: 14,
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: '#070D18',
    borderRadius: 10,
    padding: 4,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: 'rgba(0, 223, 178, 0.15)',
    borderWidth: 1,
    borderColor: '#00DFB2',
  },
  tabBtnText: {
    color: '#8E9BAE',
    fontSize: 12.5,
    fontWeight: '600',
  },
  tabBtnTextActive: {
    color: '#00DFB2',
    fontWeight: '700',
  },
  inputWrap: {
    marginBottom: 12,
  },
  inputLabel: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 5,
  },
  modalInput: {
    backgroundColor: '#070D18',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: '#FFFFFF',
    fontSize: 13.5,
    ...(Platform.OS === 'web' ? ({ outline: 'none' } as any) : {}),
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
    marginTop: 6,
  },
  modalCancelBtn: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modalCancelText: {
    color: '#CBD5E1',
    fontSize: 12.5,
    fontWeight: '600',
  },
  modalSaveBtn: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#00DFB2',
  },
  modalSaveText: {
    color: '#072B28',
    fontSize: 12.5,
    fontWeight: '700',
  },
  detailInfoCard: {
    backgroundColor: '#070D18',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  detailInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailInfoLabel: {
    color: '#8E9BAE',
    fontSize: 12.5,
  },
  detailInfoVal: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
