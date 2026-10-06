import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Subject } from '../../types/subject';
import { Card } from '../common/Card';
import { getDifficultyColor } from '../../utils/helpers';

interface SubjectCardProps {
  subject: Subject;
  onPress: () => void;
  onDelete?: () => void;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({ subject, onPress, onDelete }) => {
  const diffColor = getDifficultyColor(subject.difficulty);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.name}>{subject.name}</Text>
          <View style={[styles.badge, { backgroundColor: `${diffColor}25` }]}>
            <Text style={[styles.badgeText, { color: diffColor }]}>
              {subject.difficulty.toUpperCase()}
            </Text>
          </View>
        </View>
        {subject.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {subject.description}
          </Text>
        ) : null}
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  description: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 4,
  },
});
