

# 캔버스 높이 고정 + 스크롤 차단

## 문제
`pageHeight`가 전체 컨테이너 높이에서 4px만 빼서 계산되므로, 상단 툴바(~48px)와 하단 네비(~40px)를 고려하지 않아 페이지가 실제 가용 영역보다 훨씬 크게 렌더링됩니다. 블록들이 아래로 무한히 보이는 원인입니다.

## 해결
`pageHeight`를 픽셀로 계산하는 방식 대신, 페이지 영역 컨테이너(`flex-1`)에 `overflow-hidden`을 유지하고, 각 페이지의 높이를 `h-full`(CSS 100%)로 설정합니다. 이렇게 하면 flexbox가 자동으로 툴바/하단바를 제외한 정확한 높이를 배정하고, 스크롤도 불가능합니다.

## 변경 내용 (`SpaceCanvas.tsx`)

1. **`pageHeight` state 및 `ResizeObserver` 제거** (라인 60, 63-75)
2. **`renderPage` 함수**: `style={{ height: pageHeight }}` → `className="h-full"` 적용
3. **페이지 영역 컨테이너** (라인 243): `overflow-hidden` 유지 확인
4. **외부 컨테이너** (라인 233): `overflow-hidden` 유지

```text
Before (renderPage):
  style={{ width: CANVAS_WIDTH, height: pageHeight }}

After (renderPage):
  style={{ width: CANVAS_WIDTH }}
  className="... h-full"
```

이 변경으로 페이지가 뷰포트 내 가용 영역에 정확히 맞춰지고, 위아래 스크롤이 완전 차단됩니다.

