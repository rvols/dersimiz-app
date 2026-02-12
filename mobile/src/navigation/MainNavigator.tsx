import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/useAuthStore';
import { ApprovalStatusNotifier } from '../components/ApprovalStatusNotifier';
import { useSupportUnreadStore, useSupportUnreadRefresh, useSupportUnreadPoll } from '../store/useSupportUnreadStore';
import { TutorDashboardScreen } from '../screens/main/TutorDashboardScreen';
import { StudentDashboardScreen } from '../screens/main/StudentDashboardScreen';
import { StudentsScreen } from '../screens/main/StudentsScreen';
import { SearchScreen } from '../screens/main/SearchScreen';
import { FavoritesScreen } from '../screens/main/FavoritesScreen';
import { ChatListScreen } from '../screens/main/ChatListScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';
import { colors, typography, spacing } from '../theme';
import { api } from '../services/api';
import type { LessonType } from '../types/api';

const Tab = createBottomTabNavigator();

function TabIcon({ name, focused }: { name: keyof typeof Ionicons.glyphMap; focused: boolean }) {
  return (
    <View style={styles.tabIcon}>
      <Ionicons
        name={name}
        size={24}
        color={focused ? colors.electricAzure : colors.slateText}
      />
    </View>
  );
}

function ProfileTabIcon({ focused }: { focused: boolean }) {
  const supportUnread = useSupportUnreadStore((s) => s.count);
  const fetchSupportUnread = useSupportUnreadStore((s) => s.fetchCount);
  useEffect(() => {
    fetchSupportUnread();
  }, [fetchSupportUnread]);
  return (
    <View style={styles.tabIcon}>
      <Ionicons
        name="person"
        size={24}
        color={focused ? colors.electricAzure : colors.slateText}
      />
      {supportUnread > 0 && (
        <View style={styles.tabBadge}>
          <Text style={styles.tabBadgeText}>{supportUnread > 99 ? '99+' : supportUnread}</Text>
        </View>
      )}
    </View>
  );
}

function TutorTabs({ rootNav }: { rootNav: { navigate: (name: string, params?: object) => void } }) {
  const { t } = useTranslation();
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.cleanWhite,
          shadowColor: colors.electricAzure,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
          elevation: 3,
        },
        headerTintColor: colors.carbonText,
        headerTitleStyle: typography.h3,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.electricAzure,
        tabBarInactiveTintColor: colors.slateText,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: { paddingVertical: spacing.xs },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        options={{ title: t('nav.dashboard'), tabBarLabel: t('nav.home'), tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} /> }}
      >
        {() => (
          <TutorDashboardScreen
            onManageLessons={() => rootNav.navigate('Lessons')}
            onSetAvailability={() => rootNav.navigate('Availability')}
            onSchoolTypesGrades={() => rootNav.navigate('SchoolTypesGrades')}
            onCompleteProfile={() => rootNav.navigate('Main', { screen: 'Profile' })}
            onSubscription={() => rootNav.navigate('Subscription')}
            onSupport={() => rootNav.navigate('Support')}
          />
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Students"
        component={StudentsScreen}
        options={{ title: t('nav.students'), tabBarLabel: t('nav.students'), tabBarIcon: ({ focused }) => <TabIcon name="people" focused={focused} /> }}
      />
      <Tab.Screen
        name="Chat"
        options={{ title: t('nav.messages'), tabBarLabel: t('nav.chat'), tabBarIcon: ({ focused }) => <TabIcon name="chatbubbles" focused={focused} /> }}
      >
        {() => (
          <ChatListScreen
            onSelectConversation={(id, name) => rootNav.navigate('ChatThread', { conversationId: id, otherName: name })}
          />
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Profile"
        options={{ title: t('nav.profile'), tabBarLabel: t('nav.profile'), tabBarIcon: ({ focused }) => <ProfileTabIcon focused={focused} /> }}
      >
        {() => (
          <ProfileScreen
            onSettings={() => rootNav.navigate('Settings')}
            onSubscription={() => rootNav.navigate('Subscription')}
            onTransactions={() => rootNav.navigate('Transactions')}
            onBoosters={() => rootNav.navigate('Boosters')}
            onSupport={() => rootNav.navigate('Support')}
            onLessons={() => rootNav.navigate('Lessons')}
            onAvailability={() => rootNav.navigate('Availability')}
            onSchoolTypesGrades={() => rootNav.navigate('SchoolTypesGrades')}
            onNotifications={() => rootNav.navigate('Notifications')}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

function StudentTabs({ rootNav }: { rootNav: { navigate: (name: string, params?: object) => void } }) {
  const { t } = useTranslation();
  const [lessonTypes, setLessonTypes] = useState<LessonType[]>([]);
  useEffect(() => {
    api.get<{ data: { lesson_types: LessonType[] } }>('/onboarding/data').then((r) => {
      setLessonTypes(r.data?.data?.lesson_types ?? []);
    });
  }, []);

  const openChatWithTutor = async (tutorId: string, tutorName: string) => {
    try {
      const { data } = await api.post<{ data: { conversation: { id: string }; created: boolean } }>(
        '/chat/conversations',
        { tutor_id: tutorId }
      );
      const convId = data?.data?.conversation?.id;
      if (convId) rootNav.navigate('ChatThread', { conversationId: convId, otherName: tutorName });
    } catch (_) {}
  };

  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.cleanWhite,
          shadowColor: colors.electricAzure,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
          elevation: 3,
        },
        headerTintColor: colors.carbonText,
        headerTitleStyle: typography.h3,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.electricAzure,
        tabBarInactiveTintColor: colors.slateText,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: { paddingVertical: spacing.xs },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        options={{ title: t('nav.dashboard'), tabBarLabel: t('nav.home'), tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} /> }}
      >
        {() => <StudentDashboardScreen />}
      </Tab.Screen>
      <Tab.Screen
        name="Search"
        options={{ title: t('nav.find_tutors'), tabBarLabel: t('nav.search'), tabBarIcon: ({ focused }) => <TabIcon name="search" focused={focused} /> }}
      >
        {() => (
          <SearchScreen
            lessonTypes={lessonTypes}
            onRequestDemo={() => {}}
            onToggleFavorite={async (tutorId, isFav) => {
              try {
                if (isFav) await api.post(`/student/favorites/${tutorId}`);
                else await api.delete(`/student/favorites/${tutorId}`);
              } catch (_) {}
            }}
            onOpenChat={(tutorId, tutorName) => openChatWithTutor(tutorId, tutorName ?? t('role.tutor'))}
          />
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Chat"
        options={{ title: t('nav.messages'), tabBarLabel: t('nav.chat'), tabBarIcon: ({ focused }) => <TabIcon name="chatbubbles" focused={focused} /> }}
      >
        {() => (
          <ChatListScreen
            onSelectConversation={(id, name) => rootNav.navigate('ChatThread', { conversationId: id, otherName: name })}
          />
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Favorites"
        options={{ title: t('nav.my_tutors'), tabBarLabel: t('nav.favorites'), tabBarIcon: ({ focused }) => <TabIcon name="heart" focused={focused} /> }}
      >
        {() => (
          <FavoritesScreen
            onOpenChat={(tutorId, tutorName) => openChatWithTutor(tutorId, tutorName ?? t('role.tutor'))}
            onRequestDemo={() => {}}
          />
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Profile"
        options={{ title: t('nav.profile'), tabBarLabel: t('nav.profile'), tabBarIcon: ({ focused }) => <ProfileTabIcon focused={focused} /> }}
      >
        {() => (
          <ProfileScreen
            onSettings={() => rootNav.navigate('Settings')}
            onSupport={() => rootNav.navigate('Support')}
            onNotifications={() => rootNav.navigate('Notifications')}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export function MainNavigator({ navigation }: { navigation: { navigate: (a: string, b?: object) => void } }) {
  const user = useAuthStore((s) => s.user);
  const isTutor = user?.role === 'tutor';
  useSupportUnreadRefresh();
  useSupportUnreadPoll();

  return (
    <>
      <ApprovalStatusNotifier />
      {isTutor ? <TutorTabs rootNav={navigation} /> : <StudentTabs rootNav={navigation} />}
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.cleanWhite,
    borderTopColor: colors.outlineGrey,
    borderTopWidth: 1,
    paddingTop: spacing.xs,
    shadowColor: colors.electricAzure,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  tabBarLabel: { ...typography.caption, fontWeight: '500' },
  tabIcon: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  tabBadge: {
    position: 'absolute',
    top: -4,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.alertCoral,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeText: { ...typography.caption, color: colors.cleanWhite, fontSize: 10, fontWeight: '600' },
});
