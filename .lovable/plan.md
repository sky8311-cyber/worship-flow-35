

## 두 가지 수정

### 1. 튜토리얼 버튼에 텍스트 추가
현재 SetBuilder와 SongLibrary 모두 아이콘만 있는 버튼(`size="icon"`)으로 되어 있음. 텍스트("가이드 보기")를 함께 표시하도록 변경.

**수정 파일**:
- `src/pages/SetBuilder.tsx` (line 1567): `size="icon"` → `size="sm"`, 텍스트 "가이드" 추가
- `src/pages/SongLibrary.tsx` (line 682): 동일하게 변경

### 2. 자동 시작 로직은 이미 정상 작동 중
`useTutorial.ts`의 자동 시작은 `localStorage.getItem(storageKey)`를 체크하여 **첫 방문 1회만** 실행됨. `close()` 호출 시 `localStorage.setItem(storageKey, "true")`로 저장하므로 이후 재방문 시 자동 시작되지 않음. 현재 코드가 이미 요구사항대로 동작하고 있어 변경 불필요.

### 수정 파일 (2개)
1. `src/pages/SetBuilder.tsx` — 버튼에 텍스트 추가
2. `src/pages/SongLibrary.tsx` — 버튼에 텍스트 추가

