import type { UserRole } from '../types/api';

export type AuthStackParamList = {
  PhoneInput: undefined;
  OTPVerification: { phoneNumber: string; countryCode: string; sessionToken?: string };
  LegalAgreements: undefined;
  RoleSelection: undefined;
  Onboarding: undefined;
};

export type MainTabsParamList = {
  Dashboard: undefined;
  Second: undefined; // Students or Search
  Chat: undefined;
  Profile: undefined;
};

export type TutorSecondStackParamList = {
  Students: undefined;
  LessonDetail: { lessonId: string };
  Availability: undefined;
};

export type StudentSecondStackParamList = {
  Search: undefined;
  Favorites: undefined;
  TutorProfile: { tutorId: string };
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Onboarding: undefined;
  ChatThread: { conversationId: string; otherName: string };
  Support: undefined;
  Subscription: undefined;
  Transactions: undefined;
  Boosters: undefined;
  Notifications: undefined;
  Settings: undefined;
  Lessons: undefined;
  Availability: undefined;
  SchoolTypesGrades: undefined;
};

export type ChatThreadParams = RootStackParamList['ChatThread'];

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
    interface AuthParamList extends AuthStackParamList {}
  }
}
