

# 아치 지붕 가로 너비 = 건물 너비 정확히 맞추기 + 아치/별 확대

## 현재 문제
- 아치 SVG의 viewBox가 `0 0 360 120`으로 고정되어 있어 건물 너비와 정확히 맞지 않을 수 있음
- 별(star)이 viewBox 바깥(`translate(310,-8)`)에 위치하여 잘릴 수 있음
- 아치 높이가 `h-[72px]`로 제한되어 별이 보이지 않을 수 있음

## 변경 계획

### `GothicArchTop.tsx`

**확장 모드 (expanded):**
- viewBox를 `0 -40 360 160`으로 변경 → 상단 여백 확보해서 별이 잘리지 않도록
- 높이를 `h-[72px]` → `h-[96px]` (모바일 `h-[80px]`)으로 확대
- 별 위치를 viewBox 안쪽으로 조정 (`translate(305, -30)` 등)
- `preserveAspectRatio="xMidYMax meet"` 유지 → SVG가 항상 컨테이너 하단에 붙으면서 가로를 꽉 채움
- 아치 path 좌우 끝이 `x=0`과 `x=360`에서 시작/끝나므로 건물 너비와 정확히 일치

**축소 모드 (collapsed):**
- viewBox를 `0 -12 60 52`로 변경 → 별 상단 공간 확보
- 높이를 `h-[28px]` → `h-[36px]`으로 확대

### `StudioSidePanel.tsx`
- 변경 없음 (아치가 `w-full`이고 `mx-3`/`mx-6` 컨테이너 안에 있으므로 이미 건물과 동일 너비)

## 핵심 포인트
- `w-full` + `preserveAspectRatio="xMidYMax meet"` 조합으로 가로는 항상 부모(건물) 너비에 맞춤
- viewBox 상단을 음수로 확장하여 별이 잘리지 않도록 함
- 높이만 충분히 키우면 아치 + 별 모두 온전히 표시됨

| 파일 | 변경 |
|------|------|
| `GothicArchTop.tsx` | viewBox 확장, 높이 증가, 별 위치 조정 |

