

## 밴드뷰 YouTube 앱 열기 버튼 추가

### 현재 상태
- 밴드뷰는 YouTube를 `<iframe>` 임베드로만 보여줌 → 모바일에서 앱으로 열 수 없음
- 라이브러리/세트빌더는 `openYouTubeUrl()` 유틸로 앱 딥링크 지원

### 수정 방안

**파일: `src/pages/BandView.tsx`**

1. `openYouTubeUrl` import 추가
2. 각 YouTube 임베드 영역(단일 링크, 멀티 링크, 레거시 fallback — 3곳) 위에 "YouTube 앱에서 열기" 버튼 추가
3. 버튼 클릭 시 `openYouTubeUrl(url)` 호출 → 모바일에서는 앱 직접 실행

버튼은 임베드 위에 작은 아이콘 버튼으로 배치하여 기존 레이아웃을 최소한으로 변경합니다.

