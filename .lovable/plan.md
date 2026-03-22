

## 인스티튜트 디자인을 기존 플랫폼과 통일

### 문제
인스티튜트가 완전히 격리된 디자인 시스템(`--inst-*` 색상, 골드 테마, 커스텀 헤더/바텀 내비, `fixed inset-0 z-50` 풀스크린)을 사용하여 기존 플랫폼과 괴리감이 큼.

### 해결 방향
인스티튜트 페이지들을 기존 `AppLayout` (AppHeader + BottomTabNavigation) 안에서 렌더링하도록 변경. 색상, 폰트, 카드 스타일 모두 기존 플랫폼 디자인 토큰(shadcn/Tailwind CSS 변수) 사용.

### 변경 사항

#### 1. `InstituteLayout` 제거 → `AppLayout` 사용
- 모든 Institute 페이지(`Institute.tsx`, `InstituteCourse.tsx`, `InstituteModule.tsx`, `InstituteChapter.tsx`)에서 `<InstituteLayout>` → `<AppLayout>` 으로 교체
- 헤더: 기존 `AppHeader` 그대로 사용 (로고는 Institute 전용 로고로 교체, 아바타 드롭다운에서 나가기 = 대시보드 이동)
- 바텀 내비: 기존 `BottomTabNavigation` 그대로 사용
- `InstituteBottomNav.tsx` 삭제 (더 이상 사용 안 함)

#### 2. 헤더 로고 조건부 변경
- `AppHeader` 또는 `HeaderLogo` 에서 현재 경로가 `/institute`로 시작하면 Institute 로고 표시
- 나머지는 기존 K-Worship 로고 유지

#### 3. 인스티튜트 페이지 스타일 전환
모든 인라인 `--inst-*` 스타일을 기존 Tailwind/shadcn 클래스로 교체:

| 기존 (inst) | 변경 (platform) |
|---|---|
| `--inst-bg: #f5f4f0` | `bg-background` (gradient-soft) |
| `--inst-surface: #ffffff` | `bg-card` |
| `--inst-border: #e8e6e0` | `border-border` |
| `--inst-gold: #b8902a` | `text-primary` |
| `--inst-ink: #1a1a1a` | `text-foreground` |
| `--inst-ink2: #5a5850` | `text-muted-foreground` |
| `inst-btn-gold` | shadcn `Button` (default variant) |
| `inst-btn-outline` | shadcn `Button variant="outline"` |
| `inst-badge-certified` | shadcn `Badge` |
| 커스텀 카드 div | shadcn `Card` 컴포넌트 |

#### 4. `Institute.tsx` (메인 대시보드) 리디자인
- 인라인 스타일 `S` 객체 전체를 Tailwind 클래스로 교체
- Hero 섹션: `Card` 컴포넌트 사용, primary 색상 악센트
- 코스 카드: `Card` + 기존 플랫폼 카드 패턴 사용
- 자격증 카드: `Card` + `Badge` 사용
- AI Coach 배너: `Card` + `Button`

#### 5. `InstituteCourse.tsx`, `InstituteModule.tsx`, `InstituteChapter.tsx` 리디자인
- `var(--inst-*)` → Tailwind 클래스
- `inst-status-*` CSS → Tailwind 유틸리티
- `inst-prose` → `prose` (typography plugin) + 플랫폼 색상
- `inst-progress` → Tailwind/shadcn `Progress` 컴포넌트
- 사이드바: `bg-muted`, `border-border` 등 기존 토큰
- 바텀 내비(이전/다음 버튼): shadcn `Button`

#### 6. `InstituteCompletionModal.tsx`, `InstituteInvitationBanner.tsx` 스타일 전환
- 모달: shadcn `Dialog` 또는 기존 토큰 사용
- 배너: `bg-accent/10`, `border-accent`, `text-accent` 등 플랫폼 패턴

#### 7. `institute.css` 정리
- `inst-root`, `inst-header`, `inst-content` 등 풀스크린 관련 규칙 제거
- `inst-prose` → 필요한 부분만 유지하되 플랫폼 색상 변수로 전환
- 불필요한 `inst-btn-*`, `inst-status-*` 등 제거 (shadcn 컴포넌트로 대체)

#### 8. `InstituteInviteSection.tsx` — `inst-*` 스타일을 Tailwind으로 전환

### 수정 파일 목록 (약 10개)
1. `src/layouts/InstituteLayout.tsx` — 삭제 또는 AppLayout 래퍼로 변경
2. `src/components/layout/HeaderLogo.tsx` — Institute 경로 시 로고 변경
3. `src/pages/Institute.tsx` — 전체 스타일 전환
4. `src/pages/InstituteCourse.tsx` — 스타일 전환
5. `src/pages/InstituteModule.tsx` — 스타일 전환
6. `src/pages/InstituteChapter.tsx` — 스타일 전환
7. `src/components/institute/InstituteCompletionModal.tsx` — 스타일 전환
8. `src/components/institute/InstituteInvitationBanner.tsx` — 스타일 전환
9. `src/components/institute/InstituteInviteSection.tsx` — 스타일 전환
10. `src/styles/institute.css` — 대폭 정리
11. `src/components/institute/InstituteBottomNav.tsx` — 삭제

### 건드리지 않는 것
- Edge Functions (`award-institute-badge`, `institute-ai-coach`)
- Feature flag (`institute_enabled`) 체크 로직
- DB 스키마 / RLS 정책
- 기존 `AppHeader`, `BottomTabNavigation` 로직 (로고 분기만 추가)

