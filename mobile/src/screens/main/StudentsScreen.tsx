import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, shadows } from '../../theme';
import { Card } from '../../components/ui';
import { api } from '../../services/api';

interface StudentItem {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

export function StudentsScreen({ onSelectStudent }: { onSelectStudent?: (id: string, name: string) => void }) {
  const { t } = useTranslation();
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get<{ data: { students?: StudentItem[] } }>('/tutor/students');
      const list = data?.data?.students ?? (data?.data as unknown as { id: string; full_name: string | null; avatar_url: string | null }[]) ?? [];
      setStudents(Array.isArray(list) ? list : []);
    } catch (_) {
      setStudents([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: StudentItem }) => {
    const name = item.full_name ?? t('common.unknown');
    return (
      <Card
        variant="tutor"
        style={styles.card}
        onPress={() => onSelectStudent?.(item.id, name)}
      >
        <View style={styles.row}>
          <View style={styles.avatarContainer}>
            {item.avatar_url ? (
              <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>{name.charAt(0)}</Text>
              </View>
            )}
          </View>

          <View style={styles.info}>
            <Text style={styles.name}>{name}</Text>
            <View style={styles.metaRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{t('student')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.slateText} />
            </View>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('dashboard.tutor.my_students')}</Text>
        <Text style={styles.headerSubtitle}>{students.length} {t('common.active')}</Text>
      </View>

      <FlatList
        data={students}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="people" size={32} color={colors.slateText} />
            </View>
            <Text style={styles.emptyTitle}>{t('students.empty')}</Text>
            <Text style={styles.emptyText}>{t('students.empty_hint')}</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.calmTeal} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.mistBlue },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerTitle: { ...typography.h2, color: colors.carbonText },
  headerSubtitle: { ...typography.body, color: colors.slateText, marginTop: spacing.xxs },

  list: { padding: spacing.lg, paddingBottom: spacing.xxl },
  card: { marginBottom: spacing.sm, padding: spacing.md },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatarContainer: { marginRight: spacing.md },
  avatar: { width: 52, height: 52, borderRadius: 16, backgroundColor: colors.mistBlue },
  avatarPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  avatarText: { ...typography.h3, color: colors.slateText },

  info: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { ...typography.label, color: colors.carbonText, fontSize: 16 },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  badge: {
    backgroundColor: colors.mistBlue,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: { ...typography.caption, color: colors.slateText, fontSize: 11, fontWeight: '500' },

  empty: { padding: spacing.xl, alignItems: 'center', marginTop: spacing.xl },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.mistBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.outlineGrey,
  },
  emptyTitle: { ...typography.h3, color: colors.carbonText, marginBottom: spacing.xs },
  emptyText: { ...typography.body, color: colors.slateText, textAlign: 'center' },
});
