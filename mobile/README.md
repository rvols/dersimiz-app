# Dersimiz Mobile App

Single React Native (Expo) app for **tutors** and **students**, aligned with the Dersimiz product spec, design system, and backend API.

## Stack

- **Expo** (SDK 54) + TypeScript
- **React Navigation** (native stack + bottom tabs)
- **Zustand** (auth, locale)
- **Axios** (API client with auth refresh)
- **i18next** (tr/en)
- **expo-secure-store** (tokens)
- **expo-notifications** (push: token in verify-otp, handle open → Chat/Support)
- **expo-image-picker** (avatar upload)

## Design

- Light theme only (per design-system.md)
- **Electric Azure** (#2563EB) primary; **Spark Orange** / **Calm Teal** for student/tutor accents
- Cards with blue-tinted shadows; 16px radius; Outfit/System typography

## Structure

```
src/
  theme/           # colors, typography, spacing
  types/           # API types
  services/        # api.ts (axios + auth interceptors)
  store/           # useAuthStore, useLocaleStore
  i18n/            # en.json, tr.json
  components/ui/   # Button, Card, Input
  screens/
    auth/          # PhoneInput, OTP, Legal, RoleSelection
    onboarding/    # OnboardingScreen (tutor/student steps, photo upload)
    main/          # Dashboards, Students, Search, Favorites, Chat list, Profile
    chat/          # ChatThreadScreen (share contact, demo request)
    support/       # SupportScreen (subject on first message)
    settings/      # SettingsScreen (language, notification prefs)
    subscription/  # SubscriptionScreen
    boosters/      # BoostersScreen
    notifications/ # NotificationsScreen (mark read on open)
    tutor/         # LessonsScreen, AvailabilityScreen
  services/        # api, avatar, notifications
  navigation/      # Auth, Main (tabs by role), Root
```

## Auth flow

1. **PhoneInput** → **OTPVerification** (request-otp, verify-otp).
2. If `requires_legal_accept` → **LegalAgreements** (legal/required, legal/accept).
3. If new user → **RoleSelection** (tutor/student).
4. If `!onboarding_completed` → **Onboarding** (role-specific steps).
5. Else → **Main** (tabs).

Token refresh on 401; logout clears tokens and shows Auth.

## Role-specific tabs

- **Tutor:** Dashboard (manage lessons, set availability) | Students | Chat | Profile (Lessons, Availability, Subscription, Boosters, Support, Notifications, Settings).
- **Student:** Dashboard (Find tutors → Search tab) | Search | Chat | Favorites | Profile (Support, Notifications, Settings).

## API base URL

Set `EXPO_PUBLIC_API_URL` (e.g. `https://api.dersimiz.com`) or defaults to `http://localhost:3000`. All requests use `/api/v1`.

## Run

```bash
npm install
npm start
# Then: iOS simulator, Android emulator, or Expo Go
```

## Implemented (everything except payments)

- **Auth:** phone + OTP, legal agreements, role selection, onboarding (tutor 8 steps / student 7 steps with location, school, lesson interests, photo).
- **Push:** device token + device_info in verify-otp; notification open → ChatThread or Support.
- **Avatar:** pick & upload (profile + onboarding photo step); POST /profile/avatar.
- **Tutor:** dashboard (manage lessons, set availability), students list, **Lessons** (CRUD), **Availability** (weekly slots), chat, profile (completeness, edit name, delete account), subscription/boosters/support/notifications/settings.
- **Student:** dashboard (Find tutors → Search tab), search (lesson type, favorites toggle, open chat, request demo), favorites, chat, profile, support/notifications/settings.
- **Chat:** list, thread, send text; CONTENT_BLOCKED handling; **Share contact** and **Request demo** (lesson type modal) with API.
- **Support:** conversation, optional subject on first message.
- **Notifications:** in-app list; mark as read when opening screen; preferences in Settings (locale + toggles).
- **Onboarding:** persisted steps (GET/POST onboarding/status, step); location (country/city/district), school type/school, photo upload.

**Not implemented:** IAP (Apple/Google) and backend iap/verify only.
