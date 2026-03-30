

# 아틀리에 빌딩 대규모 비주얼 업데이트

## 변경 파일

### 1. `StudioSidePanel.tsx`

**상가 높이**: `h-16` → `h-20`

**건물 벽면 흰색 세로줄 삭제**: `glassWallStyle`의 `repeating-linear-gradient` (line 32) 제거 — 순수 블루 그라데이션만 유지. 건물 body 내부의 glass panel vertical lines overlay (line 571-576)도 삭제.

**스트링 라이트 폴대**: 현재 `buildingTop` 기반이 아니라 건물 body `.border-t` 상단에 앵커링되어야 함. 폴대 하단을 건물 최상단(루프탑 씬 바로 아래, building body border-t 위치)에 고정하고 위로 솟도록 수정.

**창문 정사각형화 (StudioUnit.tsx)**:
- 양쪽 창문(아바타 + 방문 버튼): compact 모드에서 `w-6 h-7` / `w-7 h-7` → `w-7 h-7` (정사각형). penthouse는 `w-10 h-10` (이미 정사각형).
- 가운데 이름 창문: 높이를 양쪽과 동일하게 유지 (`h-7` / `h-10`), 폭은 `flex-1`로 자동 조절.

**간판 업그레이드**:
- 테두리 색을 난간 색 `#7a8a9a`로 변경
- `border-2 border-[#7a8a9a]` + `shadow-[2px_3px_0px_#6a7a8a]` 로 입체감 부여
- 텍스트를 `text-center w-full`로 정가운데 정렬
- 폰트 `text-[7px]` → `text-[8px]`, "by kworship.app"도 `text-[6px]`로 소폭 확대

**자동차 수정**:
- 상단 차선(우→좌): 🚗, 현재 정상
- 하단 차선(좌→우): 🚕에 `scaleX(-1)` 적용 — 현재 `style={{ transform: 'scaleX(-1)' }}`가 있으나 `animate-car-move-right`의 transform과 충돌 가능. 별도 wrapper `<span>` 안에 넣어 이중 transform 해결
- 미니밴 🚐 추가 (하단 차선, delay 다르게)
- 차량 위치: 상단 `top-[2px]` → `top-[15%]`, 하단 `bottom-[2px]` → `bottom-[15%]`로 차선 중앙 배치

**루프탑 우측 파라솔 2개 제거 → 무대 추가**:
- `parasolSets` 4번째, 5번째 제거 (총 3개 남음)
- 우측 영역에 SVG로 작은 흰색 low-rise 무대 플랫폼, 드럼세트(원+스틱), 어쿠스틱 기타(세워놓기), 마이크 스탠드 배치

**갤러리 액자 그림 변경**:
- 액자1: 일장기 느낌의 원형 → 산/계곡 풍경화 (녹색 산 + 파란 하늘)
- 액자2: 빨간 원형 → 추상 색 블록 (노랑/파랑/녹색 조합)
- 액자3: 보라 단색 → 별이 있는 밤하늘

**카페 커피머신 교체**:
- 기존 사각형 블록 → 에스프레소 머신 실루엣 (상부 돔형 + 포터필터 + 컵 받침)

### 2. `StudioUnit.tsx`

- compact 아바타: `w-6 h-7` → `w-7 h-7` (정사각형)
- compact 방문버튼: `w-7 h-7` (이미 정사각형, 유지)

