import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/ui';
import { colors, typography, spacing } from '../../theme';
import { api } from '../../services/api';
import type { Conversation } from '../../types/api';

export function ChatListScreen({ onSelectConversation }: { onSelectConversation: (id: string, otherName: string) => void }) {
  const { t } = useTranslation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get<{ data: { conversations: Conversation[] } }>('/chat/conversations');
      setConversations(data?.data?.conversations ?? []);
    } catch (_) {}
  };

  useEffect(() => {
    load();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: Conversation }) => {
    const otherName = item.other?.full_name ?? t('common.unknown');
    const preview = item.last_message?.type === 'text' ? (item.last_message as { content?: string }).content : '';
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => onSelectConversation(item.id, otherName)}
        style={styles.rowWrap}
      >
        <Card style={styles.row} noPadding>
          <View style={styles.rowInner}>
            {item.other?.avatar_url ? (
              <Image source={{ uri: item.other.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>{otherName.charAt(0)}</Text>
              </View>
            )}
            <View style={styles.body}>
              <Text style={styles.name} numberOfLines={1}>{otherName}</Text>
              <Text style={styles.preview} numberOfLines={1}>{preview || t('chat.type_message')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.slateText} />
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={48} color={colors.outlineGrey} style={styles.emptyIcon} />
            <Text style={styles.emptyText}>{t('chat.no_conversations')}</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.electricAzure} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.mistBlue },
  list: { padding: spacing.lg, paddingBottom: spacing.xxl },
  rowWrap: { marginBottom: spacing.sm },
  row: { marginBottom: 0 },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  avatar: { width: 52, height: 52, borderRadius: 26, marginRight: spacing.md },
  avatarPlaceholder: { backgroundColor: colors.mistBlue, justifyContent: 'center', alignItems: 'center' },
  avatarText: { ...typography.h3, color: colors.slateText },
  body: { flex: 1, minWidth: 0 },
  name: { ...typography.label, color: colors.carbonText },
  preview: { ...typography.caption, color: colors.slateText },
  empty: { padding: spacing.xxl, alignItems: 'center' },
  emptyIcon: { marginBottom: spacing.sm },
  emptyText: { ...typography.body, color: colors.slateText },
});
