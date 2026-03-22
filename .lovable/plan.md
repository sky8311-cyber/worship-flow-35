

## SlashCommandMenu가 미니플레이어에 가려지는 문제 수정

### 원인
- SlashCommandMenu: `fixed z-50`, 커서 위치 아래로 렌더링 → 하단 항목이 미니플레이어(`z-[55]`, `bottom-14`)에 가림

### 해결 방법
**`src/components/worship-studio/editor/SlashCommandMenu.tsx`** 수정:
1. **z-index 상향**: `z-50` → `z-[60]` (미니플레이어 `z-[55]` 위)
2. **메뉴 위치를 위로 열리게 변경**: 현재 커서 아래로 열리는데, 화면 하단 공간이 부족하면 위로 열리도록 viewport 체크 로직 추가
   - `position.top + menuHeight > window.innerHeight - 100` 이면 메뉴를 위로 배치

### 수정 파일 (1개)
- `src/components/worship-studio/editor/SlashCommandMenu.tsx`

