import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/ui';
import { colors, typography, spacing } from '../../theme';
import { api } from '../../services/api';

interface Notif {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  sent_at: string;
}

export function NotificationsScreen() {
  const { t } = useTranslation();
  const [list, setList] = useState<Notif[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<{ data: { notifications: Notif[] } }>('/me/notifications');
        const notifications = data?.data?.notifications ?? [];
        setList(notifications);
        for (const n of notifications) {
          if (!n.read) {
            try {
              await api.put(`/me/notifications/${n.id}/read`);
            } catch (_) {}
          }
        }
      } catch (_) {}
    })();
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t('notifications.empty')}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card style={!item.read ? [styles.card, styles.cardUnread] : styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
            <Text style={styles.time}>{new Date(item.sent_at).toLocaleString()}</Text>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.mistBlue },
  list: { padding: spacing.md, paddingBottom: spacing.xxl },
  empty: { padding: spacing.xl, alignItems: 'center' },
  emptyText: { ...typography.body, color: colors.slateText },
  card: { marginBottom: spacing.sm },
  cardUnread: { borderLeftWidth: 4, borderLeftColor: colors.electricAzure },
  title: { ...typography.label, color: colors.carbonText },
  body: { ...typography.body, color: colors.slateText, marginTop: spacing.xxs },
  time: { ...typography.caption, color: colors.slateText, marginTop: spacing.xs },
});
