

# 1층 매장 하단 잘림 수정

## 문제
빌딩 본체(`h-[45vh]`)가 너무 높아서, 그 아래 1층 매장(GroundFloorShops, `h-20`)과 도로가 Sheet(`h-[85vh]`) 밖으로 밀려남.

## 해결
빌딩 본체 높이를 `h-[45vh]` → `h-[38vh]`로 줄여서 1층 매장과 도로가 완전히 보이도록 함.

## 변경 파일
- `src/components/worship-studio/StudioSidePanel.tsx` (1줄 수정: line 695)

