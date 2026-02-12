import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/ui';
import { colors, typography, spacing } from '../../theme';
import { api } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { getApiErrorMessage } from '../../services/api';
import type { OnboardingData, Grade } from '../../types/api';

const localeKey = (obj: Record<string, string> | undefined) =>
  obj?.tr ?? obj?.en ?? '';

export function SchoolTypesGradesScreen() {
  const { t } = useTranslation();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<OnboardingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedSchoolTypeIds, setSelectedSchoolTypeIds] = useState<string[]>([]);
  const [gradesBySchoolType, setGradesBySchoolType] = useState<Record<string, string[]>>({});

  const toggleSchoolType = (id: string) => {
    setSelectedSchoolTypeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleGrade = (stId: string, gId: string) => {
    setGradesBySchoolType((prev) => {
      const current = prev[stId] ?? [];
      const newGrades = current.includes(gId)
        ? current.filter((x) => x !== gId)
        : [...current, gId];
      return { ...prev, [stId]: newGrades };
    });
  };

  const load = async () => {
    try {
      const [onboardingRes, gradesRes] = await Promise.all([
        api.get<{ data: OnboardingData }>('/onboarding/data'),
        api.get<{ data: { grades: { id: string; school_type_id: string }[] } }>('/tutor/grades'),
      ]);

      const od = onboardingRes.data?.data;
      setData(od ?? null);

      const rawGrades = gradesRes.data?.data?.grades ?? (gradesRes.data as { grades?: unknown[] })?.grades ?? [];
      const grades = Array.isArray(rawGrades) ? rawGrades : [];

      const stIds = [...new Set(grades.map((g: { school_type_id?: string }) => g.school_type_id).filter((id): id is string => !!id))];
      setSelectedSchoolTypeIds(stIds);

      const byType: Record<string, string[]> = {};
      for (const g of grades) {
        const stId = g.school_type_id;
        if (!byType[stId]) byType[stId] = [];
        byType[stId].push(g.id);
      }
      setGradesBySchoolType(byType);
    } catch (e) {
      console.error(e);
      toast.showError(t('common.error_loading_data'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async () => {
    if (selectedSchoolTypeIds.length === 0) {
      toast.showError(t('onboarding.select_school_type'));
      return;
    }
    const missingGrade = selectedSchoolTypeIds.find((stId) => !(gradesBySchoolType[stId]?.length));
    if (missingGrade) {
      toast.showError(t('onboarding.select_at_least_one_grade', {
        defaultValue: 'Select at least one grade for each school type.',
      }));
      return;
    }

    setSaving(true);
    try {
      const allNewGradeIds = selectedSchoolTypeIds.flatMap((stId) => gradesBySchoolType[stId] ?? []);

      const currentRes = await api.get<{ data: { grades: { id: string }[] } }>('/tutor/grades');
      const currentGrades = currentRes.data?.data?.grades ?? (currentRes.data as { grades?: { id: string }[] })?.grades ?? [];
      const currentIds = (Array.isArray(currentGrades) ? currentGrades : []).map((g) => g.id);

      const toRemove = currentIds.filter((id) => !allNewGradeIds.includes(id));
      const toAdd = allNewGradeIds.filter((id) => !currentIds.includes(id));

      for (const gradeId of toRemove) {
        await api.delete(`/tutor/grades/${gradeId}`);
      }
      for (const gradeId of toAdd) {
        await api.post('/tutor/grades', { grade_id: gradeId });
      }

      toast.showSuccess(t('common.saved'));
    } catch (e) {
      toast.showError(getApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading || !data) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.electricAzure} />
      </View>
    );
  }

  const schoolTypes = (data.school_types ?? []).slice(0, 6);
  const gradesList: Grade[] = data?.grades ?? (data as { grade_options?: Grade[] })?.grade_options ?? [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>{t('onboarding.education')}</Text>
      <Text style={styles.subtitle}>{t('onboarding.grades_you_teach', { defaultValue: 'Select school types and grades you teach' })}</Text>
      <Text style={styles.label}>{t('onboarding.school_type')}</Text>
      <View style={styles.chipRow}>
        {schoolTypes.map((st: { id: string; name: Record<string, string> }) => {
          const selected = selectedSchoolTypeIds.includes(st.id);
          return (
            <TouchableOpacity
              key={st.id}
              onPress={() => toggleSchoolType(st.id)}
              style={[styles.chip, selected && styles.chipActive]}
            >
              <Text style={selected ? styles.chipTextActive : styles.chipText}>{localeKey(st.name)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {selectedSchoolTypeIds.map((stId) => {
        const st = schoolTypes.find((s: { id: string; name: Record<string, string> }) => s.id === stId);
        const schoolTypeName = st ? localeKey(st.name) : stId;
        const gradesForType = gradesList.filter((g: Grade) => g.school_type_id === stId);
        const selectedForType = gradesBySchoolType[stId] ?? [];
        return (
          <View key={stId} style={styles.schoolTypeSection}>
            <Text style={styles.schoolTypeSectionTitle}>{schoolTypeName}</Text>
            <Text style={styles.label}>{t('onboarding.select_at_least_one_grade', { defaultValue: 'Select at least one grade' })}</Text>
            <View style={styles.chipRow}>
              {gradesForType.length === 0 ? (
                <Text style={styles.hint}>{t('onboarding.no_grades_for_type', { defaultValue: 'No grades available.' })}</Text>
              ) : (
                gradesForType.map((g: Grade) => {
                  const selected = selectedForType.includes(g.id);
                  return (
                    <TouchableOpacity
                      key={g.id}
                      onPress={() => toggleGrade(stId, g.id)}
                      style={[styles.chip, selected && styles.chipActive]}
                    >
                      <Text style={selected ? styles.chipTextActive : styles.chipText}>{localeKey(g.name)}</Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </View>
        );
      })}

      <Button
        title={saving ? t('common.saving') : t('common.save')}
        onPress={handleSave}
        disabled={saving}
        style={styles.saveBtn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cleanWhite },
  content: { padding: spacing.lg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.cleanWhite },
  title: { ...typography.h2, color: colors.carbonText, marginBottom: spacing.sm },
  subtitle: { ...typography.body, color: colors.slateText, marginBottom: spacing.lg },
  label: { ...typography.label, color: colors.carbonText, marginBottom: spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  chip: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineGrey,
    backgroundColor: colors.cleanWhite,
  },
  chipActive: {
    borderColor: colors.electricAzure,
    backgroundColor: colors.mistBlue,
  },
  chipText: { ...typography.body, color: colors.carbonText },
  chipTextActive: { ...typography.label, color: colors.electricAzure },
  hint: { ...typography.body, color: colors.slateText, marginBottom: spacing.sm },
  schoolTypeSection: { marginTop: spacing.lg, marginBottom: spacing.sm },
  schoolTypeSectionTitle: { ...typography.h3, color: colors.carbonText, marginBottom: spacing.sm },
  saveBtn: { marginTop: spacing.xl },
});
