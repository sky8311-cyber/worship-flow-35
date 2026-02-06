

# 곡 추가 다이얼로그 내 드롭다운 메뉴 z-index 수정

## 문제 분석

사용자가 곡 추가/편집 다이얼로그(SongDialog) 내에서 아티스트, 언어, 키 등의 드롭다운 메뉴를 클릭하면, 해당 메뉴가 다이얼로그 **뒤편**에서 열려 선택이 불가능합니다.

### 근본 원인: Z-Index 레이어 충돌

| 컴포넌트 | 현재 z-index | 위치 |
|---------|-------------|------|
| SongDialog (DialogContent) | `z-[60]` | 최상위 |
| Popover (데스크톱 드롭다운) | `z-50` | Dialog 뒤 |
| Drawer (모바일 드롭다운) | `z-50` | Dialog 뒤 |

Dialog가 `z-[60]`을 사용하므로, 기본 `z-50`인 Popover/Drawer 콘텐츠가 Dialog 뒤에 렌더링됩니다.

---

## 해결책

**Popover와 Drawer의 z-index를 Dialog보다 높게 설정**

### 1. Popover 컴포넌트 수정

`src/components/ui/popover.tsx`:
```tsx
<PopoverPrimitive.Content
  className={cn(
    "z-[70] ...", // z-50 → z-[70]
    className,
  )}
```

### 2. Drawer 컴포넌트 수정

`src/components/ui/drawer.tsx`:
```tsx
// DrawerOverlay
<DrawerPrimitive.Overlay 
  className={cn("fixed inset-0 z-[70] bg-black/80", className)} 
/>

// DrawerContent
<DrawerPrimitive.Content
  className={cn(
    "fixed inset-x-0 bottom-0 z-[70] ...", // z-50 → z-[70]
    className,
  )}
```

---

## Z-Index 계층 정리 (수정 후)

| 레이어 | 컴포넌트 | z-index |
|--------|---------|---------|
| 1 | BottomTabNavigation | `z-50` |
| 2 | Dialog / Sheet | `z-[60]` |
| 3 | **Popover / Drawer (드롭다운)** | `z-[70]` ← 수정 |
| 4 | Toast 알림 | `z-[100]` (sonner 기본값) |

---

## 영향받는 컴포넌트

이 수정은 다음 드롭다운들을 자동으로 수정합니다:

- **ArtistSelector** (아티스트 선택)
- **TopicSelector** (주제/태그 선택)  
- **MobileSelect** (언어, 키 선택)
- **Select** (radix-ui 기본 셀렉트)
- 모든 Popover 기반 UI

---

## 수정 파일

| 파일 | 변경 |
|------|------|
| `src/components/ui/popover.tsx` | `z-50` → `z-[70]` |
| `src/components/ui/drawer.tsx` | Overlay & Content `z-50` → `z-[70]` |

---

## 기대 결과

| 상황 | 수정 전 | 수정 후 |
|-----|--------|--------|
| 아티스트 드롭다운 | 다이얼로그 뒤에 숨김 | 다이얼로그 위에 표시 |
| 언어 선택 | 클릭해도 안 보임 | 정상 표시 및 선택 가능 |
| 키 선택 | 선택 불가 | 정상 동작 |
| 주제 선택 | 태그 목록 안 보임 | 정상 표시 |

