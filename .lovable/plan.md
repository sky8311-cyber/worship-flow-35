
목표: 빌딩 본체 높이는 사용자가 요청한대로 `45vh`로 복구하고, 높이를 줄이지 않고도 1층 매장(커피머신/하단 요소)이 잘리지 않게 레이아웃 구조를 수정합니다.

1) 빌딩 본체 높이 복구
- 파일: `src/components/worship-studio/StudioSidePanel.tsx`
- 변경:
  - `isMobile ? "mx-6 h-[38vh] flex-none" : "mx-3 flex-1"`
  - → `isMobile ? "mx-6 h-[45vh] flex-none" : "mx-3 flex-1"`

2) 잘림의 근본 원인 해결 (Sheet 내부 높이 계산 오류)
- 파일: `src/pages/WorshipStudio.tsx`
- 현재는 드래그 핸들 영역 + `h-full` 콘텐츠가 합쳐져 총 높이가 100%를 넘어, 아래쪽이 `overflow-hidden`으로 잘립니다.
- 변경 방식:
  - `SheetContent`를 `flex flex-col` 구조로 전환
  - 드래그 핸들 컨테이너를 `shrink-0`
  - `StudioSidePanel` 래퍼를 `h-full` 대신 `flex-1 min-h-0 overflow-hidden`로 변경
- 의도:
  - 핸들 높이를 제외한 “남은 높이”만 StudioSidePanel이 정확히 사용하도록 만들어, 하단 매장/도로가 잘리지 않게 함.

3) 모바일 패널 내부 안정화(보조)
- 파일: `src/components/worship-studio/StudioSidePanel.tsx`
- `isMobile` 루트 컨테이너가 이미 `flex flex-col h-full` 구조이므로 유지
- 필요 시(실기기에서 여전히 경계선 컷 발생할 때만) 상단 스페이서 `h-5`를 `h-4`로 1단계 미세 조정해 하단 가시성 확보
- 우선순위는 2번 구조 수정이 핵심이며, 이 보조 조정은 fallback

4) 검증 시나리오
- 모바일(현재 430x659 포함)에서:
  - 바텀 시트를 연 직후 1층 매장 하단(커피머신/진열/도로)이 모두 보이는지
  - 빌딩 본체는 `45vh`로 유지되는지
  - 드래그로 시트 닫기(80px) 제스처가 그대로 동작하는지
  - 기존 빌딩/뮤직필/하단 UI 위치 관계가 깨지지 않는지

변경 파일
- `src/components/worship-studio/StudioSidePanel.tsx`
- `src/pages/WorshipStudio.tsx`
