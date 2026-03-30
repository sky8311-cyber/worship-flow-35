

# 아틀리에 성능 감사 결과 + 수정 계획

## 발견된 문제점

### 1. 무한 렌더 루프 (심각)
`ProfileDropdownMenu`의 Radix `PopperAnchor`에서 **"Maximum update depth exceeded"** 에러 발생. `useEffect` 안에서 `setState`가 무한 반복되는 radix-ui 버그. 이 에러가 전체 앱 성능을 저하시킴.

### 2. 모바일 빌딩 패널 매번 재마운트 (맞습니다)
Sheet가 닫힐 때 `StudioSidePanel`이 완전히 **언마운트** → 다시 열 때 모든 것 처음부터 재생성:
- `useStoryBarStudios` (내부 3개 쿼리)
- `usePlazaUsers` (2개 쿼리)  
- 프로필 아바타 쿼리
- **180개 별 SVG** + 옥상 + 카페 + 갤러리 + 도로 차량 전부 재렌더

react-query 캐시가 있어서 네트워크 요청은 반복 안 되지만, **SVG DOM 재생성**이 느림의 주 원인.

### 3. 무거운 SVG 컴포넌트 미메모이제이션
`NightSkyStars`, `RooftopScene`, `CafeSVG`, `GallerySVG`, `GroundFloorShops`, `AnimatedRoad` — 모두 `React.memo` 없이 부모가 렌더될 때마다 전부 재렌더.

---

## 수정 계획

### A. 무한 렌더 루프 수정 (`ProfileDropdownMenu.tsx`)
- `DropdownMenu`에 `modal={false}` 추가하여 PopperAnchor의 setState 루프 방지

### B. 모바일 Sheet 내용 유지 (`WorshipStudio.tsx`)
- Sheet가 닫혀도 `StudioSidePanel`을 **언마운트하지 않고** CSS `hidden`으로 숨기기
- `mobileAptOpen`이 false일 때 `display: none` 대신 content를 유지하여 재마운트 방지

### C. 무거운 SVG 컴포넌트 메모이제이션 (`StudioSidePanel.tsx`)
- `NightSkyStars`, `RooftopScene`, `GroundFloorShops`, `AnimatedRoad`를 `React.memo`로 감싸기
- props가 변경되지 않으면 재렌더 스킵

---

## 수정 파일
1. `src/components/worship-studio/ProfileDropdownMenu.tsx` — modal={false}
2. `src/pages/WorshipStudio.tsx` — Sheet 내부 컴포넌트 유지
3. `src/components/worship-studio/StudioSidePanel.tsx` — React.memo 적용

