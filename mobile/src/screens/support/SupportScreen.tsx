import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { Button } from '../../components/ui';
import { colors, typography, spacing } from '../../theme';
import { api } from '../../services/api';
import { useSupportUnreadStore } from '../../store/useSupportUnreadStore';

interface SupportTicket {
  id: string;
  status: string;
  subject: string;
  created_at: string;
  updated_at: string;
  last_message_preview?: string | null;
}

interface SupportMessage {
  id: string;
  body: string;
  is_admin: boolean;
  created_at: string;
}

export function SupportScreen() {
  const { t } = useTranslation();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [createSubject, setCreateSubject] = useState('');
  const [createBody, setCreateBody] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const markRead = useSupportUnreadStore((s) => s.markRead);

  const loadTickets = useCallback(async () => {
    try {
      const { data } = await api.get<{ data: { tickets: SupportTicket[] } }>('/support/tickets');
      setTickets(data?.data?.tickets ?? []);
    } catch (_) {}
    setLoading(false);
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const setOnSupportScreen = useSupportUnreadStore((s) => s.setOnSupportScreen);
  useEffect(() => {
    setOnSupportScreen(true);
    return () => setOnSupportScreen(false);
  }, [setOnSupportScreen]);

  useFocusEffect(
    React.useCallback(() => {
      markRead();
    }, [markRead])
  );

  const loadTicketMessages = useCallback(async (ticketId: string) => {
    try {
      const { data } = await api.get<{ data: { ticket: { status: string }; messages: SupportMessage[] } }>(
        `/support/tickets/${ticketId}`
      );
      const msgs = Array.isArray(data?.data?.messages) ? data.data.messages : [];
      setMessages(msgs);
      setSelectedTicket((prev) => (prev ? { ...prev, status: data?.data?.ticket?.status ?? prev.status } : null));
      return msgs;
    } catch (_) {
      return [];
    }
  }, []);

  const openTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    loadTicketMessages(ticket.id);
  };

  // Poll for new messages when ticket is open (instant messaging)
  useEffect(() => {
    if (!selectedTicket?.id) return;
    const ticketId = selectedTicket.id;
    const interval = setInterval(() => loadTicketMessages(ticketId), 3000);
    return () => clearInterval(interval);
  }, [selectedTicket?.id, loadTicketMessages]);

  const createTicket = async () => {
    const sub = createSubject.trim();
    if (!sub) return;
    setCreateLoading(true);
    try {
      const { data } = await api.post<{ data: { ticket: SupportTicket } }>('/support/tickets', {
        subject: sub,
        body: createBody.trim() || undefined,
      });
      if (data?.data?.ticket) {
        setCreateModal(false);
        setCreateSubject('');
        setCreateBody('');
        setTickets((prev) => [data.data.ticket, ...prev]);
        openTicket(data.data.ticket);
      }
    } catch (_) {}
    setCreateLoading(false);
  };

  const sendMessage = async () => {
    if (!selectedTicket || !input.trim() || sending) return;
    const body = input.trim();
    setInput('');
    setSending(true);
    try {
      const { data } = await api.post<{ data: { message: SupportMessage } }>(
        `/support/tickets/${selectedTicket.id}/messages`,
        { body }
      );
      if (data?.data?.message) {
        setMessages((prev) => [...prev, data.data.message]);
      }
      loadTickets();
    } catch (_) {}
    setSending(false);
  };

  const updateStatus = async (status: string) => {
    if (!selectedTicket) return;
    setStatusUpdating(true);
    try {
      await api.put(`/support/tickets/${selectedTicket.id}/status`, { status });
      setSelectedTicket((prev) => (prev ? { ...prev, status } : null));
      loadTickets();
    } catch (_) {}
    setStatusUpdating(false);
  };

  const statusLabel = (s: string) =>
    s === 'open' ? t('support.open') : s === 'replied' ? t('support.replied') : t('support.closed');

  const subjectLabel = (subject: string) =>
    subject === 'Approval process' ? t('support.subject_approval_process') : subject;

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  if (selectedTicket) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedTicket(null)}>
            <Text style={styles.backBtn}>← {t('common.back')}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{subjectLabel(selectedTicket.subject)}</Text>
          <Text style={styles.statusText}>{statusLabel(selectedTicket.status)}</Text>
          {selectedTicket.status !== 'closed' && (
            <TouchableOpacity
              onPress={() => updateStatus('closed')}
              disabled={statusUpdating}
              style={styles.closeTicketBtn}
            >
              <Text style={styles.closeTicketText}>{t('support.close_ticket')}</Text>
            </TouchableOpacity>
          )}
        </View>
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.is_admin ? styles.bubbleAdmin : styles.bubbleUser]}>
              <Text style={item.is_admin ? styles.msgText : styles.msgTextUser}>{item.body}</Text>
              <Text style={item.is_admin ? styles.time : styles.timeUser}>
                {new Date(item.created_at).toLocaleString()}
                {item.is_admin ? ` • ${t('support.support_label')}` : ''}
              </Text>
            </View>
          )}
        />
        {selectedTicket.status !== 'closed' && (
          <View style={styles.footer}>
            <TextInput
              style={styles.input}
              placeholder={t('support.placeholder')}
              placeholderTextColor={colors.slateText}
              value={input}
              onChangeText={setInput}
              multiline
            />
            <Button title={t('support.send')} onPress={sendMessage} loading={sending} disabled={!input.trim()} />
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('support.title')}</Text>
        <Button title={t('support.new_ticket')} onPress={() => setCreateModal(true)} />
      </View>
      {tickets.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{t('support.no_tickets')}</Text>
          <Button title={t('support.new_ticket')} onPress={() => setCreateModal(true)} style={styles.emptyBtn} />
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.ticketRow} onPress={() => openTicket(item)} activeOpacity={0.85}>
              <View style={styles.ticketContent}>
                <Text style={styles.ticketSubject} numberOfLines={1}>{subjectLabel(item.subject)}</Text>
                <Text style={styles.ticketPreview} numberOfLines={1}>
                  {item.last_message_preview || t('support.no_messages')}
                </Text>
                <View style={styles.ticketMeta}>
                  <Text style={[styles.ticketStatus, item.status === 'open' && styles.statusOpen, item.status === 'replied' && styles.statusReplied, item.status === 'closed' && styles.statusClosed]}>
                    {statusLabel(item.status)}
                  </Text>
                  <Text style={styles.ticketDate}>{new Date(item.updated_at).toLocaleDateString()}</Text>
                </View>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          )}
        />
      )}

      <Modal visible={createModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{t('support.new_ticket')}</Text>
            <Text style={styles.requiredHint}>{t('support.subject_required')}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder={t('support.subject_placeholder')}
              placeholderTextColor={colors.slateText}
              value={createSubject}
              onChangeText={setCreateSubject}
            />
            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              placeholder={t('support.placeholder')}
              placeholderTextColor={colors.slateText}
              value={createBody}
              onChangeText={setCreateBody}
              multiline
              numberOfLines={4}
            />
            <View style={styles.modalActions}>
              <Button title={t('common.cancel')} variant="outline" onPress={() => setCreateModal(false)} style={styles.modalBtn} />
              <Button
                title={createLoading ? t('common.loading') : t('support.create')}
                onPress={createTicket}
                loading={createLoading}
                disabled={!createSubject.trim()}
                style={styles.modalBtn}
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
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { ...typography.body, color: colors.slateText },
  header: { padding: spacing.md, backgroundColor: colors.cleanWhite, borderBottomWidth: 1, borderColor: colors.outlineGrey, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: spacing.sm },
  backBtn: { ...typography.label, color: colors.electricAzure },
  headerTitle: { ...typography.h3, color: colors.carbonText, flex: 1 },
  statusText: { ...typography.caption, color: colors.slateText },
  closeTicketBtn: { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  closeTicketText: { ...typography.caption, color: colors.alertCoral },
  list: { padding: spacing.md },
  ticketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.cleanWhite,
    borderRadius: 12,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.outlineGrey,
  },
  ticketContent: { flex: 1, minWidth: 0 },
  ticketSubject: { ...typography.label, color: colors.carbonText },
  ticketPreview: { ...typography.caption, color: colors.slateText, marginTop: spacing.xxs },
  ticketMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  ticketStatus: { ...typography.caption, fontWeight: '600' },
  statusOpen: { color: colors.warmGold },
  statusReplied: { color: colors.electricAzure },
  statusClosed: { color: colors.slateText },
  ticketDate: { ...typography.caption, color: colors.slateText },
  chevron: { ...typography.h3, color: colors.slateText },
  bubble: { padding: spacing.md, borderRadius: 12, marginBottom: spacing.sm, maxWidth: '85%' },
  bubbleUser: { alignSelf: 'flex-end', backgroundColor: colors.electricAzure },
  bubbleAdmin: {
    alignSelf: 'flex-start',
    backgroundColor: colors.cleanWhite,
    borderWidth: 1,
    borderColor: colors.outlineGrey,
    shadowColor: colors.carbonText,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  msgText: { ...typography.body, color: colors.carbonText },
  msgTextUser: { ...typography.body, color: colors.cleanWhite },
  time: { ...typography.caption, color: colors.slateText, marginTop: spacing.xxs },
  timeUser: { ...typography.caption, color: 'rgba(255,255,255,0.85)', marginTop: spacing.xxs },
  footer: { padding: spacing.md, backgroundColor: colors.cleanWhite, flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end' },
  input: { flex: 1, ...typography.body, color: colors.carbonText, padding: spacing.sm, borderWidth: 1, borderColor: colors.outlineGrey, borderRadius: 8 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  emptyText: { ...typography.body, color: colors.slateText, marginBottom: spacing.md },
  emptyBtn: { minWidth: 200 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', justifyContent: 'center', padding: spacing.lg },
  modalBox: { backgroundColor: colors.cleanWhite, borderRadius: 16, padding: spacing.lg },
  modalTitle: { ...typography.h3, color: colors.carbonText, marginBottom: spacing.sm },
  requiredHint: { ...typography.caption, color: colors.slateText, marginBottom: spacing.xs },
  modalInput: { ...typography.body, borderWidth: 1, borderColor: colors.outlineGrey, borderRadius: 12, padding: spacing.sm, marginBottom: spacing.md },
  modalTextArea: { minHeight: 80 },
  modalActions: { flexDirection: 'row', gap: spacing.sm },
  modalBtn: { flex: 1 },
});
