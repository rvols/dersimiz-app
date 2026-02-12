import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card } from '../../components/ui';
import { SafeTopView } from '../../components/SafeTopView';
import { useToast } from '../../contexts/ToastContext';
import { colors, typography, spacing } from '../../theme';
import { api, getApiErrorMessage, getApiErrorCode } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

type Props = NativeStackScreenProps<AuthStackParamList, 'OTPVerification'>;

export function OTPVerificationScreen({ route, navigation }: Props) {
  const { phoneNumber, countryCode } = route.params;
  const { t } = useTranslation();
  const toast = useToast();
  const login = useAuthStore((s) => s.login);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [sessionToken, setSessionToken] = useState<string | undefined>(() => route.params.sessionToken);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (route.params.sessionToken) setSessionToken(route.params.sessionToken);
  }, [route.params.sessionToken]);

  useEffect(() => {
    let t: ReturnType<typeof setInterval>;
    if (resendSeconds > 0) {
      t = setInterval(() => setResendSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    }
    return () => clearInterval(t);
  }, [resendSeconds]);

  const handleVerify = async () => {
    Keyboard.dismiss();
    if (otp.length !== OTP_LENGTH) return;
    setError(null);
    setLoading(true);
    try {
      const result = await login({
        phone_number: phoneNumber,
        otp_code: otp,
        country_code: countryCode,
        session_token: sessionToken,
      });
      const rootNav = navigation.getParent() as { dispatch?: (a: unknown) => void } | undefined;
      const dispatch = rootNav?.dispatch;
      if (result.requires_legal_accept) {
        navigation.replace('LegalAgreements');
        return;
      }
      if (result.is_new_user) {
        navigation.replace('RoleSelection');
        return;
      }
      if (!result.user.onboarding_completed) {
        dispatch?.(CommonActions.reset({ index: 0, routes: [{ name: 'Onboarding' }] }));
        return;
      }
      dispatch?.(CommonActions.reset({ index: 0, routes: [{ name: 'Main' }] }));
    } catch (err: unknown) {
      const code = getApiErrorCode(err);
      const msg = getApiErrorMessage(err);
      setError(msg);
      toast.showError(msg);
      if (code === 'INVALID_OTP' || code === 'EXPIRED_OTP') setOtp('');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendSeconds > 0) return;
    setError(null);
    try {
      const { data } = await api.post<{ data?: { session_token?: string } }>('/auth/request-otp', {
        phone_number: phoneNumber,
        country_code: countryCode,
      });
      if (data?.data?.session_token) setSessionToken(data.data.session_token);
      setResendSeconds(RESEND_COOLDOWN);
    } catch (err: unknown) {
      toast.showError(getApiErrorMessage(err));
    }
  };

  // Do not auto-submit on 6 digits to avoid stale closure / race on first try

  const maskedPhone = phoneNumber.slice(-4).padStart(phoneNumber.length, '*');

  return (
    <SafeTopView>
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconWrap}>
            <Ionicons name="shield-checkmark" size={40} color={colors.electricAzure} />
          </View>
          <Text style={styles.title}>{t('auth.otp_title')}</Text>
          <Text style={styles.subtitle}>{t('auth.otp_subtitle', { phone: maskedPhone })}</Text>
          <Card style={styles.card}>
            <TextInput
              ref={inputRef}
              style={styles.otpInput}
              value={otp}
              onChangeText={(text) => setOtp(text.replace(/\D/g, '').slice(0, OTP_LENGTH))}
              keyboardType="number-pad"
              maxLength={OTP_LENGTH}
              placeholder="000000"
              placeholderTextColor={colors.slateText}
              autoFocus
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button
              title={t('auth.verify')}
              onPress={handleVerify}
              loading={loading}
              disabled={otp.length !== OTP_LENGTH}
              fullWidth
              style={styles.button}
            />
          </Card>
          <TouchableOpacity onPress={() => navigation.replace('PhoneInput')} style={styles.editPhone}>
            <Text style={styles.editPhoneText}>{t('auth.edit_phone')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleResend} disabled={resendSeconds > 0} style={styles.resend}>
            <Text style={[styles.resendText, resendSeconds > 0 && styles.resendDisabled]}>
              {resendSeconds > 0 ? t('auth.resend_in', { seconds: resendSeconds }) : t('auth.resend')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
    </SafeTopView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.mistBlue, justifyContent: 'center' },
  content: { padding: spacing.xl, maxWidth: 400, width: '100%', alignSelf: 'center' },
  iconWrap: { alignItems: 'center', marginBottom: spacing.sm },
  title: { ...typography.h1, color: colors.carbonText, textAlign: 'center', marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.slateText, textAlign: 'center', marginBottom: spacing.lg },
  card: { marginBottom: spacing.md },
  otpInput: {
    ...typography.h2,
    color: colors.carbonText,
    backgroundColor: colors.mistBlue,
    borderWidth: 1,
    borderColor: colors.outlineGrey,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    letterSpacing: 8,
    textAlign: 'center',
  },
  error: { ...typography.caption, color: colors.alertCoral, marginBottom: spacing.sm },
  button: { marginBottom: 0 },
  editPhone: { alignSelf: 'center', marginBottom: spacing.xs },
  editPhoneText: { ...typography.body, color: colors.electricAzure },
  resend: { alignSelf: 'center' },
  resendText: { ...typography.body, color: colors.electricAzure },
  resendDisabled: { color: colors.slateText },
});
