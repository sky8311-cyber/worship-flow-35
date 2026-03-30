

# 모바일 빌딩 패널 개선

## 변경 파일: `src/pages/WorshipStudio.tsx` (line 169)

1. **높이 변경**: `h-[75vh]` → `h-[85vh]`
2. **드래그 핸들 추가**: `<SheetContent>` 안에 첫 번째 요소로 회색 pill 핸들 추가
   - `<div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-muted-foreground/30" /></div>`
3. **콘텐츠 상단 패딩**: `StudioSidePanel`을 감싸는 `<div>`에 `pt-2` 추가하여 닫기 버튼과 건축물 그래픽이 겹치지 않도록 처리

