import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/ui';
import { SafeTopView } from '../../components/SafeTopView';
import { colors, typography, spacing } from '../../theme';
import { useAuthStore } from '../../store/useAuthStore';
import type { UserRole } from '../../types/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'RoleSelection'>;

export function RoleSelectionScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const updateProfile = useAuthStore((s) => s.updateProfile);

  const selectRole = async (role: UserRole) => {
    await updateProfile({ role });
    const parent = navigation.getParent();
    (parent as { reset?: (o: { routes: { name: string }[] }) => void })?.reset?.({ routes: [{ name: 'Onboarding' }] });
  };

  return (
    <SafeTopView>
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('role.title')}</Text>
        <Text style={styles.subtitle}>{t('role.subtitle')}</Text>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => selectRole('tutor')}
          style={styles.cardWrap}
        >
          <Card style={[styles.card, styles.cardTutor]}>
            <View style={styles.cardIconWrap}>
              <Ionicons name="school" size={28} color={colors.calmTeal} />
            </View>
            <Text style={styles.cardTitle}>{t('role.tutor')}</Text>
            <Text style={styles.cardDesc}>{t('role.tutor_desc')}</Text>
          </Card>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => selectRole('student')}
          style={styles.cardWrap}
        >
          <Card style={[styles.card, styles.cardStudent]}>
            <View style={[styles.cardIconWrap, styles.cardIconStudent]}>
              <Ionicons name="person" size={28} color={colors.sparkOrange} />
            </View>
            <Text style={[styles.cardTitle, styles.cardTitleStudent]}>{t('role.student')}</Text>
            <Text style={styles.cardDesc}>{t('role.student_desc')}</Text>
          </Card>
        </TouchableOpacity>
      </View>
    </View>
    </SafeTopView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.mistBlue, justifyContent: 'center' },
  content: { padding: spacing.xl, maxWidth: 400, width: '100%', alignSelf: 'center' },
  title: { ...typography.h1, color: colors.carbonText, textAlign: 'center', marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.slateText, textAlign: 'center', marginBottom: spacing.xl },
  cardWrap: { marginBottom: spacing.md },
  card: { padding: spacing.xl, alignItems: 'center' },
  cardTutor: { borderLeftWidth: 4, borderLeftColor: colors.calmTeal },
  cardStudent: { borderLeftWidth: 4, borderLeftColor: colors.sparkOrange },
  cardIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.mistBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  cardIconStudent: { backgroundColor: colors.sparkOrange + '20' },
  cardTitle: { ...typography.h3, color: colors.calmTeal, marginBottom: spacing.xs },
  cardTitleStudent: { color: colors.sparkOrange },
  cardDesc: { ...typography.body, color: colors.slateText, textAlign: 'center' },
});
