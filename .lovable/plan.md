
## 문제 분석

**문제 1: 아바타 메뉴 뱃지가 "기본멤버"로 표시됨**
- `AppHeader.tsx`의 Role Badges 섹션(181-191행)은 `isWorshipLeader` 기준으로만 `RoleBadge`를 표시
- `RoleBadge`는 platform role만 보여줌 (admin, worship_leader, member 등) — subscription tier(정식멤버/공동체계정)를 반영하지 않음
- 해결: `useTierFeature()`의 `tier`와 `TIER_CONFIG`를 사용해 **티어 뱃지**를 Role Badge 옆에 추가 표시

**문제 2: 예배 프로필 설정 메뉴를 아바타 드롭다운에 추가**
- Worship Leader(예배인도자) 이상만 볼 수 있는 "예배 프로필 설정" 메뉴 항목 추가
- `user_curation_profiles`에 skills_summary가 없으면 "NEW" 뱃지 표시
- 클릭 시 `/settings`로 이동하면서 `openCurationChat: true` state 전달

**문제 3: 온보딩 팝업 대상을 Worship Leader로 제한**
- 현재 `CurationProfilePromptDialog`는 `hasFeature("ai_set_builder")` (Full Member 이상)로 게이트
- 변경: `isWorshipLeader`로 게이트 — 예배인도자 승인된 모든 사람이 대상
- 일반 팀멤버(커뮤니티 소속이더라도 worship_leader 롤 없음)에게는 팝업 미표시

---

## 수정 계획

### 1. AppHeader.tsx — 티어 뱃지 + 예배 프로필 메뉴 추가

- `useTierFeature` import 추가, `tier`와 `TIER_CONFIG` 사용
- Role Badges 영역에 티어 뱃지 추가 (예: "정식멤버" 배지를 role badge 옆에)
- `isWorshipLeader`일 때 "예배 프로필 설정" 메뉴 항목 추가 (Settings 메뉴 근처)
- skills_summary 없으면 "NEW" Badge 표시 (간단한 useQuery로 체크)

### 2. CurationProfilePromptDialog.tsx — 게이트 변경

- `hasFeature("ai_set_builder")` → `isWorshipLeader`로 변경
- query의 `enabled` 조건도 동일하게 수정
- useEffect 내 조건도 `hasAiAccess` → `isWorshipLeader`로 교체

### 3. RoleBadge 또는 AppHeader — 티어 표시 로직

- 현재 role 뱃지(worship_leader)는 그대로 유지하되, 티어가 premium 이상이면 **추가로** 티어 뱃지도 표시
- `TIER_CONFIG`의 color/label 사용해 일관된 스타일 적용

---

## 기술 상세

**AppHeader 수정 포인트:**
- Import: `useTierFeature, TIER_CONFIG` 추가
- 181-191행 Role Badges 영역: tier가 `premium` 또는 `church`일 때 해당 티어 뱃지 추가
- 227-231행 Settings 메뉴 위: worship leader용 "예배 프로필 설정" 메뉴 삽입 (NEW 뱃지 포함)
- 프로필 조회 query: `["curation-profile", user?.id]` 키로 skills_summary 존재 여부 확인

**CurationProfilePromptDialog 수정:**
- `useAuth()`에서 `isWorshipLeader` 가져옴
- `hasFeature("ai_set_builder")` 3곳을 모두 `isWorshipLeader`로 교체

