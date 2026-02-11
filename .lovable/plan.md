

# 환영 이메일 중복 발송 문제 수정

## 문제 원인

환영 이메일(`send-welcome-email`)이 회원가입 시 **2곳에서 동시에 호출**되고 있습니다:

```text
사용자 회원가입 클릭
       │
       ▼
 SignUp.tsx → AuthContext.signUp() 호출
       │              │
       │              └──► send-welcome-email 호출 (1번째) ✉️
       │
       └──► send-welcome-email 호출 (2번째) ✉️
```

| 호출 위치 | 파일 | 라인 |
|----------|------|------|
| 1번째 | `src/contexts/AuthContext.tsx` | 390-399 |
| 2번째 | `src/pages/auth/SignUp.tsx` | 175-182 |
| 3번째 (초대 가입) | `src/pages/InvitedSignUp.tsx` | 185-189 |

## 해결 방법

**`AuthContext.tsx`에서 환영 이메일 호출을 제거**합니다.

이유:
- `AuthContext.signUp()`은 범용 함수이므로, 이메일 발송 같은 부수효과는 호출하는 쪽(페이지)에서 관리하는 것이 적절
- `SignUp.tsx`와 `InvitedSignUp.tsx`에서 이미 각각 호출하고 있으므로 중복 제거만 하면 됨

## 수정 대상 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/contexts/AuthContext.tsx` | `signUp` 함수에서 `send-welcome-email` 호출 코드 제거 (라인 390-399) |

## 상세 변경

### AuthContext.tsx (라인 390-399 제거)

```typescript
// Before
const signUp = async (email, password, fullName, phone, birthDate) => {
  const { error } = await supabase.auth.signUp({ ... });

  // 이 부분 제거 ↓
  if (!error) {
    try {
      await supabase.functions.invoke('send-welcome-email', {
        body: { email, name: fullName }
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }
  }

  return { error };
};

// After
const signUp = async (email, password, fullName, phone, birthDate) => {
  const { error } = await supabase.auth.signUp({ ... });
  return { error };
};
```

## 결과

| 시나리오 | Before | After |
|---------|--------|-------|
| 일반 회원가입 | 이메일 2통 | 이메일 1통 |
| 초대 회원가입 | 이메일 2통 | 이메일 1통 |

