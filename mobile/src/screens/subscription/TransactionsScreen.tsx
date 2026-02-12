import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/ui';
import { colors, typography, spacing } from '../../theme';
import { api } from '../../services/api';

type Transaction = {
  id: string;
  type: string;
  amount_cents: number;
  currency: string;
  status: string;
  billing_provider: string;
  created_at: string;
};

export function TransactionsScreen() {
  const { t } = useTranslation();
  const [list, setList] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get<{ data: { transactions: Transaction[] } }>('/me/transactions');
      setList(data?.data?.transactions ?? []);
    } catch (_) {
      setList([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  // TRY: amount_cents is kurus (1/100 of TRY), so divide by 100 for display
  const formatAmount = (cents: number, currency: string) => {
    if (currency === 'TRY') {
      return `${(cents / 100).toFixed(2)} ₺`;
    }
    return `${(cents / 100).toFixed(2)} ${currency}`;
  };

  const statusColor = (status: string) => {
    if (status === 'completed') return colors.calmTeal;
    if (status === 'refunded' || status === 'cancelled') return colors.slateText;
    return colors.warmGold;
  };

  if (loading && list.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.calmTeal} />
      }
    >
      <Text style={styles.sectionTitle}>{t('subscription.transactions_title', { defaultValue: 'Subscription transactions' })}</Text>
      {list.length === 0 ? (
        <Card style={styles.empty}>
          <Ionicons name="receipt-outline" size={48} color={colors.slateText} />
          <Text style={styles.emptyText}>{t('subscription.no_transactions', { defaultValue: 'No transactions yet' })}</Text>
        </Card>
      ) : (
        list.map((tx) => (
          <Card key={tx.id} style={styles.card}>
            <View style={styles.row}>
              <View style={styles.left}>
                <Text style={styles.type}>{tx.type === 'subscription' ? t('subscription.subscription', { defaultValue: 'Subscription' }) : tx.type}</Text>
                <Text style={styles.date}>{new Date(tx.created_at).toLocaleString()}</Text>
                <Text style={[styles.status, { color: statusColor(tx.status) }]}>{tx.status}</Text>
              </View>
              <Text style={styles.amount}>{formatAmount(tx.amount_cents, tx.currency)}</Text>
            </View>
            {tx.billing_provider && (
              <Text style={styles.provider}>{tx.billing_provider}</Text>
            )}
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.mistBlue },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  muted: { ...typography.body, color: colors.slateText },
  sectionTitle: { ...typography.h3, color: colors.carbonText, marginBottom: spacing.md },
  empty: { alignItems: 'center', padding: spacing.xl },
  emptyText: { ...typography.body, color: colors.slateText, marginTop: spacing.sm },
  card: { marginBottom: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  left: { flex: 1 },
  type: { ...typography.label, color: colors.carbonText },
  date: { ...typography.caption, color: colors.slateText, marginTop: spacing.xxs },
  status: { ...typography.caption, marginTop: spacing.xxs, textTransform: 'capitalize' },
  amount: { ...typography.h3, color: colors.carbonText },
  provider: { ...typography.caption, color: colors.slateText, marginTop: spacing.xs },
});
