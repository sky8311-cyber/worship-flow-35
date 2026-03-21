
문제 원인을 확인했습니다. 현재 정식멤버 토글이 “항상 ON”처럼 보이는 핵심 이유는 **관리자 계정이 sandbox tester override 대상**이기 때문입니다.  
`useAppSettings`에서 `isPremiumEnabled = DB값 OR sandbox override`로 계산하고 있어, DB를 OFF로 저장해도 관리자 화면에서 다시 ON으로 표시됩니다.

### 구현 계획

1. **`useAppSettings`에 “sandbox override 무시 모드” 추가**
   - 파일: `src/hooks/useAppSettings.ts`
   - 옵션 파라미터 추가 (예: `ignoreSandboxOverride?: boolean`, 기본 `false`)
   - 플래그 계산을 공통 함수로 정리:
     - 기본(기존): `rawFlag || sandboxOverride`
     - 무시 모드: `rawFlag`만 사용
   - 기존 사용처는 기본값으로 동작 유지(기능 영향 없음)

2. **Admin Dashboard는 raw DB 값으로 토글 표시**
   - 파일: `src/pages/AdminDashboard.tsx`
   - `useAppSettings({ ignoreSandboxOverride: true })`로 변경
   - 정식멤버/교회/AI/인스티튜트 등 모든 토글이 실제 DB 상태를 정확히 반영하도록 수정

3. **오해 방지 안내 문구 추가 (관리자 UX)**
   - Admin 설정 카드에 짧은 안내 추가:
     - “현재 계정이 sandbox tester이면, 관리자 토글과 별개로 본인 계정에서 기능이 강제 활성화되어 보일 수 있음”
   - 재발 방지 목적 (왜 본인 화면에서 계속 보이는지 명확화)

### 기술 상세

- 변경 파일
  - `src/hooks/useAppSettings.ts`
  - `src/pages/AdminDashboard.tsx`
- DB 스키마/정책 변경 없음
- 토글 저장 mutation 로직은 유지 (이미 정상 저장됨)

### 완료 기준 (QA)

1. 관리자에서 `정식멤버 활성화` OFF → 즉시 OFF로 유지되고 새로고침 후에도 OFF 유지
2. `platform_feature_flags.premium_enabled` 값이 실제로 OFF 저장됨
3. 같은 관리자 계정이 sandbox tester여도, **Admin 토글 UI는 raw 값 기준으로 정확히 표시**
4. 다른 화면의 런치 게이팅은 기존 sandbox override 정책 그대로 동작
