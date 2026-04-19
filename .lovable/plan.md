
## iPad 프리뷰 크래시/느림 원인 조사 계획

### 현재 상황
- 사용자: iPad에서 프리뷰 중 Chrome 반복 크래시, 로딩 매우 느림
- 현재 라우트: `/set-builder/fba3a4c7-5727-4a88-b89a-bc252454c839` (편집 잠금 활성, 30초 간격 realtime UPDATE 이벤트 다수)
- 콘솔: DialogContent aria 경고 외 에러 없음. EditLock realtime 이벤트만 반복.
- 세션 리플레이: 악보 미리보기 다이얼로그 열고/닫기 반복 후 스크롤

### 가설 (우선순위)
1. **메모리 누수 — `SignedScoreImage` / `getSignedScoreUrl` 캐시 폭증**
   - 오늘 추가된 fullscreen `ScorePreviewDialog`가 여러 페이지 이미지를 모두 큰 사이즈로 로드
   - iPad Safari/Chrome은 메모리 한계 낮음 → 큰 이미지 누적 시 탭 크래시 (iOS WebKit ~250MB/탭)
   - 다이얼로그 닫아도 캐시/img 객체가 GC 안 되면 누적

2. **무한 리렌더 / Effect 루프**
   - `SignedScoreImage` useEffect가 `src` 변경마다 setState 3번 호출
   - 부모가 src를 매 렌더 새 객체/문자열로 만들면 폭주 가능

3. **EditLock realtime 채널 누수**
   - 30초마다 UPDATE 이벤트 정상이나, 다이얼로그 마운트마다 채널 추가 구독 시 누적

4. **PDF.js 워커 메모리 점유** (PDF→이미지 변환 모듈이 SetBuilder에 로드되어 있음)

### 조사 방법 (default 모드 전환 후)
1. **dev-server 로그 확인**: `tail -n 300 /tmp/dev-server-logs/dev-server.log` — 최근 빌드 에러/경고
2. **`SignedScoreImage` / `scoreUrl.ts` 캐시 정책 검토**: 캐시 크기 제한, eviction 여부
3. **`ScorePreviewDialog` 리소스 정리**: `open=false`일 때 이미지 src clear, 컴포넌트 언마운트 시 cleanup
4. **`SetBuilder.tsx` 마운트되는 큰 모듈 확인**: pdfjs, AI 컴포넌트 lazy load 여부
5. **브라우저 performance profile** (사용자 승인 시): 메모리/long task 측정
6. **realtime 채널 unsubscribe 확인**: `useEditLock` 훅의 cleanup

### 예상 수정 (조사 결과 기반)
- **캐시 LRU**: `getSignedScoreUrl` 캐시에 max size + LRU 도입 (예: 최대 50개)
- **이미지 정리**: `ScorePreviewDialog`가 닫힐 때 img 참조 명시적 해제, `loading="lazy"` + `decoding="async"` 유지
- **비활성 페이지 unmount**: 다중 페이지에서 현재 페이지만 DOM 유지, 나머지는 제거 (이미 그런 구조이지만 prefetch 비활성화 검토)
- **PDF.js 동적 import 확인**: SetBuilder 진입 시 즉시 로드되지 않도록
- **iPad용 이미지 다운스케일**: `SignedScoreImage`에 `sizes`/`srcset` 또는 viewport 기반 max-width 적용 검토

### 진행 방식
승인 시 default 모드에서:
1. 로그/코드 조사 (5-10분)
2. 발견된 원인별로 패치 (캐시 제한 + 다이얼로그 cleanup이 1순위)
3. iPad에서 재테스트 요청

데이터/DB는 건드리지 않음. 클라이언트 메모리 관리 코드만 수정.
