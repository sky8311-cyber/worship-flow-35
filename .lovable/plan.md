

# 공동체 검색: 인라인 드롭다운 방식으로 변경

## 요약
"공동체 검색" 버튼 클릭 시 별도 페이지(`/community/search`)로 이동하지 않고, **사이드바 안에서 검색 입력창이 펼쳐지고, 검색어를 입력해야만 결과가 표시**되는 인라인 방식으로 변경합니다.

## 핵심 동작
- 검색 버튼 클릭 → 버튼 아래에 `SearchInput`이 펼쳐짐 (토글)
- 검색어가 비어 있으면 결과 없음 (전체 목록 노출 안 함)
- 검색어 2글자 이상 입력 시 DB에서 이름/설명 매칭되는 공동체만 표시
- 각 결과에 "가입 신청" / "승인 대기" / "이미 멤버" 상태 표시 (기존 CommunitySearch 페이지 로직 재활용)
- 가입 신청/취소 액션도 인라인에서 바로 처리

## 변경 파일

### 1. 새 컴포넌트: `src/components/dashboard/InlineCommunitySearch.tsx`
- `QuickActionsCard` 내부에서 사용할 인라인 검색 컴포넌트
- 검색어 state → 2글자 이상일 때만 `useQuery`로 공동체 검색 (활성 공동체만, `is_active = true`)
- 검색어가 비어있으면 "검색어를 입력하세요" 안내 텍스트만 표시
- 결과 리스트: 공동체 이름, 멤버 수, 가입 상태/버튼
- 가입 신청/취소 mutation은 기존 `CommunitySearch.tsx`에서 로직 가져옴

### 2. 수정: `src/components/dashboard/QuickActionsCard.tsx`
- `navigate("/community/search")` 제거
- 검색 버튼 클릭 시 `showSearch` state 토글
- `showSearch`가 true일 때 `InlineCommunitySearch` 컴포넌트 렌더링

### 3. 수정: `src/components/dashboard/CommunitiesSidebarList.tsx`
- "더보기" 링크(`/community/search`)를 제거하거나, 같은 인라인 검색을 트리거하는 방식으로 변경
- 또는 단순히 `maxVisible`을 넘는 커뮤니티는 "더보기" 클릭 시 나머지를 펼치는 방식으로 변경 (전체 목록 노출이지만 이미 가입한 공동체이므로 문제 없음)

### 4. `/community/search` 라우트는 유지
- 다른 진입점(온보딩 다이얼로그, 뉴스피드 등)에서 아직 사용 중
- 단, 해당 페이지도 검색어 없으면 결과를 표시하지 않도록 수정 (전체 목록 노출 방지)

## 기술 메모
- 검색 쿼리: `supabase.from("worship_communities").select("id, name, description, avatar_url").eq("is_active", true).ilike("name", `%${query}%`)` — 서버사이드 필터링으로 전체 목록 전송 방지
- 결과 최대 20건 `.limit(20)` 적용

