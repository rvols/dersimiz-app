import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../contexts/ToastContext';
import { colors, typography, spacing } from '../../theme';
import { api, getApiErrorCode, getApiErrorMessage } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import type { Message } from '../../types/api';
import type { LessonType } from '../../types/api';

export function ChatThreadScreen({
  route,
  navigation,
}: {
  route: { params: { conversationId: string; otherName: string } };
  navigation: unknown;
}) {
  const { conversationId, otherName } = route.params;
  const { t } = useTranslation();
  const toast = useToast();
  const userId = useAuthStore((s) => s.user?.id);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [lessonTypes, setLessonTypes] = useState<LessonType[]>([]);
  const [demoModal, setDemoModal] = useState(false);
  const [demoLessonTypeId, setDemoLessonTypeId] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    api.get<{ data: { lesson_types: LessonType[] } }>('/onboarding/data').then((r) => {
      setLessonTypes(r.data?.data?.lesson_types ?? []);
    }).catch(() => {});
  }, []);

  const loadMessages = async () => {
    try {
      const { data } = await api.get<{ data: { messages: Message[]; has_more: boolean } }>(
        `/chat/conversations/${conversationId}/messages`,
        { params: { limit: 50 } }
      );
      setMessages(data?.data?.messages ?? []);
      await api.post(`/chat/conversations/${conversationId}/read`);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    loadMessages();
  }, [conversationId]);

  const shareContact = async () => {
    setShareLoading(true);
    try {
      const { data } = await api.post<{ data: { message: Message } }>(
        `/chat/conversations/${conversationId}/share-contact`,
        {}
      );
      if (data?.data?.message) setMessages((prev) => [...prev, data.data.message]);
    } catch (_) {}
    setShareLoading(false);
  };

  const sendDemoRequest = async () => {
    setDemoLoading(true);
    try {
      const { data } = await api.post<{ data: { message: Message } }>(
        `/chat/conversations/${conversationId}/demo-request`,
        { lesson_type_id: demoLessonTypeId || undefined, preferred_times: [] }
      );
      if (data?.data?.message) setMessages((prev) => [...prev, data.data.message]);
      setDemoModal(false);
      setDemoLessonTypeId('');
    } catch (_) {}
    setDemoLoading(false);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setSending(true);
    try {
      const { data } = await api.post<{ data: { message: Message } }>(
        `/chat/conversations/${conversationId}/messages`,
        { type: 'text', content: text }
      );
      if (data?.data?.message) setMessages((prev) => [...prev, data.data.message]);
    } catch (err: unknown) {
      const msg = getApiErrorCode(err) === 'CONTENT_BLOCKED' ? t('chat.content_blocked') : getApiErrorMessage(err);
      toast.showError(msg);
      if (getApiErrorCode(err) !== 'CONTENT_BLOCKED') setInput(text);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.sender_id === userId;
    if (item.type === 'contact_share') {
      return (
        <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowThem]}>
          <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
            <Text style={styles.systemText}>{t('chat.contact_shared')}</Text>
            {item.payload && typeof (item.payload as { phone_number?: string }).phone_number === 'string' && (
              <Text style={styles.caption}>{(item.payload as { phone_number: string }).phone_number}</Text>
            )}
          </View>
        </View>
      );
    }
    if (item.type === 'demo_request') {
      return (
        <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowThem]}>
          <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
            <Text style={styles.systemText}>{t('chat.demo_request')}</Text>
          </View>
        </View>
      );
    }
    return (
      <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowThem]}>
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
          <Text style={[styles.msgText, isMe && styles.msgTextMe]}>{item.content ?? ''}</Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {loading ? (
        <View style={styles.centered}>
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      ) : (
        <>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.list}
            ListFooterComponent={<View style={{ height: spacing.md }} />}
          />
          <View style={styles.actions}>
            <TouchableOpacity onPress={shareContact} disabled={shareLoading} style={styles.actionBtn}>
              <Text style={styles.actionText}>{shareLoading ? t('common.loading') : t('chat.share_contact')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setDemoModal(true)} disabled={demoLoading} style={styles.actionBtn}>
              <Text style={styles.actionText}>{t('chat.request_demo')}</Text>
            </TouchableOpacity>
          </View>
          {demoModal && (
            <View style={styles.modalOverlay}>
              <View style={styles.modalBox}>
                <Text style={styles.modalTitle}>{t('chat.request_demo')}</Text>
                {lessonTypes.slice(0, 6).map((lt) => (
                  <TouchableOpacity
                    key={lt.id}
                    onPress={() => setDemoLessonTypeId(demoLessonTypeId === lt.id ? '' : lt.id)}
                    style={[styles.lessonChip, demoLessonTypeId === lt.id && styles.lessonChipActive]}
                  >
                    <Text style={demoLessonTypeId === lt.id ? styles.lessonChipTextActive : styles.lessonChipText}>
                      {lt.name?.tr ?? lt.name?.en ?? lt.slug}
                    </Text>
                  </TouchableOpacity>
                ))}
                <View style={styles.modalActions}>
                  <TouchableOpacity onPress={() => { setDemoModal(false); setDemoLessonTypeId(''); }} style={styles.modalBtn}>
                    <Text style={styles.modalBtnText}>{t('common.cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={sendDemoRequest} disabled={demoLoading} style={styles.modalBtn}>
                    <Text style={[styles.modalBtnText, styles.modalBtnPrimary]}>{demoLoading ? t('common.loading') : t('chat.send')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          <View style={styles.footer}>
            <TextInput
              style={styles.input}
              placeholder={t('chat.type_message')}
              placeholderTextColor={colors.slateText}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={2000}
              onSubmitEditing={sendMessage}
            />
            <TouchableOpacity
              onPress={sendMessage}
              disabled={!input.trim() || sending}
              style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
            >
              <Text style={styles.sendText}>{t('chat.send')}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.mistBlue },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { ...typography.body, color: colors.slateText },
  list: { padding: spacing.md },
  msgRow: { flexDirection: 'row', marginVertical: spacing.xxs },
  msgRowMe: { justifyContent: 'flex-end' },
  msgRowThem: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '80%',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 16,
  },
  bubbleMe: { backgroundColor: colors.electricAzure },
  bubbleThem: { backgroundColor: colors.cleanWhite, borderWidth: 1, borderColor: colors.outlineGrey },
  msgText: { ...typography.body, color: colors.carbonText },
  msgTextMe: { color: colors.cleanWhite },
  systemText: { ...typography.caption, color: colors.slateText },
  caption: { ...typography.caption, color: colors.slateText, marginTop: spacing.xxs },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.sm,
    backgroundColor: colors.cleanWhite,
    borderTopWidth: 1,
    borderColor: colors.outlineGrey,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.carbonText,
    backgroundColor: colors.mistBlue,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxHeight: 100,
    marginRight: spacing.sm,
  },
  sendBtn: {
    backgroundColor: colors.electricAzure,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendText: { ...typography.label, color: colors.cleanWhite },
  actions: { flexDirection: 'row', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, backgroundColor: colors.cleanWhite, borderTopWidth: 1, borderColor: colors.outlineGrey, gap: spacing.sm },
  actionBtn: { paddingVertical: spacing.xs },
  actionText: { ...typography.caption, color: colors.electricAzure },
  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.lg },
  modalBox: { backgroundColor: colors.cleanWhite, borderRadius: 16, padding: spacing.lg },
  modalTitle: { ...typography.h3, color: colors.carbonText, marginBottom: spacing.md },
  lessonChip: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: 8, borderWidth: 1, borderColor: colors.outlineGrey, marginBottom: spacing.xs },
  lessonChipActive: { borderColor: colors.electricAzure, backgroundColor: colors.mistBlue },
  lessonChipText: { ...typography.body, color: colors.carbonText },
  lessonChipTextActive: { ...typography.body, color: colors.electricAzure },
  modalActions: { flexDirection: 'row', marginTop: spacing.md, gap: spacing.sm },
  modalBtn: { flex: 1, padding: spacing.sm, alignItems: 'center' },
  modalBtnText: { ...typography.label, color: colors.slateText },
  modalBtnPrimary: { color: colors.electricAzure },
});
