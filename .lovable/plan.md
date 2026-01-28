

# 오늘 변경사항 안정화 계획

## 발견된 문제

### 1. page_analytics RLS 오류 (중요)
- **현상**: 익명 사용자가 `/signup` 등 페이지 방문 시 analytics 삽입 실패
- **영향**: 페이지 분석 데이터 수집 누락 (사용자 경험에는 영향 없음)
- **원인**: INSERT 정책이 `WITH CHECK (true)`이지만, Supabase RLS가 anon 유저를 제대로 처리하지 못함

### 2. sync-worship-leader-role-v2 에러 로그 (낮음)
- **현상**: 세션 만료 시 콘솔에 에러 표시
- **영향**: 기능적으로는 정상 (승인된 worship leader가 아니면 역할 동기화 안 함)
- **원인**: 클라이언트에서 401 응답을 에러로 간주

---

## 수정 계획

### 1단계: page_analytics RLS 정책 수정

기존 INSERT 정책을 삭제하고, 익명/인증 사용자 모두 허용하는 새 정책 생성:

```sql
-- 기존 정책 삭제
DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.page_analytics;

-- 새 정책: 익명 사용자도 삽입 가능하도록 명시적 설정
CREATE POLICY "Anyone can insert page analytics"
  ON public.page_analytics
  FOR INSERT
  TO public, anon, authenticated
  WITH CHECK (true);
```

### 2단계: AuthContext에서 sync 함수 호출 개선

`sync-worship-leader-role-v2` 호출 시 401 응답을 정상 케이스로 처리하도록 수정:

```typescript
// AuthContext.tsx 내 syncWorshipLeaderRole 호출 부분
const { data, error } = await supabase.functions.invoke(...)

// 401은 "세션 없음" = 정상 케이스로 처리
if (error?.message?.includes("401") || error?.message?.includes("Unauthorized")) {
  // 조용히 무시 (로그인 직후 세션이 아직 전파 안 된 경우)
  return;
}
```

---

## 파일 변경 목록

| 파일 | 변경 내용 |
|------|----------|
| `supabase/migrations/...` | page_analytics RLS 정책 수정 |
| `src/contexts/AuthContext.tsx` | sync 함수 401 응답 처리 개선 |

---

## 예상 결과

1. **page_analytics**: 익명 사용자도 페이지 분석 데이터 정상 삽입
2. **Edge Function 에러**: 콘솔에 불필요한 에러 메시지 제거
3. **전체적인 안정성**: 사용자 가입/로그인 흐름 완전히 정상 작동

---

## 테스트 체크리스트

- [ ] `/signup` 페이지에서 page_analytics INSERT 성공 (DB 로그 확인)
- [ ] 로그인 후 dashboard 진입 시 에러 없음
- [ ] 콘솔에 Role sync error 표시 안 됨
- [ ] 기존 사용자 email_preferences 동의 모달 정상 작동

