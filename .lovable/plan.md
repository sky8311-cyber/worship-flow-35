
## C안 적용: 곡 순서 변경 진입점 명확화

### 변경 1: `SetSongItem.tsx` 숫자 버튼 강화
현재 `text-xl font-bold text-accent w-9 h-9 rounded-full` 단순 버튼을 명확한 인터랙션 배지로 교체:

```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <button
      onClick={() => onOpenReorder?.()}
      className="flex items-center gap-1 px-2 h-9 rounded-full 
                 bg-accent/10 hover:bg-accent/25 
                 border-2 border-accent/40 hover:border-accent
                 text-accent font-bold text-base
                 cursor-pointer transition-all"
    >
      {index + 1}
      <ArrowUpDown className="w-3 h-3 opacity-70" />
    </button>
  </TooltipTrigger>
  <TooltipContent>곡 순서 변경</TooltipContent>
</Tooltip>
```

### 변경 2: `SetComponentItem.tsx` 동일 적용
일관성을 위해 컴포넌트 아이템(예배 순서)도 같은 스타일 적용. (이미 `onOpenReorder` prop 존재)

### 변경 3: `SetBuilder.tsx` 상단 안내 문구
세트 곡 목록 상단(또는 "곡 추가" 버튼 근처)에 작은 hint 텍스트 추가:

```tsx
<p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-2">
  <ArrowUpDown className="w-3 h-3" />
  곡 번호를 눌러 순서를 변경할 수 있어요
</p>
```

### 영향 파일
- `src/components/SetSongItem.tsx` — 번호 버튼 스타일 + Tooltip + ArrowUpDown 아이콘
- `src/components/SetComponentItem.tsx` — 동일 적용
- `src/pages/SetBuilder.tsx` — 곡 목록 상단 안내 한 줄 추가

### 핵심 원칙
- **시각**: 테두리 + 배경으로 클릭 가능 명시
- **의미**: ArrowUpDown 아이콘으로 "정렬" 직관 전달
- **언어**: Tooltip + 상단 안내로 명시적 설명
- **일관**: 곡/컴포넌트 모두 동일 패턴
