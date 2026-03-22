

## 404 오류 수정 — `/communities` → `/community/search`

### 원인
대시보드의 "예배공동체 찾기" 버튼과 "전체 보기" 링크가 `/communities`로 이동하지만, 실제 라우트는 `/community/search`입니다. `/communities` 라우트는 존재하지 않아 404가 발생합니다.

### 수정 파일 (2개)

1. **`src/components/dashboard/CommunityNewsfeed.tsx`** (line 189): `<Link to="/communities">` → `<Link to="/community/search">`
2. **`src/components/dashboard/CommunitiesSidebarList.tsx`** (line 93): `<Link to="/communities">` → `<Link to="/community/search">`

