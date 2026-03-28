
문제 진단:
- 아직 `StudioUnit`의 방문 버튼이 `w-full + mt-1.5`(별도 2번째 줄)로 남아 있어, 유닛 높이가 커지고 아파트 실루엣이 무너집니다.
- 현재 구조가 `상단(아바타/텍스트/창문) + 하단(방문버튼)` 2단이라 모바일 Sheet에서 특히 과대하게 보입니다.

수정 목표:
- 방문 버튼을 “한 줄 인라인(우측 고정)”으로 바꿔 유닛 높이를 줄이고 층층이 쌓인 아파트 형태를 복원합니다.
- 모바일 Sheet에서는 더 컴팩트하게, 데스크탑은 기존 감성 유지하되 과도한 높이만 제거합니다.

구현 계획:

1) `src/components/worship-studio/StudioUnit.tsx` 레이아웃 재구성
- 현재 2단 구조를 1단 구조로 변경:
  - `[아바타] [이름/소유자] [창문] [방문버튼]`
- 방문 버튼을 블록형에서 인라인 pill로 축소:
  - 제거: `w-full py-1 mt-1.5 text-xs`
  - 적용: `h-6 px-2 shrink-0 rounded-full border text-[10px] inline-flex items-center gap-1 whitespace-nowrap`
- 텍스트 영역은 `flex-1 min-w-0 truncate` 유지하여 버튼이 줄바꿈되지 않도록 고정.
- `WindowLights`의 정렬을 현재 `self-start mt-1`에서 중앙 정렬 기반으로 조정해 한 줄 높이 안정화.

2) 모바일 전용 컴팩트 모드 추가
- `StudioUnit`에 `compact?: boolean` prop 추가.
- `compact=true`일 때:
  - ownerName 보조줄 숨김(2줄→1줄)
  - 패딩/폰트 소폭 축소 (`py-1.5`, `text-[11px]`)
  - 방문 버튼은 더 작은 고정 폭(`min-w-[52px]`)으로 유지.
- `StudioSidePanel`에서 `mode==="sheet"`인 경우 `compact` 전달.
  - 이렇게 하면 모바일에서만 더 단단한 “아파트 벽면” 형태를 확보.

3) `src/components/worship-studio/StudioSidePanel.tsx` 미세 조정
- placeholder/실데이터 모두 동일하게 새 인라인 버튼 레이아웃 적용(추가 분기 없이 `StudioUnit` 공통 반영).
- 층 배지/구분선/피라미드 마진은 유지하여 기존 메타포 스타일 보존.
- collapsed 모드는 기존처럼 아바타만 노출(변경 없음).

검증 기준:
- 방문 버튼이 더 이상 다음 줄로 내려가지 않음.
- 모바일(430px 기준)에서 유닛 높이가 확연히 줄어 6F~1F 층 구조가 한 화면 내 더 촘촘히 보임.
- placeholder/실데이터/ambassador 모두 동일한 버튼 크기 규칙 적용.
- collapsed 모드, 스토리 클릭, 방문 클릭 동작 회귀 없음.
