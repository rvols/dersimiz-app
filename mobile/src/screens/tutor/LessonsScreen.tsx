import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Input } from '../../components/ui';
import { colors, typography, spacing, shadows, borderRadius } from '../../theme';
import { api } from '../../services/api';
import type { TutorLesson, LessonType } from '../../types/api';

const locale = (o: Record<string, string> | undefined) => o?.tr ?? o?.en ?? '';

export function LessonsScreen() {
  const { t } = useTranslation();
  const [lessons, setLessons] = useState<TutorLesson[]>([]);
  const [lessonTypes, setLessonTypes] = useState<LessonType[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  // Add/Edit State
  const [selectedLessonType, setSelectedLessonType] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [currency, setCurrency] = useState('TRY');
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Remove State
  const [removeId, setRemoveId] = useState<string | null>(null);

  const load = async () => {
    try {
      const [lessonsRes, typesRes] = await Promise.all([
        api.get<{ data: TutorLesson[] }>('/tutor/lessons'),
        api.get<{ data: { lesson_types: LessonType[] } }>('/onboarding/data'),
      ]);

      const rawLessons = lessonsRes.data?.data;
      const list = Array.isArray(rawLessons) ? rawLessons : (rawLessons as { lessons?: TutorLesson[] })?.lessons ?? [];
      setLessons(list);

      const types = typesRes.data?.data?.lesson_types ?? [];
      setLessonTypes(types);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAddLesson = async () => {
    if (!selectedLessonType || !price) return;
    const cents = Math.round(parseFloat(price) * 100);
    if (cents <= 0) return;

    setAdding(true);
    try {
      await api.post('/tutor/lessons', {
        lesson_type_id: selectedLessonType,
        price_per_hour_cents: cents,
        currency
      });
      setIsModalVisible(false);
      setPrice('');
      setSelectedLessonType('');
      await load();
    } catch (error) {
      // Toast usually handled by interceptor or we can add local error handling
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id: string) => {
    // Optimistic update could go here, but strict consistency is safer
    try {
      await api.delete(`/tutor/lessons/${id}`);
      setLessons(prev => prev.filter(l => l.id !== id));
    } catch (error) {
      // handle error
    }
  };

  // Filter out already added lesson types
  const usedTypeIds = lessons.map(l => l.lesson_type_id);
  const availableTypes = lessonTypes.filter(lt => !usedTypeIds.includes(lt.id));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{t('dashboard.tutor.manage_lessons')}</Text>
          <Text style={styles.headerSubtitle}>{lessons.length} {t('common.active')}</Text>
        </View>
        <Button
          title={t('common.add')}
          variant="tutor"
          size="small"
          icon="add"
          onPress={() => setIsModalVisible(true)}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.calmTeal} style={{ marginTop: spacing.xl }} />
        ) : (
          <View style={styles.list}>
            {lessons.map(lesson => (
              <Card key={lesson.id} variant="tutor" style={styles.lessonCard}>
                <View style={styles.lessonHeader}>
                  <View style={styles.iconBox}>
                    <Ionicons name="book" size={20} color={colors.calmTeal} />
                  </View>
                  <View style={styles.lessonInfo}>
                    <Text style={styles.lessonName}>{locale(lesson.lesson_type?.name)}</Text>
                    <Text style={styles.lessonPrice}>
                      {(lesson.price_per_hour_cents / 100).toFixed(0)} {lesson.currency}
                      <Text style={styles.perHour}> / {t('common.hour')}</Text>
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleRemove(lesson.id)} style={styles.deleteBtn}>
                    <Ionicons name="trash-outline" size={20} color={colors.slateText} />
                  </TouchableOpacity>
                </View>
              </Card>
            ))}

            {lessons.length === 0 && !loading && (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>{t('lessons.empty_hint')}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Add Lesson Modal */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('lessons.add_new')}</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.carbonText} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>{t('onboarding.lesson_type')}</Text>
              <View style={styles.resChips}>
                {availableTypes.map(lt => (
                  <TouchableOpacity
                    key={lt.id}
                    style={[styles.chip, selectedLessonType === lt.id && styles.chipActive]}
                    onPress={() => setSelectedLessonType(lt.id)}
                  >
                    <Text style={[styles.chipText, selectedLessonType === lt.id && styles.chipTextActive]}>
                      {locale(lt.name)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.inputWrap}>
                <Text style={styles.label}>{t('onboarding.price_per_hour')} (TRY)</Text>
                <Input
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                  placeholder="250"
                  style={styles.priceInput}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title={t('common.cancel')}
                variant="ghost"
                onPress={() => setIsModalVisible(false)}
                style={{ flex: 1 }}
              />
              <Button
                title={t('common.save')}
                variant="tutor"
                onPress={handleAddLesson}
                loading={adding}
                disabled={!selectedLessonType || !price}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.mistBlue },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.mistBlue,
  },
  headerTitle: { ...typography.h2, color: colors.carbonText },
  headerSubtitle: { ...typography.caption, color: colors.slateText },

  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  list: { gap: spacing.md },

  lessonCard: { padding: spacing.md },
  lessonHeader: { flexDirection: 'row', alignItems: 'center' },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.calmTeal + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  lessonInfo: { flex: 1 },
  lessonName: { ...typography.label, color: colors.carbonText, marginBottom: 2 },
  lessonPrice: { ...typography.h3, color: colors.calmTeal, fontSize: 16 },
  perHour: { ...typography.caption, color: colors.slateText, fontSize: 12, fontWeight: '400' },
  deleteBtn: { padding: spacing.xs },

  empty: { alignItems: 'center', marginTop: spacing.xxl },
  emptyText: { ...typography.body, color: colors.slateText },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.cleanWhite,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineGrey,
  },
  modalTitle: { ...typography.h3, color: colors.carbonText },
  modalBody: { padding: spacing.lg },
  label: { ...typography.label, color: colors.carbonText, marginBottom: spacing.sm },
  resChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.outlineGrey,
    backgroundColor: colors.cleanWhite,
  },
  chipActive: {
    borderColor: colors.calmTeal,
    backgroundColor: colors.calmTeal + '10',
  },
  chipText: { ...typography.caption, color: colors.slateText },
  chipTextActive: { color: colors.calmTeal, fontWeight: '600' },

  inputWrap: { marginBottom: spacing.xl },
  priceInput: { fontSize: 18, fontWeight: '600', color: colors.carbonText },

  modalFooter: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.outlineGrey,
  },
});
