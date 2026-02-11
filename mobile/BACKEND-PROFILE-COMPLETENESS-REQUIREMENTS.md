# Backend: Profile completeness & missing fields (for mobile)

This document describes what the mobile app expects from the backend to support the **Complete your profile** card on the tutor dashboard (progress %, missing items, and navigation).

## Current behavior (mobile)

- The tutor dashboard calls **GET /tutor/dashboard** and uses:
  - `profile_completeness`: number 0–100 (progress %).
  - `missing_fields`: optional array of string keys (see below). If present, the app shows a short list of what’s missing; otherwise it shows a generic “Boost your visibility” message.
- Tapping the card navigates the user to the **Profile** tab so they can edit profile, avatar, and use links to Lessons / Availability etc.

## Request: extend GET /tutor/dashboard response

Return (or keep) the following in the dashboard payload:

```json
{
  "data": {
    "profile_completeness": 75,
    "missing_fields": ["bio", "availability"]
  }
}
```

### `profile_completeness` (number, 0–100)

- Already used by the app.
- Should reflect how “complete” the tutor profile is for visibility (e.g. bio, avatar, lessons, availability, education).

### `missing_fields` (array of strings, optional)

- List of **keys** that indicate what is still missing.
- Mobile maps these to localized labels:

| Key             | EN (example)              | TR (example)           |
|-----------------|---------------------------|------------------------|
| `bio`           | Add a bio                 | Biyografi ekleyin      |
| `avatar`        | Add a profile photo       | Profil fotoğrafı ekleyin |
| `lessons`       | Add lesson types & pricing| Ders türü ve ücret ekleyin |
| `availability`  | Set your availability     | Müsaitlik ayarlayın    |
| `school_types`  | Add education & grades    | Eğitim ve sınıf ekleyin |

- Backend can decide which keys to return based on your own rules (e.g. “no bio” → include `"bio"`, “no availability slots” → include `"availability"`).
- If `missing_fields` is omitted or empty, the app still shows the progress bar and a generic message (“Boost your visibility to students” / “Tap to complete”).

## No new endpoints required

- The app only needs the above fields on the **existing** GET /tutor/dashboard response.
- No new API endpoints are required for this feature.

## Summary

1. **GET /tutor/dashboard**  
   - Keep or add `profile_completeness` (0–100).  
   - Add optional `missing_fields`: string array with keys like `bio`, `avatar`, `lessons`, `availability`, `school_types` (or your own convention; app will show the key if unknown).

2. **Calculation of completeness and missing_fields**  
   - Implement on the backend based on your profile model (e.g. has_bio, has_avatar, has_lessons, has_availability, has_education).  
   - Mobile only displays what you send; it does not compute completeness itself.

If you prefer different field names or more keys, the mobile app can be updated to map them; document the list and we can align the keys and labels.
