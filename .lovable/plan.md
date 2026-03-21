

## Institute & Studio: Bottom Nav 추가 + Coming Soon 게이팅

### 현재 상태
- **Institute**: `institute_enabled` 플래그 존재, 비활성 시 `/dashboard`로 리다이렉트
- **Studio**: 플래그 없음, 누구나 접근 가능
- **Bottom Nav**: DB `navigation_items` 테이블에서 로드 — Admin에서 항목 추가 필요

### 구현 계획

#### 1. `studio_enabled` 플래그 추가 (DB Migration)
- `platform_feature_flags` 테이블에 `studio_enabled` row 삽입 (기본 `false`)

#### 2. `useAppSettings` 훅에 Studio 플래그 추가
- **파일**: `src/hooks/useAppSettings.ts`
- `FeatureFlags` 인터페이스에 `studio_enabled` 추가
- `isStudioEnabled` 반환값 추가 (sandbox override 지원)
- `toggleStudio` 추가

#### 3. Coming Soon 페이지 컴포넌트 생성
- **파일**: `src/components/common/FeatureComingSoon.tsx`
- 재사용 가능한 "준비 중" 마케팅 랜딩 페이지
- Props: `featureName`, `description`, `icon`
- 디자인: 아이콘 + 제목 + 설명 + "준비중입니다" 메시지 + 대시보드 돌아가기 버튼
- 한/영 지원

#### 4. Institute 게이팅 수정
- **파일**: `src/layouts/InstituteLayout.tsx`
- 현재: 비활성 시 `/dashboard`로 리다이렉트
- 변경: 비활성 시 `<FeatureComingSoon>` 컴포넌트 렌더링 (리다이렉트 대신)

#### 5. Studio 게이팅 추가
- **파일**: `src/pages/WorshipStudio.tsx` (또는 Studio 래퍼)
- `useAppSettings`에서 `isStudioEnabled` 체크
- 비활성 시 `<FeatureComingSoon>` 표시
- sandbox tester/admin은 정상 페이지 접근

#### 6. Admin Dashboard에 Studio 토글 추가
- **파일**: `src/pages/AdminDashboard.tsx`
- 정식멤버 설정 섹션에 "Worship Studio 활성화" 토글 추가

#### 7. Bottom Nav에 Institute/Studio 항목 추가 (DB)
- `navigation_items` 테이블에 2개 row 삽입:
  - Institute: key=`institute`, icon=`GraduationCap`, path=`/institute`, order_index 적절히 배치
  - Studio: key=`studio`, icon=`Palette`, path=`/studio`, order_index 적절히 배치
- 총 6개 아이콘 (Home, WorshipSets, Songs, Studio, Institute, Chat) — 이전에 구현한 compact 모드 적용

### 수정 파일 요약

| 파일 | 변경 |
|---|---|
| DB Migration | `studio_enabled` 플래그 + navigation_items 2개 추가 |
| `src/hooks/useAppSettings.ts` | `studio_enabled` 플래그 지원 |
| `src/components/common/FeatureComingSoon.tsx` | 새 파일 — 재사용 Coming Soon 페이지 |
| `src/layouts/InstituteLayout.tsx` | 리다이렉트 → Coming Soon 페이지 |
| `src/pages/WorshipStudio.tsx` | Studio 게이팅 추가 |
| `src/pages/AdminDashboard.tsx` | Studio 토글 추가 |

### 동작 흐름

```text
일반 유저가 Studio/Institute 탭 클릭
  → useAppSettings에서 플래그 체크
  → 비활성 → FeatureComingSoon 페이지 표시

관리자/sandbox tester가 동일 탭 클릭
  → hasSandboxAccess("studio_enabled") = true
  → 정상 페이지 표시
```

