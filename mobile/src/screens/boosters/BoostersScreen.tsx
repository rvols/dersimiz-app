import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card, Button } from '../../components/ui';
import { colors, typography, spacing } from '../../theme';
import { api } from '../../services/api';
import type { Booster } from '../../types/api';

const localeName = (lang: 'tr' | 'en') => (o: Record<string, string> | undefined) => o?.[lang] ?? o?.en ?? o?.tr ?? '';

export function BoostersScreen() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language === 'tr' ? 'tr' : 'en') as 'tr' | 'en';
  const getDisplayName = localeName(lang);
  const [boosters, setBoosters] = useState<Booster[]>([]);
  const [active, setActive] = useState<Array<{ booster: { display_name: Record<string, string> }; expires_at: string }>>([]);

  useEffect(() => {
    (async () => {
      try {
        const [listRes, subRes] = await Promise.all([
          api.get<{ data: { boosters: Booster[] } }>('/boosters'),
          api.get<{ data: { active_boosters: Array<{ booster: { display_name: Record<string, string> }; expires_at: string }> } }>('/me/subscription'),
        ]);
        setBoosters(listRes.data?.data?.boosters ?? []);
        setActive(subRes.data?.data?.active_boosters ?? []);
      } catch (_) {}
    })();
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {active.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>{t('boosters.active')}</Text>
          {active.map((a, i) => (
            <Card key={i} style={styles.card}>
              <Text style={styles.name}>{getDisplayName(a.booster?.display_name)}</Text>
              <Text style={styles.expires}>{t('boosters.expires', { date: new Date(a.expires_at).toLocaleDateString() })}</Text>
            </Card>
          ))}
        </>
      )}
      <Text style={styles.sectionTitle}>{t('boosters.available')}</Text>
      {boosters.map((b) => (
        <Card key={b.id} style={styles.card}>
          <Text style={styles.name}>{getDisplayName(b.display_name)}</Text>
          <Text style={styles.desc}>{t('boosters.days', { count: b.duration_days })} • {t('boosters.ranking_boost', { value: b.search_ranking_boost })}</Text>
          <Button
            title={`${(b.price_cents / 100).toFixed(0)} TRY - ${t('boosters.activate')}`}
            onPress={() => {}}
            variant="primary"
            style={styles.btn}
          />
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.mistBlue },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  sectionTitle: { ...typography.h3, color: colors.carbonText, marginBottom: spacing.sm },
  card: { marginBottom: spacing.md },
  name: { ...typography.h3, color: colors.carbonText },
  desc: { ...typography.body, color: colors.slateText, marginTop: spacing.xs },
  expires: { ...typography.caption, color: colors.slateText, marginTop: spacing.xs },
  btn: { marginTop: spacing.sm },
});
