

## 삭제 버튼 hover 시 흰색 아이콘 전환

### 수정 파일 (2개)

**1. `src/components/SongCard.tsx`** (라인 298-304)
- `hover:text-destructive` → `hover:bg-destructive hover:text-white hover:border-destructive`
- `group` 클래스 추가, 아이콘에 `group-hover:text-white`

**2. `src/components/WorshipSetCard.tsx`** (라인 153-160)
- 동일 패턴 적용

### 구현
```tsx
// SongCard
<Button 
  variant="outline" 
  size="icon" 
  className="group h-7 w-7 sm:h-8 sm:w-8 text-destructive hover:bg-destructive hover:text-white hover:border-destructive"
>
  <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 group-hover:text-white" />
</Button>

// WorshipSetCard
<Button 
  variant="ghost" 
  className="group h-8 px-2 gap-1 text-xs justify-start text-destructive hover:bg-destructive hover:text-white"
>
  <Trash2 className="w-4 h-4 group-hover:text-white" />
  삭제
</Button>
```

SongTable의 삭제 버튼도 동일하게 적용 (라인 ~470).

