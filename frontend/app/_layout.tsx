import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../context/AuthContext';
import { useAuth } from '../hooks/useAuth';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { Colors } from '../constants/theme';

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        {/* Logo mark */}
        <View style={styles.logoMark}>
          <Text style={styles.logoIcon}>📖</Text>
        </View>
        <Text style={styles.appName}>StudyFlow</Text>
        <Text style={styles.tagline}>AI-Powered Learning</Text>
        <ActivityIndicator size="small" color={Colors.teal} style={{ marginTop: 32 }} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#0C1220' },
        headerTintColor: Colors.textPrimary,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: Colors.bg },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="subjects/[id]" options={{ title: 'Subject Details' }} />
      <Stack.Screen name="exams" options={{ title: 'Exams' }} />
      <Stack.Screen name="assignments" options={{ title: 'Assignments' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" backgroundColor={Colors.bg} />
        <RootLayoutNav />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoMark: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: Colors.teal,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
    shadowColor: Colors.teal,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  logoIcon: { fontSize: 36 },
  appName: { color: Colors.textPrimary, fontSize: 26, fontWeight: '800' },
  tagline: { color: Colors.teal, fontSize: 14, fontWeight: '600', marginTop: 4 },
});
