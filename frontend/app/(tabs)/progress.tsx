import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Text,
  ImageBackground,
  useWindowDimensions,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ProgressChart } from '../../components/progress/ProgressChart';
import { ProgressService } from '../../services/progress';
import { OverallProgress } from '../../types/progress';

export default function ProgressScreen() {
  const [progressData, setProgressData] = useState<OverallProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  const loadProgress = async () => {
    try {
      setLoading(true);
      const data = await ProgressService.getOverallProgress();
      setProgressData(data);
    } catch (err) {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProgress();
  }, []);

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
                  style={styles.navItem}
                  onPress={() => router.push('/(tabs)/subjects')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.navIcon}>📚</Text>
                  <Text style={styles.navLabel}>Subjects</Text>
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
                  style={[styles.navItem, styles.navItemActive]}
                  activeOpacity={0.9}
                >
                  <Text style={[styles.navIcon, styles.navIconActive]}>📊</Text>
                  <Text style={[styles.navLabel, styles.navLabelActive]}>Progress</Text>
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
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.container, isDesktop && styles.desktopContainer]}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={loadProgress} tintColor="#00DFB2" />}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.innerWrapper, !isDesktop && styles.mobileInner]}>
              <View style={styles.header}>
                <Text style={styles.title}>Study Progress Analytics</Text>
                <Text style={styles.subtitle}>Comprehensive performance insights & syllabus mastery</Text>
              </View>

              <View style={styles.chartWrapper}>
                <ProgressChart
                  overallPercentage={progressData?.overall_percentage || 0}
                  subjectProgressList={progressData?.subject_progress || []}
                />
              </View>
            </View>
          </ScrollView>
        </View>
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

  scroll: { flex: 1 },
  container: {
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
  },
  mobileInner: {
    maxWidth: '100%',
  },
  header: {
    marginBottom: 20,
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
  chartWrapper: {
    backgroundColor: 'rgba(10, 20, 36, 0.72)',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(30, 41, 59, 0.7)',
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(16px)' } as any) : {}),
  },
});
