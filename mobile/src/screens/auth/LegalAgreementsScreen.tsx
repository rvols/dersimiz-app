import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import Markdown from 'react-native-markdown-display';
import { Button, Card } from '../../components/ui';
import { SafeTopView } from '../../components/SafeTopView';
import { useToast } from '../../contexts/ToastContext';
import { colors, typography, spacing } from '../../theme';
import { api, getApiErrorMessage } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import type { LegalDocument } from '../../types/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'LegalAgreements'>;

export function LegalAgreementsScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const toast = useToast();
  const user = useAuthStore((s) => s.user);
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  // Fetches documents user must accept. Backend returns docs when user has not accepted or when a new version exists (re-approval).
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get<{ data: { required_documents: LegalDocument[] } }>('/legal/required');
        if (mounted && data?.data?.required_documents?.length) {
          setDocuments(data.data.required_documents);
        } else if (mounted) {
          redirect();
        }
      } catch {
        if (mounted) redirect();
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  function redirect() {
    const parent = navigation.getParent() as { reset?: (o: { routes: { name: string }[] }) => void } | undefined;
    if (!user) {
      navigation.replace('PhoneInput');
      return;
    }
    if (!user.role) {
      navigation.replace('RoleSelection');
      return;
    }
    if (!user.onboarding_completed) {
      parent?.reset?.({ routes: [{ name: 'Onboarding' }] });
      return;
    }
    parent?.reset?.({ routes: [{ name: 'Main' }] });
  }

  const handleAcceptAll = async () => {
    if (!documents.length) {
      redirect();
      return;
    }
    setAccepting(true);
    try {
      await api.post('/legal/accept', {
        document_ids: documents.map((d) => d.id),
      });
      redirect();
    } catch (err) {
      toast.showError(getApiErrorMessage(err));
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <SafeTopView>
        <View style={styles.centered}>
          <Text style={styles.loading}>{t('common.loading')}</Text>
        </View>
      </SafeTopView>
    );
  }

  if (documents.length === 0) {
    return null;
  }

  return (
    <SafeTopView>
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>{t('legal.title')}</Text>
        <Text style={styles.subtitle}>{t('legal.subtitle')}</Text>
        {documents.map((doc) => (
          <Card key={doc.id} style={styles.card}>
            <Text style={styles.docTitle}>{doc.title}</Text>
            <Text style={styles.version}>{t('legal.version', { version: doc.version })}</Text>
            {doc.body_markdown?.trim() ? (
              <View style={styles.markdownWrap}>
                <Markdown style={styles.markdown}>{doc.body_markdown}</Markdown>
              </View>
            ) : (
              <Text style={styles.noContent}>{t('legal.no_content')}</Text>
            )}
          </Card>
        ))}
        <Button
          title={t('legal.accept_all')}
          onPress={handleAcceptAll}
          loading={accepting}
          fullWidth
          style={styles.button}
        />
      </ScrollView>
    </View>
    </SafeTopView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.mistBlue },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.mistBlue },
  loading: { ...typography.body, color: colors.slateText },
  scroll: { flex: 1 },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    flexGrow: 0,
  },
  title: { ...typography.h2, color: colors.carbonText, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.slateText, marginBottom: spacing.lg },
  card: {
    marginBottom: spacing.md,
    alignSelf: 'stretch',
  },
  docTitle: { ...typography.h3, color: colors.carbonText, marginBottom: spacing.xxs },
  version: { ...typography.caption, color: colors.slateText, marginBottom: spacing.sm },
  markdownWrap: {
    flexShrink: 0,
  },
  markdown: {
    body: { ...typography.body, color: colors.carbonText, flexShrink: 0 },
    paragraph: { ...typography.body, color: colors.carbonText, marginTop: 0, marginBottom: spacing.sm },
    heading1: { ...typography.h1, color: colors.carbonText, marginTop: spacing.md, marginBottom: spacing.sm },
    heading2: { ...typography.h2, color: colors.carbonText, marginTop: spacing.md, marginBottom: spacing.xs },
    heading3: { ...typography.h3, color: colors.carbonText, marginTop: spacing.sm, marginBottom: spacing.xs },
    heading4: { ...typography.h3, fontSize: 16, color: colors.carbonText, marginTop: spacing.sm, marginBottom: spacing.xs },
    heading5: { ...typography.label, color: colors.carbonText, marginTop: spacing.sm, marginBottom: spacing.xxs },
    heading6: { ...typography.label, fontSize: 13, color: colors.slateText, marginTop: spacing.xs, marginBottom: spacing.xxs },
    strong: { ...typography.body, fontWeight: '700' as const, color: colors.carbonText },
    em: { ...typography.body, fontStyle: 'italic', color: colors.carbonText },
    link: { ...typography.body, color: colors.electricAzure },
    list_item: { ...typography.body, color: colors.carbonText, marginBottom: spacing.xxs },
    blockquote: { ...typography.body, color: colors.slateText, borderLeftWidth: 4, borderLeftColor: colors.outlineGrey, paddingLeft: spacing.sm, marginVertical: spacing.sm },
    code_inline: { ...typography.body, fontSize: 13, backgroundColor: colors.mistBlue, paddingHorizontal: spacing.xxs },
    hr: { backgroundColor: colors.outlineGrey, height: 1, marginVertical: spacing.md },
  },
  noContent: { ...typography.body, color: colors.slateText, fontStyle: 'italic' },
  button: { marginTop: spacing.lg },
});
