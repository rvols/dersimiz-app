import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Card, Button, ConfirmModal } from '../../components/ui';
import { AvatarImage } from '../../components/AvatarImage';
import { colors, typography, spacing } from '../../theme';
import { useAuthStore } from '../../store/useAuthStore';
import { useSupportUnreadStore } from '../../store/useSupportUnreadStore';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../services/api';
import { pickAndUploadAvatar } from '../../services/avatar';
import Constants from 'expo-constants';

export function ProfileScreen({ onSettings, onSubscription, onTransactions, onBoosters, onSupport, onLessons, onAvailability, onSchoolTypesGrades, onNotifications }: {
  onSettings?: () => void;
  onSubscription?: () => void;
  onTransactions?: () => void;
  onBoosters?: () => void;
  onSupport?: () => void;
  onLessons?: () => void;
  onAvailability?: () => void;
  onSchoolTypesGrades?: () => void;
  onNotifications?: () => void;
}) {
  const { t } = useTranslation();
  const toast = useToast();
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

  const supportUnread = useSupportUnreadStore((s) => s.count);
  const fetchSupportUnread = useSupportUnreadStore((s) => s.fetchCount);

  useEffect(() => {
    if (user?.role === 'tutor') {
      api.get<{ data: { completeness?: number } }>('/profile/completeness').then((r) => {
        setCompleteness(r.data?.data?.completeness ?? null);
      }).catch(() => {});
    }
  }, [user?.role]);

  useEffect(() => {
    fetchSupportUnread();
  }, [fetchSupportUnread]);

  const handleAvatarPress = async () => {
    setAvatarLoading(true);
    try {
      const url = await pickAndUploadAvatar();
      if (url) toast.showSuccess(t('profile.avatar_updated', { defaultValue: 'Profile photo updated' }));
    } catch (e) {
      toast.showError(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setAvatarLoading(false);
    }
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
    isTutor && onSchoolTypesGrades && { key: 'schoolTypesGrades', label: t('onboarding.education'), onPress: onSchoolTypesGrades, icon: 'library-outline' as const },
    isTutor && onSubscription && { key: 'subscription', label: t('subscription.title'), onPress: onSubscription, icon: 'card-outline' as const },
    isTutor && onTransactions && { key: 'transactions', label: t('subscription.transactions_title'), onPress: onTransactions, icon: 'receipt-outline' as const },
    isTutor && onBoosters && { key: 'boosters', label: t('boosters.title'), onPress: onBoosters, icon: 'rocket-outline' as const },
    onSupport && { key: 'support', label: t('support.title'), onPress: onSupport, icon: 'help-buoy-outline' as const },
    onNotifications && { key: 'notifications', label: t('notifications.title'), onPress: onNotifications, icon: 'notifications-outline' as const },
  ].filter(Boolean) as { key: string; label: string; onPress: () => void; icon: keyof typeof Ionicons.glyphMap }[];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleAvatarPress} disabled={avatarLoading} style={styles.avatarWrap}>
          {user?.avatar_url ? (
            <AvatarImage uri={user.avatar_url} fallbackText={user?.full_name?.charAt(0) ?? '?'} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>{user?.full_name?.charAt(0) ?? '?'}</Text>
            </View>
          )}
          <View style={styles.avatarRing} />
          <View style={styles.avatarEditBadge}>
            <Ionicons name="camera" size={14} color={colors.cleanWhite} />
          </View>
        </TouchableOpacity>
        <Text style={styles.editAvatarHint}>{avatarLoading ? t('common.loading') : t('profile.edit')}</Text>
        <Text style={styles.approvalHint}>{t('profile.approval_hint')}</Text>
        <TouchableOpacity onPress={() => { setEditName(user?.full_name ?? ''); setEditModal(true); }} style={styles.editableRow}>
          <Text style={styles.name}>{user?.full_name ?? '—'}</Text>
          <Ionicons name="pencil" size={16} color={colors.slateText} style={styles.editIcon} />
        </TouchableOpacity>
        <Text style={styles.phone}>{user?.phone_number}</Text>
        {user?.role && (
          <TouchableOpacity
            onPress={user?.is_rejected && onSupport ? onSupport : undefined}
            disabled={!user?.is_rejected || !onSupport}
            style={[styles.approvalRow, user?.is_rejected && styles.approvalRowRejected, user?.is_approved && styles.approvalRowApproved]}
            activeOpacity={user?.is_rejected && onSupport ? 0.7 : 1}
          >
            <Ionicons
              name={user?.is_approved ? 'checkmark-circle' : user?.is_rejected ? 'close-circle' : 'time'}
              size={18}
              color={user?.is_approved ? colors.calmTeal : user?.is_rejected ? colors.alertCoral : colors.warmGold}
            />
            <Text style={[styles.approvalText, user?.is_rejected && styles.approvalTextRejected]}>
              {user?.is_approved
                ? t('profile.status_approved', { defaultValue: 'Approved' })
                : user?.is_rejected
                  ? t('profile.status_rejected', { defaultValue: 'Rejected' })
                  : t('profile.status_pending', { defaultValue: 'Pending' })}
            </Text>
            {user?.is_rejected && onSupport && (
              <Ionicons name="chevron-forward" size={16} color={colors.alertCoral} style={styles.approvalChevron} />
            )}
          </TouchableOpacity>
        )}
        {!isTutor && (
          <TouchableOpacity onPress={() => { setEditSchool(user?.school_name ?? ''); setEditSchoolModal(true); }} style={styles.schoolRow}>
            <Text style={styles.schoolLabel}>{t('onboarding.school_name')}</Text>
            <View style={styles.schoolValueRow}>
              <Text style={styles.schoolValue}>{user?.school_name?.trim() ? user.school_name : '—'}</Text>
              <Ionicons name="pencil" size={16} color={colors.slateText} style={styles.editIcon} />
            </View>
          </TouchableOpacity>
        )}
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
              <View style={styles.menuIconWrap}>
                <Ionicons name={item.icon} size={22} color={colors.slateText} />
                {item.key === 'support' && supportUnread > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{supportUnread > 99 ? '99+' : supportUnread}</Text>
                  </View>
                )}
              </View>
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
  approvalHint: { ...typography.caption, color: colors.slateText, marginTop: spacing.xs, textAlign: 'center', fontStyle: 'italic' },
  name: { ...typography.h2, color: colors.carbonText },
  phone: { ...typography.body, color: colors.slateText },
  editableRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  editIcon: { marginLeft: spacing.xxs },
  schoolRow: { marginTop: spacing.sm, alignItems: 'center' },
  schoolLabel: { ...typography.caption, color: colors.slateText },
  schoolValueRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  schoolValue: { ...typography.body, color: colors.carbonText },
  approvalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.warmGold + '15',
    borderWidth: 1,
    borderColor: colors.warmGold + '30',
  },
  approvalRowApproved: {
    backgroundColor: colors.calmTeal + '15',
    borderColor: colors.calmTeal + '30',
  },
  approvalRowRejected: {
    backgroundColor: colors.alertCoral + '12',
    borderColor: colors.alertCoral + '30',
  },
  approvalChevron: {
    marginLeft: spacing.xs,
  },
  approvalText: {
    ...typography.label,
    color: colors.carbonText,
    fontWeight: '600',
  },
  approvalTextRejected: {
    color: colors.alertCoral,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.electricAzure,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  menuIconWrap: { position: 'relative' },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.alertCoral,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { ...typography.caption, color: colors.cleanWhite, fontSize: 10, fontWeight: '600' },
  menuText: { ...typography.body, color: colors.carbonText },
  logoutBtn: {
    marginBottom: spacing.sm,
    borderColor: colors.alertCoral,
    borderWidth: 2,
  },
  version: { ...typography.caption, color: colors.slateText, textAlign: 'center' },
});
