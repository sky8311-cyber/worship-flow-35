
### 목표
모바일에서 YouTube 앱이 열렸다가 브라우저로 복귀해도, 추가 탭(YouTube 웹)이 열리지 않도록 `openYouTubeUrl`를 안정화합니다.

### 현재 코드 확인 결과
- 공통 유틸: `src/lib/youtubeHelper.ts`
- 실제 사용처: BandView, SongLibrary 카드/테이블, SetBuilder, YouTubeSearchBar
- 즉, 유틸 1곳 수정으로 전 영역 동시 반영 가능

### 원인 가설
일부 모바일 브라우저에서 딥링크 후 백그라운드/복귀 타이밍에 `setTimeout` fallback이 지연 실행되며, 복귀 시점에 `window.open`이 실행되어 새 탭이 열리는 케이스가 남아 있음.

### 수정 계획 (최종)
**파일: `src/lib/youtubeHelper.ts`**

1. **fallback 취소 신호 강화**
   - `visibilitychange` 뿐 아니라 `pagehide`, `blur`도 함께 감지
   - 앱 이동 신호가 1번이라도 감지되면 fallback 타이머 즉시 `clearTimeout`

2. **지연 실행 방어 로직 추가**
   - 딥링크 시도 시각(`startedAt`) 기록
   - fallback 타이머 콜백에서 `elapsed` 검사
   - 설정 지연(예: 1500ms)보다 과도하게 늦게 실행되면(백그라운드 지연 복귀 케이스) fallback 실행 금지

3. **fallback 방식 변경**
   - `window.open(url, "_blank")` 제거
   - 필요 시에도 **같은 탭 이동**(`window.location.assign(url)`)만 사용
   - 결과적으로 “복귀 시 새 탭 생성” 현상 구조적으로 차단

4. **공통 적용 확인**
   - 유틸 호출부(BandView/송라이브러리/노래추가/세트빌더)는 수정 없이 자동 반영

### 검증 계획
- 모바일 실제 시나리오 3가지 확인:
  1) 앱 설치됨: 버튼 탭 → 앱 열림 → 브라우저 복귀 시 새 탭/웹 이동 없음  
  2) 앱 미설치: 버튼 탭 → 동일 탭에서 YouTube 웹 fallback 동작  
  3) 앱 전환 후 오래 머문 뒤 복귀: 지연 fallback 미발동 확인

### 영향 범위
- 변경 파일: `src/lib/youtubeHelper.ts` 1개
- 백엔드/DB/RLS 영향 없음
