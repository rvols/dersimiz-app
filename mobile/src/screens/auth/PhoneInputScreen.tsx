import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input, Card } from '../../components/ui';
import { SafeTopView } from '../../components/SafeTopView';
import { useToast } from '../../contexts/ToastContext';
import { useLocaleStore } from '../../store/useLocaleStore';
import { changeLanguage } from '../../i18n';
import { colors, typography, spacing } from '../../theme';
import { api, getApiErrorMessage, getApiErrorCode } from '../../services/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'PhoneInput'>;

const defaultCountryCode = 'TR';
const defaultPhonePrefix = '+90';
// Turkish mobile: 10 digits (5xx xxx xx xx)
const PHONE_NATIONAL_LENGTH = 10;
const PHONE_REGEX = /^\d{10}$/;

/** Format 10 digits as 505 123 45 67 */
function formatPhoneMask(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(0, PHONE_NATIONAL_LENGTH);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  if (d.length <= 8) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8, 10)}`;
}

export function PhoneInputScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const toast = useToast();
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

  const handleLanguageSelect = async (next: 'en' | 'tr') => {
    await setLocale(next);
    changeLanguage(next);
  };

  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const digitsOnly = phone.replace(/\D/g, '').slice(0, PHONE_NATIONAL_LENGTH);
  const e164 = defaultPhonePrefix + digitsOnly;

  const handleSendCode = async () => {
    if (!PHONE_REGEX.test(digitsOnly)) {
      setError(t('auth.phone_invalid'));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await api.post<{ success?: boolean; data?: { session_token?: string; message?: string }; session_token?: string }>('/auth/request-otp', {
        phone_number: e164,
        country_code: defaultCountryCode,
      });
      const body = res.data;
      const sessionToken = body?.data?.session_token ?? body?.session_token ?? undefined;
      navigation.replace('OTPVerification', {
        phoneNumber: e164,
        countryCode: defaultCountryCode,
        sessionToken,
      });
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err);
      toast.showError(msg);
      if (getApiErrorCode(err) !== 'TOO_MANY_ATTEMPTS') setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeTopView>
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <View style={styles.content}>
        <View style={styles.langRow}>
          <TouchableOpacity
            onPress={() => handleLanguageSelect('en')}
            style={[styles.langBtn, locale === 'en' && styles.langBtnActive]}
          >
            <Text style={[styles.langBtnText, locale === 'en' && styles.langBtnTextActive]}>{t('settings.language_english')}</Text>
          </TouchableOpacity>
          <View style={styles.langDivider} />
          <TouchableOpacity
            onPress={() => handleLanguageSelect('tr')}
            style={[styles.langBtn, locale === 'tr' && styles.langBtnActive]}
          >
            <Text style={[styles.langBtnText, locale === 'tr' && styles.langBtnTextActive]}>{t('settings.language_turkish')}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.iconWrap}>
          <Ionicons name="chatbubble-ellipses" size={40} color={colors.electricAzure} />
        </View>
        <Text style={styles.title}>{t('auth.phone_title')}</Text>
        <Text style={styles.subtitle}>{t('auth.phone_subtitle', { defaultValue: 'We’ll send you a verification code.' })}</Text>
        <Card style={styles.card}>
          <View style={styles.phoneRow}>
            <View style={styles.countryCodeWrap}>
              <Text style={styles.countryCode}>{defaultPhonePrefix}</Text>
            </View>
            <Input
              label=""
              placeholder={t('auth.phone_placeholder')}
              value={formatPhoneMask(digitsOnly)}
              onChangeText={(text) => {
                const next = text.replace(/\D/g, '').slice(0, PHONE_NATIONAL_LENGTH);
                setPhone(next);
                setError(null);
              }}
              keyboardType="phone-pad"
              maxLength={13}
              error={error || undefined}
              containerStyle={styles.phoneInputWrap}
            />
          </View>
          <Button
            title={t('auth.send_code')}
            onPress={handleSendCode}
            loading={loading}
            fullWidth
            style={styles.button}
          />
        </Card>
      </View>
    </KeyboardAvoidingView>
    </SafeTopView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.mistBlue,
    justifyContent: 'center',
  },
  content: {
    padding: spacing.xl,
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: spacing.lg,
    backgroundColor: colors.cleanWhite,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineGrey,
    overflow: 'hidden',
  },
  langBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
  langBtnActive: { backgroundColor: colors.mistBlue },
  langBtnText: { ...typography.label, color: colors.slateText },
  langBtnTextActive: { ...typography.label, color: colors.electricAzure },
  langDivider: { width: 1, height: 20, backgroundColor: colors.outlineGrey },
  iconWrap: { alignItems: 'center', marginBottom: spacing.md },
  title: { ...typography.h1, color: colors.carbonText, textAlign: 'center', marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.slateText, textAlign: 'center', marginBottom: spacing.lg },
  card: { marginBottom: spacing.lg },
  phoneRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  countryCodeWrap: {
    height: 52,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    marginRight: spacing.xs,
  },
  countryCode: { ...typography.body, fontSize: 16, color: colors.carbonText },
  phoneInputWrap: { flex: 1, marginBottom: 0 },
  button: { marginTop: spacing.xs },
});
