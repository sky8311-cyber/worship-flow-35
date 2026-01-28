
# Sandbox 테스터 시스템 구현 계획

## 개요

Toss 결제 감사를 위해 특정 테스트 계정(`testworship@test.com`)이 글로벌 토글 상태와 관계없이 Full Membership 및 Community Account 결제 화면을 볼 수 있도록 "샌드박스 테스터" 시스템을 구현합니다.

### 작동 방식

```text
일반 사용자 (isPremiumMenuVisible = OFF)
  → Settings 페이지에서 PremiumBillingCard 보이지 않음

샌드박스 테스터 (testworship@test.com)
  → 글로벌 토글이 OFF여도 PremiumBillingCard 표시됨
  → 일반 사용자에게는 영향 없음
```

---

## 기술 아키텍처

### 1단계: 데이터베이스 스키마

새 테이블 `sandbox_testers`를 생성하여 테스트 권한을 가진 사용자를 관리합니다:

```sql
CREATE TABLE public.sandbox_testers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  features TEXT[] NOT NULL DEFAULT '{}',  -- 접근 가능한 기능 목록
  note TEXT,                               -- 관리용 메모 (예: "Toss 감사용 계정")
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id)
);

-- RLS: Admin만 관리 가능
ALTER TABLE public.sandbox_testers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage sandbox testers" ON public.sandbox_testers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- 현재 사용자는 자신이 테스터인지 확인 가능
CREATE POLICY "Users can check own tester status" ON public.sandbox_testers
  FOR SELECT USING (user_id = auth.uid());
```

### 2단계: useAppSettings Hook 수정

현재 사용자가 샌드박스 테스터인지 확인하고, 해당 기능에 대해 토글을 오버라이드합니다:

```typescript
// src/hooks/useAppSettings.ts

export function useAppSettings() {
  const { user, isAdmin } = useAuth();
  
  // 글로벌 플래그 조회 (기존)
  const { data: flags, isLoading } = useQuery({...});
  
  // 샌드박스 테스터 상태 조회 (신규)
  const { data: sandboxAccess } = useQuery({
    queryKey: ["sandbox-tester-access", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("sandbox_testers")
        .select("features, enabled")
        .eq("user_id", user.id)
        .eq("enabled", true)
        .single();
      return data?.features || [];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
  
  // 오버라이드 로직
  const hasSandboxAccess = (feature: string) => 
    sandboxAccess?.includes(feature) || sandboxAccess?.includes("all");
  
  return {
    // 기존 값 OR 샌드박스 오버라이드
    isPremiumMenuVisible: !isLoading && (
      flags?.premium_menu_visible || hasSandboxAccess("premium_menu_visible")
    ),
    isChurchSubscriptionEnabled: !isLoading && (
      flags?.church_subscription_enabled || hasSandboxAccess("church_subscription_enabled")
    ),
    // ... 기타 플래그도 동일 패턴
  };
}
```

### 3단계: Admin UI - 테스터 관리

Admin Dashboard에 샌드박스 테스터 관리 섹션을 추가합니다:

```text
┌─────────────────────────────────────────────────────────────────┐
│  Admin Dashboard > Feature Toggles 카드                        │
├─────────────────────────────────────────────────────────────────┤
│  ...기존 토글들...                                              │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  🧪 Sandbox Testers                        [관리] 버튼    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Sandbox Testers 관리 다이얼로그                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  testworship@test.com                                    │  │
│  │  Features: premium_menu_visible, church_subscription     │  │
│  │  Note: Toss 감사용 계정                                   │  │
│  │                                         [수정] [삭제]    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  [+ 새 테스터 추가]                                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 구현 단계

### Phase 1: 데이터베이스
1. `sandbox_testers` 테이블 생성
2. RLS 정책 설정
3. `testworship@test.com` 계정에 초기 데이터 삽입

### Phase 2: Hook 수정
1. `useAppSettings.ts`에 샌드박스 조회 로직 추가
2. 각 플래그 반환값에 오버라이드 조건 추가

### Phase 3: Admin UI (선택사항)
1. AdminDashboard에 테스터 관리 버튼 추가
2. 테스터 추가/수정/삭제 다이얼로그

---

## 파일 변경 목록

| 파일 | 변경 내용 |
|------|----------|
| `supabase/migrations/...` | sandbox_testers 테이블 생성 |
| `src/hooks/useAppSettings.ts` | 샌드박스 오버라이드 로직 추가 |
| `src/pages/AdminDashboard.tsx` | 테스터 관리 UI 추가 (선택) |

---

## 즉시 적용 방법 (SQL 직접 실행)

계획 승인 후 바로 테스트가 필요하면, 아래 SQL로 즉시 설정할 수 있습니다:

```sql
-- 1. 테이블 생성
CREATE TABLE public.sandbox_testers (...);

-- 2. testworship@test.com 추가
INSERT INTO public.sandbox_testers (user_id, features, note, enabled)
VALUES (
  '3a7a5fcf-dd70-4d14-8a5a-bb19b11cb241',  -- testworship@test.com의 user_id
  ARRAY['premium_menu_visible', 'premium_enabled', 'church_subscription_enabled', 'church_menu_visible'],
  'Toss 결제 감사용 계정',
  true
);
```

---

## 보안 고려사항

1. **RLS 정책**: Admin만 테스터 관리 가능
2. **자가 확인**: 사용자는 자신이 테스터인지만 조회 가능
3. **비활성화 옵션**: `enabled` 플래그로 언제든 비활성화 가능
4. **감사 추적**: `created_by`로 누가 추가했는지 기록

---

## 테스트 체크리스트

- [ ] 글로벌 토글 OFF 상태에서 일반 사용자 → PremiumBillingCard 안 보임
- [ ] 글로벌 토글 OFF 상태에서 testworship@test.com 로그인 → PremiumBillingCard 표시됨
- [ ] 글로벌 토글 ON 상태에서 모든 사용자 → PremiumBillingCard 표시됨
- [ ] Admin에서 테스터 비활성화 → 해당 사용자 오버라이드 해제됨
