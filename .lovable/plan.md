

## Institute 프론트 페이지 재설계 + 전체 CSS 통일

### 변경 개요

총 4개 파일 수정, 1개 파일 신규 생성.

---

### 1. Institute 메인 페이지 재설계 (`src/pages/Institute.tsx`)

현재 페이지를 완전히 재작성하여 아래 구조로 변경:

**Hero 섹션**
- 골드 eyebrow 배지: "🎓 K-WORSHIP CERTIFIED"
- 대형 타이틀 (22px, bold 800): "한국 예배 사역자를 위한 공식 자격증 스쿨" — "공식 자격증 스쿨" 부분만 골드 컬러
- 서브텍스트 (13px, #5a5850): "찬양인도자, 예배팀 리더, 사역자를 위한 온라인 커리큘럼 · AI 학습 코치 · 공식 배지 발급"
- 16:9 다크 박스 (bg: #1a1a1a, border-radius: 12px) — 중앙에 ▶ 아이콘과 "AI 강사 소개 영상" 텍스트. 향후 video_url 있으면 실제 영상으로 교체 가능한 구조
- 통계 3개 가로 나열 (flex, equal width, 카드 스타일): "3+ 자격증 과정" / "AI 학습 코치" / "∞ 평생 수강"

**AI 코치 배너**
- 전체 너비 카드. 골드 AI 아이콘 (22x22 gradient box) + "AI 코치에게 질문하기" + 서브텍스트
- 우측에 "정식멤버" 골드 배지
- `useTierFeature('institute_ai_coach')`로 게이트. 미충족 시 클릭하면 LockedFeatureBanner 또는 멤버십 페이지로 이동
- 기존 `InstituteAiCoach` 컴포넌트의 버튼 UI를 참고하되 메인 페이지용 배너로 재구성

**자격증 과정 섹션** — 기존 가로 스크롤 카드 유지 (현재 코드 재활용)

**전체 과목 섹션** — 기존 세로 리스트 유지 (현재 코드 재활용)

### 2. Institute 바텀 네비게이션 신규 생성 (`src/components/institute/InstituteBottomNav.tsx`)

4탭 구조:
| 탭 | 아이콘 | 경로 |
|---|---|---|
| 홈 | Home | `/institute` |
| 과목 | BookOpen | `/institute/courses` (현재는 메인과 동일, 향후 분리 가능) |
| 자격증 | Award | `/institute/certifications` (현재는 메인과 동일) |
| 마이페이지 | User | `/institute/my` (향후 구현) |

- 현재 활성 탭: 골드 컬러 (#b8902a) + 하단 골드 점 (4px dot)
- 비활성: #9a9890
- 배경: #ffffff, 상단 border: 1px solid #e8e6e0
- 과목/자격증/마이페이지 탭은 아직 별도 라우트가 없으므로 클릭 시 `/institute`로 이동 (향후 라우트 추가 시 변경)

### 3. InstituteLayout 수정 (`src/layouts/InstituteLayout.tsx`)

- `<main>` 아래에 `InstituteBottomNav` 추가
- 메인 페이지(`/institute`)에서만 바텀 네비 표시. 모듈 학습 페이지 등에서는 숨김
- 바텀 네비가 콘텐츠를 가리지 않도록 main에 `paddingBottom` 추가

### 4. 하위 페이지 CSS 통일

**InstituteCourse.tsx** (과목 상세)
- Hero 배경 확인: 이미 `var(--inst-surface)` = `#ffffff` ✓
- 커리큘럼 모듈 제목 폰트: `13px` → `14px`
- 수강 신청 버튼: 이미 `inst-btn-gold` 클래스 사용 ✓

**InstituteModule.tsx** (모듈 학습)
- 사이드바 배경: 이미 `var(--inst-surface2)` = `#f9f8f5` ✓
- 다음 모듈 버튼: 이미 `inst-btn-gold-sm` 클래스 사용 ✓
- 사이드바 과목명 폰트: `9px` → `11px`
- 모듈 리스트 항목 폰트: `12px` → `13px`

**InstituteCertification.tsx** (자격증 상세)
- 이미 CSS 변수 기반으로 잘 구현되어 있음 ✓
- 과목 리스트 항목 폰트: `13px` → `14px`

### 수정 파일 요약

| 파일 | 변경 |
|---|---|
| `src/pages/Institute.tsx` | Hero + AI코치 배너 + 통계 섹션 추가, 전체 재구성 |
| `src/components/institute/InstituteBottomNav.tsx` | **신규** — 4탭 바텀 네비 |
| `src/layouts/InstituteLayout.tsx` | 바텀 네비 통합 |
| `src/pages/InstituteCourse.tsx` | 커리큘럼 폰트 14px |
| `src/pages/InstituteModule.tsx` | 사이드바 폰트 업사이징 |

