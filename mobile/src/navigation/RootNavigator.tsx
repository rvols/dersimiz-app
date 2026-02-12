import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/useAuthStore';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { ChatThreadScreen } from '../screens/chat/ChatThreadScreen';
import { SupportScreen } from '../screens/support/SupportScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { SubscriptionScreen } from '../screens/subscription/SubscriptionScreen';
import { TransactionsScreen } from '../screens/subscription/TransactionsScreen';
import { BoostersScreen } from '../screens/boosters/BoostersScreen';
import { NotificationsScreen } from '../screens/notifications/NotificationsScreen';
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';
import { LessonsScreen } from '../screens/tutor/LessonsScreen';
import { AvailabilityScreen } from '../screens/tutor/AvailabilityScreen';
import { SchoolTypesGradesScreen } from '../screens/tutor/SchoolTypesGradesScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  if (!isHydrated) {
    return null;
  }

  const isLoggedIn = !!user?.id;
  const hasRole = !!user?.role;
  const onboardingDone = !!user?.onboarding_completed;

  // If logged in but no role (new user), keep showing Auth stack so they can select role
  const showAuth = !isLoggedIn || !hasRole;
  const showOnboarding = isLoggedIn && hasRole && !onboardingDone;

  return (
    <Stack.Navigator
      key={showAuth ? 'auth' : showOnboarding ? 'onboarding' : 'main'}
      screenOptions={{ headerShown: false }}
      initialRouteName={showAuth ? 'Auth' : showOnboarding ? 'Onboarding' : 'Main'}
    >
      <Stack.Screen name="Auth" component={AuthNavigator} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Main" component={MainNavigator} />
      <Stack.Screen
        name="ChatThread"
        component={ChatThreadScreen}
        options={({ route }) => ({ headerShown: true, headerTitle: route.params.otherName || t('nav.chat') })}
      />
      <Stack.Screen name="Support" component={SupportScreen} options={{ headerShown: true, headerTitle: t('support.title') }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: true, headerTitle: t('settings.title') }} />
      <Stack.Screen name="Subscription" component={SubscriptionScreen} options={{ headerShown: true, headerTitle: t('subscription.title') }} />
      <Stack.Screen name="Transactions" component={TransactionsScreen} options={{ headerShown: true, headerTitle: t('subscription.transactions_title', { defaultValue: 'Transactions' }) }} />
      <Stack.Screen name="Boosters" component={BoostersScreen} options={{ headerShown: true, headerTitle: t('boosters.title') }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: true, headerTitle: t('notifications.title') }} />
      <Stack.Screen name="Lessons" component={LessonsScreen} options={{ headerShown: true, headerTitle: t('onboarding.lessons_pricing') }} />
      <Stack.Screen name="Availability" component={AvailabilityScreen} options={{ headerShown: true, headerTitle: t('onboarding.availability') }} />
      <Stack.Screen name="SchoolTypesGrades" component={SchoolTypesGradesScreen} options={{ headerShown: true, headerTitle: t('onboarding.education') }} />
    </Stack.Navigator>
  );
}
