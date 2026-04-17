
Root cause: the backend function is now reaching Google, but the Google API key is restricted for browser referrers. Because this search runs from a backend function, Google sees the request as `referer <empty>` and rejects it with `API_KEY_HTTP_REFERRER_BLOCKED`. So this is no longer a missing-secret issue; it is a Google key restriction mismatch.

Plan

1. Harden the edge function error mapping
- Detect Google 403 responses caused by `API_KEY_HTTP_REFERRER_BLOCKED`.
- Return a structured JSON error code such as `referer_blocked` with the existing CORS headers.
- Keep `503 not_configured` only for missing `GOOGLE_CSE_KEY` / `GOOGLE_CSE_CX`.

2. Make the dialog handle setup-related 403s gracefully
- Update `SetSongScoreDialog` so both `not_configured` and `referer_blocked` are treated as admin setup problems.
- Show an inline notice instead of the generic “검색 중 오류가 발생했습니다” toast for this case.
- Keep the generic toast only for unexpected failures.

3. Fix the Google API key configuration
- Change the Google Custom Search API key restriction so it can be used from the backend function.
- Remove HTTP referrer restriction and switch to a server-compatible restriction approach.
- Confirm the Custom Search API is enabled and the programmable search engine ID is correct.

4. Verify end-to-end
- Open the 사용자 자료 검색 dialog.
- Confirm:
  - missing secrets still show the admin setup notice,
  - misrestricted key also shows the setup notice instead of crashing,
  - valid configuration returns image results normally.

Technical details
- Current failure source: Google returns `403 PERMISSION_DENIED` with `reason: API_KEY_HTTP_REFERRER_BLOCKED`.
- Why: browser-restricted API keys do not work from backend/edge requests.
- Files likely involved:
  - `supabase/functions/google-image-search/index.ts`
  - `src/components/SetSongScoreDialog.tsx`

Expected outcome
- No blank/error state from this Google setup problem.
- Clear admin-facing setup guidance in the UI.
- Search works once the Google key restriction is corrected.
