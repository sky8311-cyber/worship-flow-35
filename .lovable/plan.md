

# 빌딩 층 구조 리빌드 + 모바일/차량 수정

## 변경 1: 플레이스홀더 제거 & 층 구조 변경 (`StudioSidePanel.tsx`)

**삭제**: Lines 13-27의 `PLACEHOLDER_TENANTS`, `PLACEHOLDER_FRIENDS`, `PLACEHOLDER_AMBASSADORS` 상수 전부 제거.

**층 구조 (위→아래)**:
- **ROOFTOP** — 현재 유지 (내 아틀리에)
- **3F · 이웃** — 기존 2F 이웃 로직을 3F로 라벨만 변경. `friendStudios` 데이터 사용. 0명이면 빈 창문 그리드만 표시 (3개 빈 StudioUnit, opacity-30, pointer-events-none)
- **2F · 앰배서더** — 기존 1F 앰배서더를 2F로 올림. `ambassadorStudios` 데이터 사용. 0명이면 빈 창문 그리드 표시
- **1F · 광장** — 새 섹션. `usePlazaUsers` 훅에서 데이터 fetch. 0명이면 빈 창문 그리드 표시
- **상가** (CAFÉ & BOOKS + GALLERY) — 현재 유지

**빈 상태 처리**: 각 층에 유저 0명이면 3개의 빈 창문(이름/아바타 없이 빈 프레임만) 표시. `StudioUnit`에 새 prop `empty` 추가하여 이름/아바타 없이 빈 창문 프레임만 렌더링.

## 변경 2: 새 훅 `usePlazaUsers` 생성

**파일**: `src/hooks/usePlazaUsers.ts`

- `worship_rooms` 테이블에서 `visibility = 'public'`인 방들 쿼리
- 본인 제외, 친구 제외 (friends 테이블 서브쿼리), 앰배서더 제외 (`is_ambassador != true`)
- `profiles` join하여 프로필 정보 가져오기
- 최대 20개, 랜덤 정렬은 클라이언트에서 shuffle
- `StoryStudio` 형태로 변환하여 반환

## 변경 3: `useStoryBarStudios.ts` 수정

- plaza 유저를 `studios` 배열에 포함시키지 않음 (스토리바와 독립적). 대신 `StudioSidePanel`에서 직접 `usePlazaUsers` 호출하여 1F에 렌더링.

## 변경 4: `StudioUnit.tsx` — `empty` prop 추가 & `placeholderInitials` 제거

- `placeholderInitials` prop 제거
- 새 `empty?: boolean` prop 추가: true이면 아바타/이름 없이 빈 창문 프레임만 렌더링 (windowFrame + windowGlow 스타일 유지, 내부 비움)

## 변경 5: 차량 z-index 수정 (`StudioSidePanel.tsx`)

**문제**: 인도(`z-10`)가 차량 이모지를 가림. 차량은 `z-30`이지만 인도와 도로가 별도 div이므로 stacking context가 분리됨.

**수정**: `AnimatedRoad` 전체를 하나의 relative 컨테이너로 감싸고, 인도와 도로를 같은 stacking context 안에 배치. 차량 span의 `z-30`이 인도 위에 올라오도록 구조 변경:
- 인도 div: `z-0` (relative 부모 내에서)
- 도로 div: `z-0`
- 차량 span: `z-10` (부모 컨테이너 기준 absolute로 변경)

또는 더 간단하게: 인도 div의 `overflow-hidden` 제거 대신 인도 높이를 줄이거나 차량 top 위치를 도로 영역 내부로 조정하여 인도에 가려지지 않게 함. 실제로 현재 upper lane 차량이 `top: -13px`로 되어 있어 도로 밖으로 올라가 인도에 가려짐. → `top: 2px`로 조정.

## 변경 6: 모바일 하단 잘림 수정

**문제**: `max-h-[50vh]` 제한이 건물 본체에만 적용되어 상가+도로가 뷰포트 밖으로 밀림.

**수정**: 
- 건물 본체 `max-h-[50vh]` → `max-h-[40vh]`로 줄여 상가+도로에 더 많은 공간 확보
- 또는 전체 building wrapper에 `max-h-[calc(100vh-4rem)]`를 적용하고 내부를 flex로 배분

## 변경 파일
- `src/components/worship-studio/StudioSidePanel.tsx`
- `src/components/worship-studio/StudioUnit.tsx`
- `src/hooks/usePlazaUsers.ts` (신규)

