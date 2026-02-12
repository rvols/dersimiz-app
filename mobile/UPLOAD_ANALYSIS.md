# Profile picture (avatar) upload – analysis and fix

## Summary

- **Backend:** `POST /api/v1/profile/avatar` (multipart, field name `avatar`) is implemented and stores the file under `uploads/`, then saves the URL in `profiles.avatar_url`.
- **Mobile:** `pickAndUploadAvatar()` in `src/services/avatar.ts` uses `expo-image-picker` and sends a `FormData` with `{ uri, name, type }` to the API.

## Issue

Upload could fail on React Native when the client sends multipart requests with a **manually set** `Content-Type: multipart/form-data` header. That prevents the runtime from adding the **boundary** parameter (e.g. `multipart/form-data; boundary=----WebKitFormBoundary...`). Without the boundary, the server cannot parse the parts and the request fails or is rejected.

## Fix applied

1. **Do not set `Content-Type`** for the avatar request so the client (axios / React Native) can set `multipart/form-data` **with** the correct boundary.
2. In `avatar.ts`, the request is sent with `headers: { 'Content-Type': undefined }` and `transformRequest: (d) => d` so the body is sent as-is and the runtime sets the header.
3. Response handling supports both wrapped (`data.data.avatar_url`) and unwrapped (`data.avatar_url`) shapes for compatibility.

## References

- BACKEND: `api/src/routes/profile.ts` – `POST /avatar`, multer `upload.single('avatar')`.
- MOBILE: `mobile/src/services/avatar.ts` – `pickAndUploadAvatar()`.
- TEST_SESSION_REPORT.md, IMPLEMENTATION_CHECKLIST.md – note “Upload profile photo” and avatar upload flow.

## How to verify

1. Run API and mobile app (same network).
2. Log in as tutor or student, go to Profile.
3. Tap the avatar area, allow gallery permission, pick a photo, crop if needed.
4. Confirm the new photo appears and is persisted (reopen app or refresh profile).

If upload still fails, check: API `BASE_URL` and `UPLOAD_DIR`, CORS, and that the request body is actually multipart (e.g. in network inspector).
