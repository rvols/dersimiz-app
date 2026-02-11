import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Modal, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Card, Button, ConfirmModal } from '../../components/ui';
import { colors, typography, spacing } from '../../theme';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../services/api';
import { pickAndUploadAvatar } from '../../services/avatar';
import Constants from 'expo-constants';

export function ProfileScreen({ onSettings, onSubscription, onBoosters, onSupport, onLessons, onAvailability, onNotifications }: {
  onSettings?: () => void;
  onSubscription?: () => void;
  onBoosters?: () => void;
  onSupport?: () => void;
  onLessons?: () => void;
  onAvailability?: () => void;
  onNotifications?: () => void;
}) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const [completeness, setCompleteness] = useState<number | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editName, setEditName] = useState(user?.full_name ?? '');
  const [savingName, setSavingName] = useState(false);
  const [editSchoolModal, setEditSchoolModal] = useState(false);
  const [editSchool, setEditSchool] = useState(user?.school_name ?? '');
  const [savingSchool, setSavingSchool] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  useEffect(() => {
    if (user?.role === 'tutor') {
      api.get<{ data: { completeness?: number } }>('/profile/completeness').then((r) => {
        setCompleteness(r.data?.data?.completeness ?? null);
      }).catch(() => {});
    }
  }, [user?.role]);

  const handleAvatarPress = async () => {
    setAvatarLoading(true);
    try {
      await pickAndUploadAvatar();
    } catch (_) {}
    setAvatarLoading(false);
  };

  const handleSaveName = async () => {
    setSavingName(true);
    try {
      await updateProfile({ full_name: editName.trim() || undefined });
      setEditModal(false);
    } catch (_) {}
    setSavingName(false);
  };

  const handleSaveSchool = async () => {
    setSavingSchool(true);
    try {
      await updateProfile({ school_name: editSchool.trim() || null });
      setEditSchoolModal(false);
    } catch (_) {}
    setSavingSchool(false);
  };

  const handleLogout = () => setLogoutModalVisible(true);

  const handleLogoutConfirm = () => {
    setLogoutModalVisible(false);
    logout();
  };

  const isTutor = user?.role === 'tutor';

  const menuItems = [
    onSettings && { key: 'settings', label: t('settings.title'), onPress: onSettings, icon: 'settings-outline' as const },
    isTutor && onLessons && { key: 'lessons', label: t('onboarding.lessons_pricing'), onPress: onLessons, icon: 'school-outline' as const },
    isTutor && onAvailability && { key: 'availability', label: t('onboarding.availability'), onPress: onAvailability, icon: 'calendar-outline' as const },
    isTutor && onSubscription && { key: 'subscription', label: t('subscription.title'), onPress: onSubscription, icon: 'card-outline' as const },
    isTutor && onBoosters && { key: 'boosters', label: t('boosters.title'), onPress: onBoosters, icon: 'rocket-outline' as const },
    onSupport && { key: 'support', label: t('support.title'), onPress: onSupport, icon: 'help-buoy-outline' as const },
    onNotifications && { key: 'notifications', label: t('notifications.title'), onPress: onNotifications, icon: 'notifications-outline' as const },
  ].filter(Boolean) as { key: string; label: string; onPress: () => void; icon: keyof typeof Ionicons.glyphMap }[];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleAvatarPress} disabled={avatarLoading} style={styles.avatarWrap}>
          {user?.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>{user?.full_name?.charAt(0) ?? '?'}</Text>
            </View>
          )}
          <View style={styles.avatarRing} />
        </TouchableOpacity>
        <Text style={styles.editAvatarHint}>{avatarLoading ? t('common.loading') : t('profile.edit')}</Text>
        <TouchableOpacity onPress={() => { setEditName(user?.full_name ?? ''); setEditModal(true); }}>
          <Text style={styles.name}>{user?.full_name ?? '—'}</Text>
        </TouchableOpacity>
        <Text style={styles.phone}>{user?.phone_number}</Text>
        <TouchableOpacity onPress={() => { setEditSchool(user?.school_name ?? ''); setEditSchoolModal(true); }} style={styles.schoolRow}>
          <Text style={styles.schoolLabel}>{t('onboarding.school_name')}</Text>
          <Text style={styles.schoolValue}>{user?.school_name?.trim() ? user.school_name : '—'}</Text>
        </TouchableOpacity>
        {isTutor && completeness != null && (
          <View style={styles.completenessRow}>
            <Ionicons name="checkmark-circle" size={16} color={colors.calmTeal} />
            <Text style={styles.completeness}>{t('profile.completeness', { percent: completeness })}</Text>
          </View>
        )}
      </View>

      <Modal visible={editModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{t('onboarding.name')}</Text>
            <TextInput
              style={styles.modalInput}
              value={editName}
              onChangeText={setEditName}
              placeholder={t('onboarding.name')}
              placeholderTextColor={colors.slateText}
            />
            <View style={styles.modalActions}>
              <Button title={t('common.cancel')} variant="outline" onPress={() => setEditModal(false)} style={styles.modalBtn} />
              <Button title={t('common.save')} onPress={handleSaveName} loading={savingName} style={styles.modalBtn} />
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={editSchoolModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{t('onboarding.school_name')}</Text>
            <TextInput
              style={styles.modalInput}
              value={editSchool}
              onChangeText={setEditSchool}
              placeholder={t('onboarding.school_name_placeholder')}
              placeholderTextColor={colors.slateText}
            />
            <View style={styles.modalActions}>
              <Button title={t('common.cancel')} variant="outline" onPress={() => setEditSchoolModal(false)} style={styles.modalBtn} />
              <Button title={t('common.save')} onPress={handleSaveSchool} loading={savingSchool} style={styles.modalBtn} />
            </View>
          </View>
        </View>
      </Modal>
      <ConfirmModal
        visible={logoutModalVisible}
        onClose={() => setLogoutModalVisible(false)}
        title={t('profile.logout')}
        cancelLabel={t('common.cancel')}
        confirmLabel={t('profile.logout')}
        onConfirm={handleLogoutConfirm}
        variant="destructive"
      />
      <Card style={styles.card}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={item.key}
            style={[styles.menuRow, index === menuItems.length - 1 && styles.menuRowLast]}
            onPress={item.onPress}
          >
            <View style={styles.menuLeft}>
              <Ionicons name={item.icon} size={22} color={colors.slateText} />
              <Text style={styles.menuText}>{item.label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.slateText} />
          </TouchableOpacity>
        ))}
      </Card>
      <Button title={t('profile.logout')} variant="outline" onPress={handleLogout} fullWidth style={styles.logoutBtn} textStyle={{ color: colors.alertCoral }} />
      <Text style={styles.version}>
        {t('profile.version', { version: Constants.expoConfig?.version ?? '1.0.0' })}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.mistBlue },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { alignItems: 'center', marginBottom: spacing.lg },
  avatarWrap: { position: 'relative', marginBottom: spacing.xs },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarRing: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 52,
    borderWidth: 2,
    borderColor: colors.electricAzure,
    opacity: 0.4,
  },
  avatarPlaceholder: { backgroundColor: colors.mistBlue, justifyContent: 'center', alignItems: 'center' },
  avatarText: { ...typography.h1, color: colors.slateText },
  editAvatarHint: { ...typography.caption, color: colors.slateText, marginTop: spacing.xxs },
  name: { ...typography.h2, color: colors.carbonText },
  phone: { ...typography.body, color: colors.slateText },
  schoolRow: { marginTop: spacing.sm, alignItems: 'center' },
  schoolLabel: { ...typography.caption, color: colors.slateText },
  schoolValue: { ...typography.body, color: colors.carbonText },
  completenessRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs, marginTop: spacing.xs },
  completeness: { ...typography.caption, color: colors.calmTeal },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', justifyContent: 'center', padding: spacing.lg },
  modalBox: { backgroundColor: colors.cleanWhite, borderRadius: 16, padding: spacing.lg },
  modalTitle: { ...typography.label, color: colors.carbonText, marginBottom: spacing.sm },
  modalInput: { ...typography.body, borderWidth: 1, borderColor: colors.outlineGrey, borderRadius: 12, padding: spacing.sm, marginBottom: spacing.md },
  modalActions: { flexDirection: 'row', gap: spacing.sm },
  modalBtn: { flex: 1 },
  card: { marginBottom: spacing.md },
  menuRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.outlineGrey },
  menuRowLast: { borderBottomWidth: 0 },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  menuText: { ...typography.body, color: colors.carbonText },
  logoutBtn: {
    marginBottom: spacing.sm,
    borderColor: colors.alertCoral,
    borderWidth: 2,
  },
  version: { ...typography.caption, color: colors.slateText, textAlign: 'center' },
});
