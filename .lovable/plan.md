
## 상황 정리 (지금 왜 가입이 막히는지)
- 현재 `/signup`의 생년월일 입력은 **연/월/일 3개 드롭다운**(DateDropdownPicker)으로 구성되어 있고, `birthDate`는 **"YYYY-MM-DD" 한 문자열**로만 저장됩니다.
- 사용자가 **연도(Year)를 먼저 선택**하면, 현재 DateDropdownPicker 로직이 **완성된 날짜 문자열을 만들 수 없어서("")를 다시 저장**해버립니다.
- 그 결과:
  - “연도 선택이 안 된다”처럼 보임 (선택 직후 값이 다시 빈 값으로 리셋됨)
  - `month`/`day`는 `!year` 조건으로 disabled라서 계속 비활성화
  - 모바일에서 특히 명확하게 “선택이 안 되는” 치명 버그로 체감됨

## 근본 원인 (코드 레벨)
`src/components/ui/date-dropdown-picker.tsx`의 로직이:
- year/month/day를 **value(YYYY-MM-DD)**에서만 파싱해 가져오고
- year 변경 시 `buildDateString(newYear, month, day)`를 호출하는데
- month/day가 아직 비어있으면 `buildDateString`이 `""`을 반환 → 부모 상태가 `""` 유지 → year도 다시 `""`로 파싱 → month/day 계속 disabled

즉, “연도만 먼저 고르는 단계”를 표현할 내부 상태가 없어 선택이 저장되지 않습니다.

## 해결 전략 (가장 빠르고 안정적으로 가입을 뚫는 방법)
### 핵심: DateDropdownPicker에 “부분 선택(연도만/연+월만)”을 유지할 내부 상태를 추가
- DateDropdownPicker 내부에 `selectedYear`, `selectedMonth`, `selectedDay` **로컬 state**를 둡니다.
- UI의 Select들은 `value`(YYYY-MM-DD)에서 파싱한 값이 아니라 **로컬 state를 기준으로 제어**합니다.
- `onChange(YYYY-MM-DD)`는 **연/월/일이 모두 선택되었을 때만 호출**합니다.
- 연도만 선택된 상태에서도 로컬 state가 유지되므로:
  - Year는 화면에 선택된 값으로 보이고
  - Month가 활성화되고
  - Month 선택 후 Day 활성화
  - 최종 Day 선택 시에만 `YYYY-MM-DD`가 부모로 전달되어 `birthDate` 완성

### 폼 required(필수)도 실제로 동작하도록 보강 (권장)
Radix Select는 네이티브 `<select required>`처럼 브라우저 기본 검증이 잘 안 걸릴 수 있어서,
- DateDropdownPicker 내부에 `<input type="hidden" required ...>`를 추가해 “완성된 날짜가 있을 때만” 값이 들어가도록 만들어
- 모바일/데스크톱 모두에서 **필수 검증이 안정적으로 동작**하게 합니다.

## 변경할 파일
1) `src/components/ui/date-dropdown-picker.tsx` (핵심 수정)
- 변경 내용:
  - `year/month/day`를 `useMemo`로 `value`에서만 파싱하는 구조를 **로컬 state 구조로 리팩터링**
  - `handleYearChange / handleMonthChange / handleDayChange`가:
    - 로컬 state 업데이트
    - day 유효성(2월 29일 등) 보정
    - 3개가 모두 채워졌을 때만 `onChange("YYYY-MM-DD")` 호출
  - `disabled` 조건은 로컬 state 기준으로 유지
  - `required`가 true면 hidden input을 추가해 제출 차단이 되도록 처리

2) (선택) `src/pages/auth/SignUp.tsx`, `src/pages/InvitedSignUp.tsx`
- 원칙적으로 DateDropdownPicker가 정상화되면 추가 수정 없이 해결됩니다.
- 다만 “백업 안전장치”로:
  - submit 시 `birthDate`가 비어있으면 토스트로 막는 validation을 추가할지 여부는 상황 보고 결정합니다. (급하면 넣는 게 안전)

## 구현 세부 설계 (동작 규칙)
- 초기 렌더:
  - `value`가 `"YYYY-MM-DD"`면 로컬 state를 해당 값으로 초기화
  - `value`가 `""`면 로컬 state는 빈 값으로 시작
- Year 선택:
  - `selectedYear = newYear`
  - Month/Day는 유지 (있으면)
  - Month는 활성화
  - 아직 Month/Day가 없으면 `onChange` 호출하지 않음
- Month 선택:
  - `selectedMonth = newMonth`
  - 기존 Day가 그 달의 최대 일수를 초과하면 자동으로 마지막 일로 보정
  - Year+Month+Day가 모두 있으면 `onChange` 호출
- Day 선택:
  - `selectedDay = newDay`
  - Year+Month가 있는 상태에서 `onChange("YYYY-MM-DD")` 호출

## 테스트 체크리스트 (긴급 기준)
모바일(필수):
- [ ] `/signup`에서 Year 선택 후 **선택 값이 유지**되는지
- [ ] Year 선택 후 Month가 **활성화**되는지
- [ ] Month 선택 후 Day가 **활성화**되는지
- [ ] Day 선택 시 `birthDate`가 `"YYYY-MM-DD"`로 저장되어 가입이 진행되는지

다른 영향 범위(필수):
- [ ] `/invited-signup`에서도 동일하게 동작하는지
- [ ] 프로필 편집 다이얼로그(ProfileEditDialog)에서도 생년월일 선택/수정이 되는지

회귀(가능하면):
- [ ] 2월/윤년(예: 2000-02-29)에서 일 수 보정이 정상인지
- [ ] 31일 선택 후 30일인 달로 바꿀 때 30일로 자동 보정되는지

## 기대 결과
- “연도 선택이 안 된다” 문제가 해소되고,
- 월/일이 정상적으로 활성화되어,
- 모바일에서 가입이 즉시 가능해집니다.

