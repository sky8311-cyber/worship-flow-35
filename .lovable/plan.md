
SetBuilder.tsx의 인라인 ReorderItemsPanel 래퍼에서 `bg-accent/50` 배경을 제거하고, 주변 다른 카드/섹션과 동일한 밝은 기본 배경(예: `bg-card` + `border`)으로 교체.

변경:
- `src/pages/SetBuilder.tsx`에서 해당 div의 `className`:
  - 기존: `mt-6 p-4 bg-accent/50 rounded-lg`
  - 변경: `mt-6 p-4 bg-card border border-border rounded-lg`

다른 파일 변경 없음. 데이터/로직 변경 없음.
