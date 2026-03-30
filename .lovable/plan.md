

# 건물 파사드 다크 차콜 + 패티오 세트 삭제

## 변경 사항 (`StudioSidePanel.tsx`)

### 1. 낮 모드 건물 색상 → 다크 차콜 & 블랙
- `glassWallDay` 그라디언트 변경:
  - 기존: `#c0d4e4 → #a8bcd0 → #98b0c4` (파란 유리)
  - 변경: `#3a3a3a → #2a2a2a → #222222` (다크 차콜)
- 관련 요소 색상 조정:
  - `FloorLabel` 낮 모드 텍스트/배경: 어두운 파사드에 맞게 밝은 톤으로 (`text-[#c0c0c0]`, `bg-[#333]`, `border-[#555]`)
  - 건물 간판 "WORSHIP ATELIER": `bg-white` 유지 (어두운 벽과 대비)

### 2. 루프탑 패티오 세트(파라솔 + 테이블 + 의자) 삭제
- `parasolSets` 배열 및 관련 렌더링 블록 (lines 96-168) 전체 제거
- `parasolSets` 변수, 매핑 JSX 블록 삭제

## 파일
- `src/components/worship-studio/StudioSidePanel.tsx`

