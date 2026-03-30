

# StudioHeader 구분선 삭제

## 문제
`StudioHeader.tsx` line 19에 `border-b border-border` 클래스가 여전히 적용되어 있어 헤더 하단에 구분선이 보입니다.

## 변경

### `src/components/worship-studio/StudioHeader.tsx`
- Line 19: `border-b border-border` 제거

```tsx
// Before
<header className="flex items-center justify-between px-3 py-2 border-b border-border bg-background/95 backdrop-blur-sm">

// After
<header className="flex items-center justify-between px-3 py-2 bg-background/95 backdrop-blur-sm">
```

