

# 빌딩 비주얼 수정 — 비행기 제거, 드럼 위치, 카페/갤러리 축소, 하늘 축소

## 변경 사항

### 1. `StudioSidePanel.tsx` — 비행기 이모지 제거
- Line 624의 `✈️` airplane div 삭제.

### 2. `StudioSidePanel.tsx` — 드럼 위치를 무대 위로 고정
- 현재 `drumY = stageY - 22`로 드럼이 하늘에 떠 있음.
- 수정: `drumY = stageY - 10` 정도로 조정하여 흰색 무대 플랫폼 바로 위에 드럼이 놓이도록 변경.
- 드럼 크기(2.6x)는 유지하되 Y 좌표만 내려서 무대에 안착.

### 3. `StudioSidePanel.tsx` — 카페/갤러리 내부 인테리어 축소 + 소품 추가
- **CafeSVG**: viewBox를 `0 0 120 70` 등으로 확대하여 상대적으로 기존 요소가 작아지게 만든 뒤, 빈 공간에 추가 소품 배치:
  - 벽면 메뉴보드, 선반 위 병/잔, 추가 조명, 책꽂이(BOOKS 컨셉), 벽 액자
- **GallerySVG**: 동일하게 viewBox 확대 후 추가 소품:
  - 관람객 실루엣, 추가 그림 프레임, 바닥 조각상/화분, 벤치

### 4. `StudioSidePanel.tsx` — 하늘 height 절반으로 축소
- Line 647: 하늘 spacer `h-12` → `h-6` (데스크탑), `h-10` → `h-5` (모바일).
- 구름 위치도 `top-3/8/14` → `top-1/3/5` 등으로 비례 축소.

### 5. `tailwind.config.ts` — `airplane-fly` 키프레임/애니메이션 제거
- 사용처가 없어지므로 깔끔하게 정리.

## 변경 파일
- `src/components/worship-studio/StudioSidePanel.tsx`
- `tailwind.config.ts`

