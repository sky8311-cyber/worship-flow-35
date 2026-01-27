

# 모바일 전용 인쇄 수정 (데스크톱 유지)

## 현재 상황

### 이미 잘 작동하는 것
- **데스크톱 인쇄**: 현재 완벽하게 작동 중 ✅
- **iframe 방식**: 데스크톱에서 잘 작동

### 문제가 있는 것
- **모바일 인쇄**: iOS Safari에서 12페이지로 분할됨

## 해결 전략: 모바일 전용 CSS 분리

기존 `@media print` 규칙은 그대로 유지하고, 모바일 전용 규칙을 **별도의 @media 쿼리**로 추가합니다.

```text
@media print                    ← 기존 (데스크톱 포함 모든 기기)
@media print and (max-width: 768px)  ← 새로 추가 (모바일 전용)
```

---

## 변경 내용

### 파일: `src/components/band-view/PrintOptionsDialog.tsx`

#### 기존 `@media print` 유지 (line 492-533)
데스크톱에서 잘 작동하는 기존 규칙을 **그대로 유지**합니다.

#### 모바일 전용 `@media print` 추가
`@media print` 블록 바로 뒤에 모바일 전용 규칙을 추가:

```css
/* 기존 @media print 그대로 유지 */
@media print {
  @page { 
    margin: 10mm;
    size: A4 portrait;
  }
  /* ... 기존 규칙 유지 ... */
}

/* 새로 추가: 모바일 전용 인쇄 규칙 */
@media print and (max-width: 768px) {
  @page { 
    margin: 8mm;
    size: A4 portrait;
  }
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
    height: auto !important;
    overflow: visible !important;
  }
  body {
    padding: 0 !important;
  }
  .score-page { 
    page-break-after: always !important;
    page-break-inside: avoid !important;
    break-after: page !important;
    break-inside: avoid !important;
    width: 100% !important;
    height: auto !important;
    min-height: 0 !important;
    max-height: none !important;
    display: block !important;
    padding: 0 !important;
    margin: 0 !important;
    background: white !important;
    overflow: visible !important;
  }
  .score-page:last-child { 
    page-break-after: avoid !important;
    break-after: avoid !important;
  }
  .score-page img {
    max-width: 100% !important;
    max-height: 270mm !important;
    width: auto !important;
    height: auto !important;
    object-fit: contain !important;
    display: block !important;
    margin: 0 auto !important;
  }
}
```

### 파일: `src/components/band-view/FullscreenScoreViewer.tsx`

z-index 변경은 모바일/데스크톱 모두에 적용해도 문제 없음 (더 높은 z-index일 뿐):

```typescript
// line 329
className="fixed inset-0 z-[100] bg-black flex flex-col"
```

---

## 변경 파일

| 파일 | 변경 내용 | 영향 범위 |
|------|----------|----------|
| `src/components/band-view/FullscreenScoreViewer.tsx` | z-index `z-50` → `z-[100]` | 모든 기기 (무해함) |
| `src/components/band-view/PrintOptionsDialog.tsx` | `@media print and (max-width: 768px)` 추가 | **모바일 전용** |

---

## 미디어 쿼리 동작 원리

```text
데스크톱 (width > 768px):
  @media print              ✅ 적용
  @media print and (max-width: 768px)  ❌ 무시

모바일 (width <= 768px):
  @media print              ✅ 적용 (기본 규칙)
  @media print and (max-width: 768px)  ✅ 적용 (덮어쓰기)
```

모바일에서는 두 규칙이 모두 적용되지만, 뒤에 오는 모바일 전용 규칙이 `!important`와 더 구체적인 선택자로 덮어씁니다.

---

## 예상 결과

### 데스크톱 인쇄
- **변경 없음** - 기존 규칙 그대로 유지
- 기존처럼 완벽하게 작동

### 모바일 인쇄
- 악보당 1페이지로 수정
- `max-height: 270mm`으로 A4에 맞춤
- `display: block`으로 flex 레이아웃 문제 해결

### 전체화면
- z-index 증가로 하단 네비게이션 완전히 숨김

