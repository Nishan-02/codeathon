import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/theme';
import { BottomTabHeaderProps } from '@react-navigation/bottom-tabs';

// ── Mobile Top Navigation Bar ────────────────────────────────────────────────
function MobileTopNavBar(props: BottomTabHeaderProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  if (isDesktop) return null;

  const currentRouteName = props.route.name;

  const TAB_ITEMS = [
    { name: 'index', label: 'Today', icon: '🏠', path: '/(tabs)' },
    { name: 'subjects', label: 'Subjects', icon: '📚', path: '/(tabs)/subjects' },
    { name: 'planner', label: 'Planner', icon: '⚡', path: '/(tabs)/planner' },
    { name: 'docuquery', label: 'DocuQuery AI', icon: '📑', path: '/(tabs)/docuquery' },
    { name: 'calendar', label: 'Calendar', icon: '📅', path: '/(tabs)/calendar' },
    { name: 'progress', label: 'Progress', icon: '📊', path: '/(tabs)/progress' },
    { name: 'profile', label: 'Profile', icon: '👤', path: '/(tabs)/profile' },
  ];

  return (
    <SafeAreaView edges={['top']} style={topS.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#070D18" />
      <View style={topS.headerContainer}>
        {/* Brand & Profile Row */}
        <View style={topS.brandRow}>
          <TouchableOpacity
            style={topS.brandLeft}
            onPress={() => router.push('/(tabs)')}
            activeOpacity={0.8}
          >
            <View style={topS.logoBox}>
              <Text style={topS.logoEmoji}>📖</Text>
            </View>
            <View>
              <Text style={topS.brandTitle}>StudyFlow</Text>
              <Text style={topS.brandSub}>AI-Powered Learning</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={topS.avatarCircle}
            onPress={() => router.push('/(tabs)/profile')}
            activeOpacity={0.8}
          >
            <Text style={topS.avatarText}>H</Text>
          </TouchableOpacity>
        </View>

        {/* Horizontal Navigation Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={topS.tabsScroll}
        >
          {TAB_ITEMS.map((tab) => {
            const isFocused = currentRouteName === tab.name;

            return (
              <TouchableOpacity
                key={tab.name}
                style={[topS.tabChip, isFocused && topS.tabChipActive]}
                onPress={() => {
                  if (!isFocused) {
                    props.navigation.navigate(tab.name);
                  }
                }}
                activeOpacity={0.75}
              >
                <Text style={topS.tabIcon}>{tab.icon}</Text>
                <Text style={[topS.tabLabel, isFocused && topS.tabLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const topS = StyleSheet.create({
  safe: {
    backgroundColor: '#070D18',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 223, 178, 0.15)',
  },
  headerContainer: {
    backgroundColor: 'rgba(7, 14, 26, 0.95)',
    paddingTop: 8,
    paddingBottom: 10,
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(16px)' } as any) : {}),
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#00DFB2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00DFB2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
  },
  logoEmoji: {
    fontSize: 16,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  brandSub: {
    color: '#00DFB2',
    fontSize: 10,
    fontWeight: '600',
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  tabsScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 2,
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 99,
    backgroundColor: 'rgba(10, 20, 36, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(30, 41, 59, 0.7)',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  tabChipActive: {
    backgroundColor: 'rgba(0, 223, 178, 0.15)',
    borderColor: '#00DFB2',
  },
  tabIcon: {
    fontSize: 13,
  },
  tabLabel: {
    color: '#8E9BAE',
    fontSize: 12,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#00DFB2',
    fontWeight: '700',
  },
});

export default function TabsLayout() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  return (
    <Tabs
      screenOptions={{
        headerShown: !isDesktop,
        header: (props) => <MobileTopNavBar {...props} />,
        tabBarStyle: {
          display: 'none', // Completely removes the bottom navigation bar from website & mobile
          height: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
        }}
      />
      <Tabs.Screen
        name="subjects"
        options={{
          title: 'Subjects',
        }}
      />
      <Tabs.Screen
        name="planner"
        options={{
          title: 'Planner',
        }}
      />
      <Tabs.Screen
        name="docuquery"
        options={{
          title: 'DocuQuery AI',
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}
