

## Why "편집이 차단되었습니다" appears

Looking at console logs + `useSetEditLock.ts`:

```
lockStatus: "locked_by_other"
lockHolder.userId: 0c97068c-...   ← same as current user
lockHolder.sessionId: session-1776544407244-zjyb2sj  ← different tab
acquiredAt: 22:52:36   lastActivity: 22:52:37 (no heartbeat since!)
```

The edit lock for this set is held by **the same user** (`최광은`) but from a **different browser tab/session**. The lock comparison in `useSetEditLock.ts` only checks `holder_session_id === sessionIdRef.current`, so the user's own ghost session blocks them. `isBlocked` becomes true, and clicking the new "기본으로 설정" star → `handleUpdateItem` (SetBuilder.tsx:1306) → fires the toast. Save also tripped it.

The other session's `last_activity_at` is **frozen at 22:52:37** (no heartbeat for 2+ minutes) while `expires_at` keeps getting bumped — likely a closed tab whose unmount cleanup didn't run, or an idle tab still extending TTL without activity.

## Fix plan

**1. `useSetEditLock.ts` — treat same-user locks correctly**

In the lock-state resolver (around lines 217-237) and the realtime UPDATE handler (lines 836-845), add a same-user takeover branch:

- If `lock.holder_user_id === user.id` AND `lock.holder_session_id !== sessionIdRef.current`:
  - If the other session is stale (`now - last_activity_at > 30s`), call `force_takeover` automatically (mirror the logic already in `acquireLock` lines 280-308) instead of marking `locked_by_other`.
  - Otherwise, set a new status `locked_by_me_other_tab` (or keep `locked_by_other` but expose `isSameUser: true` on `lockHolder`) so UI can show a friendlier "다른 탭에서 편집 중 — 여기서 이어서 편집" button that calls `force_takeover` with one click.

**2. `SetBuilder.tsx` — UI affordance**

In the read-only banner (around line 1780), when `lockHolder.userId === user.id`, render the message in Korean as "다른 탭/기기에서 편집 중입니다" with a primary "여기서 편집 이어가기" button that triggers takeover, instead of just showing the generic blocked state.

**3. Immediate user unblock (no code)**

Right now the user can click any "다른 사용자가 편집 중" takeover button already in the UI to grab the lock back, OR close the other tab; the stale lock will be auto-cleaned within 30s once heartbeats stop and they reload.

## Scope
- 2 files: `src/hooks/useSetEditLock.ts`, `src/pages/SetBuilder.tsx`
- No DB / migration changes
- Behavior preserved for true cross-user lock conflicts

