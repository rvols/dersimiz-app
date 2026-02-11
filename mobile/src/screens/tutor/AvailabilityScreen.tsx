import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui';
import { WeeklyAvailability, type AvailabilitySlot } from '../../components/WeeklyAvailability';
import { colors, typography, spacing } from '../../theme';
import { api, getApiErrorMessage } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

export type { AvailabilitySlot } from '../../components/WeeklyAvailability';

export function AvailabilityScreen() {
  const { t } = useTranslation();
  const toast = useToast();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    api
      .get<{ data: { slots?: AvailabilitySlot[] } }>('/tutor/availability')
      .then((r) => {
        const s = r.data?.data?.slots ?? (r.data?.data as unknown as AvailabilitySlot[]) ?? [];
        if (mounted && Array.isArray(s)) setSlots(s);
      })
      .catch(() => {
        if (mounted) setSlots([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.put('/tutor/availability', { slots });
      toast.showSuccess(t('common.saved', { defaultValue: 'Saved.' }));
    } catch (err) {
      toast.showError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('onboarding.availability')}</Text>
      <Text style={styles.subtitle}>{t('onboarding.set_slots')}</Text>
      <WeeklyAvailability slots={slots} onChange={setSlots} />
      <Button title={t('common.save')} onPress={save} loading={saving} fullWidth style={styles.saveBtn} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.mistBlue },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.mistBlue },
  loadingText: { ...typography.body, color: colors.slateText },
  title: { ...typography.h2, color: colors.carbonText, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.slateText, marginBottom: spacing.lg },
  saveBtn: { marginTop: spacing.xl },
});
