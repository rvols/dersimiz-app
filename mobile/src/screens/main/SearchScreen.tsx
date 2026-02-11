import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, Modal, ScrollView, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card } from '../../components/ui';
import { LocationPicker } from '../../components/LocationPicker';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { api } from '../../services/api';
import type { TutorSearchResult, LessonType } from '../../types/api';

/** Picks the lesson/location name for the current app language. */
const localeName = (lang: 'tr' | 'en') => (o: Record<string, string> | undefined) =>
  o?.[lang] ?? o?.en ?? o?.tr ?? '';

export function SearchScreen({
  lessonTypes,
  onRequestDemo,
  onToggleFavorite,
  onOpenChat,
}: {
  lessonTypes: LessonType[];
  onRequestDemo?: (tutorId: string) => void;
  onToggleFavorite?: (tutorId: string, isFavorite: boolean) => void;
  onOpenChat?: (tutorId: string, tutorName?: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language === 'tr' ? 'tr' : 'en') as 'tr' | 'en';
  const getLocaleName = localeName(lang);
  const [lessonTypeId, setLessonTypeId] = useState<string>('');
  const [locationId, setLocationId] = useState<string>('');
  const [locationBreadcrumb, setLocationBreadcrumb] = useState<string[]>([]);
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);
  const [tutors, setTutors] = useState<TutorSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = async () => {
    setLoading(true);
    setSearched(true);
    try {
      const { data } = await api.post<{ data: { tutors: TutorSearchResult[] } }>('/student/search', {
        lesson_type_id: lessonTypeId || undefined,
        location_id: locationId || undefined,
      });
      setTutors(data?.data?.tutors ?? []);
    } catch (_) {
      setTutors([]);
    } finally {
      setLoading(false);
    }
  };

  const renderTutor = ({ item }: { item: TutorSearchResult }) => {
    const name = item.full_name ?? '—';
    const lessons = item.lessons ?? [];
    const lessonNames = lessons.map((l) => getLocaleName(l.lesson_type?.name)).filter(Boolean).join(', ') || '—';

    // Formatting price if available (mock logic as example)
    const price = lessons[0]?.price_per_hour_cents ? `₺${lessons[0].price_per_hour_cents / 100}` : '';

    return (
      <Card
        variant="student"
        style={styles.tutorCard}
        elevated
      >
        <View style={styles.tutorHeader}>
          <View style={styles.avatarContainer}>
            {item.avatar_url ? (
              <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>{name.charAt(0)}</Text>
              </View>
            )}
            {/* Online/Verified Badge could go here */}
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={16} color={colors.calmTeal} />
            </View>
          </View>

          <View style={styles.tutorInfo}>
            <Text style={styles.tutorName}>{name}</Text>
            <Text style={styles.tutorLessons}>{lessonNames}</Text>

            <View style={styles.metaRow}>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={14} color={colors.warmGold} />
                <Text style={styles.ratingText}>4.9</Text>
              </View>
              {price ? (
                <Text style={styles.priceText}>{price}<Text style={styles.perHour}>/hr</Text></Text>
              ) : null}
            </View>
          </View>

          <TouchableOpacity
            onPress={() => onToggleFavorite?.(item.id, !item.is_favorite)}
            style={styles.favBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons
              name={item.is_favorite ? 'heart' : 'heart-outline'}
              size={24}
              color={item.is_favorite ? colors.alertCoral : colors.slateText}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.actions}>
          <Button
            title={t('search.request_demo')}
            variant="student" // Orange primary
            size="small" // Compact
            onPress={() => onRequestDemo?.(item.id)}
            style={styles.actionBtn}
            fullWidth
            icon="flash"
          />
          <Button
            title={t('chat.title')}
            variant="secondary" // Blue secondary
            size="small"
            onPress={() => onOpenChat?.(item.id, name)}
            style={styles.actionBtn}
            fullWidth
            icon="chatbubble"
          />
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('search.find_your_tutor')}</Text>
        <Text style={styles.headerSubtitle}>{t('search.subtitle_student')}</Text>
      </View>

      <View style={styles.searchContainer}>
        {/* Chips for Lesson Types */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll} style={styles.chipsRow}>
          {lessonTypes.map((lt) => {
            const isActive = lessonTypeId === lt.id;
            return (
              <Pressable
                key={lt.id}
                onPress={() => setLessonTypeId((id) => (id === lt.id ? '' : lt.id))}
                style={[styles.chip, isActive && styles.chipActive]}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                  {getLocaleName(lt.name)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Filter Bar */}
        <View style={styles.filterBar}>
          <TouchableOpacity
            onPress={() => setLocationPickerVisible(true)}
            style={styles.filterButton}
          >
            <Ionicons name="location" size={18} color={locationId ? colors.electricAzure : colors.slateText} />
            <Text style={[styles.filterButtonText, locationId && styles.filterButtonTextActive]} numberOfLines={1}>
              {locationBreadcrumb.length > 0 ? locationBreadcrumb[locationBreadcrumb.length - 1] : t('search.location')}
            </Text>
            <Ionicons name="chevron-down" size={14} color={colors.slateText} />
          </TouchableOpacity>
        </View>

        <Button
          title={t('search.find')}
          onPress={search}
          loading={loading}
          variant="student"
          fullWidth
          style={styles.searchBtn}
          icon="search"
        />
      </View>

      <Modal visible={locationPickerVisible} animationType="slide" onRequestClose={() => setLocationPickerVisible(false)}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('search.select_location')}</Text>
            <TouchableOpacity onPress={() => setLocationPickerVisible(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.carbonText} />
            </TouchableOpacity>
          </View>
          <LocationPicker
            locale={lang}
            onSelect={({ location_id, breadcrumb }) => {
              setLocationId(location_id);
              setLocationBreadcrumb(breadcrumb);
              setLocationPickerVisible(false);
            }}
            onCancel={() => setLocationPickerVisible(false)}
          />
        </View>
      </Modal>

      {loading ? (
        <View style={styles.centerEmpty}>
          <ActivityIndicator size="large" color={colors.sparkOrange} />
          <Text style={styles.loaderText}>{t('search.searching')}</Text>
        </View>
      ) : (
        <FlatList
          data={tutors}
          keyExtractor={(item) => item.id}
          renderItem={renderTutor}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            searched ? (
              <View style={styles.centerEmpty}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="search" size={40} color={colors.slateText} />
                </View>
                <Text style={styles.emptyTitle}>{t('search.no_results')}</Text>
                <Text style={styles.emptyText}>{t('search.try_different_filters')}</Text>
              </View>
            ) : (
              <View style={styles.centerEmpty}>
                <Image
                  source={{ uri: 'https://cdn-icons-png.flaticon.com/512/7486/7486301.png' }} // Placeholder illustration
                  style={{ width: 120, height: 120, opacity: 0.5, marginBottom: spacing.md }}
                />
                <Text style={styles.emptyTitle}>{t('search.ready_to_start')}</Text>
                <Text style={styles.emptyText}>{t('search.select_filters_intro')}</Text>
              </View>
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.mistBlue },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg, // Safe area handled by parent usually, but good to have padding
    marginBottom: spacing.md
  },
  headerTitle: { ...typography.h1, color: colors.carbonText, marginBottom: spacing.xxs },
  headerSubtitle: { ...typography.body, color: colors.slateText },

  searchContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  chipsRow: {
    marginBottom: spacing.md,
  },
  chipsScroll: {
    gap: spacing.xs,
    paddingRight: spacing.lg,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.cleanWhite,
    borderWidth: 1,
    borderColor: colors.outlineGrey,
    ...shadows.subtle,
  },
  chipActive: {
    backgroundColor: colors.sparkOrange,
    borderColor: colors.sparkOrange,
    ...shadows.studentAccent,
  },
  chipText: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '600',
    color: colors.slateText,
  },
  chipTextActive: {
    color: colors.cleanWhite,
  },
  filterBar: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cleanWhite,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineGrey,
    gap: spacing.xs,
    flex: 1,
    ...shadows.subtle,
  },
  filterButtonText: {
    ...typography.label,
    color: colors.slateText,
    flex: 1,
  },
  filterButtonTextActive: {
    color: colors.carbonText,
    fontWeight: '600',
  },
  searchBtn: {
    ...shadows.studentAccent,
  },

  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.xs,
  },

  // Tutor Card Styles
  tutorCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.cleanWhite,
  },
  tutorHeader: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  avatar: { width: 64, height: 64, borderRadius: 24, backgroundColor: colors.mistBlue },
  avatarPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  avatarText: { ...typography.h2, color: colors.slateText },
  verifiedBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: colors.cleanWhite,
    borderRadius: 10,
    padding: 2,
  },
  tutorInfo: { flex: 1, minWidth: 0, justifyContent: 'center' },
  tutorName: { ...typography.h3, color: colors.carbonText, marginBottom: 2 },
  tutorLessons: { ...typography.caption, color: colors.slateText, marginBottom: spacing.xs },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.warmGold + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingText: { ...typography.caption, color: colors.warmGold, fontWeight: '700' },
  priceText: { ...typography.label, color: colors.electricAzure, fontWeight: '700' },
  perHour: { ...typography.caption, color: colors.slateText, fontWeight: '400', fontSize: 10 },

  favBtn: {
    padding: spacing.xs,
  },

  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  actionBtn: { flex: 1 },

  // Empty/Loading States
  centerEmpty: {
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  loaderText: { ...typography.body, color: colors.slateText, marginTop: spacing.md },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.mistBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: { ...typography.h3, color: colors.carbonText, marginBottom: spacing.xs },
  emptyText: { ...typography.body, color: colors.slateText, textAlign: 'center' },

  // Modal
  modalContent: { flex: 1, backgroundColor: colors.mistBlue },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    paddingTop: spacing.xxl,
    backgroundColor: colors.cleanWhite,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineGrey,
  },
  modalTitle: { ...typography.h3, color: colors.carbonText },
  closeBtn: { padding: spacing.xs },
});
