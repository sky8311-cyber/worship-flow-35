
문제 진단

- 지금 에러는 앱 로직 자체가 아니라 Google 쪽 권한/프로젝트 매칭 문제입니다.
- 현재 함수는 Google의 원본 403 응답
  `This project does not have the access to Custom Search JSON API.`
  를 무조건 `api_not_enabled`로 바꿔 보여주고 있어서, 원인이 너무 좁게 안내되고 있습니다.
- 이 문구는 실제로 아래 경우를 모두 포함할 수 있습니다:
  1. API가 정말 비활성화됨
  2. `GOOGLE_CSE_KEY`가 다른 Google Cloud 프로젝트의 키임
  3. 그 프로젝트에 결제(Billing)가 연결 안 됨
  4. API restrictions가 잘못 걸림
  5. 방금 활성화해서 아직 전파 안 됨

한방 해결안

1. Google 쪽을 한 번에 정리
- `GOOGLE_CSE_KEY`가 발급된 정확한 Google Cloud 프로젝트를 연다
- 그 동일한 프로젝트에서:
  - `Custom Search API`가 Enabled 상태인지 확인
  - Billing이 연결되어 있는지 확인
  - API Key restriction에서
    - Application restriction: 서버 호출 가능하게 설정
    - API restriction: `Custom Search API` 허용
- 기존 키가 헷갈리면 가장 빠른 해결은:
  - 같은 프로젝트에서 새 API Key 생성
  - 그 키로 `GOOGLE_CSE_KEY` 교체
  - `GOOGLE_CSE_CX`는 현재 쓰는 Search Engine ID 유지
- 설정 직후 3~10분 정도 전파 시간을 둔다

2. 코드도 같이 바로잡기
- `supabase/functions/google-image-search/index.ts`
  - 현재의 `api_not_enabled` 단일 매핑을 없애고
  - 403 forbidden 계열을 `api_access_denied` 같은 더 넓은 설정 오류로 매핑
  - 응답에 안전한 디버그 정보만 포함:
    - `google_status`
    - `google_reason`
    - `google_message`
  - 예상 가능한 설정 오류는 503 대신 200 + 구조화된 에러 payload로 반환
    - 이유: 지금처럼 Edge Function 5xx/503이 계속 런타임 에러로 잡혀서 디버깅 경험만 나빠짐
- `src/components/SetSongScoreDialog.tsx`
  - `api_access_denied`를 별도 처리
  - 토스트 에러 대신 인라인 안내로 고정 표시
  - 안내 문구를 “API 미활성화”로 단정하지 말고 아래 체크리스트로 통합:
    - API Key가 맞는 프로젝트 키인지
    - Billing 연결 여부
    - API restriction 허용 여부
    - Search API 활성화 여부

3. 기대 결과
- 사용자는 더 이상 매번 “검색 중 오류가 발생했습니다”만 보지 않음
- 런타임 에러 오버레이/blank-screen 성격의 노이즈를 줄일 수 있음
- 외부 설정이 틀린 경우에도 화면에서 바로 정확한 체크리스트를 볼 수 있음
- Google 설정이 맞으면 코드 추가 수정 없이 바로 검색 결과가 뜸

구현 대상 파일

- `supabase/functions/google-image-search/index.ts`
- `src/components/SetSongScoreDialog.tsx`

기술 메모

- 현재 로그 기준으로 가장 가능성 높은 원인은 “API를 켰는데 다른 프로젝트의 API Key를 secret에 넣은 경우” 또는 “Billing 미연결”입니다.
- 지금 코드는 403 + `Custom Search API` 문구를 너무 단순하게 `api_not_enabled`로 해석하고 있어서 반복 오진이 발생하고 있습니다.
- 따라서 이번에는 외부 설정 정리 + 오류 매핑 개선 + 503 제거까지 한 번에 처리하는 게 맞습니다.
