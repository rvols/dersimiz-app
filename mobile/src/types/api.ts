/**
 * API types matching backend (API-BACKEND-MOBILE.md)
 */

export type UserRole = 'tutor' | 'student';

export interface User {
  id: string;
  phone_number: string;
  country_code?: string;
  role: UserRole | null;
  full_name: string | null;
  school_name: string | null;
  avatar_url: string | null;
  is_approved: boolean;
  is_banned?: boolean;
  onboarding_completed: boolean;
  created_at?: string;
  updated_at?: string;
}

export type NextStep = 'legal_agreements' | 'role_selection' | 'onboarding' | 'dashboard';

export interface VerifyOtpResponse {
  is_new_user: boolean;
  access_token: string;
  refresh_token: string;
  user: User;
  requires_legal_accept?: boolean;
  next_step: NextStep;
}

export interface Conversation {
  id: string;
  other: { id: string; full_name: string | null; avatar_url: string | null; role: UserRole };
  last_message: { type: string; content?: string } | null;
  last_message_at: string | null;
}

export type MessageType = 'text' | 'contact_share' | 'demo_request' | 'system';

export interface Message {
  id: string;
  sender_id: string;
  type: MessageType;
  content?: string | null;
  payload?: Record<string, unknown> | null;
  created_at: string;
  read_at?: string | null;
}

export interface LessonType {
  id: string;
  slug: string;
  name: Record<string, string>;
  sort_order?: number;
  is_active?: boolean;
}

export interface TutorLesson {
  id: string;
  lesson_type_id: string;
  lesson_type?: LessonType;
  price_per_hour_cents: number;
  currency: string;
}

export interface SubscriptionPlan {
  id: string;
  slug: string;
  display_name: Record<string, string>;
  description?: Record<string, string>;
  monthly_price_cents: number;
  yearly_price_cents: number;
  apple_product_id_monthly?: string;
  apple_product_id_yearly?: string;
  google_product_id_monthly?: string;
  google_product_id_yearly?: string;
  features?: string[];
  max_students?: number | null;
  search_visibility_boost?: number;
  profile_badge?: string | null;
  is_default?: boolean;
  icon?: string | null;
}

export interface Booster {
  id: string;
  slug: string;
  display_name: Record<string, string>;
  description?: Record<string, string>;
  price_cents: number;
  duration_days: number;
  search_ranking_boost: number;
  apple_product_id?: string | null;
  google_product_id?: string | null;
  badge_text?: Record<string, string> | null;
  icon?: string | null;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: { timestamp: string; request_id: string };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: { timestamp: string; request_id: string };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface LocationItem {
  id: string;
  parent_id?: string | null;
  type: string;
  name: Record<string, string>;
  code?: string | null;
  sort_order?: number;
}

export interface Grade {
  id: string;
  school_type_id: string;
  name: Record<string, string>;
  sort_order?: number;
}

export interface OnboardingData {
  locations: LocationItem[];
  school_types: Array<{ id: string; name: Record<string, string> }>;
  grades?: Grade[];
  lesson_types: LessonType[];
}

export interface LegalDocument {
  id: string;
  type: string;
  version: number;
  title: string;
  body_markdown: string;
}

export interface TutorSearchResult {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  lessons?: TutorLesson[];
  is_favorite?: boolean;
  availability_slots?: unknown[];
}
