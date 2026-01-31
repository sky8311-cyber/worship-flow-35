
# 멀티 디바이스 편집 요청 실패 수정

## 문제 분석

### 근본 원인
`useSetEditLock.ts`의 `invokeLockAction` 함수가 Edge function 호출 시 **Authorization 헤더를 포함하지 않음**

**Edge function 로그:**
```
[set-edit-lock-action] Missing or invalid Authorization header
```

**현재 코드 (문제):**
```tsx
async function invokeLockAction(params: LockActionParams) {
  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // ❌ Authorization 헤더 없음!
    },
    body: JSON.stringify(params),
  });
  ...
}
```

### 결과
- 아이패드에서 "편집 요청" → Edge function 401 오류 → 실패
- 핸드폰에서 takeover 요청 알림을 받지 못함
- 세션 타임아웃으로 인해 핸드폰 세션도 종료됨

---

## 수정 계획

### 1. `invokeLockAction` 함수에 Authorization 헤더 추가

**파일:** `src/hooks/useSetEditLock.ts`

현재 세션의 access_token을 가져와서 Authorization 헤더에 포함:

```tsx
async function invokeLockAction(params: LockActionParams): Promise<{ success: boolean; message: string }> {
  try {
    // 현재 세션에서 access_token 가져오기
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      console.error('[EditLock] No active session');
      return { success: false, message: 'No active session' };
    }
    
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,  // ← 추가!
      },
      body: JSON.stringify(params),
    });
    return await response.json();
  } catch (error) {
    console.error('[EditLock] Edge function error:', error);
    return { success: false, message: 'Network error' };
  }
}
```

### 2. (선택) 세션 만료 시 재인증 안내

편집 잠금 요청 실패 시 세션이 만료되었는지 확인하고, 만료된 경우 재로그인 안내 토스트 표시.

---

## 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/hooks/useSetEditLock.ts` | `invokeLockAction` 함수에 Authorization 헤더 추가 |

---

## 예상 결과

수정 후:
1. 핸드폰에서 워십세트 편집 중
2. 아이패드에서 "편집 요청" 버튼 클릭
3. Edge function이 Authorization 헤더를 받아 요청 처리
4. 핸드폰에서 takeover 요청 알림 수신
5. 사용자가 양보/거절 선택 가능
6. 정상적인 멀티 디바이스 편집 전환 완료

---

## 기술 참고사항

- Edge function `set-edit-lock-action`은 이미 올바르게 Authorization 헤더 검증을 수행함
- 클라이언트 측에서만 헤더 추가가 누락됨
- 이 수정으로 모든 편집 잠금 관련 기능(takeover request, force takeover, release lock 등)이 정상 작동하게 됨
