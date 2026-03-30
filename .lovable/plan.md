

# 건물 하단 푸터 영역 잔디밭 배경 적용

## 현재 상태
- 도로(`AnimatedRoad`) 아래에 텍스트 + 소셜 링크가 있는 푸터 영역 (line 1069-1113)
- 배경: 투명 (부모의 `#faf7f2` 그대로 노출)
- 텍스트: `text-[10px]`, `text-muted-foreground`

## 접근 방식: 녹색 바탕 + 잔디 이모지 패턴

업로드된 잔디 이미지를 직접 사용하면 텍스트 가독성이 크게 떨어지므로, **녹색 계열 바탕색 + 잔디 이모지를 뿌리는 방식**을 채택합니다.

## 수정 내용

### `src/components/worship-studio/StudioSidePanel.tsx` — 푸터 영역 (line 1069-1113)

1. **잔디밭 배경 컨테이너**
   - 낮: 부드러운 녹색 그라디언트 배경 (`from-[#5a8f3c] to-[#4a7d32]`)
   - 밤: 어두운 녹색 (`from-[#1e3a1e] to-[#162e16]`)
   - 상단에 `🌱🌿` 이모지를 pseudo-element 또는 인라인으로 랜덤 배치하여 잔디 느낌 연출

2. **텍스트 가독성 확보**
   - 텍스트 색상을 흰색 계열로 변경 (낮: `text-white`, 밤: `text-green-100`)
   - 텍스트 뒤에 살짝 반투명 어두운 배경 (`bg-black/20 rounded-lg px-3 py-2`) 적용하여 가독성 보장
   - 소셜 링크 아이콘도 흰색 계열로 조정

3. **잔디 이모지 장식**
   - 푸터 상단/하단에 `🌿🍀🌱` 이모지를 작은 크기로 흩뿌려 자연스러운 잔디밭 분위기
   - `absolute` 포지션으로 배치, `pointer-events-none`으로 인터랙션 방해 방지

### 수정 파일
- `src/components/worship-studio/StudioSidePanel.tsx` (1곳, 푸터 영역)

