
Issue summary:
- The missing-secret problem is solved.
- The current failure is different: Google is now responding with `400 INVALID_ARGUMENT` and message `Request contains an invalid argument.`
- That points to a bad Google request/config value, most likely `GOOGLE_CSE_CX` or the search engine settings, not the dialog itself.

Plan

1. Tighten the backend validation
- Update `supabase/functions/google-image-search/index.ts` to validate and normalize the secrets before calling Google.
- Trim `GOOGLE_CSE_KEY`, `GOOGLE_CSE_CX`, and `query`.
- Detect obvious bad `cx` values early and return a clearer setup error such as `invalid_cx_config` instead of generic `google_api_error`.

2. Improve Google error mapping
- Keep the existing `not_configured` and `referer_blocked` handling.
- Add explicit handling for Google `400 badRequest / INVALID_ARGUMENT` so the UI can show “search engine setup is invalid” instead of only “검색중 오류가 발생했습니다”.
- Include safe debugging detail in the response code/message without exposing secrets.

3. Make the dialog show setup guidance inline
- Update `SetSongScoreDialog.tsx` so `invalid_cx_config` and similar setup errors are treated like admin configuration issues.
- Show a clear inline notice telling the admin to verify:
  - `GOOGLE_CSE_CX` is the exact Search Engine ID
  - “Search the entire web” is enabled
  - “Image search” is enabled in the Programmable Search Engine

4. Correct the external Google configuration
- Re-enter `GOOGLE_CSE_CX` using the exact engine ID value only.
- Verify the engine itself supports image search.
- If needed, recreate the search engine cleanly and replace only the `cx` secret.

5. Verify end-to-end
- Test with a normal Korean query in the dialog.
- Confirm setup errors render as inline guidance.
- Confirm valid config returns image thumbnails and selection works.

Technical details
- Current evidence:
  - Edge function logs: Google returns `400`, reason `badRequest`, status `INVALID_ARGUMENT`
  - Client receives `{"error":"google_api_error","message":"Request contains an invalid argument."}`
- Most likely causes:
  - `GOOGLE_CSE_CX` contains the wrong value, extra whitespace, or copied metadata instead of the raw engine ID
  - the Google Programmable Search Engine is not configured for image search
- Files to update:
  - `supabase/functions/google-image-search/index.ts`
  - `src/components/SetSongScoreDialog.tsx`

Expected outcome
- No more opaque generic error for this case.
- Clear distinction between:
  - missing secrets,
  - blocked API key,
  - invalid search engine setup.
- Search works once the `cx` and engine settings are corrected.
