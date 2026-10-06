import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Student Profile</Text>

      <Card style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.email?.charAt(0).toUpperCase() || 'S'}
          </Text>
        </View>

        <Text style={styles.label}>Email Address</Text>
        <Text style={styles.value}>{user?.email || 'Not logged in'}</Text>

        <Text style={styles.label}>Firebase User ID</Text>
        <Text style={styles.valueSmall}>{user?.uid || 'N/A'}</Text>
      </Card>

      <Button
        title="Sign Out"
        variant="danger"
        onPress={() => signOut()}
        style={styles.logoutBtn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#13131D',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  card: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  label: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 12,
  },
  value: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
  },
  valueSmall: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 4,
  },
  logoutBtn: {
    marginTop: 24,
  },
});
