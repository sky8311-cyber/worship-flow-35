

# 스튜디오 위젯 페이지 스크롤 및 버튼 문제 수정 계획

## 문제 분석

### 확인된 상황
- **기기**: 데스크톱
- **페이지**: 내 스튜디오 (`/rooms/137cab82-0876-4b2a-ab73-c2037b58e6e4`)
- **BGM 바**: 하단에 보임 (뮤직 플레이어 표시됨)
- **문제**: 스크롤 불가, 위젯 추가 버튼 안 보임

### 근본 원인 분석

이전 수정에서 `TabsContent`에 `h-0 overflow-hidden`을 적용했지만, 여전히 작동하지 않는 이유:

**1. ScrollArea의 Viewport 문제**

`src/components/ui/scroll-area.tsx` (line 10-11):
```tsx
<ScrollAreaPrimitive.Root ref={ref} className={cn("relative overflow-hidden", className)} {...props}>
  <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
```

`ScrollArea`의 Root에 `h-full`이 적용되지만, `Viewport`도 `h-full`입니다. 이는 **부모 체인 전체에 명시적 높이**가 있어야만 작동합니다.

**2. 레이아웃 구조 확인**

```
WorshipStudio.tsx (line 78)
└─ div.fixed.inset-0 ← 전체 화면, 높이 정의됨 ✓
   └─ div.flex-1.overflow-hidden.flex (line 92) ← flex-1만 있음, h-0 없음 ⚠️
      └─ StudioMainPanel (line 30)
         └─ div.flex-1.flex.flex-col.overflow-hidden ← flex-1만 있음, h-0 없음 ⚠️
            └─ Tabs.flex-1.flex.flex-col (line 31)
               └─ TabsContent.flex-1.h-0.overflow-hidden ← 수정됨 ✓
                  └─ StudioView (line 99)
                     └─ ScrollArea.h-full ← 부모 높이 체인이 끊김 ⚠️
```

**문제점**: `WorshipStudio.tsx`의 `div.flex-1.overflow-hidden.flex`와 `StudioMainPanel.tsx`의 `div.flex-1.flex.flex-col.overflow-hidden`에 **`h-0`이 없어서** 높이 체인이 끊어집니다.

**3. BGM 바가 공간을 차지**

`StudioGrid.tsx` (line 120): `pb-20` 패딩이 있지만, BGM 바 높이(`h-16` = 64px)보다 작을 수 있음. 또한 스크롤 자체가 안 되면 이 패딩도 의미 없음.

---

## 수정 계획

### Phase 1: 높이 체인 완성 (핵심 수정)

**파일 1: `src/pages/WorshipStudio.tsx` (line 92)**

```typescript
// 변경 전
<div className="flex-1 overflow-hidden flex">

// 변경 후
<div className="flex-1 h-0 overflow-hidden flex">
```

**파일 2: `src/components/worship-studio/StudioMainPanel.tsx` (line 30)**

```typescript
// 변경 전
<div className="flex-1 flex flex-col overflow-hidden">

// 변경 후
<div className="flex-1 h-0 flex flex-col overflow-hidden">
```

**파일 3: `src/components/worship-studio/StudioMainPanel.tsx` (line 31)**

```typescript
// 변경 전
<Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">

// 변경 후
<Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 h-0 flex flex-col overflow-hidden">
```

### Phase 2: BGM 바 여백 보정

BGM 바가 표시될 때 콘텐츠가 가려지지 않도록 추가 여백 확보:

**파일: `src/components/worship-studio/grid/StudioGrid.tsx` (line 120)**

```typescript
// 변경 전
<div className="p-4 pb-20">

// 변경 후
<div className="p-4 pb-28">  // pb-28 = 112px (BGM 바 64px + 여유 48px)
```

---

## 기술 설명

### Flexbox 높이 문제 원리

Flexbox에서 `flex: 1`만 있으면 자식 콘텐츠가 부모를 넘어설 때 스크롤이 작동하지 않습니다:

```
❌ 문제 상황
flex container (height: 500px)
└─ flex-1 ← 기본 높이가 content 크기에 맞춰짐
   └─ ScrollArea h-full ← 부모 높이가 content 크기라서 스크롤 안 생김

✓ 해결
flex container (height: 500px)
└─ flex-1 h-0 ← 기본 높이를 0으로 설정, flex-1이 500px로 채움
   └─ ScrollArea h-full ← 부모 높이 500px, 스크롤 작동
```

### 수정 후 높이 체인

```
WorshipStudio.tsx
└─ div.fixed.inset-0 (높이: 100vh) ✓
   └─ div.flex-1.h-0 (높이: 100vh - header) ✓
      └─ StudioMainPanel
         └─ div.flex-1.h-0 (높이: 부모와 동일) ✓
            └─ Tabs.flex-1.h-0 (높이: 부모와 동일) ✓
               └─ TabsContent.flex-1.h-0 (높이: 부모 - tabs) ✓
                  └─ StudioView
                     └─ ScrollArea.h-full (높이: 부모와 동일) ✓
                        └─ content (자유 높이, 스크롤 가능!) ✓
```

---

## 파일 변경 요약

| 파일 | 라인 | 변경 내용 |
|------|------|----------|
| `src/pages/WorshipStudio.tsx` | 92 | `flex-1` → `flex-1 h-0` |
| `src/components/worship-studio/StudioMainPanel.tsx` | 30 | `flex-1` → `flex-1 h-0` |
| `src/components/worship-studio/StudioMainPanel.tsx` | 31 | Tabs에 `h-0 overflow-hidden` 추가 |
| `src/components/worship-studio/grid/StudioGrid.tsx` | 120 | `pb-20` → `pb-28` |

---

## 예상 결과

수정 후:
1. **스크롤 작동**: 위젯 그리드가 화면을 넘어가도 스크롤 가능
2. **위젯 추가 버튼 표시**: 스크롤해서 하단의 WidgetPalette 버튼까지 도달 가능
3. **BGM 바에 가리지 않음**: 하단 패딩 증가로 콘텐츠가 BGM 바 위에 표시

