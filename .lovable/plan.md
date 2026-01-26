
# 예배공작소 (Worship Studio) 로딩 안됨 문제 수정

## 문제 분석

### 네트워크 상태 (정상)
| 요청 | 상태 | 데이터 |
|------|------|--------|
| worship_rooms | 200 ✅ | 방 ID: 137cab82... 반환 |
| studio_widgets | 200 ✅ | 위젯 4개 반환 |

API 호출은 성공적이며 데이터가 정상적으로 반환됨.

### 근본 원인: CSS Height Chain 문제

문제는 `StudioView.tsx`의 `ScrollArea`가 부모로부터 높이를 상속받지 못하는 것임:

```text
fixed inset-0 (100vh)
  └── flex-1 h-0 flex flex-col overflow-hidden (정상)
        └── Tabs flex-1 h-0 flex flex-col overflow-hidden (정상)
              └── TabsContent flex-1 h-0 overflow-hidden
                    │
                    │  ← TabsPrimitive.Content는 기본적으로
                    │     display: block이며 height 상속 안됨
                    │
                    └── ScrollArea h-full
                          │
                          └── 부모 높이가 0으로 계산되어
                              콘텐츠가 보이지 않음
```

`ScrollArea className="h-full"`은 부모의 **computed height**에 의존하는데:
- `TabsContent`의 `flex-1 h-0` 클래스가 있어도 Radix의 `TabsPrimitive.Content`는 기본적으로 `display: block`
- 따라서 `h-full`이 0px로 계산됨

---

## 해결 방법

### 파일: `src/components/worship-studio/StudioView.tsx`

`ScrollArea`를 일반 `div`로 변경하고 `overflow-y-auto`를 사용:

```typescript
// 변경 전 (98-110줄)
return (
  <ScrollArea className="h-full">
    <StudioCoverEditor room={room} isOwner={isActuallyOwnRoom} />
    <StudioGrid roomId={room.id} isOwner={isActuallyOwnRoom} gridColumns={gridColumns} />
  </ScrollArea>
);

// 변경 후
return (
  <div className="h-full overflow-y-auto">
    <StudioCoverEditor room={room} isOwner={isActuallyOwnRoom} />
    <StudioGrid roomId={room.id} isOwner={isActuallyOwnRoom} gridColumns={gridColumns} />
  </div>
);
```

`ScrollArea` import도 제거:
```typescript
// 제거
import { ScrollArea } from "@/components/ui/scroll-area";
```

---

## 대안 방법 (선택)

만약 `ScrollArea`의 커스텀 스크롤바 스타일을 유지하고 싶다면, 부모에 명시적 높이를 설정:

### 파일: `src/components/worship-studio/StudioMainPanel.tsx`

```typescript
// TabsContent에 flex와 관련 스타일 추가
<TabsContent 
  value="studio" 
  className="flex-1 flex flex-col h-0 overflow-hidden mt-0 p-0"
>
  <StudioView ... />
</TabsContent>
```

그리고 `StudioView.tsx`에서:
```typescript
return (
  <ScrollArea className="flex-1">
    ...
  </ScrollArea>
);
```

---

## 변경 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/components/worship-studio/StudioView.tsx` | `ScrollArea` → `div className="h-full overflow-y-auto"` 로 변경 |

---

## 예상 결과

1. **즉시 콘텐츠 표시**: 스튜디오 커버 이미지와 위젯 그리드가 정상적으로 렌더링됨
2. **스크롤 정상 작동**: 콘텐츠가 많을 때 세로 스크롤 가능
3. **기존 기능 유지**: 드래그 앤 드롭, 위젯 편집 등 모든 기능 정상 작동
