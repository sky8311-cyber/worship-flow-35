

## 문제 분석

1. **NEW 뱃지 overflow** — 메뉴 항목에 AiBadge + NEW 뱃지가 같이 있어서 넘침. NEW 뱃지 제거.
2. **기존 프로필이 있는데 처음부터 질문함** — `existingSummary`가 edge function에 전달되고 시스템 프롬프트에도 포함되지만, 채팅 UI에서는 기존 요약을 보여주지 않아 사용자가 맥락을 모름. AI도 "처음부터" 시작하는 것처럼 대화함.

## 수정 계획

### 1. AppHeader.tsx — NEW 뱃지 제거

- lines 263-270: `showProfileNewBadge` 관련 코드 및 NEW 뱃지 렌더링 제거
- `showProfileNewBadge` 변수와 관련 useQuery도 정리 (AiBadge만 유지)

### 2. CurationProfileChat.tsx — 기존 프로필 요약 표시 + 수정 모드

**기존 프로필이 있을 때:**
- 채팅 시작 전, 상단에 기존 `existingSummary`를 카드 형태로 표시 ("현재 저장된 프로필")
- 초기 메시지를 `"안녕하세요"` 대신 `"기존 프로필을 수정하고 싶습니다"` 같은 맥락 있는 메시지로 변경
- 이렇게 하면 edge function의 시스템 프롬프트가 이미 기존 정보를 참고하도록 되어 있으므로, AI가 "어떤 부분을 수정하시겠어요?" 식으로 대화 시작

**기존 프로필이 없을 때:**
- 현재 동작 유지 (처음부터 질문)

### 3. Edge Function 시스템 프롬프트 보강

현재 수정 모드 프롬프트: `"사용자가 프로필을 수정하려 합니다. 기존 정보를 참고하여 변경사항을 반영하세요."`

더 명확하게 변경:
- 기존 정보를 먼저 요약해서 사용자에게 보여주고
- "어떤 부분을 수정/추가/삭제하시겠어요?" 라고 물어보도록 지시
- 변경 없이 대화 종료 시에도 기존 프로필 유지

## 수정 파일
- `src/components/layout/AppHeader.tsx` — NEW 뱃지 제거
- `src/components/CurationProfileChat.tsx` — 기존 요약 카드 + 수정 모드 초기 메시지
- `supabase/functions/update-curation-profile/index.ts` — 수정 모드 프롬프트 개선

