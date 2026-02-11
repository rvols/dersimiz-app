import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  Animated,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Card, Button } from '../../components/ui';
import { colors, typography, spacing, shadows } from '../../theme';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';

interface DashboardData {
  favorites_count?: number;
  active_conversations?: number;
  upcoming_demos?: number;
  profile?: { full_name?: string };
}

export function StudentDashboardScreen({ onFindTutors }: { onFindTutors?: () => void }) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<DashboardData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const scaleAnim = new Animated.Value(1);

  const load = async () => {
    try {
      const { data: res } = await api.get<{ data: DashboardData }>('/student/dashboard');
      setData(res?.data ?? null);
    } catch (_) { }
  };

  useEffect(() => {
    load();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const name = user?.full_name || data?.profile?.full_name || '';
  const firstName = name.split(' ')[0] || t('common.there');

  // Pulse animation for CTA
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.02,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { flexGrow: 1 }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.sparkOrange} />
      }
      showsVerticalScrollIndicator={true}
      nestedScrollEnabled
    >
      {/* Hero Section with Gradient */}
      <View style={styles.hero}>
        <View style={styles.heroContent}>
          <View style={styles.greetingRow}>
            <Text style={styles.greeting}>👋</Text>
            <View style={styles.greetingTextContainer}>
              <Text style={styles.greetingText}>{t('dashboard.student.hey')}</Text>
              <Text style={styles.name}>{firstName}!</Text>
            </View>
          </View>
          <Text style={styles.heroSubtitle}>{t('dashboard.student.ready_to_learn')}</Text>
        </View>

        {/* Streak Badge (Gamification) */}
        <View style={styles.streakBadge}>
          <Ionicons name="flame" size={20} color={colors.sparkOrange} />
          <Text style={styles.streakText}>7 {t('dashboard.student.day_streak')}</Text>
        </View>
      </View>

      {/* Main CTA - Find Tutors */}
      <Animated.View style={[styles.ctaContainer, { transform: [{ scale: scaleAnim }] }]}>
        <Pressable
          onPress={onFindTutors}
          style={styles.mainCta}
        >
          <View style={styles.ctaGradient}>
            <View style={styles.ctaContent}>
              <View style={styles.ctaLeft}>
                <Text style={styles.ctaTitle}>{t('dashboard.student.find_your_tutor')}</Text>
                <Text style={styles.ctaSubtitle}>{t('dashboard.student.start_learning')}</Text>
              </View>
              <View style={styles.ctaIcon}>
                <Ionicons name="search" size={28} color={colors.cleanWhite} />
              </View>
            </View>
          </View>
        </Pressable>
      </Animated.View>

      {/* Quick Stats - Bento Grid Style */}
      <View style={styles.statsGrid}>
        <Card variant="student" style={styles.statCard} onPress={() => { }}>
          <View style={styles.statIconWrap}>
            <Ionicons name="heart" size={24} color={colors.sparkOrange} />
          </View>
          <Text style={styles.statValue}>{data?.favorites_count ?? 0}</Text>
          <Text style={styles.statLabel}>{t('dashboard.student.favorites')}</Text>
        </Card>

        <Card variant="student" style={styles.statCard} onPress={() => { }}>
          <View style={styles.statIconWrap}>
            <Ionicons name="chatbubbles" size={24} color={colors.neonLime} />
          </View>
          <Text style={styles.statValue}>{data?.active_conversations ?? 0}</Text>
          <Text style={styles.statLabel}>{t('dashboard.student.chats')}</Text>
        </Card>

        <Card variant="student" style={[styles.statCard, styles.statCardWide]} onPress={() => { }}>
          <View style={styles.statIconWrap}>
            <Ionicons name="calendar" size={24} color={colors.electricAzure} />
          </View>
          <Text style={styles.statValue}>{data?.upcoming_demos ?? 0}</Text>
          <Text style={styles.statLabel}>{t('dashboard.student.upcoming_demos')}</Text>
        </Card>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('dashboard.student.recent_activity')}</Text>
          <Pressable>
            <Text style={styles.seeAll}>{t('common.see_all')}</Text>
          </Pressable>
        </View>

        <Card style={styles.activityCard}>
          <View style={styles.activityItem}>
            <View style={[styles.activityDot, { backgroundColor: colors.neonLime }]} />
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>{t('dashboard.student.no_activity_yet')}</Text>
              <Text style={styles.activityTime}>{t('dashboard.student.start_by_finding')}</Text>
            </View>
          </View>
        </Card>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('dashboard.student.quick_actions')}</Text>

        <View style={styles.quickActions}>
          <Pressable style={styles.quickAction}>
            <View style={[styles.quickActionIcon, { backgroundColor: colors.sparkOrange + '15' }]}>
              <Ionicons name="book" size={24} color={colors.sparkOrange} />
            </View>
            <Text style={styles.quickActionText}>{t('dashboard.student.browse_lessons')}</Text>
          </Pressable>

          <Pressable style={styles.quickAction}>
            <View style={[styles.quickActionIcon, { backgroundColor: colors.electricAzure + '15' }]}>
              <Ionicons name="time" size={24} color={colors.electricAzure} />
            </View>
            <Text style={styles.quickActionText}>{t('dashboard.student.schedule')}</Text>
          </Pressable>

          <Pressable style={styles.quickAction}>
            <View style={[styles.quickActionIcon, { backgroundColor: colors.neonLime + '15' }]}>
              <Ionicons name="trophy" size={24} color={colors.neonLime} />
            </View>
            <Text style={styles.quickActionText}>{t('dashboard.student.achievements')}</Text>
          </Pressable>

          <Pressable style={styles.quickAction}>
            <View style={[styles.quickActionIcon, { backgroundColor: colors.warmGold + '15' }]}>
              <Ionicons name="star" size={24} color={colors.warmGold} />
            </View>
            <Text style={styles.quickActionText}>{t('dashboard.student.reviews')}</Text>
          </Pressable>
        </View>
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
  hero: {
    marginBottom: spacing.lg,
  },
  heroContent: {
    marginBottom: spacing.md,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  greeting: {
    fontSize: 32,
    marginRight: spacing.sm,
  },
  greetingTextContainer: {
    flex: 1,
  },
  greetingText: {
    ...typography.body,
    color: colors.slateText,
    fontSize: 14,
  },
  name: {
    ...typography.h1,
    color: colors.carbonText,
    fontSize: 32,
  },
  heroSubtitle: {
    ...typography.bodyLarge,
    color: colors.slateText,
    marginTop: spacing.xxs,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.sparkOrange + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.sparkOrange + '30',
  },
  streakText: {
    ...typography.label,
    color: colors.sparkOrange,
    marginLeft: spacing.xs,
    fontWeight: '700',
  },
  ctaContainer: {
    marginBottom: spacing.lg,
  },
  mainCta: {
    borderRadius: 20,
    overflow: 'hidden',
    ...shadows.studentAccent,
  },
  ctaGradient: {
    padding: spacing.lg,
    backgroundColor: colors.sparkOrange,
  },
  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ctaLeft: {
    flex: 1,
  },
  ctaTitle: {
    ...typography.h2,
    color: colors.cleanWhite,
    marginBottom: spacing.xxs,
  },
  ctaSubtitle: {
    ...typography.body,
    color: colors.cleanWhite,
    opacity: 0.9,
  },
  ctaIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  statCardWide: {
    minWidth: '100%',
  },
  statIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.mistBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    ...typography.stats,
    color: colors.sparkOrange,
    fontWeight: '700',
  },
  statLabel: {
    ...typography.caption,
    color: colors.slateText,
    marginTop: spacing.xxs,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.carbonText,
  },
  seeAll: {
    ...typography.label,
    color: colors.sparkOrange,
    fontWeight: '600',
  },
  activityCard: {
    padding: spacing.md,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: spacing.sm,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    ...typography.body,
    color: colors.carbonText,
    marginBottom: spacing.xxs,
  },
  activityTime: {
    ...typography.caption,
    color: colors.slateText,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  quickAction: {
    alignItems: 'center',
    width: '22%',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  quickActionText: {
    ...typography.caption,
    color: colors.carbonText,
    textAlign: 'center',
    fontWeight: '500',
  },
});
