

# Breadcrumb 위치 조정

## 문제점

1. **Desktop**: Home 아이콘과 Breadcrumb이 중복됨 (Home 아이콘 + 별도 행의 Breadcrumb)
2. **Mobile/Tablet**: Breadcrumb과 로고 사이 간격이 부족함

## 해결 방안

### Desktop (lg 이상)
- 기존 Home 아이콘 위치에 Breadcrumb을 배치
- Home 아이콘 제거 (Breadcrumb의 첫 번째 항목이 이미 Home 역할)
- 별도 행의 Breadcrumb은 숨김

### Mobile/Tablet (lg 미만)
- 현재 위치 유지 (별도 행)
- 로고와 Breadcrumb 사이 간격 추가 (pt-2 → pt-4)

---

## 변경 파일

| 파일 | 작업 |
|------|------|
| `src/components/layout/AppHeader.tsx` | Breadcrumb 위치 조정 |

---

## 상세 변경 내용

### AppHeader.tsx 수정

```text
현재 구조:
┌─────────────────────────────────────────────────────────┐
│ [Menu] [Logo]          [Logo(Desktop)]     [Icons...]   │  ← Main Row
├─────────────────────────────────────────────────────────┤
│ 🏠 > K-Worship 정보 > 도움말                            │  ← Breadcrumb Row (모든 화면)
└─────────────────────────────────────────────────────────┘

변경 후:
┌─────────────────────────────────────────────────────────┐
│ [Menu] [Logo]          [Logo(Desktop)]     [Icons...]   │  ← Mobile/Tablet
│ [Breadcrumb]           [Logo(Desktop)]     [Icons...]   │  ← Desktop (Home 아이콘 대체)
├─────────────────────────────────────────────────────────┤
│ 🏠 > K-Worship 정보 > 도움말                            │  ← Mobile/Tablet Only (간격 추가)
└─────────────────────────────────────────────────────────┘
```

### 구체적 코드 변경

**1. Left Section 수정 (Lines 82-101)**

Desktop에서는 Home 아이콘 대신 Breadcrumb 표시:

```tsx
{/* Left: Menu button + Logo (Mobile/Tablet) | Breadcrumb (Desktop) */}
<div className="justify-self-start flex items-center gap-2">
  <Button 
    variant="ghost" 
    size="icon" 
    className="lg:hidden" 
    onClick={() => setSidebarOpen(true)}
  >
    <Menu className="h-5 w-5" />
  </Button>
  
  {/* Logo - Left aligned on mobile/tablet */}
  <Link to="/dashboard" className="md:hidden">
    <HeaderLogo />
  </Link>
  
  {/* Desktop: Show breadcrumb in place of Home icon */}
  {breadcrumb ? (
    <div className="hidden lg:block">
      {breadcrumb}
    </div>
  ) : (
    <Link to="/dashboard" className="hidden lg:flex items-center gap-2">
      <Home className="h-4 w-4" />
    </Link>
  )}
</div>
```

**2. Breadcrumb Row 수정 (Lines 252-257)**

Mobile/Tablet에서만 표시 + 간격 추가:

```tsx
{/* Breadcrumb Row - Mobile/Tablet only */}
{breadcrumb && (
  <div className="container mx-auto px-4 pb-2 pt-4 lg:hidden">
    {breadcrumb}
  </div>
)}
```

---

## 예상 결과

### Desktop (lg 이상)
```text
┌─────────────────────────────────────────────────────────┐
│ 🏠 > K-Worship 정보 > 도움말    [Logo]    [Icons...]    │
└─────────────────────────────────────────────────────────┘
```
- Breadcrumb이 왼쪽 Home 아이콘 자리에 배치
- 별도 행 없음 → 더 깔끔한 레이아웃

### Mobile/Tablet
```text
┌─────────────────────────────────────────────────────────┐
│ [Menu] [Logo]                             [Icons...]    │
├─────────────────────────────────────────────────────────┤
│                    (간격 추가)                           │
│ 🏠 > K-Worship 정보 > 도움말                            │
└─────────────────────────────────────────────────────────┘
```
- 기존 위치 유지
- 로고와 Breadcrumb 사이 간격 증가 (pt-2 → pt-4)

