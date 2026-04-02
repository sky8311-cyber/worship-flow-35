

# 검색 버튼을 검색창으로 전환

## 문제
현재: "예배공동체 검색" 버튼 → 클릭 → 아래에 또 SearchInput이 나타남 (중복 UI)

## 변경

### `src/components/dashboard/QuickActionsCard.tsx`
- 검색 Button을 제거하고, 그 자리에 `SearchInput`을 직접 배치
- `showSearch` state 제거 → `InlineCommunitySearch`에 검색어 state를 내장하되, 항상 검색창은 보이게
- 또는: 평소에는 버튼처럼 보이다가 클릭하면 input으로 전환되는 방식
- **채택 방식**: `showSearch`를 유지하되, true일 때 Button 대신 `InlineCommunitySearch`(검색창 포함)를 보여줌. 즉 Button이 사라지고 검색창+결과가 그 자리를 대체

### `src/components/dashboard/InlineCommunitySearch.tsx`
- `autoFocus` prop을 SearchInput에 추가 → 열리자마자 커서 진입
- 닫기(X) 버튼 추가: 검색창 오른쪽 또는 상단에 닫기 버튼 → 클릭 시 `onClose` 콜백 호출
- `onClose` prop 추가

### 동작 흐름
1. 사용자가 "예배공동체 검색" 버튼 클릭
2. 버튼이 사라지고, 그 자리에 검색 input이 나타남 (autoFocus로 바로 커서)
3. 2글자 이상 입력 시 드롭다운으로 결과 표시
4. X 버튼 또는 input 비우기 시 → 버튼 상태로 복귀

