

## 정식멤버 기능 토글 — AI Integration + Institute 숨기기/표시

### 목적
AI 기능(Worship Set AI, Worship Profile Chat)과 K-Worship Institute를 퍼블리시 전에 숨길 수 있도록 관리자 토글 3개를 추가한다.

### 변경 내용

#### 1. DB: `platform_feature_flags` 테이블에 3개 신규 플래그 삽입
- `ai_set_builder_enabled` (default: false) — AI 세트 빌더 기능
- `worship_profile_enabled` (default: false) — 예배 프로필 챗 기능
- `institute_enabled` (default: false) — K-Worship Institute 전체

#### 2. `useAppSettings.ts` — 3개 플래그 추가
- `FeatureFlags` 인터페이스에 `ai_set_builder_enabled`, `worship_profile_enabled`, `institute_enabled` 추가
- 각각 `isAiSetBuilderEnabled`, `isWorshipProfileEnabled`, `isInstituteEnabled` 반환값 + toggle 함수 추가
- sandbox tester override 지원

#### 3. `AdminDashboard.tsx` — 멤버십 설정 카드에 토글 3개 추가
기존 "정식멤버 계정 설정" 카드 내에:
- **AI 세트 빌더**: "AI를 활용한 워십세트 자동 생성 기능"
- **예배 프로필**: "AI 기반 예배 프로필 온보딩 챗"
- **K-Worship Institute**: "온라인 자격증 스쿨 전체 표시"

#### 4. `AppHeader.tsx` — 메뉴 항목 조건부 숨기기
- Institute 메뉴 (`<Link to="/institute">`): `isInstituteEnabled` 또는 sandbox 조건으로 감싸기
- Worship Profile 메뉴 (`openCurationChat`): `isWorshipProfileEnabled` 조건 추가
- Instructor 메뉴 (`/institute/manage`): `isInstituteEnabled` 조건 추가

#### 5. `SetBuilder.tsx` — AI 세트 버튼 숨기기
- AI 세트 버튼/패널: 기존 `hasFeature('ai_set_builder')` 체크에 추가로 `isAiSetBuilderEnabled` 플래그 확인. 플래그 OFF 시 AI 세트 버튼 자체를 숨김

#### 6. Institute 라우트 보호
- Institute 관련 라우트(`/institute`, `/institute/*`)에서 `isInstituteEnabled`가 false이면 대시보드로 리다이렉트 또는 빈 상태 표시. `InstituteLayout.tsx`에서 처리

#### 7. `CurationProfileCard` (Settings.tsx 내) — 숨기기
- `isWorshipProfileEnabled`가 false이면 Worship Curation Profile 카드 숨김

### 수정 파일
| 파일 | 변경 |
|---|---|
| DB migration | 3개 플래그 INSERT |
| `src/hooks/useAppSettings.ts` | 3개 플래그 + toggle 추가 |
| `src/pages/AdminDashboard.tsx` | 멤버십 카드에 토글 3개 UI |
| `src/components/layout/AppHeader.tsx` | Institute/Profile 메뉴 조건부 |
| `src/pages/SetBuilder.tsx` | AI 세트 버튼 플래그 체크 |
| `src/layouts/InstituteLayout.tsx` | 플래그 OFF 시 리다이렉트 |
| `src/pages/Settings.tsx` | Profile 카드 플래그 체크 |

