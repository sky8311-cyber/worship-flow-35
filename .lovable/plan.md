

# Fix: 1층 매장/도로 잘림 근본 해결

## 원인 분석

현재 모바일 레이아웃 구조 (Sheet 85vh ≈ 560px):

```text
Sheet (h-[85vh] ≈ 560px)
├─ Drag handle (~32px, shrink-0)
└─ Content wrapper (flex-1, overflow-hidden) ≈ 528px
   └─ StudioSidePanel (h-full)
      ├─ Spacer (h-5 = 20px)
      └─ Building wrapper (flex-1)
         ├─ Rooftop scene (~78px, shrink-0)
         ├─ Building body (h-[45vh]=297px, flex-none) ← 절대 줄어들지 않음
         ├─ Ground floor shops (h-20=80px)
         └─ Road (~44px, shrink-0)
         = 합계 ≈ 519px
```

Building body가 `flex-none`이라 축소 불가. 합계가 컨테이너를 초과하면 `overflow-hidden`으로 하단이 잘림.

## 해결 방법

Building body를 **고정 높이(`h-[45vh] flex-none`)** 대신 **유연한 높이(`flex-1 min-h-0`)**로 변경. 
Ground floor와 Road는 `shrink-0`로 고정하여 **절대 잘리지 않도록** 보장.

빌딩 본체가 남은 공간을 채우되 내부는 이미 `ScrollArea`가 있으므로 스크롤 가능.

## 변경 사항

### 1. `src/components/worship-studio/StudioSidePanel.tsx`

**Line 695** — Building body 클래스 변경:
```
Before: isMobile ? "mx-6 h-[45vh] flex-none" : "mx-3 flex-1"
After:  isMobile ? "mx-6 flex-1 min-h-0" : "mx-3 flex-1"
```

**Line 712** — Ground floor shops 래퍼에 `shrink-0` 추가:
```
Before: "shrink-0 border-x border-[#7a8a9a] bg-[#e4ecf2]"
(이미 shrink-0 있음 — 변경 없음)
```

이렇게 하면:
- Rooftop(shrink-0) + GroundFloor(shrink-0, h-20) + Road(shrink-0) = 고정 요소 ~142px
- Building body = 나머지 공간 전부 차지 (내부 ScrollArea로 스크롤)
- 1층 매장과 도로는 **항상 완전히 표시**

### 변경 파일
- `src/components/worship-studio/StudioSidePanel.tsx` (1줄 수정)

