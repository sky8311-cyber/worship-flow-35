
## 작업 이해

송 라이브러리(/songs)에서 곡을 카트에 담을 때, 상단의 "곡 검색 / 새 곡 추가 / 곡 담기(카트)" 액션 영역이 스크롤되어 화면 밖에 있으면 사용자가 직접 위로 스크롤해야 카트 버튼이 보임. → **카트에 곡이 담기는 순간 자동으로 상단 액션 바로 부드럽게 스크롤**해서 사용자가 즉시 카트 액션을 취할 수 있게 한다.

## 변경 계획

### `src/pages/SongLibrary.tsx`

1. 상단 액션 바(검색/새 곡 추가/카트 버튼이 위치한 컨테이너)에 `actionBarRef` 부착.
2. `useSongCart()`의 `cartCount`를 watch하는 `useEffect` 추가:
   - `prevCountRef`로 직전 값 저장
   - **카운트가 증가했을 때만** `actionBarRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })` 실행
   - 첫 마운트(localStorage 복원)에는 스크롤 안 함 — `prevCountRef`를 초기 cartCount로 시드
   - 감소(제거/clear)에는 스크롤 안 함

### 동작 결과
- 어느 위치에서든 곡을 카트에 담는 순간 → 상단 액션 바가 화면 안으로 부드럽게 들어옴
- 사용자는 즉시 "곡 담기(카트 열기)" 또는 "세트에 추가" 가능
- 평소 화면 공간은 그대로 (sticky 고정 아님)

## 영향 파일
- `src/pages/SongLibrary.tsx` — `actionBarRef` + `cartCount` 감시 useEffect 추가

데이터/스키마/번역 변경 없음. 순수 UX 개선.
