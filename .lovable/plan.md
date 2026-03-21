

## Invitation System Audit — Findings & Fix Plan

### Audit Scope
The invitation flow covers: **CommunityManagement** (send/resend/cancel invites), **RoleAssignmentDialog** (admin invite), **InvitedSignUp** (new user signup), **AcceptInvitation** (existing user accept/decline), and the **send-community-invitation** Edge Function.

---

### Current Flow Summary

```text
Worship Leader/Owner → CommunityManagement page → enters email(s) → 
  calls send-community-invitation Edge Function →
    sends email via Resend API → creates DB record (community_invitations)
    
Recipient clicks link → /invite/:id (new user) or /accept-invitation/:id (existing user) →
  fetches invitation via get_invitation_by_id RPC →
  signs up / accepts → community_members insert + accept_invitation RPC
```

---

### ✅ What Works Well

1. **Email-first approach**: DB record created only after email sends successfully — no orphaned invitations
2. **Security**: `accept_invitation` / `decline_invitation` RPCs verify email match (case-insensitive)
3. **RLS policies**: Proper policies for community_invitations (leaders, owners, admins only)
4. **Expiry handling**: 7-day expiry checked on both frontend (InvitedSignUp) and in DB default
5. **Duplicate handling**: `upsert` with `onConflict` for community_members in InvitedSignUp
6. **Multi-email support**: CommunityManagement handles comma-separated emails with rate limiting (500ms delay)

---

### ⚠️ Issues Found (4 bugs, 2 improvements)

#### Bug 1: `inviterName` uses `user.email` instead of profile name
**File**: `CommunityManagement.tsx` line 560
```
inviterName: user.email || "A worship leader"
```
The email HTML shows this as the inviter's name. Should use the user's `full_name` from their profile.

#### Bug 2: `RoleAssignmentDialog` sends `roleId` param that Edge Function ignores
**File**: `RoleAssignmentDialog.tsx` line 214 passes `roleId` in the body, but `send-community-invitation` doesn't use it. The invitation is always created with `role: "member"`. If an admin invites someone for a specific band role, that context is lost.

#### Bug 3: Expired invitations still show pending to managers
**File**: `CommunityManagement.tsx` — the invitation list query doesn't filter out expired invitations. Managers see stale "pending" invitations for expired links. The `resend` action will resend the email but the DB record's `expires_at` is never refreshed.

#### Bug 4: `accept_invitation` RPC requires `auth.uid()` but InvitedSignUp calls it immediately