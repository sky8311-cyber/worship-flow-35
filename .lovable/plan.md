
## 계획: 샘플 코스 삭제 + Institute Setting 페이지 분리

### 1. 샘플 데이터 삭제 (DB)
워십 리부트를 제외한 3개 샘플 코스 및 관련 데이터 삭제:
- `institute_certification_courses` 연결 레코드 삭제 (3건)
- `institute_enrollments` 삭제 (1건 - 예배 신학 기초)
- `institute_courses` 삭제: 예배 신학 기초, 찬양 선곡 원칙, 예배팀 리더십
- `institute_certifications` 삭제: Worship Leading Foundation, Worship Team Leadership (샘플 자격증 2개)

### 2. `/institute/setting` 페이지 생성
**새 파일**: `src/pages/InstituteSetting.tsx`
- `InstituteLayout`으로 감싸기 (기존 Institute 페이지와 동일한 레이아웃)
- 어드민 전용 접근 체크 추가
- 탭 구조로 관리 영역 분리:
  - **과목 관리** (Courses) — 기존 `AdminInstituteCourses` 컴포넌트 재사용
  - **강사 관리** (Instructors) — 기존 `AdminInstituteInstructors` 컴포넌트 재사용
  - **자격증/패스웨이** (Certifications) — 기존 `AdminInstituteCertifications` 컴포넌트 재사용
  - **수강생 관리** (Enrollments) — 새로운 enrollment 관리 탭 추가 (수강생 목록, 진행 상황 확인)

### 3. 라우팅 변경
**`src/App.tsx`**:
- `/institute/setting` 라우트 추가 (AdminRoute로 보호)
- `/admin/institute` 라우트 유지 (호환성) 또는 제거

### 4. 네비게이션 업데이트
**`src/components/admin/AdminNav.tsx`**:
- Institute 링크를 `/admin/institute` → `/institute/setting`으로 변경

**`src/pages/Institute.tsx`** (학생용 메인 페이지):
- 어드민인 경우 "설정" 버튼 추가하여 `/institute/setting`으로 이동 가능하게

### 5. Enrollment 관리 탭 (새 컴포넌트)
**새 파일**: `src/components/institute/AdminInstituteEnrollments.tsx`
- 전체 수강생 enrollment 목록 표시
- 코스별 필터
- 진행 상태 (진행 중 / 완료) 표시
- 수동 enrollment 추가/삭제

### 수정 파일 요약
1. DB: 샘플 데이터 삭제 (insert tool 사용)
2. `src/pages/InstituteSetting.tsx` — 새 페이지 생성
3. `src/components/institute/AdminInstituteEnrollments.tsx` — 새 컴포넌트
4. `src/App.tsx` — 라우트 추가
5. `src/components/admin/AdminNav.tsx` — 링크 변경
6. `src/pages/Institute.tsx` — 어드민 설정 버튼 추가
