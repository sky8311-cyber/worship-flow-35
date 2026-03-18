

## AI Usage Tracking System

### Database Migration
Create two tables:

**ai_usage_log** — append-only event log
- `id` UUID PK, `user_id` UUID references auth.users NOT NULL, `action_type` TEXT NOT NULL, `created_at` TIMESTAMPTZ DEFAULT now()

**ai_usage_summary** — per-user aggregate
- `user_id` UUID PK references auth.users, `total_uses` INTEGER DEFAULT 0, `last_used_at` TIMESTAMPTZ

**RLS**: Both tables get RLS enabled. Users can SELECT their own rows only. No INSERT/UPDATE/DELETE policies for anon/authenticated — only service role writes.

### Edge Function: `log-ai-usage`
- Accepts `{ user_id, action_type }` in POST body
- Inserts into `ai_usage_log`
- Upserts `ai_usage_summary` (increment `total_uses`, set `last_used_at`)
- Called server-to-server (from other edge functions after successful AI responses), so `verify_jwt = false`
- Validates `action_type` is one of `set_generation` or `institute_coach`
- Returns success/failure — never blocks the calling function

### Config
Add `[functions.log-ai-usage]` with `verify_jwt = false` to `supabase/config.toml`.

### Files
| File | Change |
|---|---|
| Migration SQL | Create 2 tables + RLS |
| `supabase/functions/log-ai-usage/index.ts` | New edge function |
| `supabase/config.toml` | Register function |

No UI changes. No client-side code.

