
AI 워십세트 패널 재수정 계획

진단
- 이번엔 `AISetBuilderPanel`, `AISetBuilderForm`, `AISetBuilderResult`, 공용 `sheet`, `scroll-area`까지 다시 확인했습니다.
- 이전 수정은 `-mx-6` 쪽만 건드렸지만, 실제 핵심 원인은 form/result 영역에 쓰인 `ScrollArea`입니다.
- 현재 구조에서는 커스텀 세로 스크롤바 레일이 콘텐츠 영역 안쪽을 차지해서, `w-full`인 Input / Select / Button의 오른쪽이 430px 모바일에서 계속 잘려 보일 수 있습니다.
- 그래서 필드와 버튼 박스가 모두 같은 방향으로 잘리는 증상이 반복된 것입니다. 이번에는 이 레이어를 직접 고칩니다.

변경 계획
1. `src/components/AISetBuilderPanel.tsx`
   - form/result 구간의 `ScrollArea`를 제거하고, 로컬 `div` 스크롤 컨테이너로 교체합니다.
   - 구조를 `flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden` 기준으로 정리해 커스텀 스크롤바가 필드 위를 덮지 않게 합니다.
   - 하단 액션 버튼 영역도 같은 너비 기준으로 맞춰서 body/footer가 서로 다른 폭으로 보이지 않게 정리합니다.
   - 공용 `ScrollArea`나 `Sheet`는 이번 이슈 때문에 전역 수정하지 않습니다.

2. `src/components/ai-set-builder/AISetBuilderForm.tsx`
   - 최상위 래퍼를 `w-full min-w-0` 기준으로 보강합니다.
   - 프로필 카드, 잠금 배너, 생성 버튼을 모두 동일한 width 규칙으로 맞춥니다.
   - 템포 패턴 행은 모바일에서 안전하게 보이도록 내부 텍스트 영역에 `min-w-0`를 주고, 설명 텍스트는 필요 시 줄바꿈/축소되게 정리합니다.
   - 현재 짧게 바꾼 로딩 텍스트와 truncate는 유지합니다.

3. `src/components/ai-set-builder/AISetBuilderResult.tsx`
   - 결과 카드도 `min-w-0` 기준으로 정리해서 동일한 우측 잘림이 생기지 않게 합니다.
   - 하단 “다시 생성 / 이 세트 사용” 버튼은 텍스트가 길어져도 박스가 깨지지 않도록 내부 텍스트 truncate 처리를 같이 맞춥니다.

검증 기준
- 430px 모바일 기준으로 아래 항목의 오른쪽 border와 rounded corner가 전부 정상 노출되어야 합니다.
  - 설교 본문/주제 input
  - 예배 유형 / 선호 키 / 분위기 select
  - 곡 수 / 예배 시간 input
  - 템포 패턴 카드
  - AI 세트 생성 버튼
  - 결과 화면 하단 2개 버튼
- form 화면과 result 화면 둘 다 확인 대상으로 잡겠습니다.

기술 메모
- 이번 수정은 “여백 숫자 미세조정”이 아니라, 잘림을 만드는 레이아웃 원인 자체를 바꾸는 계획입니다.
- 즉, `ScrollArea` 내부에서 full-width 폼을 계속 렌더링하는 구조를 걷어내고, AI 세트 패널만 안전한 모바일 스크롤 레이아웃으로 재구성하는 방향입니다.
