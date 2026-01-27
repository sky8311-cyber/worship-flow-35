

# 모바일 전체화면 & 인쇄 기능 개선

## 문제 1: 모바일 전체화면이 축소된 상태로 유지됨

### 근본 원인
1. **iOS Safari에서 Fullscreen API 미지원**: iPhone은 `requestFullscreen()` API를 지원하지 않음
2. **잘못된 상태 처리**: API 실패 시 `isActualFullscreen = true`로 설정하지만, 실제로는 fullscreen이 아님
3. **Recovery overlay가 잘못 표시됨**: `!isActualFullscreen` 조건으로 overlay가 표시되면서 콘텐츠가 가려짐

```text
현재 로직:
requestFullscreen()
  ├── 성공 → isActualFullscreen = true ✅
  └── 실패 → isActualFullscreen = true ← 문제! overlay 조건과 충돌
                                          모바일에서 true로 설정했지만
                                          실제 fullscreen 아님
```

### 해결 방법

**파일: `src/components/band-view/FullscreenScoreViewer.tsx`**

1. **iOS 감지 및 다른 처리**: iOS에서는 fullscreen API 대신 전체화면 UI만 제공
2. **Recovery overlay 조건 수정**: 실제 fullscreen을 지원하는 기기에서만 표시
3. **상태 분리**: `isFullscreenSupported`와 `isActualFullscreen` 분리

```typescript
// 변경 전 (line 30)
const [isActualFullscreen, setIsActualFullscreen] = useState(false);

// 변경 후
const [isActualFullscreen, setIsActualFullscreen] = useState(false);
const isFullscreenSupported = typeof document.fullscreenEnabled !== 'undefined' 
  && document.fullscreenEnabled;
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
```

```typescript
// 변경 전 (line 119-127)
containerRef.current.requestFullscreen?.()
  .then(() => setIsActualFullscreen(true))
  .catch(() => {
    setIsActualFullscreen(true); // ← 문제: 실패해도 true 설정
  });

// 변경 후
if (isFullscreenSupported && !isIOS) {
  containerRef.current.requestFullscreen?.()
    .then(() => setIsActualFullscreen(true))
    .catch(() => {
      // Fullscreen failed, but we're still in pseudo-fullscreen mode
      // Don't set isActualFullscreen to true - this will skip the recovery overlay
    });
} else {
  // iOS/unsupported: Skip fullscreen API entirely, use fixed overlay mode
  // No recovery overlay needed since we never requested fullscreen
  setIsActualFullscreen(true); // Mark as "operational" to hide recovery overlay
}
```

```typescript
// 변경 전 (line 480)
{!isActualFullscreen && (

// 변경 후 - iOS와 fullscreen 미지원 기기에서는 recovery overlay 표시하지 않음
{!isActualFullscreen && isFullscreenSupported && !isIOS && (
```

---

## 문제 2: 모바일 인쇄 시 페이지 수 과다 (3-4곡 → 12페이지)

### 근본 원인
1. **`100vh` 계산 문제**: 모바일 Safari에서 `100vh`가 주소창을 포함한 높이로 계산되어 실제 화면보다 큼
2. **이미지 overflow**: `height: 100%`가 컨테이너를 초과하면 페이지 분할 발생
3. **`page-break-after: always`**: 모든 score-page에 적용되어 빈 페이지 추가

### 해결 방법

**파일: `src/components/band-view/PrintOptionsDialog.tsx`**

1. **`100vh` 대신 고정 A4 크기 사용**: 프린트 시 일관된 페이지 크기
2. **이미지 max-height 제한**: 페이지 내에 완전히 포함되도록
3. **마지막 페이지 page-break 제거**: 불필요한 빈 페이지 방지

```css
/* 변경 전 (line 365-381) */
.score-page {
  page-break-after: always;
  height: 100vh;
  width: 100vw;
  display: flex;
  ...
}
.score-page img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* 변경 후 */
.score-page {
  page-break-after: always;
  page-break-inside: avoid;
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white; /* 검정 배경은 인쇄 시 잉크 낭비 */
  padding: 16px;
  box-sizing: border-box;
}
.score-page:last-child {
  page-break-after: avoid;
}
.score-page img {
  max-width: 100%;
  max-height: calc(100vh - 32px); /* padding 고려 */
  width: auto;
  height: auto;
  object-fit: contain;
}
```

```css
/* 변경 전 @media print (line 486-505) */
@media print {
  @page { margin: 0; size: auto; }
  body { margin: 0; padding: 0; }
  .score-page { 
    height: 100vh !important;
    width: 100vw !important;
    ...
  }
}

/* 변경 후 */
@media print {
  @page { 
    margin: 10mm;
    size: A4 portrait;
  }
  html, body {
    margin: 0;
    padding: 0;
    width: 100%;
  }
  .score-page { 
    page-break-after: always;
    page-break-inside: avoid;
    width: 100% !important;
    height: auto !important;
    min-height: 0 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    padding: 0 !important;
    margin: 0 !important;
  }
  .score-page:last-child { 
    page-break-after: avoid; 
  }
  .score-page img {
    max-width: 100% !important;
    max-height: 260mm !important; /* A4 높이(297mm) - margin(37mm) */
    width: auto !important;
    height: auto !important;
    object-fit: contain !important;
  }
}
```

---

## 변경 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/components/band-view/FullscreenScoreViewer.tsx` | iOS 감지 추가, recovery overlay 조건 수정, fullscreen 요청 로직 개선 |
| `src/components/band-view/PrintOptionsDialog.tsx` | `100vh` → 고정 A4 크기, 이미지 max-height 제한, @media print 규칙 개선 |

---

## 예상 결과

### 전체화면
1. **iPhone**: 검정 배경 전체화면 UI로 악보 표시 (recovery overlay 없음)
2. **iPad**: 실제 Fullscreen API 사용, 화면 꺼짐 후 recovery overlay 표시
3. **Android**: 실제 Fullscreen API 사용

### 인쇄
1. **3-4곡 → 3-4페이지**: 악보당 정확히 1페이지
2. **A4 크기에 맞춤**: 악보가 페이지 중앙에 꽉 차게 표시
3. **모바일/데스크톱 동일**: 일관된 인쇄 결과

