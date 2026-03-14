

## YouTube 버튼 색상을 브랜드 Coral/Pink으로 변경

### 문제
현재 YouTube 버튼이 hover 시 명시적인 빨간색(`red-600`)을 사용하고 있으나, 사용자는 브랜드의 primary coral/pink 색상(#d16265, `--accent`)을 사용하길 원함.

### 수정 파일 (3개)

**1. `src/components/SongTable.tsx` (라인 441, 444)**
- `hover:bg-red-600` → `hover:bg-accent`
- `hover:border-red-600` → `hover:border-accent`
- `text-red-500` → `text-accent`

**2. `src/components/SongCard.tsx` (라인 210, 212)**
- 동일하게 `red-600` → `accent`, `red-500` → `accent`

**3. `src/components/SetSongItem.tsx` (라인 395, 397)**
- 동일 패턴 적용

### 구현
```tsx
<Button
  className="group hover:bg-accent hover:text-white hover:border-accent"
>
  <Youtube className="text-accent group-hover:text-white" />
  유튜브
</Button>
```

브랜드의 Accent Coral (#d16265) 색상을 Tailwind의 `accent` 토큰으로 일관되게 적용.

