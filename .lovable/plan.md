

# 모바일 빌딩 패널 높이 확장 (85dvh → 93dvh)

## 현재 상태
- Sheet 높이: `85dvh` → 659px 뷰포트 기준 약 560px
- 상단 drag handle + 여백: ~40px
- 고정 요소(Rooftop ~78px + 1F h-28 ~112px + Road ~44px) = ~234px
- **빌딩 본체(스크롤 영역): ~286px** → 층수 제한

## 변경

### `src/pages/WorshipStudio.tsx` (1줄)
- Sheet 높이를 `85dvh` → `93dvh`로 확장
```tsx
// Line 170
<SheetContent side="bottom" className="h-[93dvh] max-h-[93dvh] p-0 rounded-t-2xl overflow-hidden flex flex-col ...">
```

이렇게 하면 빌딩 본체 영역이 ~53px 추가 확보되어 더 많은 유닛/층이 한 번에 보이고, 스크롤 없이 입주 가능한 공간이 늘어남. 기존 `flex-1 min-h-0` 구조 덕분에 추가 높이가 자동으로 빌딩 본체에 배분됨.

상단 7dvh만 남겨 시트 뒤 배경이 살짝 보이므로 "시트"임을 인지 가능.

### 변경 파일
- `src/pages/WorshipStudio.tsx` (1줄 수정)

