

# 약관 동의 모달 오류 수정

## 문제 분석

스크린샷과 네트워크 로그를 분석한 결과, 다음과 같은 문제가 발견되었습니다:

```text
문제 발생 흐름:
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. 사용자 로그인 상태지만 API 요청 시 인증 토큰이 누락됨                   │
│    → authorization 헤더에 anon 키만 전달, 사용자 JWT 토큰 없음            │
│                                                                         │
│ 2. RLS 정책에서 auth.uid()가 null로 평가됨                               │
│    → legal_acceptances 조회 시 빈 배열 반환                              │
│    → "동의 기록 없음"으로 판단 → 모달 표시                                │
│                                                                         │
│ 3. 사용자가 "동의하고 계속하기" 클릭                                      │
│    → INSERT 시도 but auth.uid() = null                                  │
│    → RLS 정책 위반 오류: "new row violates row-level security policy"    │
└─────────────────────────────────────────────────────────────────────────┘
```

### 근본 원인

1. **세션 토큰 전달 문제**: Supabase 클라이언트가 일시적으로 인증 토큰을 전달하지 못함 (세션 갱신 중, 네트워크 지연, 또는 localStorage 동기화 문제)
2. **방어 로직 부재**: `useLegalConsent` 훅이 인증 상태가 불안정할 때도 쿼리를 실행하여 잘못된 결과를 반환함

---

## 해결 방안

### 1. useLegalConsent 훅에 세션 검증 추가

쿼리 실행 전에 실제 세션이 유효한지 확인합니다.

**수정 전:**
```typescript
const { data, isLoading, refetch } = useQuery({
  queryKey: ["legal-consent-check", user?.id, language],
  queryFn: async () => {
    if (!user) return { needsConsent: false, pendingDocuments: [] };
    // ... 바로 쿼리 실행
  },
  enabled: !!user && !authLoading,
});
```

**수정 후:**
```typescript
const { data, isLoading, refetch } = useQuery({
  queryKey: ["legal-consent-check", user?.id, language],
  queryFn: async () => {
    if (!user) return { needsConsent: false, pendingDocuments: [] };
    
    // 세션 유효성 검증 - 실제 토큰이 있는지 확인
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      console.warn("[useLegalConsent] No active session, skipping consent check");
      return { needsConsent: false, pendingDocuments: [] };
    }
    
    // ... 기존 쿼리 로직
  },
  enabled: !!user && !authLoading,
});
```

### 2. LegalConsentModal에 에러 핸들링 개선

RLS 오류 발생 시 사용자에게 친절한 메시지를 표시하고, 자동으로 세션 갱신을 시도합니다.

**개선 내용:**
```typescript
const handleAccept = async () => {
  if (!user || !agreed) return;
  
  setLoading(true);
  try {
    // 세션 갱신 시도
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      // 세션이 없으면 새로고침 유도
      toast.error(
        language === "ko" 
          ? "세션이 만료되었습니다. 페이지를 새로고침 해주세요." 
          : "Session expired. Please refresh the page."
      );
      setLoading(false);
      return;
    }
    
    // ... 기존 INSERT 로직
  } catch (error: any) {
    // RLS 오류인 경우 친절한 메시지
    if (error.code === "42501") {
      toast.error(
        language === "ko"
          ? "인증 오류가 발생했습니다. 페이지를 새로고침 해주세요."
          : "Authentication error. Please refresh the page."
      );
    } else {
      toast.error(error.message);
    }
  } finally {
    setLoading(false);
  }
};
```

### 3. LegalConsentGate에 세션 상태 체크 추가

모달을 표시하기 전에 세션이 확실히 유효한지 한 번 더 확인합니다.

**개선 내용:**
```typescript
const LegalConsentGate = ({ children }: { children: React.ReactNode }) => {
  const { needsConsent, pendingDocuments, isLoading, refetch } = useLegalConsent();
  const { session } = useAuth(); // session 추가 확인
  
  if (isLoading) {
    return <PageLoader />;
  }
  
  // 세션이 없으면 모달 표시 안 함 (ProtectedRoute가 처리)
  const shouldShowModal = needsConsent && session;
  
  return (
    <>
      {children}
      <LegalConsentModal
        open={shouldShowModal}
        pendingDocuments={pendingDocuments}
        onConsentComplete={() => refetch()}
      />
    </>
  );
};
```

---

## 변경 파일 요약

| 파일 | 변경 내용 |
|------|----------|
| `src/hooks/useLegalConsent.ts` | 세션 유효성 검증 추가, 세션 없으면 needsConsent: false 반환 |
| `src/components/legal/LegalConsentModal.tsx` | 세션 갱신 시도 및 RLS 오류에 대한 친절한 에러 메시지 |
| `src/App.tsx` | LegalConsentGate에서 session 상태 추가 확인 |

---

## 사용자 경험 개선 효과

```text
수정 전:
┌─────────────────────────────────────────────────────────────────────────┐
│ 세션 불안정 → 빈 동의 기록 → 모달 표시 → RLS 오류 → 막힌 상태           │
└─────────────────────────────────────────────────────────────────────────┘

수정 후:
┌─────────────────────────────────────────────────────────────────────────┐
│ 세션 불안정 감지 → 모달 표시 안 함 → 정상 대시보드 로드                   │
│ (세션이 자동 복구되면 다음 새로고침 시 정상 처리)                         │
└─────────────────────────────────────────────────────────────────────────┘
```

| 상황 | 수정 전 | 수정 후 |
|------|---------|---------|
| 세션 일시적 문제 | 모달 표시 + 오류 | 정상 진행 |
| 실제 세션 만료 | 오류만 표시 | 친절한 안내 + 새로고침 유도 |
| 정상 상태 | 정상 동작 | 정상 동작 (변화 없음) |

