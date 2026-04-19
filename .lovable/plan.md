
## 예배순서 컴포넌트 번호 버튼 색상 수정

### 문제
`SetComponentItem.tsx`의 번호 버튼이 `text-accent-foreground` (흰색/밝은색)을 사용해서 `bg-accent/10` 옅은 배경 위에서 글자가 거의 안 보임.

### 원인
지난 변경에서 `SetSongItem`은 `text-primary` 사용했지만, `SetComponentItem`은 `text-accent-foreground`로 잘못 적용됨. `accent-foreground`는 진한 accent 배경 위에 쓰는 색이라 옅은 배경에서 대비 부족.

### 수정
`src/components/SetComponentItem.tsx` 번호 버튼:
- `text-accent-foreground` → `text-accent` (또는 `text-foreground`)로 변경
- `SetSongItem`과 일관성 유지

```tsx
className="flex items-center gap-1 px-2 h-9 rounded-full 
           bg-accent/10 hover:bg-accent/25 
           border-2 border-accent/40 hover:border-accent
           text-accent font-bold text-base 
           cursor-pointer transition-all"
```

### 영향 파일
- `src/components/SetComponentItem.tsx` (1줄 수정)
