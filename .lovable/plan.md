

## Institute UX/디자인 대폭 개선 — Artos Academy 벤치마킹

### 현재 문제
- 코스 목록이 작은 리스트 카드로만 표시 — 시각적 임팩트 부족
- 코스 상세 페이지가 텍스트 위주 — 썸네일 히어로, 코스 정보 메타데이터 부재
- 모듈/챕터 목록이 단순 — Lesson 단위 그룹핑 없이 밋밋함
- 유저를 가이드하는 텍스트/프레임 부족 (수강 방법, 과정 소개 등)
- `InstituteCertification.tsx`에 아직 `var(--inst-*)` 인라인 스타일 잔재

### 벤치마킹 포인트 (Artos Academy 레퍼런스)
1. **코스 카드**: 큰 썸네일 이미지 + 오버레이 텍스트 (레슨 수, 레벨, 강사명, 설명)
2. **코스 상세 히어로**: 다크 배경 + 큰 타이틀 + 설명 + "View Course details" 펼침
3. **코스 디테일 영역**: 수강 정보 (레슨 수, 강사 정보, 수료증 여부) 아이콘 리스트
4. **커리큘럼 목록**: "Lesson One" / "Lesson Two" 등 모듈 제목 → 하위 챕터 카드 (아이콘, 활동 수, 완료 원형 인디케이터)

### 변경 사항

#### 1. `Institute.tsx` — 코스 카드 비주얼 개선
- 현재 52px 작은 아이콘 + 텍스트 리스트 → **큰 썸네일 카드** (aspect-ratio 16/9)
- 썸네일 위에 반투명 오버레이로 코스 타이틀, 모듈 수, 강사명 표시
- 썸네일 없으면 `bg-primary` 그라데이션 + 타이틀
- 하단에 진행률 바 + 배지 유지
- Hero 섹션 간소화 (세로 비디오 플레이스홀더 제거 → 간결한 소개 텍스트 + AI 코치 버튼)

#### 2. `InstituteCourse.tsx` — 코스 상세 페이지 리디자인
- **다크 히어로 배너**: 썸네일 배경 + 오버레이 or `bg-foreground` + 흰 텍스트로 코스 타이틀, 설명
- **코스 정보 메타**: 아이콘 리스트 (모듈 수, 강사명, 수료증 여부, 필요 멤버십 레벨)
- **수강 신청 CTA**: 현재와 동일하되 더 눈에 띄게
- **커리큘럼 섹션**: 모듈별 그룹핑 강화 — 모듈 제목을 섹션 헤더로, 하위 챕터 수 표시

#### 3. `InstituteModule.tsx` — 챕터 목록 개선
- 모듈 상단에 모듈 설명 텍스트 추가 (가이드 역할)
- 챕터 카드에 타입 아이콘 표시 (비디오 있으면 Play 아이콘, 텍스트만이면 BookOpen, 오디오면 Headphones)
- 완료 인디케이터를 원형 체크 (Artos 스타일)

#### 4. `InstituteChapter.tsx` — 챕터 뷰 개선
- 상단에 "Chapter X of Y" 진행 표시
- 컨텐츠 하단에 "이 챕터에서 배운 것" 요약 프레임 (있을 경우)
- 완료 버튼 더 명확하게

#### 5. `InstituteCertification.tsx` — `var(--inst-*)` 잔재 제거 + shadcn 전환
- 모든 인라인 `var(--inst-*)` 스타일 → Tailwind 클래스
- 커스텀 `inst-btn-gold`, `inst-badge-certified` 등 → shadcn `Button`, `Badge`
- 배지 다이얼로그 → shadcn 패턴 (Card 기반 모달)

#### 6. `institute.css` — 미사용 클래스 정리
- `inst-btn-gold`, `inst-btn-outline`, `inst-btn-gold-sm`, `inst-badge-certified`, `inst-section-header`, `inst-card-hover`, `inst-status`, `inst-status-done`, `inst-status-pending` 등 아직 남아있는 클래스가 있으면 제거
- `inst-prose`만 유지

### 수정 파일 (6개)
1. `src/pages/Institute.tsx` — 코스 카드 비주얼 + 히어로 간소화
2. `src/pages/InstituteCourse.tsx` — 다크 히어로 + 메타 정보 + 커리큘럼 개선
3. `src/pages/InstituteModule.tsx` — 챕터 카드 타입 아이콘 + 가이드 텍스트
4. `src/pages/InstituteChapter.tsx` — 진행 표시 개선
5. `src/pages/InstituteCertification.tsx` — inst 스타일 완전 제거 + shadcn 전환
6. `src/styles/institute.css` — 미사용 클래스 정리

### 건드리지 않는 것
- Edge Functions, DB 스키마, RLS, feature flag
- `AppLayout`, `BottomTabNavigation`, `HeaderLogo` (이미 통합 완료)
- 기존 데이터 쿼리 로직 (UI만 변경)

