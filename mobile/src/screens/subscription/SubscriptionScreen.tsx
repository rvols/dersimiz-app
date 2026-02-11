import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card, Button } from '../../components/ui';
import { colors, typography, spacing } from '../../theme';
import { api } from '../../services/api';
import type { SubscriptionPlan } from '../../types/api';

const localeName = (lang: 'tr' | 'en') => (o: Record<string, string> | undefined) => o?.[lang] ?? o?.en ?? o?.tr ?? '';

export function SubscriptionScreen() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language === 'tr' ? 'tr' : 'en') as 'tr' | 'en';
  const getDisplayName = localeName(lang);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [current, setCurrent] = useState<{
    plan: { display_name: Record<string, string> };
    end_date?: string;
    is_renewing?: boolean;
  } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [plansRes, subRes] = await Promise.all([
          api.get<{ data: { plans: SubscriptionPlan[] } }>('/subscription-plans'),
          api.get<{ data: { current_subscription: unknown } }>('/me/subscription'),
        ]);
        setPlans(plansRes.data?.data?.plans ?? []);
        const sub = subRes.data?.data?.current_subscription as typeof current;
        setCurrent(sub ?? null);
      } catch (_) {}
    })();
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {current && (
        <Card style={styles.current}>
          <Text style={styles.label}>{t('subscription.current')}</Text>
          <Text style={styles.planName}>{getDisplayName(current.plan?.display_name)}</Text>
          {current.end_date && (
            <Text style={styles.renews}>{t('subscription.renews', { date: new Date(current.end_date).toLocaleDateString() })}</Text>
          )}
        </Card>
      )}
      <Text style={styles.sectionTitle}>{t('subscription.plans')}</Text>
      {plans.map((plan) => (
        <Card key={plan.id} style={styles.planCard}>
          <Text style={styles.planName}>{getDisplayName(plan.display_name)}</Text>
          <View style={styles.prices}>
            <Text style={styles.price}>
              {(plan.monthly_price_cents / 100).toFixed(0)} TRY {t('subscription.per_month')}
            </Text>
            <Text style={styles.price}>
              {(plan.yearly_price_cents / 100).toFixed(0)} TRY {t('subscription.per_year')}
            </Text>
          </View>
          <Button title={t('subscription.subscribe')} onPress={() => {}} variant="secondary" style={styles.btn} />
        </Card>
      ))}
      <Button title={t('subscription.restore')} variant="outline" onPress={() => {}} style={styles.restore} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.mistBlue },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  current: { marginBottom: spacing.lg },
  label: { ...typography.caption, color: colors.slateText },
  planName: { ...typography.h3, color: colors.carbonText },
  renews: { ...typography.body, color: colors.slateText, marginTop: spacing.xs },
  sectionTitle: { ...typography.h3, color: colors.carbonText, marginBottom: spacing.sm },
  planCard: { marginBottom: spacing.md },
  prices: { marginVertical: spacing.sm },
  price: { ...typography.body, color: colors.slateText },
  btn: { marginTop: spacing.sm },
  restore: { marginTop: spacing.md },
});
