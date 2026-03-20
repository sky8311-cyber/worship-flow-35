
목표: 모바일(430x610)에서 Step 4 포함 모든 단계에서 하단 액션 버튼(취소/임시저장/다음)을 항상 보이게 고정하고, 재검색 UX도 안정적으로 보완합니다.

1) 원인 재정리
- 현재 SmartSongFlow는 내부에서 `max-h`를 쓰고, 부모 DialogContent는 모바일에서 `max-h-[70vh] + overflow-hidden`만 설정되어 있어 “실제 높이 기준”이 불명확합니다.
- 이 조합 때문에 내부 footer가 컨테이너 밖으로 밀리면 부모에서 잘려 버튼이 안 보일 수 있습니다.
- 콘솔의 Radix 경고(`DialogTitle/Description 누락`)도 같이 발생 중이라 Smart flow 분기의 dialog 구조를 같이 정리하는 게 안전합니다.

2) 구현 계획

- A. `src/components/SongDialog.tsx` (핵심)
  - SmartSongFlow 분기(`!song || song.status==='draft'`)에 한해 DialogContent를 “명시적 높이 + flex column”으로 변경:
    - 모바일: `h-[90dvh] max-h-[90dvh]`
    - 데스크톱: 기존 수준(`sm:h-[85vh] sm:max-h-[85vh]`)
    - `flex flex-col overflow-hidden p-0`
  - 모바일 safe-area 대응(하단 홈 인디케이터 겹침 방지) padding 적용.
  - Smart flow 분기에도 접근성용 `DialogTitle`/`DialogDescription`(시각적으로 숨김) 추가해 Radix 에러 제거.

- B. `src/components/songs/SmartSongFlow.tsx` (레이아웃 고정)
  - 루트 컨테이너를 부모 높이를 꽉 채우는 구조로 단순화:
    - `flex flex-col h-full min-h-0` (현재 `max-h-[calc(...)]` 제거)
  - Content 영역은 유지/강화:
    - `flex-1 min-h-0 overflow-y-auto`
  - Footer를 항상 보이게:
    - `shrink-0 border-t bg-background`
    - 하단 safe-area padding 추가(`env(safe-area-inset-bottom)` 반영)

- C. `src/components/songs/SmartSongFlow.tsx` (재검색 UX 보강, 부가)
  - 재검색 실패 시 기존 가사를 유지하는 현재 동작은 유지.
  - 단, “기존 가사가 있어서 실패 메시지가 안 보이는” 혼란 방지를 위해:
    - `lastSearchFound` 상태(또는 동등 플래그) 추가
    - 재검색 실패 시 “새 결과는 못 찾았고 기존 가사를 유지” 배너/토스트 표시
  - 이로써 ‘재시도 시 못 찾음’ 체감 문제를 UX 측면에서 명확히 안내.

3) 기술 상세 (요약)
- 버튼 미노출의 본질은 textarea 높이보다 “부모-자식 높이 계약 부재 + overflow hidden clipping”입니다.
- 해결 포인트는
  1) DialogContent에 명시적 높이 부여,
  2) 내부를 `flex + min-h-0`로 스크롤 분리,
  3) footer를 shrink/clip되지 않게 고정,
  4) safe-area 반영
  입니다.

4) 검증 계획
- 모바일 뷰포트(430x610)에서 Step 1~6 순회 시 하단 버튼 항상 노출 확인.
- Step 4에서 가사 자동검색/재검색 반복 시:
  - 스피너 종료
  - 기존 가사 유지
  - 실패 안내 메시지 노출
  - 하단 버튼 계속 노출
- 키보드 오픈 상태에서도 footer가 완전히 사라지지 않는지 확인.

수정 파일
- `src/components/SongDialog.tsx`
- `src/components/songs/SmartSongFlow.tsx`
