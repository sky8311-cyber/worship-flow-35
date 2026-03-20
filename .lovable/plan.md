

## 가사 검색 오류 수정 계획

### 원인

`match-lyrics`와 `suggest-song-topics` 두 Edge Function 모두 **`supabase.auth.getClaims(token)`**을 사용하고 있는데, 이 메서드는 Supabase JS v2에 존재하지 않습니다. 런타임에서 `TypeError`가 발생하며 함수가 즉시 crash → 500 에러 반환.

로그가 없는 이유: crash가 `console.log` 호출 전에 발생하기 때문.

### 수정 방법

두 함수의 인증 로직을 `supabase.auth.getUser(token)` 방식으로 교체:

```typescript
// 기존 (오류)
const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
if (claimsError || !claimsData?.claims) { ... }

// 수정
const { data: { user }, error: userError } = await supabase.auth.getUser(token);
if (userError || !user) { ... }
```

### 수정 파일

| 파일 | 변경 |
|---|---|
| `supabase/functions/match-lyrics/index.ts` (line 32-37) | `getClaims` → `getUser` |
| `supabase/functions/suggest-song-topics/index.ts` (line 32-37) | `getClaims` → `getUser` |

두 파일 모두 동일한 2줄 수정. 배포 후 테스트까지 진행.

