

## 진단

`src/pages/SongLibrary.tsx` 119~124번 줄 useEffect: 카트에 곡 추가 시 `searchRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })` 호출 → 페이지가 검색/액션 카드 위치(거의 최상단)로 스크롤됨. 사용자가 스크롤 내려서 곡을 보고 있다가 선택하면 위로 튀어 올라가서 흐름이 끊김.

목표:
- **스크롤 이동 제거** (현재 위치 유지)
- **액션 버튼은 계속 보이게** — 즉 액션 버튼을 sticky/floating으로 띄워서 어느 위치에서든 바로 보이게.

## 변경 계획

### `src/pages/SongLibrary.tsx`

1. **자동 스크롤 useEffect 제거** (line 119~124) — `searchRef.scrollIntoView` 호출 삭제. `prevCartCountRef` 추적도 더이상 불필요하므로 정리.

2. **카트 액션 버튼을 floating으로** — 카트에 1개 이상 곡이 담겼을 때 화면 하단(또는 헤더 아래 sticky)에 떠 있는 액션 바 표시. 기존 프로젝트의 `FloatingActionStack` 패턴(`bottom-32`, `z-40`) 재사용.
   - 위치: `fixed bottom-X right-4` (모바일 기준, 미니플레이어 유무 고려해 `bottom-32`/`bottom-48`)
   - 내용: 현재 카트 액션 카드 안의 핵심 버튼들(예: "세트에 추가", "카트 비우기", 카운트 뱃지)
   - 카트가 비어있으면 숨김 (`hidden` prop 활용)

3. **기존 상단 검색/액션 카드 정리** — 카드 자체는 검색 UI 용도로 유지하되, 카트 관련 액션은 floating으로 이동(또는 양쪽 다 표시 — 사용자 확인 필요시 단순화).

4. **`searchRef` 자체 제거** — 더이상 사용되지 않음.

### 영향 파일
- `src/pages/SongLibrary.tsx` — useEffect/ref 제거 + FloatingActionStack 사용

데이터/스키마/번역 변경 없음. 순수 UX 동작 변경.

