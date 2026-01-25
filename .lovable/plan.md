
# 앱 히스토리 페이지 색상 통일

## 현재 문제
AppHistory 페이지에서 카테고리별로 **하드코딩된 Tailwind 색상**을 사용하고 있어 앱의 브랜드 디자인 시스템과 불일치합니다.

| 카테고리 | 현재 색상 | 문제점 |
|----------|-----------|--------|
| launch | `bg-green-500` | 브랜드 컬러 아님 |
| feature | `bg-blue-500` | 비슷하지만 정확한 primary 아님 |
| milestone | `bg-purple-500` | 브랜드 컬러 아님 |
| update | `bg-orange-500` | 브랜드 컬러 아님 |
| bugfix | `bg-red-500` | 브랜드 컬러 아님 |

## 브랜드 컬러 팔레트
- **Primary (파란색)**: `hsl(220 52% 35%)` → `bg-primary`
- **Accent (코랄)**: `hsl(358 55% 60%)` → `bg-accent`
- **Muted**: `hsl(240 20% 96%)` → `bg-muted`
- **Destructive**: `hsl(0 84% 60%)` → `bg-destructive`

---

## 해결 방안: 디자인 시스템 토큰 사용

카테고리별 색상을 앱의 CSS 변수/디자인 토큰으로 교체합니다.

| 카테고리 | 새 색상 | 이유 |
|----------|---------|------|
| launch | `bg-primary` | 중요한 출시 → 브랜드 Primary |
| feature | `bg-accent` | 새 기능 하이라이트 → 브랜드 Accent (코랄) |
| milestone | `bg-primary/80` | 마일스톤 → Primary 변형 |
| update | `bg-muted-foreground` | 일반 업데이트 → 차분한 색상 |
| bugfix | `bg-destructive` | 버그 수정 → 주의/경고 색상 |

---

## 수정 내용

### 파일: `src/pages/AppHistory.tsx`

**Before (Line 70-85):**
```typescript
const getCategoryColor = (category: string) => {
  switch (category) {
    case "launch":
      return "bg-green-500 text-white";
    case "feature":
      return "bg-blue-500 text-white";
    case "milestone":
      return "bg-purple-500 text-white";
    case "update":
      return "bg-orange-500 text-white";
    case "bugfix":
      return "bg-red-500 text-white";
    default:
      return "bg-muted text-muted-foreground";
  }
};
```

**After:**
```typescript
const getCategoryColor = (category: string) => {
  switch (category) {
    case "launch":
      return "bg-primary text-primary-foreground";
    case "feature":
      return "bg-accent text-accent-foreground";
    case "milestone":
      return "bg-primary/80 text-primary-foreground";
    case "update":
      return "bg-muted-foreground text-background";
    case "bugfix":
      return "bg-destructive text-destructive-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
};
```

---

## 예상 결과

색상이 앱 전체 디자인 시스템과 통일되어:
- 🚀 출시: 브랜드 파란색 (Primary)
- ✨ 기능: 브랜드 코랄색 (Accent)  
- 🏁 마일스톤: 파란색 변형 (Primary/80)
- ⬆️ 업데이트: 차분한 회색 (Muted)
- 🔧 버그수정: 경고 빨간색 (Destructive)

---

## 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/pages/AppHistory.tsx` | `getCategoryColor` 함수에서 하드코딩 색상 → 디자인 토큰 교체 |
