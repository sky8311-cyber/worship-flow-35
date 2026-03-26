

## Fix: Edge Function Timeout During AI Content Generation

### Root Cause

The Supabase Edge Function has a **platform-enforced execution time limit** (~60-150 seconds). The Anthropic API call generating 8-9 pages + quiz with `max_tokens: 16384` routinely exceeds this. The 300s client-side timeout is irrelevant — the **server kills the function** before it finishes, causing "Failed to fetch" on the client.

### Solution: Stream the Anthropic Response

Enable Anthropic's streaming API in the edge function and pipe chunks directly to the client as they arrive. This keeps the HTTP connection alive with continuous data flow, preventing both the edge function wall-clock timeout and browser idle-connection timeouts.

### Changes

**File 1: `supabase/functions/institute-generate-content/index.ts`**

- Add `stream: true` to the Anthropic API request body
- Read the SSE stream from Anthropic, accumulating `content_block_delta` text chunks
- After the stream completes (`message_stop`), parse the full accumulated text as JSON (with existing repair logic)
- Replace image placeholders and return the final JSON as before
- Remove the retry loop (streaming eliminates truncation from edge function timeout; `max_tokens` truncation is still handled by repair logic)

Key streaming logic:
```typescript
// In the Anthropic fetch call:
body: JSON.stringify({
  model: AI_CONFIG.model,
  max_tokens: MAX_TOKENS,
  stream: true,  // <-- Enable streaming
  messages: [...],
  system: SYSTEM_PROMPT,
})

// Read the stream, accumulate text:
const reader = aiResponse.body.getReader();
const decoder = new TextDecoder();
let fullText = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const chunk = decoder.decode(value);
  // Parse SSE events, extract text from content_block_delta
  for (const line of chunk.split('\n')) {
    if (line.startsWith('data: ')) {
      const event = JSON.parse(line.slice(6));
      if (event.type === 'content_block_delta') {
        fullText += event.delta?.text || '';
      }
    }
  }
}
// Then parse fullText as JSON using existing repair logic
```

**File 2: `src/components/institute/faculty/BulkUploadPanel.tsx`** — No changes needed (already has 300s timeout which is sufficient for streaming).

### Why Not Other Approaches

- **Queue-based**: Over-engineered for this case; requires new DB table, polling UI, background worker
- **Splitting into parallel requests**: Complex prompt engineering to split/merge content coherently
- **Streaming to client**: Not needed — we just need the edge function to stay alive; the final JSON response format stays the same

### Risk

- Minimal: streaming is a well-supported Anthropic feature. The edge function still returns the same JSON shape. No client changes needed.

