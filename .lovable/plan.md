

# 고딕 빌딩 디테일 수정 + 모바일 패널 높이 확장

## 1. 카톨릭 느낌 완화 — 십자가 위 동그라미 제거

**`GothicRoof.tsx`**
- Line 94: `<circle cx="0" cy="0" r="1.5" fill="#b8a88a" />` 제거 (좌측 finial)
- Line 100: `<circle cx="0" cy="0" r="2" fill="#b8902a" />` 제거 (중앙 finial)
- Line 108: `<circle cx="0" cy="0" r="1.5" fill="#b8a88a" />` 제거 (우측 finial)
- Collapsed 상태 (line 16): `<circle cx="6" cy="1.5" r="1.5" fill="#b8902a" />` 제거

**`GothicEntrance.tsx`**
- Tympanum 십자가 (line 89-92)는 유지 — 작고 건축적 장식이라 카톨릭 인상 적음
- 필요시 십자가를 다이아몬드 또는 별 모양으로 대체 가능하나, 현재는 깨끗한 십자가 유지

## 2. 중앙 아치 finial 잘림 수정

**`GothicRoof.tsx`**
- 중앙 finial이 `translate(120,-5)`로 viewBox 상단 밖으로 나감
- viewBox를 `0 -10 240 120`으로 변경하여 상단 여유 확보
- 또는 중앙 finial 위치를 `translate(120,0)`으로 조정

## 3. 입주자 간 margin 축소

**`StudioSidePanel.tsx` — buildingContent 내부**
- 섹션 헤더 padding: `pt-2 pb-0.5` → `pt-1 pb-0`
- spacer `min-h-[24px]` → `min-h-[8px]` 또는 `min-h-[12px]`

**`StudioUnit.tsx`** (확인 필요)
- 각 유닛의 vertical padding 축소 (py-2 → py-1 등)

## 4. 1층 문 높이 축소

**`GothicEntrance.tsx`**
- viewBox `0 0 160 70` → `0 0 160 50` (높이 줄임)
- 아치 path의 Y 좌표를 비례적으로 축소
- 또는 SVG className에 `max-h-12` 등 제한 추가하여 렌더링 크기 줄임

## 5. 모바일 패널 95vh로 확장

**`src/pages/WorshipStudio.tsx`** (line 169)
- `h-[75vh]` → `h-[95vh]`

## 파일 변경 요약

| 파일 | 변경 |
|------|------|
| `GothicRoof.tsx` | finial 볼 3개 제거, viewBox 상단 확장 |
| `GothicEntrance.tsx` | viewBox 높이 축소 (문 작게) |
| `StudioSidePanel.tsx` | 섹션 간격 축소 |
| `StudioUnit.tsx` | 유닛 padding 축소 (필요시) |
| `WorshipStudio.tsx` | 모바일 Sheet 75vh → 95vh |

