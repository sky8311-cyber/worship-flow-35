

# setup-stripe-products 인증 방식 수정

## 변경 파일

`supabase/functions/setup-stripe-products/index.ts` — 인증 로직만 교체 (1개 파일)

## 변경 내용

Lines 20-48의 인증 블록을 아래로 교체:

1. Authorization 헤더에서 Bearer 토큰 추출
2. **anon key**로 Supabase 클라이언트를 생성하되, 사용자 JWT를 전달하여 `auth.getUser()` 호출
3. `has_role(user.id, 'admin')` RPC로 admin 여부 확인 → 아니면 403
4. DB 쓰기용 클라이언트는 별도로 **SERVICE_ROLE_KEY**로 생성 (응답에 노출 안 함)

```text
Before:
  authHeader → compare with SERVICE_ROLE_KEY → 1 supabase client (service role)

After:
  authHeader → getUser() via anon client → has_role() RPC → admin 확인
  DB writes → separate service-role client (internal only)
```

## 프론트엔드 변경 없음

`AdminMembershipProducts.tsx`는 이미 세션 토큰을 Authorization 헤더로 전달 중 — 수정 불필요.

## 검증

- 배포 후 `curl_edge_functions`로 토큰 없이 호출 → 401
- 어드민 UI 버튼 클릭 → 정상 실행 확인

