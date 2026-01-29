

# 모바일 멤버십 카드 잘림 문제 수정 계획

## 문제 원인 분석

`carousel.tsx` 파일 139번 라인을 보면:

```typescript
<div ref={carouselRef} className="overflow-hidden">
```

CarouselContent 내부에 `overflow-hidden`이 하드코딩되어 있어서, 외부에서 `overflow-visible`을 적용해도 이 내부 div에서 카드 상단/하단이 잘립니다.

**문제 구조:**
```text
Carousel (overflow-visible 적용됨) ✓
└── CarouselContent (overflow-visible 적용됨) ✓
    └── 내부 div (overflow-hidden 하드코딩) ✗ ← 여기서 잘림!
        └── CarouselItem
            └── Card
                └── Badge (absolute -top-3) ← 잘림
```

---

## 해결 방안

`CarouselContent` 컴포넌트를 수정하여 외부에서 전달된 className에 `overflow-visible`이 있을 때 내부 div도 overflow를 제어할 수 있도록 변경합니다.

### 변경 내용: `src/components/ui/carousel.tsx`

```typescript
// 변경 전 (line 138-146)
return (
  <div ref={carouselRef} className="overflow-hidden">
    <div
      ref={ref}
      className={cn("flex", orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col", className)}
      {...props}
    />
  </div>
);

// 변경 후
const hasOverflowVisible = className?.includes("overflow-visible");

return (
  <div ref={carouselRef} className={hasOverflowVisible ? "overflow-visible" : "overflow-hidden"}>
    <div
      ref={ref}
      className={cn("flex", orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col", className)}
      {...props}
    />
  </div>
);
```

---

## 파일 변경 요약

| 파일 | 변경 내용 |
|------|----------|
| `src/components/ui/carousel.tsx` | CarouselContent 내부 div의 overflow를 className에 따라 동적으로 설정 |

---

## 예상 결과

```text
수정 후:
┌─────────────────────────────────────┐
│  [현재 플랜] ← 뱃지 완전히 보임     │
│  ┌─────────────────────────────┐    │
│  │       기본멤버              │    │
│  │         무료                │    │
│  │        영구 무료            │    │
│  │                             │    │
│  │  ✓ 예배공동체 생성          │    │
│  │  ✓ 워십세트 생성 및 관리    │    │
│  │  ✓ 곡 라이브러리 관리       │    │
│  │                             │    │
│  │    [현재 멤버십]            │    │
│  └─────────────────────────────┘    │
│      ← 스와이프하여 비교 →         │
└─────────────────────────────────────┘
            ↑ 카드 하단도 잘리지 않음
```

이 수정은 기존 캐러셀 동작에 영향을 주지 않습니다. `overflow-visible` 클래스를 명시적으로 전달한 경우에만 적용됩니다.

