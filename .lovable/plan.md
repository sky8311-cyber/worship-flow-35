
User is asking: "I don't think I've ever set up the Google Image Search API."

This is a status question + implicit request to set it up. The 503 error confirms `GOOGLE_CSE_KEY` and `GOOGLE_CSE_CX` secrets are not configured. The edge function and UI are already built to handle this gracefully (showing the "관리자에게 API 설정을 요청하세요" notice), but the search itself won't work until secrets are added.

## Plan: Configure Google Custom Search API

To enable the Google image search feature in the score dialog, two secrets need to be added.

### What you need to obtain

**1. `GOOGLE_CSE_KEY` (API Key)**
- Go to https://console.cloud.google.com/apis/credentials
- Create a project (if needed) → Create Credentials → API Key
- Enable "Custom Search API" in the API Library

**2. `GOOGLE_CSE_CX` (Search Engine ID)**
- Go to https://programmablesearchengine.google.com/
- Create a new search engine
- Set "Search the entire web" ON
- Turn ON "Image search"
- Copy the Search engine ID (cx value)

### Implementation steps (after approval)

1. Use `add_secret` tool to request both secrets:
   - `GOOGLE_CSE_KEY`
   - `GOOGLE_CSE_CX`
2. Once you provide the values, the existing `google-image-search` edge function will pick them up automatically — no code changes needed.
3. Verify by opening 악보 dialog → search tab → run a query.

### Notes
- Free tier: 100 queries/day. Paid tier: $5 per 1,000 queries (max 10k/day).
- Both secrets are stored server-side only (never exposed to the browser).
- No code or DB changes required — the dialog and edge function are already wired.

### Quota protection (optional, recommended later)
Consider adding daily per-user query limits in the edge function to prevent quota exhaustion — can be added in a follow-up.
