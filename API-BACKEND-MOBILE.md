# Dersimiz API — Backend Reference for Mobile App

This document describes the **full REST API** of the Dersimiz backend so another agent or team can build a mobile app (iOS/Android) against it. It is intended to be **comprehensive**: every endpoint, auth flow, data shape, and error code is documented.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Base URL & Conventions](#2-base-url--conventions)
3. [Authentication](#3-authentication)
4. [Request / Response Format](#4-request--response-format)
5. [Error Codes & i18n](#5-error-codes--i18n)
6. [Rate Limiting & CORS](#6-rate-limiting--cors)
7. [Data Models (Summary)](#7-data-models-summary)
8. [Endpoints Reference](#8-endpoints-reference)
9. [Environment Variables (Server-Side Reference)](#9-environment-variables-server-side-reference)

---

## 1. Overview

- **Stack:** Node.js (≥20), Express, TypeScript, PostgreSQL.
- **Purpose:** Backend for a tutoring platform (Dersimiz): students find tutors, chat, request demos; tutors manage profile, lessons, availability, subscriptions; support, legal, and in-app purchases are supported.
- **Auth:** App users: **phone + OTP** → JWT access + refresh. Admin: **email + password** → admin JWT (web only; not needed for mobile).
- **Locale:** API supports `tr` and `en`. Send `Accept-Language: tr` or `en`; error messages may be translated. Default locale is `en`.

---

## 2. Base URL & Conventions

- **Base path:** All API routes are under `/api/v1`.
- **Example base URL:** `https://api.dersimiz.com` or `http://localhost:3000` (development).
- **Content-Type:** `application/json` for request bodies and responses.
- **Trailing slashes:** Not required; paths are as written below.
- **IDs:** All entity IDs are **UUIDs** (strings).

---

## 3. Authentication

### 3.1 App user (mobile)

1. **Request OTP:** `POST /api/v1/auth/request-otp` with `{ "phone_number": "+90...", "country_code": "TR" }`.
2. **Verify OTP:** `POST /api/v1/auth/verify-otp` with `{ "phone_number", "otp_code", "device_token?", "device_info?" }` → returns `access_token`, `refresh_token`, `user`, `next_step`, etc.
3. **Use access token:** For all protected routes, send header:
   ```http
   Authorization: Bearer <access_token>
   ```
4. **Refresh:** When access token expires, call `POST /api/v1/auth/refresh` with `{ "refresh_token": "..." }` → new `access_token`.
5. **Logout (optional):** `POST /api/v1/auth/logout` with optional `device_token` to deactivate that device for push.

- **Token type:** JWT. Access token payload: `{ sub: userId, role?, type: 'access' }`. Refresh: `{ sub: userId, type: 'refresh' }`.
- **Expiry:** Access default `1h`, refresh default `30d` (configurable via env).

### 3.2 Admin (web only)

- **Login:** `POST /api/v1/admin/auth/login` with `{ "email", "password" }` → `access_token` (admin JWT).
- **Admin routes:** All under `/api/v1/admin/*` (except `/api/v1/admin/auth/login`). Require header:
  ```http
  Authorization: Bearer <admin_access_token>
  ```
- Admin JWT payload: `{ sub: adminId, email, type: 'admin' }`. Not used by the mobile app.

---

## 4. Request / Response Format

### Success response

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-02-09T12:00:00.000Z",
    "request_id": "uuid"
  }
}
```

- `data` can be an object or array depending on the endpoint.

### Error response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message (may be localized)",
    "details": { ... }
  },
  "meta": {
    "timestamp": "2026-02-09T12:00:00.000Z",
    "request_id": "uuid"
  }
}
```

- `details` is optional (e.g. validation field errors).
- HTTP status is 4xx/5xx; always check both status and `error.code` for handling.

---

## 5. Error Codes & i18n

- **Locale:** Server uses `Accept-Language` to pick `tr` or `en` for error messages. Default `en`.
- **Common codes:**

| Code | HTTP | Description |
|------|------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid body/params; see `error.details` for field errors. |
| `NOT_FOUND` | 404 | Resource not found. |
| `FORBIDDEN` | 403 | No permission (e.g. wrong role). |
| `UNAUTHORIZED` | 401 | Missing or invalid token (auth). |
| `INVALID_TOKEN` | 401 | Token invalid/expired or wrong type. |
| `USER_NOT_FOUND` | 401 | User no longer exists. |
| `INVALID_OTP` | 400 | Wrong or expired OTP. |
| `EXPIRED_OTP` | 400 | OTP time window expired. |
| `TOO_MANY_ATTEMPTS` | 429 | OTP attempts exceeded. |
| `SMS_SEND_FAILED` | 503 | SMS provider error. |
| `CONTENT_BLOCKED` | 400 | Chat message blocked by AI moderation. |
| `PRODUCT_NOT_FOUND` | 400 | IAP product ID not recognized. |
| `RATE_LIMIT` | 429 | Too many requests. |
| `INTERNAL_ERROR` | 500 | Server error. |

---

## 6. Rate Limiting & CORS

- **Scope:** All routes under `/api/v1` are rate-limited.
- **Limit:** 1000 requests per hour per IP (configurable).
- **Response when exceeded:** HTTP 429, `error.code`: `RATE_LIMIT`.
- **CORS:** Enabled with `credentials: true`; allow your app origin when deploying.

---

## 7. Data Models (Summary)

- **profiles:** App users. Fields: `id`, `phone_number`, `country_code`, `role` (`'tutor' | 'student'`), `full_name`, `avatar_url`, `is_approved`, `is_banned`, `onboarding_completed`, `created_at`, `updated_at`, `deleted_at`.
- **conversations:** Chat between one tutor and one student. `tutor_id`, `student_id`, `last_message_at`, `created_at`, `updated_at`.
- **messages:** Chat messages. `id`, `conversation_id`, `sender_id`, `type` (`'text' | 'contact_share' | 'demo_request'`), `content`, `payload` (JSON), `moderation_status` (`'pending' | 'approved' | 'blocked' | 'flagged'`), `created_at`, `read_at`.
- **subscription_plans:** Plans for tutors. `id`, `slug`, `display_name` (JSONB i18n), `description` (JSONB), `monthly_price_cents`, `yearly_price_cents`, Apple/Google product IDs, `features` (JSONB), `max_students`, `search_visibility_boost`, `profile_badge`, `is_active`, `is_default`, `sort_order`, `icon`.
- **boosters:** One-off visibility boost products. `id`, `slug`, `display_name`/`description` (JSONB), `price_cents`, `duration_days`, `search_ranking_boost`, Apple/Google product IDs, `badge_text` (JSONB), `is_active`, `sort_order`, `icon`.
- **user_subscriptions:** User’s subscription. `user_id`, `plan_id`, `start_date`, `end_date`, `is_active`, `is_renewing`, `is_trial`, `billing_interval`, `billing_provider`, `provider_subscription_id`, `provider_transaction_id`, `provider_receipt`, etc.
- **user_boosters:** Active boosters. `user_id`, `booster_id`, `activated_at`, `expires_at`, `is_active`, `provider_transaction_id`, `provider_receipt`, `billing_provider`.
- **transactions:** Payments. `user_id`, `type` (e.g. `'subscription'`, `'booster'`), `amount_cents`, `currency`, `status`, `billing_provider`, `provider_transaction_id`, `provider_receipt`, `subscription_id`/`booster_id`, `created_at`.
- **tutor_lessons:** Tutor’s lesson types and prices. `tutor_id`, `lesson_type_id`, `price_per_hour_cents`, `currency`.
- **tutor_availability:** Tutor’s slots. `tutor_id`, `slots` (JSONB array).
- **lesson_types:** Master data. `id`, `slug`, `name` (JSONB i18n), `sort_order`, `is_active`.
- **locations:** Hierarchical (country, city, district). `id`, `parent_id`, `type`, `name` (JSONB), `code`, `sort_order`.
- **schools,** **school_types:** Master data for onboarding.
- **support_tickets,** **support_messages:** One ticket per user; messages from user or admin.
- **legal_documents:** Terms, privacy, cookie, usage policy. `type`, `version`, `title`, `body_markdown`, `published_at`.
- **user_agreements:** Records of user accepting legal documents.
- **student_favorites:** Student–tutor favorites. `student_id`, `tutor_id`.
- **onboarding_progress:** `user_id`, `current_step`, `data` (JSONB).
- **search_history:** Student search criteria. `student_id`, `criteria` (JSONB), `created_at`.
- **device_tokens:** Push tokens. `user_id`, `token`, `platform` (`'ios' | 'android'`), `device_info` (JSONB), `is_active`.
- **notification_preferences:** Per-user toggles and optional quiet hours.
- **notifications_log:** In-app notification history. `user_id`, `type`, `title`, `body`, `data` (JSONB), `read`, `sent_at`.

---

## 8. Endpoints Reference

### Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Health check. Returns `{ "status": "ok", "timestamp": "..." }`. |

---

### Auth (app user)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/auth/request-otp` | No | Send OTP to phone. |
| POST | `/api/v1/auth/verify-otp` | No | Verify OTP and get tokens + user. |
| POST | `/api/v1/auth/refresh` | No | Get new access token from refresh token. |
| POST | `/api/v1/auth/logout` | Bearer | Logout; optional `device_token` to deactivate. |

**POST /api/v1/auth/request-otp**

- Body: `{ "phone_number": "+901234567890", "country_code": "TR" }`.
- `phone_number`: E.164 format required.
- Response: `{ "data": { "message": "Verification code sent", "expires_in": 300, "retry_after": 60 } }`.
- If SMS not configured, backend uses demo code `123456`.

**POST /api/v1/auth/verify-otp**

- Body: `{ "phone_number": "+...", "otp_code": "123456", "country_code"?: "TR", "device_token"?: "...", "device_info"?: { "platform"?: "ios"|"android", "version"?: "...", "model"?: "..." } }`.
- Response: `{ "data": { "is_new_user", "access_token", "refresh_token", "user": { "id", "phone_number", "full_name", "role", "is_approved", "onboarding_completed", "avatar_url" }, "requires_legal_accept", "next_step" } }`.
- `next_step`: `"legal_agreements"` | `"role_selection"` | `"onboarding"` | `"dashboard"`.

**POST /api/v1/auth/refresh**

- Body: `{ "refresh_token": "..." }`.
- Response: `{ "data": { "access_token" } }`.

**POST /api/v1/auth/logout**

- Headers: `Authorization: Bearer <access_token>`.
- Body (optional): `{ "device_token": "..." }`.
- Response: `{ "data": { "message": "Logged out" } }`.

---

### Admin auth (web)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/admin/auth/login` | No | Admin login. |
| GET | `/api/v1/admin/auth/me` | Admin Bearer | Current admin. |

**POST /api/v1/admin/auth/login**

- Body: `{ "email": "...", "password": "..." }`.
- Response: `{ "data": { "access_token", "admin": { "id", "email", "full_name" } } }`.

---

### Public (no auth)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/subscription-plans` | No | List active subscription plans (for display/purchase). |
| GET | `/api/v1/boosters` | No | List active boosters. |
| GET | `/api/v1/onboarding/data` | No | Locations, school types, schools, lesson types (for onboarding forms). |
| GET | `/api/v1/legal/public` | No | Latest legal documents (terms, privacy, etc.) for display. |

**GET /api/v1/subscription-plans**

- Response: `{ "data": { "plans": [ { "id", "slug", "display_name", "description", "monthly_price_cents", "yearly_price_cents", "apple_product_id_monthly", "apple_product_id_yearly", "google_product_id_monthly", "google_product_id_yearly", "features", "max_students", "search_visibility_boost", "profile_badge", "is_default", "icon" }, ... ] } }`.

**GET /api/v1/boosters**

- Response: `{ "data": { "boosters": [ { "id", "slug", "display_name", "description", "price_cents", "duration_days", "search_ranking_boost", "apple_product_id", "google_product_id", "badge_text", "icon" }, ... ] } }`.

**GET /api/v1/onboarding/data**

- Response: `{ "data": { "locations": [...], "school_types": [...], "schools": [...], "lesson_types": [...] } }`. Each location/school/lesson_type has `id`; names are JSONB (e.g. `{ "tr": "...", "en": "..." }`).

**GET /api/v1/legal/public**

- Response: `{ "data": { "documents": [ { "id", "type", "version", "title", "body_markdown" }, ... ] } }`. Types: `terms_and_conditions`, `privacy_notice`, `cookie_policy`, `acceptable_usage_policy`.

---

### Profile (Bearer)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/profile` | Bearer | Current user profile. |
| PUT | `/api/v1/profile` | Bearer | Update `full_name`, `role` (`tutor`\|`student`). |
| POST | `/api/v1/profile/avatar` | Bearer | Upload avatar (multipart form: `avatar` file). |
| DELETE | `/api/v1/profile` | Bearer | Soft-delete account. |
| GET | `/api/v1/profile/completeness` | Bearer | Tutor profile completeness 0–100 and details. |

**GET /api/v1/profile**

- Response: `{ "data": { "user": { "id", "phone_number", "country_code", "role", "full_name", "avatar_url", "is_approved", "is_banned", "onboarding_completed", "created_at", "updated_at" } } }`. Avatar URL is absolute (uses `BASE_URL` + `/uploads/...`).

**PUT /api/v1/profile**

- Body: `{ "full_name"?: string, "role"?: "tutor" | "student" }`. Only provided fields are updated.

**POST /api/v1/profile/avatar**

- Content-Type: `multipart/form-data`; field name: `avatar`. Max file size 5MB.
- Response: `{ "data": { "avatar_url": "https://..." } }`.

---

### Me (settings, subscription, notifications) — Bearer

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/me/settings` | Bearer | Profile + notification preferences. |
| GET | `/api/v1/me/subscription` | Bearer | Current subscription + active boosters. |
| GET | `/api/v1/me/transactions` | Bearer | Last 50 transactions. |
| GET | `/api/v1/me/notification-preferences` | Bearer | Notification toggles + quiet hours. |
| PUT | `/api/v1/me/notification-preferences` | Bearer | Update preferences. |
| GET | `/api/v1/me/notifications` | Bearer | In-app notification list. |
| PUT | `/api/v1/me/notifications/:id/read` | Bearer | Mark notification read. |

**GET /api/v1/me/settings**

- Response: `{ "data": { "profile": { ... }, "notification_preferences": { "new_message", "approval_status", "subscription_update", "booster_update", "new_student_contact", "support_reply", "quiet_hours_start", "quiet_hours_end" } } }`.

**GET /api/v1/me/subscription**

- Response: `{ "data": { "current_subscription": { "id", "plan", "start_date", "end_date", "is_active", "is_renewing", "is_trial", "billing_interval", "billing_provider" } | null, "active_boosters": [ { "id", "booster", "activated_at", "expires_at", "is_active" }, ... ] } }`.

**GET /api/v1/me/transactions**

- Response: `{ "data": { "transactions": [ { "id", "type", "amount_cents", "currency", "status", "billing_provider", "created_at" }, ... ], "total": N } }`.

**PUT /api/v1/me/notification-preferences**

- Body: any subset of `new_message`, `approval_status`, `subscription_update`, `booster_update`, `new_student_contact`, `support_reply`, `quiet_hours_start`, `quiet_hours_end`. Times as `"HH:mm"` or null.

**GET /api/v1/me/notifications**

- Query: `limit` (default 20, max 50).
- Response: `{ "data": { "notifications": [ { "id", "type", "title", "body", "data", "read", "sent_at" }, ... ] } }`.

---

### Onboarding (Bearer)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/onboarding/status` | Bearer | Current step and saved data. |
| POST | `/api/v1/onboarding/step` | Bearer | Save step progress; optionally mark onboarding completed. |

**GET /api/v1/onboarding/status**

- Response: `{ "data": { "current_step": number, "data": { ... }, "onboarding_completed": boolean } }`.

**POST /api/v1/onboarding/step**

- Body: `{ "step": number, "data": { ... }, "completed"?: boolean }`. Merges `data` into existing; if `completed` true, sets `onboarding_completed` on profile.

---

### Tutor (Bearer, role = tutor)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/tutor/dashboard` | Bearer (tutor) | Dashboard stats. |
| GET | `/api/v1/tutor/students` | Bearer (tutor) | Students with conversations. |
| GET | `/api/v1/tutor/lessons` | Bearer (tutor) | Tutor’s lesson offerings. |
| POST | `/api/v1/tutor/lessons` | Bearer (tutor) | Add/update lesson (upsert by lesson_type_id). |
| GET | `/api/v1/tutor/lessons/:id` | Bearer (tutor) | One lesson. |
| PUT | `/api/v1/tutor/lessons/:id` | Bearer (tutor) | Update price/currency. |
| DELETE | `/api/v1/tutor/lessons/:id` | Bearer (tutor) | Remove lesson. |
| GET | `/api/v1/tutor/availability` | Bearer (tutor) | Get slots. |
| PUT | `/api/v1/tutor/availability` | Bearer (tutor) | Set slots (JSON array). |
| GET | `/api/v1/tutor/subscription` | Bearer (tutor) | Current subscription. |
| POST | `/api/v1/tutor/subscription` | Bearer (tutor) | Stub; use IAP + verify. |
| GET | `/api/v1/tutor/boosters` | Bearer (tutor) | Active boosters. |
| POST | `/api/v1/tutor/boosters` | Bearer (tutor) | Stub; use IAP + verify. |

**GET /api/v1/tutor/dashboard**

- Response: `{ "data": { "impressions", "contacts", "lesson_count", "profile_completeness", "subscription_status", "profile" } }`.

**POST /api/v1/tutor/lessons**

- Body: `{ "lesson_type_id": "uuid", "price_per_hour_cents": number, "currency"?: "TRY" }`. Upserts by (tutor_id, lesson_type_id).

**PUT /api/v1/tutor/availability**

- Body: `{ "slots": [ ... ] }`. Any JSON array structure (backend stores as-is).

---

### Student (Bearer, role = student)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/student/dashboard` | Bearer (student) | Dashboard counts. |
| POST | `/api/v1/student/search` | Bearer (student) | Search tutors (saves to history). |
| GET | `/api/v1/student/favorites` | Bearer (student) | Favorite tutors with lessons. |
| GET | `/api/v1/student/search/history` | Bearer (student) | Search history. |
| GET | `/api/v1/student/tutors` | Bearer (student) | Tutors with existing conversation. |
| POST | `/api/v1/student/favorites/:tutorId` | Bearer (student) | Add favorite. |
| DELETE | `/api/v1/student/favorites/:tutorId` | Bearer (student) | Remove favorite. |

**POST /api/v1/student/search**

- Body: `{ "lesson_type_id"?, "location_id"?, "weekly_lesson_count"?, "availability"? }`. All optional; filters applied where implemented (e.g. lesson_type_id). Criteria saved to search_history.
- Response: `{ "data": { "tutors": [ { "id", "full_name", "avatar_url", "role", "lessons": [...], "is_favorite", "availability_slots" }, ... ] } }`. Only approved tutors with at least one lesson are returned; limit 50.

---

### Chat (Bearer)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/chat/conversations` | Bearer | Create or get conversation (student → tutor). |
| GET | `/api/v1/chat/conversations` | Bearer | List conversations. |
| GET | `/api/v1/chat/conversations/:id` | Bearer | One conversation. |
| GET | `/api/v1/chat/conversations/:id/messages` | Bearer | Messages (paginated). |
| POST | `/api/v1/chat/conversations/:id/messages` | Bearer | Send message (text or other type). |
| POST | `/api/v1/chat/conversations/:id/read` | Bearer | Mark as read. |
| POST | `/api/v1/chat/conversations/:id/share-contact` | Bearer | Send contact_share message. |
| POST | `/api/v1/chat/conversations/:id/demo-request` | Bearer | Send demo_request message. |

**POST /api/v1/chat/conversations**

- Body: `{ "tutor_id": "uuid" }`. Only students can create. Returns `{ "data": { "conversation": { "id" }, "created": true|false } }`.

**GET /api/v1/chat/conversations**

- Response: `{ "data": { "conversations": [ { "id", "other": { "id", "full_name", "avatar_url", "role" }, "last_message", "last_message_at" }, ... ] } }`.

**GET /api/v1/chat/conversations/:id/messages**

- Query: `limit` (default 50, max 100), `before` (message id for cursor).
- Response: `{ "data": { "messages": [ { "id", "sender_id", "type", "content", "payload", "created_at", "read_at" }, ... ], "has_more": boolean } }`. Ordered oldest first in array.

**POST /api/v1/chat/conversations/:id/messages**

- Body: `{ "type"?: "text", "content"?: string, "payload"?: object }`. For text, `content` is required; it is moderated (Gemini 2.5 Flash). If blocked, returns 400 `CONTENT_BLOCKED`. Other types: e.g. use share-contact or demo-request endpoints.
- Response: `{ "data": { "message": { "id", "sender_id", "type", "content", "payload", "created_at" } } }`.

**POST /api/v1/chat/conversations/:id/share-contact**

- Body: `{ "phone_number"?: string }`. If omitted, uses profile phone. Inserts message type `contact_share` with `payload: { "phone_number" }`.

**POST /api/v1/chat/conversations/:id/demo-request**

- Body: `{ "lesson_type_id"?, "preferred_times"?: [] }`. Inserts message type `demo_request` with payload.

---

### Support (Bearer)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/support/conversation` | Bearer | Get or create ticket + messages. |
| POST | `/api/v1/support/messages` | Bearer | Send message (creates ticket if needed). |
| PUT | `/api/v1/support/conversation/status` | Bearer | Set ticket status. |

**GET /api/v1/support/conversation**

- Response: `{ "data": { "ticket": { "id", "status", "subject", "created_at" }, "messages": [ { "id", "body", "is_admin", "created_at" }, ... ] } }`. One ticket per user; created on first get if missing.

**POST /api/v1/support/messages**

- Body: `{ "body": string, "subject"?: string }`.

**PUT /api/v1/support/conversation/status**

- Body: `{ "status": "open" | "replied" | "closed" }`.

---

### IAP (Bearer)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/iap/verify` | Bearer | Verify in-app purchase (subscription or booster). |

**POST /api/v1/iap/verify**

- Body: `{ "platform": "apple" | "google", "receipt": string, "transaction_id": string, "product_id": string, "package_name"?: string }`. `transaction_id` must be unique; duplicate returns `already_processed: true`.
- If `product_id` matches a subscription plan (Apple/Google monthly or yearly), creates/extends subscription and transaction.
- If `product_id` matches a booster, creates user_booster and transaction.
- Response: `{ "data": { "verified": true, "already_processed"?: true, "subscription"?: { "id", "plan" }, "booster"?: { "id", "expires_at" } } }` or 400 `PRODUCT_NOT_FOUND`.

---

### Legal (Bearer where noted)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/legal/required` | Bearer | Documents user must accept (not yet accepted). |
| POST | `/api/v1/legal/accept` | Bearer | Record acceptance of documents. |
| GET | `/api/v1/legal/public` | No | Latest legal documents (see Public). |

**GET /api/v1/legal/required**

- Response: `{ "data": { "required_documents": [ { "id", "type", "version", "title", "body_markdown" }, ... ] } }`.

**POST /api/v1/legal/accept**

- Body: `{ "document_ids": [ "uuid", ... ] }`. Records user agreement (IP stored). Response: `{ "data": { "accepted_count", "accepted_documents": [...] } }`.

---

### Admin (Admin Bearer)

All under `/api/v1/admin` (and all except login use admin JWT). Summary:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/admin/stats` | Dashboard stats (users, tutors, students, pending, revenue_cents). |
| GET | `/api/v1/admin/users` | List users (query: page, limit, role, status). |
| POST | `/api/v1/admin/users/:id/approve` | Approve user. |
| POST | `/api/v1/admin/users/:id/reject` | Reject (body: reason?). |
| POST | `/api/v1/admin/users/:id/ban` | Ban user. |
| GET | `/api/v1/admin/support-tickets` | List tickets. |
| POST | `/api/v1/admin/support-tickets/:id/reply` | Reply (body: body). |
| GET/POST/PUT | `/api/v1/admin/subscription-plans` | CRUD plans. |
| GET | `/api/v1/admin/boosters` | List boosters. |
| GET | `/api/v1/admin/subscriptions` | List user subscriptions. |
| GET | `/api/v1/admin/transactions` | List transactions. |
| GET | `/api/v1/admin/legal` | Legal index by type. |
| POST | `/api/v1/admin/legal` | Create legal doc (type, title, body_markdown). |
| GET | `/api/v1/admin/legal/:id` | Document + acceptances. |
| GET/POST/PUT | `/api/v1/admin/lesson-types` | Lesson types. |
| GET/POST | `/api/v1/admin/locations` | Locations. |
| GET/POST | `/api/v1/admin/schools`, `/api/v1/admin/school-types` | Schools. |

Admin routes are for the web dashboard; the mobile app does not use admin auth.

---

## 9. Environment Variables (Server-Side Reference)

For the team running the backend (not for the mobile client). Mobile app only needs **base URL** and **auth tokens**.

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | No | development / production |
| `PORT` | No | Default 3000 |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection (e.g. Redis Cloud with credentials in URL) |
| `JWT_SECRET` | Yes | Secret for app JWTs |
| `JWT_ACCESS_EXPIRY` | No | e.g. 1h |
| `JWT_REFRESH_EXPIRY` | No | e.g. 30d |
| `ADMIN_JWT_SECRET` | Yes | Secret for admin JWTs |
| `ADMIN_JWT_EXPIRY` | No | e.g. 8h |
| `VATAN_SMS_API_ID` | No | If set, real OTP via Vatan SMS |
| `VATAN_SMS_API_KEY` | No | |
| `VATAN_SMS_SENDER` | No | |
| `GEMINI_API_KEY` | No | If set, chat text messages are moderated with Gemini 2.5 Flash |
| `UPLOAD_DIR` | No | Default ./uploads |
| `BASE_URL` | No | Base URL for avatar links (e.g. https://api.dersimiz.com) |

---

## Quick checklist for mobile app

- Use **base URL** + `/api/v1` for all API calls.
- Implement **request-otp** → **verify-otp** → store **access_token** and **refresh_token**.
- Send **Authorization: Bearer &lt;access_token&gt;** on every protected request.
- On 401, try **refresh**; on refresh failure, redirect to login (re-verify OTP if needed).
- Send **Accept-Language: tr** or **en** for localized errors.
- After verify-otp, follow **next_step** (legal → role → onboarding → dashboard).
- Call **legal/required** and **legal/accept** when `requires_legal_accept` is true.
- Register **device_token** and **device_info** in verify-otp for push (backend stores in device_tokens).
- Use **subscription-plans** and **boosters** for product IDs; after purchase, call **iap/verify** with platform, receipt, transaction_id, product_id.
- Text chat messages are moderated; handle **CONTENT_BLOCKED** (400) and show a friendly message.
- Avatar URLs returned by the API are absolute; use as-is for display.

This document reflects the backend as of the last update. For schema details, see `api/src/db/schema.sql` in the repo.
