import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/theme';

// ── Custom tab icon ───────────────────────────────────────────────────────────
function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={[ti.wrap, focused && ti.wrapActive]}>
      <Text style={ti.emoji}>{emoji}</Text>
    </View>
  );
}

const ti = StyleSheet.create({
  wrap: {
    width: 36, height: 28, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
  },
  wrapActive: { backgroundColor: '#0F2A22' },
  emoji: { fontSize: 18 },
});

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0C1220',
          borderTopColor: '#1E293B',
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: Colors.teal,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📊" label="Today" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="subjects"
        options={{
          title: 'Subjects',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📚" label="Subjects" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="planner"
        options={{
          title: 'Planner',
          tabBarIcon: ({ focused }) => <TabIcon emoji="⚡" label="Planner" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🗓️" label="Calendar" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📈" label="Progress" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label="Profile" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
