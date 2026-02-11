import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui';
import { colors, typography, spacing } from '../../theme';
import { api } from '../../services/api';

interface SupportMessage {
  id: string;
  body: string;
  is_admin: boolean;
  created_at: string;
}

export function SupportScreen() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [input, setInput] = useState('');
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<string>('');

  const load = async () => {
    try {
      const { data } = await api.get<{ data: { ticket: { status: string }; messages: SupportMessage[] } }>(
        '/support/conversation'
      );
      setMessages(data?.data?.messages ?? []);
      setStatus(data?.data?.ticket?.status ?? '');
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const send = async () => {
    const body = input.trim();
    if (!body || sending) return;
    setInput('');
    const sub = subject.trim() || undefined;
    if (sub) setSubject('');
    setSending(true);
    try {
      await api.post('/support/messages', { body, subject: sub });
      await load();
    } catch (_) {}
    setSending(false);
  };

  const statusLabel = status === 'open' ? t('support.open') : status === 'replied' ? t('support.replied') : t('support.closed');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.status}>{t('support.status')}: {statusLabel}</Text>
      </View>
      {loading ? (
        <View style={styles.centered}>
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View style={[styles.bubble, item.is_admin ? styles.bubbleAdmin : styles.bubbleUser]}>
                <Text style={styles.msgText}>{item.body}</Text>
                <Text style={styles.time}>
                  {new Date(item.created_at).toLocaleString()}
                  {item.is_admin ? ` • ${t('support.support_label')}` : ''}
                </Text>
              </View>
            )}
          />
          <View style={styles.footer}>
            {messages.length === 0 && (
              <TextInput
                style={styles.subjectInput}
                placeholder={t('support.subject_placeholder')}
                placeholderTextColor={colors.slateText}
                value={subject}
                onChangeText={setSubject}
              />
            )}
            <View style={styles.footerRow}>
              <TextInput
                style={styles.input}
                placeholder={t('support.placeholder')}
                placeholderTextColor={colors.slateText}
                value={input}
                onChangeText={setInput}
                multiline
              />
              <Button title={t('support.send')} onPress={send} loading={sending} disabled={!input.trim()} />
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.mistBlue },
  header: { padding: spacing.md, backgroundColor: colors.cleanWhite, borderBottomWidth: 1, borderColor: colors.outlineGrey },
  status: { ...typography.label, color: colors.carbonText },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { ...typography.body, color: colors.slateText },
  list: { padding: spacing.md },
  bubble: { padding: spacing.md, borderRadius: 12, marginBottom: spacing.sm, maxWidth: '85%' },
  bubbleUser: { alignSelf: 'flex-end', backgroundColor: colors.electricAzure },
  bubbleAdmin: { alignSelf: 'flex-start', backgroundColor: colors.cleanWhite, borderWidth: 1, borderColor: colors.outlineGrey },
  msgText: { ...typography.body, color: colors.carbonText },
  time: { ...typography.caption, color: colors.slateText, marginTop: spacing.xxs },
  footer: { padding: spacing.md, backgroundColor: colors.cleanWhite },
  subjectInput: { ...typography.body, color: colors.carbonText, padding: spacing.sm, borderWidth: 1, borderColor: colors.outlineGrey, borderRadius: 8, marginBottom: spacing.sm },
  footerRow: { flexDirection: 'row', gap: spacing.sm },
  input: { flex: 1, ...typography.body, color: colors.carbonText, padding: spacing.sm, borderWidth: 1, borderColor: colors.outlineGrey, borderRadius: 8 },
});
