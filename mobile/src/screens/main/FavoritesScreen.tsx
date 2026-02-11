import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Card, Button } from '../../components/ui';
import { colors, typography, spacing, shadows } from '../../theme';
import { api } from '../../services/api';
import type { TutorSearchResult } from '../../types/api';

const locale = (o: Record<string, string> | undefined) => o?.tr ?? o?.en ?? '';

export function FavoritesScreen({ onOpenChat, onRequestDemo }: {
  onOpenChat?: (tutorId: string, tutorName?: string) => void;
  onRequestDemo?: (tutorId: string) => void;
}) {
  const { t } = useTranslation();
  const [tutors, setTutors] = useState<TutorSearchResult[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get<{ data: { tutors?: TutorSearchResult[] } }>('/student/favorites');
      const list = data?.data?.tutors ?? (data?.data as unknown as TutorSearchResult[]) ?? [];
      setTutors(Array.isArray(list) ? list : []);
    } catch (_) {
      setTutors([]);
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

  const removeFavorite = async (tutorId: string) => {
    try {
      await api.delete(`/student/favorites/${tutorId}`);
      setTutors((prev) => prev.filter((t) => t.id !== tutorId));
    } catch (_) { }
  };

  const renderItem = ({ item }: { item: TutorSearchResult }) => {
    const name = item.full_name ?? '—';
    const lessons = (item.lessons ?? []).map((l) => locale(l.lesson_type?.name)).filter(Boolean).join(', ') || '—';

    return (
      <Card variant="student" style={styles.card} elevated>
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
            <Text style={styles.lessons}>{lessons}</Text>

            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={12} color={colors.warmGold} />
              <Text style={styles.ratingText}>4.9</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => removeFavorite(item.id)}
            style={styles.unfavBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="heart" size={24} color={colors.sparkOrange} />
            <View style={styles.unfavOverlay}>
              <Ionicons name="close" size={14} color={colors.cleanWhite} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.actions}>
          <Button
            title={t('chat.title')}
            variant="secondary"
            size="small"
            onPress={() => onOpenChat?.(item.id, name)}
            style={styles.btn}
            icon="chatbubble"
          />
          <Button
            title={t('search.request_demo')}
            variant="student"
            size="small"
            onPress={() => onRequestDemo?.(item.id)}
            style={styles.btn}
            icon="flash"
          />
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('dashboard.student.favorites')}</Text>
      </View>

      <FlatList
        data={tutors}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="heart" size={32} color={colors.slateText} />
            </View>
            <Text style={styles.emptyText}>{t('favorites.empty')}</Text>
            <Text style={styles.emptySubtext}>{t('favorites.empty_hint')}</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.sparkOrange} />
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

  list: { padding: spacing.lg, paddingBottom: spacing.xxl },
  card: { marginBottom: spacing.md, padding: spacing.md },

  row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md },
  avatarContainer: { marginRight: spacing.md },
  avatar: { width: 56, height: 56, borderRadius: 20, backgroundColor: colors.mistBlue },
  avatarPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  avatarText: { ...typography.h3, color: colors.slateText },

  info: { flex: 1, minWidth: 0, justifyContent: 'center' },
  name: { ...typography.label, color: colors.carbonText, fontSize: 16, marginBottom: 2 },
  lessons: { ...typography.caption, color: colors.slateText, marginBottom: spacing.xs },

  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.warmGold + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  ratingText: { ...typography.caption, color: colors.warmGold, fontWeight: '700', fontSize: 11 },

  unfavBtn: { position: 'relative', padding: spacing.xs },
  unfavOverlay: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: colors.alertCoral,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cleanWhite,
  },

  actions: { flexDirection: 'row', gap: spacing.sm },
  btn: { flex: 1 },

  empty: { padding: spacing.xxl, alignItems: 'center', marginTop: spacing.xl },
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
  emptyText: { ...typography.h3, color: colors.carbonText, marginBottom: spacing.xs },
  emptySubtext: { ...typography.body, color: colors.slateText, textAlign: 'center' },
});
