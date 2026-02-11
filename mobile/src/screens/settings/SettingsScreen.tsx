import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Card, Button, ConfirmModal } from '../../components/ui';
import { colors, typography, spacing } from '../../theme';
import { api } from '../../services/api';
import { useLocaleStore } from '../../store/useLocaleStore';
import { useAuthStore } from '../../store/useAuthStore';
import { changeLanguage } from '../../i18n';

interface NotificationPrefs {
  new_message?: boolean;
  approval_status?: boolean;
  subscription_update?: boolean;
  booster_update?: boolean;
  new_student_contact?: boolean;
  support_reply?: boolean;
  quiet_hours_start?: string | null;
  quiet_hours_end?: string | null;
}

export function SettingsScreen() {
  const { t } = useTranslation();
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const logout = useAuthStore((s) => s.logout);
  const [prefs, setPrefs] = useState<NotificationPrefs>({});
  const [loading, setLoading] = useState(true);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<{ data: { notification_preferences?: NotificationPrefs } }>(
          '/me/notification-preferences'
        );
        const raw = data?.data?.notification_preferences ?? data?.data ?? {};
        const p = typeof raw === 'object' && raw !== null && !('notification_preferences' in raw)
          ? (raw as NotificationPrefs)
          : (raw as { notification_preferences?: NotificationPrefs })?.notification_preferences ?? {};
        setPrefs(p);
      } catch (_) {}
      setLoading(false);
    })();
  }, []);

  const updatePref = async (key: keyof NotificationPrefs, value: boolean | string | null) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    try {
      await api.put('/me/notification-preferences', next);
    } catch (_) {}
  };

  const toggleLang = () => {
    const next = locale === 'tr' ? 'en' : 'tr';
    setLocale(next);
    changeLanguage(next);
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await api.delete('/profile');
      setDeleteModalVisible(false);
      logout();
    } catch (_) {}
    setDeleting(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
        <TouchableOpacity onPress={toggleLang} style={styles.row}>
          <Text style={styles.rowText}>{locale === 'tr' ? t('settings.language_turkish') : t('settings.language_english')}</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </Card>
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>{t('settings.notifications')}</Text>
        {[
          'new_message',
          'approval_status',
          'subscription_update',
          'booster_update',
          'new_student_contact',
          'support_reply',
        ].map((key) => (
          <View key={key} style={styles.row}>
            <Text style={styles.rowText}>{t(`settings.${key}`)}</Text>
            <Switch
              value={!!prefs[key as keyof NotificationPrefs]}
              onValueChange={(v) => updatePref(key as keyof NotificationPrefs, v)}
              trackColor={{ false: colors.outlineGrey, true: colors.electricAzure }}
              thumbColor={colors.cleanWhite}
            />
          </View>
        ))}
      </Card>

      <View style={styles.dangerZoneWrap}>
        <Text style={styles.dangerZoneTitle}>{t('settings.danger_zone')}</Text>
        <Card style={styles.dangerZoneCard}>
          <View style={styles.dangerZoneRow}>
            <View style={styles.dangerZoneLeft}>
              <Ionicons name="warning-outline" size={22} color={colors.alertCoral} />
              <Text style={styles.dangerZoneLabel}>{t('profile.delete_account')}</Text>
            </View>
            <Button
              title={t('profile.delete_account')}
              variant="destructive"
              size="small"
              onPress={() => setDeleteModalVisible(true)}
            />
          </View>
          <Text style={styles.dangerZoneHint}>{t('profile.delete_confirm')}</Text>
        </Card>
      </View>

      <ConfirmModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        title={t('profile.delete_account')}
        message={t('profile.delete_confirm')}
        cancelLabel={t('common.cancel')}
        confirmLabel={t('profile.delete_account')}
        onConfirm={handleDeleteConfirm}
        variant="destructive"
        loading={deleting}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.mistBlue },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  card: { marginBottom: spacing.md },
  sectionTitle: { ...typography.h3, color: colors.carbonText, marginBottom: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
  rowText: { ...typography.body, color: colors.carbonText },
  arrow: { ...typography.h3, color: colors.slateText },
  dangerZoneWrap: { marginTop: spacing.xl, marginBottom: spacing.lg },
  dangerZoneTitle: {
    ...typography.h3,
    color: colors.alertCoral,
    marginBottom: spacing.sm,
  },
  dangerZoneCard: {
    borderColor: colors.alertCoral + '40',
    borderWidth: 1,
    padding: spacing.md,
  },
  dangerZoneRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  dangerZoneLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  dangerZoneLabel: { ...typography.label, color: colors.carbonText },
  dangerZoneHint: { ...typography.caption, color: colors.slateText, marginTop: spacing.sm },
});
