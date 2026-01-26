
# 예배공작소 (Worship Studio) 로딩 안됨 문제 수정

## 문제 분석

### 현재 상태
- **네트워크**: 정상 (room 데이터 + 4개 위젯 반환됨)
- **콘솔 에러**: 없음
- **증상**: 탭, 사이드바, BGM 바는 보이지만 그리드 콘텐츠가 안 보임

### 근본 원인: CSS Height Chain 끊김

```text
WorshipStudio.tsx (line 92)
└── div.flex-1.h-0.flex ← 높이 OK ✅
      └── StudioMainPanel.tsx
            └── Tabs.flex-1.h-0.flex.flex-col ← 높이 OK ✅
                  └── TabsContent.flex-1.h-0 ← 높이 OK ✅
                        │
                        │ ⚠️ TabsPrimitive.Content는 display: block
                        │    flex-1은 부모가 flex일 때만 작동하지만,
                        │    자식에게 높이를 전달하려면 자신도 flex이어야 함
                        │
                        └── StudioView div.h-full ← h-full의 기준이 0px!
                              └── 콘텐츠가 보이지 않음 ❌
```

**핵심 문제**: `TabsContent`가 `flex-1`로 높이를 받지만, `display: block`이라 자식에게 높이를 전달하지 못함

---

## 해결 방법

### 파일: `src/components/worship-studio/StudioMainPanel.tsx`

`TabsContent`에 `flex flex-col`을 추가하여 자식에게 높이를 전달:

```typescript
// 변경 전 (line 69)
<TabsContent value="studio" className="flex-1 h-0 overflow-hidden mt-0 p-0">

// 변경 후
<TabsContent value="studio" className="flex-1 h-0 flex flex-col overflow-hidden mt-0 p-0">
```

모든 `TabsContent`에 동일하게 적용:
- line 69: studio 탭
- line 76: feed 탭
- line 81: drafts 탭
- line 87: discover 탭

### 파일: `src/components/worship-studio/StudioView.tsx`

자식이 flex container의 높이를 채우도록 수정:

```typescript
// 변경 전 (line 98)
<div className="h-full overflow-y-auto">

// 변경 후
<div className="flex-1 overflow-y-auto">
```

---

## Height Chain 수정 후 구조

```text
Tabs.flex.flex-col
└── TabsContent.flex-1.flex.flex-col ← 이제 flex container ✅
      └── StudioView div.flex-1 ← flex-1로 부모 높이 채움 ✅
            └── 콘텐츠 정상 표시 ✅
```

---

## 변경 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/components/worship-studio/StudioMainPanel.tsx` | 모든 TabsContent에 `flex flex-col` 추가 |
| `src/components/worship-studio/StudioView.tsx` | `h-full` → `flex-1`로 변경 |

---

## 예상 결과

1. **즉시 콘텐츠 표시**: 커버 이미지와 위젯 그리드가 정상 렌더링
2. **스크롤 정상 작동**: 세로 스크롤 가능
3. **모든 탭 정상 작동**: Feed, Drafts, Discover 탭도 동일하게 수정됨
