

# 팀원 초대 404 오류 수정 계획

## 문제 원인

```text
┌─────────────────────────────────────────────────────────────────┐
│  현재 URL 패턴:                                                  │
│  navigate(`/community/${id}/manage`)  ❌ 404 에러                │
│                                                                  │
│  라우터에 정의된 패턴:                                            │
│  <Route path="/community/:id" ... />  ← /manage 없음            │
└─────────────────────────────────────────────────────────────────┘
```

### 발견된 문제점

| 파일 | 문제 |
|------|------|
| `WLOnboardingChecklist.tsx:104` | `/community/${firstCommunityId}/manage` 사용 → 404 |
| `CreateCommunityDialog.tsx:107` | `/community/${newCommunityId}/manage` 사용 → 404 |
| `WLWelcomeDialog.tsx:87` | 팀 초대 버튼이 `handleCreateCommunity` 호출 (잘못된 동작) |

---

## 해결 방법

### 1. URL 패턴 수정: `/manage` 제거

**파일**: `src/components/dashboard/WLOnboardingChecklist.tsx`

```typescript
// 변경 전 (line 104)
action: firstCommunityId 
  ? () => navigate(`/community/${firstCommunityId}/manage`)
  : undefined,

// 변경 후
action: firstCommunityId 
  ? () => navigate(`/community/${firstCommunityId}`)
  : () => setShowCreateCommunity(true),  // 커뮤니티 없으면 생성 다이얼로그
```

**파일**: `src/components/CreateCommunityDialog.tsx`

```typescript
// 변경 전 (line 107)
navigate(`/community/${newCommunityId}/manage`);

// 변경 후
navigate(`/community/${newCommunityId}`);
```

### 2. WLWelcomeDialog 워크플로우 수정

**파일**: `src/components/dashboard/WLWelcomeDialog.tsx`

"팀 초대" 버튼의 로직 수정:
- 커뮤니티가 있으면 → 해당 커뮤니티 페이지로 이동
- 커뮤니티가 없으면 → 먼저 생성하도록 안내

```typescript
// 새로운 prop 추가
interface WLWelcomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  churchName?: string;
  existingCommunityId?: string;  // 이미 커뮤니티가 있는 경우
}

// 팀 초대 핸들러 수정
const handleInviteTeam = () => {
  onOpenChange(false);
  if (existingCommunityId) {
    navigate(`/community/${existingCommunityId}`);
  } else {
    setShowCreateCommunity(true);
  }
};

// Step 2 버튼 수정
<button onClick={handleInviteTeam}>
  ...
</button>
```

### 3. Dashboard에서 WLWelcomeDialog에 커뮤니티 ID 전달

**파일**: Dashboard에서 WLWelcomeDialog 호출 부분

```typescript
<WLWelcomeDialog
  open={showWelcome}
  onOpenChange={setShowWelcome}
  churchName={profile?.church}
  existingCommunityId={firstCommunityId}  // 추가
/>
```

---

## 워크플로우 개선

### 현재 (문제)
```text
사용자 → "팀원 초대" 클릭 → /community/xxx/manage → 404 ❌
```

### 수정 후 (정상)
```text
커뮤니티 있음:
  사용자 → "팀원 초대" 클릭 → /community/xxx → Members 탭 (초대 링크 표시) ✅

커뮤니티 없음:
  사용자 → "팀원 초대" 클릭 → 커뮤니티 생성 다이얼로그 열림 → 생성 후 초대 안내 ✅
```

---

## 수정 파일 목록

| 파일 | 변경 내용 |
|------|----------|
| `WLOnboardingChecklist.tsx` | URL에서 `/manage` 제거, 커뮤니티 없을 때 생성 다이얼로그 열기 |
| `CreateCommunityDialog.tsx` | URL에서 `/manage` 제거 |
| `WLWelcomeDialog.tsx` | `existingCommunityId` prop 추가, 팀 초대 핸들러 분리 |
| `Dashboard.tsx` | WLWelcomeDialog에 커뮤니티 ID 전달 |

---

## 기술적 세부사항

### CommunityManagement 페이지 동작
- `/community/:id` 경로에서 탭 기반 UI 제공
- Members 탭에 이미 초대 링크와 K-Seed 보상 배너가 구현되어 있음
- 별도의 `/manage` 경로 필요 없음

### 보안 고려
- 커뮤니티 ID가 없는 경우 안전하게 생성 플로우로 유도
- 잘못된 커뮤니티 ID는 CommunityManagement에서 처리됨 (권한 체크)

