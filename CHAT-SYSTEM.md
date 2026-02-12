# Dersimiz Chat System – Design & Scenarios

## Overview

The chat system enables **student–tutor** conversations. Only students can initiate conversations; tutors respond. Messages support text, contact sharing, and demo requests.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/chat/conversations` | Create conversation (student only, body: `tutor_id`) |
| GET | `/api/v1/chat/conversations` | List user's conversations |
| GET | `/api/v1/chat/conversations/:id` | Get single conversation |
| GET | `/api/v1/chat/conversations/:id/messages` | List messages (pagination: `?limit=50&before=msg_id`) |
| POST | `/api/v1/chat/conversations/:id/messages` | Send text (body: `type`, `content`, `payload`) |
| POST | `/api/v1/chat/conversations/:id/read` | Mark messages as read |
| POST | `/api/v1/chat/conversations/:id/share-contact` | Share phone number |
| POST | `/api/v1/chat/conversations/:id/demo-request` | Send demo request (body: `lesson_type_id`, `preferred_times`) |

## Scenarios

### 1. Student starts conversation

1. Student finds tutor (Search / Favorites).
2. Student taps "Chat" → `POST /chat/conversations` with `tutor_id`.
3. API creates or returns existing conversation.
4. Student navigates to `ChatThreadScreen` with `conversationId`.

### 2. Student sends text message

1. Student types in input and taps Send.
2. `POST /chat/conversations/:id/messages` with `type: 'text'`, `content`.
3. Content is moderated (`moderateText`). If blocked → `CONTENT_BLOCKED`.
4. Message stored; `last_message_at` updated.
5. **Missing:** No notification inserted for tutor. Recommend: when tutor has `new_message` pref, insert `notifications_log` with `type: 'new_message'` and `data: { conversation_id, sender_id }`.

### 3. Tutor sends text message

1. Same flow as student.
2. **Missing:** No notification for student. Same recommendation.

### 4. Student shares contact

1. Student taps "Share contact" → `POST /chat/conversations/:id/share-contact`.
2. Phone number from profile or body.
3. Message type `contact_share` with `payload.phone_number`.
4. **Missing:** No `new_student_contact` notification for tutor.

### 5. Student sends demo request

1. Student selects lesson type and taps Send → `POST /chat/conversations/:id/demo-request`.
2. Message type `demo_request`, payload `{ lesson_type_id, preferred_times }`.
3. **Missing:** No notification for tutor.

### 6. Mark as read

1. User opens chat thread.
2. `POST /chat/conversations/:id/read` marks other party's messages as read.
3. `read_at` set on messages where `sender_id != current_user`.

## Mobile App Flow

- **ChatListScreen:** Lists conversations via `GET /chat/conversations`. Shows other user, last message preview.
- **ChatThreadScreen:** Loads messages, supports text, Share contact, Demo request. Calls `/read` on load.
- **Design:** User bubbles (me) = Electric Azure, white text. Other bubbles = Mist Blue + Carbon Text. Matches design system.

## Gaps & Recommendations

1. **New message notifications:** When user A sends a chat message to user B, insert `notifications_log` for user B if their `new_message` preference is on. Use `type: 'new_message'`, `data: { conversation_id, sender_id, message_type }`. This enables push notifications and in-app badges.
2. **New student contact:** When student shares contact, consider `new_student_contact` notification for tutor (if pref on).
3. **Demo request:** Consider notification for tutor when demo request is sent.
4. **Chat tab badge:** Like support, add unread count badge on Chat tab when user has unread messages (conversations with `read_at IS NULL` for messages they didn't send).
5. **Real-time:** Current design is pull-based. For real-time updates, consider WebSockets or polling when app is foregrounded.

## Database Schema

- `conversations`: tutor_id, student_id, last_message_at, created_at, updated_at.
- `messages`: conversation_id, sender_id, type (text, contact_share, demo_request), content, payload, moderation_status, read_at, created_at.

## Message Types

| Type | Sender | Content | Payload |
|------|--------|---------|---------|
| text | any | body text | - |
| contact_share | any | - | `{ phone_number }` |
| demo_request | student | - | `{ lesson_type_id, preferred_times }` |
