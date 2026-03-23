

## Institute 설정 — 통합 트리 구조 개편

### 현재 문제
- "과목(Courses)" 탭과 "자격증(Certifications)" 탭이 분리되어 있어 전체 계층 구조를 한눈에 볼 수 없음
- Pathway → Course → Module → Chapter 관계가 직관적이지 않음

### 변경 계획

**탭 구조 변경** (`InstituteSetting.tsx`):
- "과목" + "자격증" 탭 → **"커리큘럼"** 탭 1개로 통합
- 나머지 탭(강사, 수강생) 유지

**새 컴포넌트** `AdminInstituteContentTree.tsx`:
- 4단 폴더/트리 구조로 전체 hierarchy를 한 화면에 표시

```text
▼ 📂 Pathway: 워십 리부트 자격 과정     [+ Course] [Edit] [Delete]
  ▼ 📘 Course: 워십 리부트               [+ Module] [Edit] [Delete]
    ▼ 📄 Module: 1과 - 예배란 무엇인가   [+ Chapter] [Edit] [Delete]
      📝 Chapter: 1-1 예배의 정의         [Edit] [Delete]
      📝 Chapter: 1-2 성경적 예배         [Edit] [Delete]
    ▶ 📄 Module: 2과 - 예배 인도의 원리
  ▶ 📘 Course: 찬양 인도 기초
▶ 📂 Pathway: 예배팀 리더십 과정
── Unassigned Courses ──
  ▶ 📘 Course: (패스웨이 미지정 코스)
```

**각 레벨 기능**:
- **Pathway**: 추가/삭제/이름 편집/published 토글. 클릭시 상세 편집 패널(배지, 템플릿, 설명)
- **Course**: 추가/삭제/이름 편집. 드래그로 다른 Pathway로 이동 가능. 클릭시 상세(썸네일, 강사, tier 등)
- **Module**: 추가/삭제/이름 편집/sort_order. 클릭시 상세(video_url, tier)
- **Chapter**: 추가/삭제/이름 편집. 클릭시 상세(video, audio, content HTML)

**상세 편집**: 트리 오른쪽에 선택된 항목의 편집 패널 표시 (현재 Certifications 탭의 left-right 레이아웃과 유사)

### 수정 파일
1. `src/components/institute/AdminInstituteContentTree.tsx` — 새 통합 트리 컴포넌트 (기존 AdminInstituteCourses + AdminInstituteCertifications 로직 통합)
2. `src/pages/InstituteSetting.tsx` — 탭 구조 변경 (courses/certifications → curriculum 탭 1개)
3. 기존 `AdminInstituteCourses.tsx`, `AdminInstituteCertifications.tsx` — 이 페이지에서는 더 이상 사용하지 않음 (삭제 또는 유지)

### 기술 구현
- Collapsible 컴포넌트로 각 레벨 접기/펼치기
- 왼쪽: 트리 뷰 (~40% 너비), 오른쪽: 선택된 항목 상세 편집 패널 (~60%)
- 기존 DB 테이블/쿼리 그대로 활용 (institute_certifications, institute_certification_courses, institute_courses, institute_modules, institute_chapters)
- "미지정 코스" 섹션: 어떤 Pathway에도 속하지 않은 코스를 별도로 표시

