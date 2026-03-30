
목표: 모바일에서 **1층 매장/도로가 절대 잘리지 않게** 보장(사용자 우선순위: Never cut off 1F).

원인(코드 기준):
1) `WorshipStudio.tsx`의 하단 고정 UI(페이지 네비 바 `z-[55]`, 좌측 건물 버튼 `z-[55]`)가, 시트(`SheetContent`, 기본 `z-50`) 위에 겹쳐 보여 하단이 잘린 것처럼 보일 수 있음.  
2) 시트 높이가 `85vh`라서 모바일 브라우저(특히 주소창/홈 인디케이터)에서 실제 가시영역과 불일치 가능.  
3) 시트 내부 상단 여백(`pt-2`) + 사이드패널 상단 spacer(`h-5`)가 누적되어 짧은 화면에서 하단 여유를 잠식.

구현 계획:

1) `src/pages/WorshipStudio.tsx` — 시트 위 하단 오버레이 제거
- 모바일 시트가 열렸을 때(`mobileAptOpen === true`):
  - 플로팅 페이지 네비 바 렌더링 중지
  - 좌측 하단 건물 열기 버튼 렌더링 중지
- 의도: 하단 매장/도로가 다른 fixed UI에 가려지는 문제를 구조적으로 차단.

2) `src/pages/WorshipStudio.tsx` — 모바일 시트 높이/안전영역 보정
- `SheetContent` 높이를 `vh` 중심에서 `dvh` 중심으로 변경(예: `h-[85dvh] max-h-[85dvh]` + 필요 시 fallback 클래스 병행).
- 시트 내부 콘텐츠 래퍼(`StudioSidePanel` 감싸는 div)에 하단 safe-area 패딩 추가(`pb-[env(safe-area-inset-bottom,0px)]`).
- 상단 패딩 `pt-2`는 줄이거나 제거해 하단 표시 여유 확보.

3) `src/components/worship-studio/StudioSidePanel.tsx` — 1F 보호 레이아웃 강화
- 현재 유지 중인 핵심 구조는 그대로 유지:
  - 빌딩 본체: `flex-1 min-h-0`
  - 1층/도로: `shrink-0`
- 모바일 상단 spacer를 축소(`h-5` → 더 작은 값)해 짧은 뷰포트에서 하단 가시 영역을 추가 확보.
- 목적: 본체는 더 줄어들어도 1층/도로는 항상 보이게 유지.

4) 검증 계획(430x659 기준 포함)
- 모바일에서 시트 오픈 직후:
  - 1층 매장 하단/도로가 끝까지 보이는지
  - 페이지 네비 바/좌측 버튼이 시트 위를 가리지 않는지
  - 스와이프 닫기(80px) 제스처 정상 동작
  - 기존 빌딩 스크롤/층 콘텐츠 동작 이상 없는지

변경 대상 파일:
- `src/pages/WorshipStudio.tsx`
- `src/components/worship-studio/StudioSidePanel.tsx`
