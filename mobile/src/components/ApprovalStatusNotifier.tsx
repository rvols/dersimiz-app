/**
 * When app becomes active (or periodically), checks for new approval_status notifications.
 * Shows toast and refreshes user when approval/rejection status changes.
 */

import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useToast } from '../contexts/ToastContext';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../services/api';

const POLL_INTERVAL_MS = 30000;

interface Notif {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  data?: { status?: string };
}

export function ApprovalStatusNotifier() {
  const { t } = useTranslation();
  const toast = useToast();
  const hydrate = useAuthStore((s) => s.hydrate);
  const user = useAuthStore((s) => s.user);
  const toastShownRef = useRef<Set<string>>(new Set());
  const isTutor = user?.role === 'tutor';

  useEffect(() => {
    if (!user?.id || !isTutor) return;

    const checkApprovalNotifications = async () => {
      try {
        const { data } = await api.get<{ data: { notifications: Notif[] } }>('/me/notifications?limit=10');
        const notifications = data?.data?.notifications ?? [];
        const unreadApproval = notifications.filter((n) => n.type === 'approval_status' && !n.read);
        for (const n of unreadApproval) {
          if (toastShownRef.current.has(n.id)) continue;
          toastShownRef.current.add(n.id);
          const status = (n.data as { status?: string })?.status;
          if (status === 'approved') {
            toast.showSuccess(t('notifications.approval_approved', { defaultValue: 'Your profile has been approved!' }));
          } else if (status === 'rejected') {
            toast.showError(t('notifications.approval_rejected', { defaultValue: 'Your profile was rejected. View the reason in Support.' }));
          } else {
            toast.showSuccess(n.body || n.title);
          }
          try {
            await api.put(`/me/notifications/${n.id}/read`);
          } catch (_) {}
        }
        await hydrate();
      } catch (_) {}
    };

    checkApprovalNotifications();

    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') checkApprovalNotifications();
    });

    const poll = setInterval(checkApprovalNotifications, POLL_INTERVAL_MS);

    return () => {
      sub.remove();
      clearInterval(poll);
    };
  }, [user?.id, isTutor, hydrate, toast, t]);
  return null;
}
