

# 아바타 창문 정사각형 수정

**문제**: 펜트하우스(내 아틀리에) 아바타 창문이 `w-8 h-10`으로 설정되어 세로가 더 긴 직사각형임.

**수정**: `StudioUnit.tsx` line 41에서 비-compact 아바타 너비를 `w-8` → `w-10`으로 변경하여 `w-10 h-10` 정사각형으로 통일.

```tsx
// Before
const avatarW = compact && !isPenthouse ? "w-7" : "w-8";

// After  
const avatarW = compact && !isPenthouse ? "w-7" : "w-10";
```

**파일**: `src/components/worship-studio/StudioUnit.tsx` (1줄 변경)

