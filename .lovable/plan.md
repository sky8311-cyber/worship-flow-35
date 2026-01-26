
# 두 페이지 통계 통일 계획

## 문제 요약

| 항목 | AdminTierGuide | AdminCRM | 올바른 값 |
|------|----------------|----------|-----------|
| 팀멤버 | 101 ✅ | 11 ❌ | 101 (승급 안 한 모든 사용자) |
| 예배인도자/일반멤버 | 95 (일반멤버) | 95 (예배인도자) | 95 (명칭 통일 필요) |
| 카드 순서 | 팀멤버 → 일반멤버 → 정회원 → 공동체 | 공동체 → 예배인도자 → Communities → 팀멤버 | 통일 필요 |

---

## 수정 계획

### 1. 명칭 통일 (UI 용어)

플랫폼 티어 체계에 맞춰 통일:

| DB Role | 한국어 명칭 | 영어 명칭 |
|---------|------------|-----------|
| `user` only | **팀멤버** | Team Member |
| `worship_leader` | **일반멤버** (예배인도자) | Basic Member |
| premium subscription | **정회원** | Full Member |
| church account | **공동체계정** | Community Account |

### 2. AdminCRM.tsx 수정

**수정 사항:**

1. **팀멤버 계산 로직 수정**:
   - 현재: 커뮤니티에 가입한 비-예배인도자만 카운트 (11명)
   - 수정: 전체 사용자 중 `worship_leader` role이 없는 사용자 (101명)

2. **카드 순서 통일** (티어 순서대로):
   ```
   1. 팀멤버 (101)
   2. 일반멤버 (95) - "예배인도자" 대신
   3. 정회원 (0) - 추가 필요
   4. 공동체계정 (1)
   ```

3. **명칭 변경**:
   - "예배인도자" → "일반멤버"

4. **Communities 카드 제거 또는 별도 섹션**:
   - 플랫폼 티어 통계와 커뮤니티 수는 별개
   - 티어 통계 아래에 추가 정보로 표시

### 3. 수정할 코드 위치

#### AdminCRM.tsx - getStats 함수 수정

```typescript
const getStats = () => {
  if (!crmData) return { teamMembers: 0, basicMembers: 0, fullMembers: 0, churchAccounts: 0 };
  
  // 전체 프로필 수
  const totalProfiles = crmData.members.length + crmData.worshipLeaders.length;
  
  // 팀멤버: worship_leader role이 없는 모든 사용자
  const worshipLeaderIds = new Set(crmData.worshipLeaders.map(wl => wl.id));
  const teamMemberCount = /* 전체 profiles */ - worshipLeaderIds.size;
  
  // 일반멤버 (예배인도자): worship_leader role 보유자
  const basicMemberCount = crmData.worshipLeaders.length;
  
  // 정회원: active premium subscription
  const fullMemberCount = crmData.worshipLeaders.filter(
    wl => wl.subscription?.subscription_status === 'active'
  ).length;
  
  // 공동체계정
  const churchAccountCount = crmData.churchAccounts.length;
  
  return {
    teamMembers: teamMemberCount,
    basicMembers: basicMemberCount,
    fullMembers: fullMemberCount,
    churchAccounts: churchAccountCount,
  };
};
```

#### AdminCRM.tsx - 통계 카드 UI 수정

카드 순서와 스타일을 AdminTierGuide와 동일하게 변경:

```tsx
{/* Stats Cards - 티어 순서대로 */}
<div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
  {/* 1. 팀멤버 */}
  <Card>
    <CardContent className="p-4 flex items-center gap-3">
      <div className="p-2 bg-muted rounded-lg">
        <Users className="w-5 h-5" />
      </div>
      <div>
        <div className="text-2xl font-bold">{stats.teamMembers}</div>
        <div className="text-xs text-muted-foreground">팀멤버</div>
      </div>
    </CardContent>
  </Card>
  
  {/* 2. 일반멤버 */}
  <Card>
    <CardContent className="p-4 flex items-center gap-3">
      <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
        <Crown className="w-5 h-5 text-purple-600" />
      </div>
      <div>
        <div className="text-2xl font-bold">{stats.basicMembers}</div>
        <div className="text-xs text-muted-foreground">일반멤버</div>
      </div>
    </CardContent>
  </Card>
  
  {/* 3. 정회원 */}
  <Card>
    <CardContent className="p-4 flex items-center gap-3">
      <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
        <Shield className="w-5 h-5 text-yellow-600" />
      </div>
      <div>
        <div className="text-2xl font-bold">{stats.fullMembers}</div>
        <div className="text-xs text-muted-foreground">정회원</div>
      </div>
    </CardContent>
  </Card>
  
  {/* 4. 공동체계정 */}
  <Card>
    <CardContent className="p-4 flex items-center gap-3">
      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
        <Building2 className="w-5 h-5 text-blue-600" />
      </div>
      <div>
        <div className="text-2xl font-bold">{stats.churchAccounts}</div>
        <div className="text-xs text-muted-foreground">공동체계정</div>
      </div>
    </CardContent>
  </Card>
</div>

{/* 커뮤니티 수는 별도 표시 */}
<div className="text-sm text-muted-foreground mb-4">
  총 {stats.communities}개 커뮤니티
</div>
```

---

## 수정 후 예상 결과

### 두 페이지 통일된 모습

| 카드 | AdminTierGuide | AdminCRM |
|------|----------------|----------|
| 1 | 101 팀멤버 | 101 팀멤버 |
| 2 | 95 일반멤버 | 95 일반멤버 |
| 3 | 0 정회원 | 0 정회원 |
| 4 | 1 공동체계정 | 1 공동체계정 |

### 추가: CRM에서 커뮤니티 정보
- 커뮤니티 수(75)는 별도 라인으로 표시
- 또는 두 번째 줄 카드로 "커뮤니티 75개" 추가

---

## 파일 변경 목록

| 파일 | 변경 내용 |
|------|----------|
| `src/pages/AdminCRM.tsx` | getStats 로직 수정, 카드 순서/명칭 통일, 정회원 카드 추가 |

---

## 기술 세부사항

### 팀멤버 정확한 계산을 위한 쿼리 추가

현재 CRM 데이터에서 전체 프로필 수를 가져오지 않으므로, 쿼리 추가 필요:

```typescript
const [
  // ... existing queries
  allProfilesResult,
] = await Promise.all([
  // ... existing
  supabase.from("profiles").select("id", { count: "exact", head: true }),
]);

const totalProfileCount = allProfilesResult.count || 0;
```

그 후 `getStats`에서:
```typescript
const teamMemberCount = totalProfileCount - crmData.worshipLeaders.length;
```
