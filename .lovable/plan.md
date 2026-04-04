

# 비밀번호 가입 장벽 완화 계획

## 문제 분석

스크린샷에서 보이는 에러: **"Password is known to be weak and easy to guess, please choose a different one."**

이것은 Lovable Cloud의 **HIBP (Have I Been Pwned) 비밀번호 체크**가 활성화되어 있어서, 유출된 비밀번호 목록에 있는 비밀번호를 거부하는 것입니다. 현재 코드에는:
- 클라이언트측 비밀번호 강도 안내가 전혀 없음
- 비밀번호 표시/숨기기 토글이 SignUp/InvitedSignUp에 없음 (Login에만 있음)
- 에러 메시지가 영어 원문 그대로 노출됨 (한국어 번역 없음)

## 변경 방향: 보안 유지 + UX 개선

HIBP 체크를 끄지 않고, 사용자가 **처음부터 좋은 비밀번호를 만들 수 있도록** 안내합니다.

## 구현 내용

### 1. `PasswordInput` 공통 컴포넌트 생성
- 비밀번호 표시/숨기기 토글 (Eye/EyeOff 아이콘)
- 실시간 강도 표시 바 (약함/보통/강함)
- 안내 텍스트: "8자 이상, 너무 흔한 비밀번호는 사용할 수 없습니다" (KO/EN)
- 강도 체크 로직: 길이, 대소문자 혼합, 숫자/특수문자 포함 여부

### 2. 3개 페이지에 `PasswordInput` 적용
| 파일 | 변경 |
|------|------|
| `src/components/auth/PasswordInput.tsx` | **신규** — 공통 비밀번호 입력 컴포넌트 |
| `src/pages/auth/SignUp.tsx` | 기존 `<Input type="password">` → `<PasswordInput>` 교체 |
| `src/pages/InvitedSignUp.tsx` | 동일하게 교체 |
| `src/pages/auth/ResetPassword.tsx` | 동일하게 교체 |

### 3. 에러 메시지 한국어 번역 추가
`src/lib/translations.ts`에 HIBP 관련 에러 메시지 매핑 추가:
- `handleSubmit`에서 Supabase 에러 메시지에 "weak" 키워드가 포함되면 한국어 친화적 메시지로 대체
- 예: "흔하게 사용되는 비밀번호입니다. 다른 비밀번호를 사용해주세요."

### 4. `PasswordInput` 컴포넌트 상세

```text
┌──────────────────────────────────┐
│ 비밀번호                    👁   │
│ ┌────────────────────────────┐  │
│ │ ••••••••                   │  │
│ └────────────────────────────┘  │
│ ■■■■■■□□□□  보통                │
│ ✓ 8자 이상  ✗ 특수문자 포함     │
└──────────────────────────────────┘
```

- 강도 바: 빨강(약함) → 주황(보통) → 초록(강함)
- 조건 체크리스트: 8자 이상, 숫자 포함, 대소문자 혼합 (선택), 특수문자 (선택)
- 최소 요구: 8자 이상이면 submit 가능 (서버의 HIBP 체크가 최종 방어선)

