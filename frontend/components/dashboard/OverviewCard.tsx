import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../common/Card';

interface OverviewCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  iconColor?: string;
}

export const OverviewCard: React.FC<OverviewCardProps> = ({
  title,
  value,
  subtitle,
  iconColor = '#6366F1',
}) => {
  return (
    <Card style={styles.container}>
      <View style={[styles.indicator, { backgroundColor: iconColor }]} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>{value}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 140,
    margin: 6,
    position: 'relative',
  },
  indicator: {
    width: 4,
    height: 24,
    borderRadius: 2,
    position: 'absolute',
    left: 12,
    top: 16,
  },
  title: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '500',
    paddingLeft: 8,
  },
  value: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 6,
    paddingLeft: 8,
  },
  subtitle: {
    color: '#6B7280',
    fontSize: 11,
    marginTop: 4,
    paddingLeft: 8,
  },
});
