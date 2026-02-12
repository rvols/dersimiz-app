import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Card, Button } from '../../components/ui';
import { colors, typography, spacing, shadows } from '../../theme';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';

interface DashboardData {
  impressions?: number;
  contacts?: number;
  lesson_count?: number;
  grade_count?: number;
  profile_completeness?: number;
  missing_fields?: string[];
  subscription_status?: string | null;
  total_availability_hours?: number;
  profile?: { full_name?: string };
  earnings_this_month?: number;
  upcoming_sessions?: number;
}

const MISSING_FIELD_KEYS: Record<string, string> = {
  bio: 'dashboard.tutor.missing_bio',
  avatar: 'dashboard.tutor.missing_avatar',
  lessons: 'dashboard.tutor.missing_lessons',
  availability: 'dashboard.tutor.missing_availability',
  school_types: 'dashboard.tutor.missing_education',
};

export function TutorDashboardScreen({
  onManageLessons,
  onSetAvailability,
  onSchoolTypesGrades,
  onCompleteProfile,
  onSubscription,
  onSupport,
}: {
  onManageLessons?: () => void;
  onSetAvailability?: () => void;
  onSchoolTypesGrades?: () => void;
  onCompleteProfile?: () => void;
  onSubscription?: () => void;
  onSupport?: () => void;
} = {}) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const hydrate = useAuthStore((s) => s.hydrate);
  const [data, setData] = useState<DashboardData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const response = await api.get<{ success?: boolean; data?: DashboardData }>('/tutor/dashboard');
      const body = response?.data;
      const dashboardData = body?.data ?? body;
      if (dashboardData && typeof dashboardData === 'object') {
        setData({
          ...dashboardData,
          grade_count: typeof dashboardData.grade_count === 'number'
            ? dashboardData.grade_count
            : parseInt(String(dashboardData.grade_count ?? 0), 10) || 0,
        });
      } else {
        setData(null);
      }
    } catch (_) { }
  };

  useEffect(() => {
    load();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await hydrate();
    await load();
    setRefreshing(false);
  };

  const name = user?.full_name || data?.profile?.full_name || '';
  const firstName = name.split(' ')[0] || t('common.there');

  const completeness = data?.profile_completeness ?? 0;
  const isProfileComplete = completeness >= 100;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { flexGrow: 1 }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.calmTeal} />
      }
      showsVerticalScrollIndicator={true}
      nestedScrollEnabled
    >
      {/* Professional Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.greeting}>{t('dashboard.tutor.good_day')}</Text>
          <Text style={styles.name}>{firstName}</Text>
          <Text style={styles.subtitle}>{t('dashboard.tutor.your_teaching_hub')}</Text>
        </View>

        {/* Verification Badge */}
        {user?.is_approved && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={20} color={colors.calmTeal} />
            <Text style={styles.verifiedText}>{t('dashboard.tutor.verified')}</Text>
          </View>
        )}
      </View>

      {/* Rejected Banner - tap to view reason in support */}
      {user?.is_rejected && onSupport && (
        <Pressable onPress={onSupport} style={styles.bannerWrap}>
          <Card variant="tutor" style={styles.bannerRejected}>
            <View style={styles.bannerContent}>
              <View style={[styles.bannerIcon, styles.bannerIconRejected]}>
                <Ionicons name="alert-circle-outline" size={24} color={colors.alertCoral} />
              </View>
              <View style={styles.bannerText}>
                <Text style={[styles.bannerTitle, styles.bannerTitleRejected]}>{t('dashboard.tutor.rejected')}</Text>
                <Text style={styles.bannerSubtitle}>{t('dashboard.tutor.view_rejection_reason')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.slateText} />
            </View>
          </Card>
        </Pressable>
      )}

      {/* Approval Status Banner - pending review */}
      {!user?.is_approved && !user?.is_rejected && (
        <Card variant="tutor" style={styles.banner}>
          <View style={styles.bannerContent}>
            <View style={styles.bannerIcon}>
              <Ionicons name="time-outline" size={24} color={colors.warmGold} />
            </View>
            <View style={styles.bannerText}>
              <Text style={styles.bannerTitle}>{t('dashboard.tutor.pending_review')}</Text>
              <Text style={styles.bannerSubtitle}>{t('dashboard.tutor.reviewing_profile')}</Text>
            </View>
          </View>
        </Card>
      )}

      {/* Profile Completeness - tap to go to Profile */}
      {!isProfileComplete && (
        <Pressable onPress={onCompleteProfile}>
          <Card variant="tutor" style={styles.completenessCard}>
            <View style={styles.completenessHeader}>
              <Text style={styles.completenessTitle}>{t('dashboard.tutor.complete_profile')}</Text>
              <Text style={styles.completenessPercent}>{completeness}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.max(0, completeness)}%` }]} />
            </View>
            {(data?.missing_fields?.length ?? 0) > 0 ? (
              <Text style={styles.completenessHint}>
                {(data?.missing_fields ?? []).map((key) => t(MISSING_FIELD_KEYS[key] || key)).join(' · ')}
              </Text>
            ) : (
              <Text style={styles.completenessHint}>{t('dashboard.tutor.boost_visibility')}</Text>
            )}
            <Text style={styles.completenessTap}>{t('dashboard.tutor.tap_to_complete', { defaultValue: 'Tap to complete' })}</Text>
          </Card>
        </Pressable>
      )}

      {/* Performance overview - stacked vertically */}
      <View style={styles.metricsSection}>
        <Text style={styles.sectionTitle}>{t('dashboard.tutor.performance_overview')}</Text>
        <View style={styles.metricsColumn}>
          <Card variant="tutor" style={styles.metricCard}>
            <View style={[styles.metricIconWrap, { backgroundColor: colors.calmTeal + '18' }]}>
              <Ionicons name="eye" size={22} color={colors.calmTeal} />
            </View>
            <View style={styles.metricTextWrap}>
              <Text style={styles.metricNumber}>{data?.impressions ?? 0}</Text>
              <Text style={styles.metricCaption}>{t('dashboard.tutor.profile_views')}</Text>
            </View>
          </Card>
          <Card variant="tutor" style={styles.metricCard}>
            <View style={[styles.metricIconWrap, { backgroundColor: colors.electricAzure + '18' }]}>
              <Ionicons name="chatbubbles" size={22} color={colors.electricAzure} />
            </View>
            <View style={styles.metricTextWrap}>
              <Text style={styles.metricNumber}>{data?.contacts ?? 0}</Text>
              <Text style={styles.metricCaption}>{t('dashboard.tutor.new_contacts')}</Text>
            </View>
          </Card>
          <Card variant="tutor" style={styles.metricCard}>
            <View style={[styles.metricIconWrap, { backgroundColor: colors.warmGold + '18' }]}>
              <Ionicons name="calendar" size={22} color={colors.warmGold} />
            </View>
            <View style={styles.metricTextWrap}>
              <Text style={styles.metricNumber}>{data?.upcoming_sessions ?? 0}</Text>
              <Text style={styles.metricCaption}>{t('dashboard.tutor.sessions')}</Text>
            </View>
          </Card>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>{t('dashboard.tutor.quick_actions')}</Text>

        <View style={styles.actionsColumn}>
          {onManageLessons && (
            <Pressable onPress={onManageLessons} style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: colors.calmTeal + '15' }]}>
                <Ionicons name="book" size={24} color={colors.calmTeal} />
              </View>
              <View style={styles.actionTextWrap}>
                <Text style={styles.actionTitle}>{t('dashboard.tutor.lessons')}</Text>
                <Text style={styles.actionSubtitle}>{data?.lesson_count ?? 0} {t('common.active')}</Text>
              </View>
            </Pressable>
          )}

          {onSchoolTypesGrades && (
            <Pressable onPress={onSchoolTypesGrades} style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: colors.warmGold + '15' }]}>
                <Ionicons name="school" size={24} color={colors.warmGold} />
              </View>
              <View style={styles.actionTextWrap}>
                <Text style={styles.actionTitle}>{t('onboarding.education')}</Text>
                <Text style={styles.actionSubtitle}>
                  {t('dashboard.tutor.grades_count', {
                    count: typeof data?.grade_count === 'number' ? data.grade_count : (parseInt(String(data?.grade_count ?? 0), 10) || 0),
                    defaultValue: '{{count}} grades',
                  })}
                </Text>
              </View>
            </Pressable>
          )}

          {onSetAvailability && (
            <Pressable onPress={onSetAvailability} style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: colors.electricAzure + '15' }]}>
                <Ionicons name="time" size={24} color={colors.electricAzure} />
              </View>
              <View style={styles.actionTextWrap}>
                <Text style={styles.actionTitle}>{t('dashboard.tutor.availability')}</Text>
                <Text style={styles.actionSubtitle}>
                  {typeof data?.total_availability_hours === 'number'
                    ? t('dashboard.tutor.hours_per_week', { hours: data.total_availability_hours, defaultValue: '{{hours}} h/week' })
                    : t('dashboard.tutor.manage_schedule')}
                </Text>
              </View>
            </Pressable>
          )}
        </View>
      </View>

      {/* Subscription Status - tap to open Subscription screen */}
      <Pressable onPress={onSubscription}>
        <Card variant="tutor" style={styles.subscriptionCard}>
          <View style={styles.subscriptionHeader}>
            <View style={styles.subscriptionLeft}>
              <View style={[styles.subscriptionIcon, { backgroundColor: colors.warmGold + '15' }]}>
                <Ionicons name="star" size={20} color={colors.warmGold} />
              </View>
              <View>
                <Text style={styles.subscriptionTitle}>{t('dashboard.tutor.subscription')}</Text>
                <Text style={styles.subscriptionStatus}>{data?.subscription_status != null ? String(data.subscription_status) : t('common.free_plan')}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.slateText} />
          </View>
          <Text style={styles.subscriptionNote}>{t('dashboard.tutor.subscription_search_note')}</Text>
        </Card>
      </Pressable>

      {/* Insights */}
      <View style={styles.insightsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('dashboard.tutor.insights')}</Text>
          <Pressable>
            <Text style={styles.seeAll}>{t('common.see_all')}</Text>
          </Pressable>
        </View>

        <Card variant="tutor">
          <View style={styles.insightItem}>
            <View style={[styles.insightDot, { backgroundColor: colors.calmTeal }]} />
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>{t('dashboard.tutor.peak_hours')}</Text>
              <Text style={styles.insightText}>{t('dashboard.tutor.most_views_evening')}</Text>
            </View>
          </View>
          <View style={styles.insightDivider} />
          <View style={styles.insightItem}>
            <View style={[styles.insightDot, { backgroundColor: colors.electricAzure }]} />
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>{t('dashboard.tutor.popular_subject')}</Text>
              <Text style={styles.insightText}>{t('dashboard.tutor.mathematics_trending')}</Text>
            </View>
          </View>
        </Card>
      </View>

      {/* Bottom Spacing */}
      <View style={{ height: spacing.xxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.mistBlue,
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.lg,
  },
  headerContent: {
    marginBottom: spacing.sm,
  },
  greeting: {
    ...typography.body,
    color: colors.slateText,
    fontSize: 14,
  },
  name: {
    ...typography.h1,
    color: colors.carbonText,
    fontSize: 32,
    marginTop: spacing.xxs,
  },
  subtitle: {
    ...typography.body,
    color: colors.slateText,
    marginTop: spacing.xxs,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.calmTeal + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.calmTeal + '30',
  },
  verifiedText: {
    ...typography.label,
    color: colors.calmTeal,
    marginLeft: spacing.xs,
    fontWeight: '600',
  },
  banner: {
    marginBottom: spacing.lg,
    backgroundColor: colors.warmGold + '10',
    borderColor: colors.warmGold + '30',
  },
  bannerWrap: {
    marginBottom: spacing.lg,
  },
  bannerRejected: {
    marginBottom: 0,
    backgroundColor: colors.alertCoral + '12',
    borderColor: colors.alertCoral + '40',
    borderWidth: 1,
    overflow: 'hidden',
  },
  bannerTitleRejected: {
    color: colors.alertCoral,
  },
  bannerIconRejected: {
    backgroundColor: colors.alertCoral + '20',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.warmGold + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    ...typography.h3,
    color: colors.carbonText,
    fontSize: 16,
  },
  bannerSubtitle: {
    ...typography.body,
    color: colors.slateText,
    marginTop: spacing.xxs,
  },
  completenessCard: {
    marginBottom: spacing.lg,
  },
  completenessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  completenessTitle: {
    ...typography.h3,
    color: colors.carbonText,
    fontSize: 16,
  },
  completenessPercent: {
    ...typography.h2,
    color: colors.calmTeal,
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.mistBlue,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.calmTeal,
    borderRadius: 4,
  },
  completenessHint: {
    ...typography.caption,
    color: colors.slateText,
    marginBottom: spacing.xxs,
  },
  completenessTap: {
    ...typography.caption,
    color: colors.calmTeal,
    fontWeight: '600',
  },
  metricsSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.carbonText,
    marginBottom: spacing.md,
  },
  metricsColumn: {
    flexDirection: 'column',
    gap: spacing.sm,
  },
  metricCard: {
    padding: spacing.md,
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  metricIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricTextWrap: {
    flex: 1,
  },
  metricNumber: {
    ...typography.stats,
    color: colors.carbonText,
    fontSize: 20,
  },
  metricCaption: {
    ...typography.caption,
    color: colors.slateText,
    marginTop: spacing.xxs,
  },
  actionsSection: {
    marginBottom: spacing.lg,
  },
  actionsColumn: {
    flexDirection: 'column',
    gap: spacing.sm,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cleanWhite,
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.calmTeal + '20',
    ...shadows.card,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  actionTextWrap: {
    flex: 1,
  },
  actionTitle: {
    ...typography.label,
    color: colors.carbonText,
    fontWeight: '600',
  },
  actionSubtitle: {
    ...typography.caption,
    color: colors.slateText,
    marginTop: spacing.xxs,
  },
  subscriptionCard: {
    marginBottom: spacing.lg,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subscriptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  subscriptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  subscriptionTitle: {
    ...typography.label,
    color: colors.slateText,
    fontSize: 13,
  },
  subscriptionStatus: {
    ...typography.h3,
    color: colors.carbonText,
    fontSize: 16,
    marginTop: spacing.xxs,
  },
  subscriptionNote: {
    ...typography.caption,
    color: colors.slateText,
    marginTop: spacing.sm,
  },
  insightsSection: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  seeAll: {
    ...typography.label,
    color: colors.calmTeal,
    fontWeight: '600',
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
  },
  insightDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    marginRight: spacing.sm,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    ...typography.label,
    color: colors.carbonText,
    marginBottom: spacing.xxs,
  },
  insightText: {
    ...typography.caption,
    color: colors.slateText,
  },
  insightDivider: {
    height: 1,
    backgroundColor: colors.outlineGrey,
    marginVertical: spacing.xs,
  },
});
