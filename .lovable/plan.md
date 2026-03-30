

# 전광판 배경 이미지 + 애니메이션

## 개요
전광판 스크린에 텍스트별 배경을 추가. 스크린 1~3은 시냇물 배경(CSS 애니메이션으로 물 흐르는 효과), 스크린 4~5는 밝은 흰색 배경.

## 디자인

| 스크린 | 배경 | 텍스트 |
|--------|------|--------|
| 1 | 시냇물 (animated) | 삶을 예배로 만드는 공간 |
| 2 | 시냇물 (동일) | WORSHIP ATELIER |
| 3 | 시냇물 (동일) | by K-Worship |
| 4 | 밝은 흰색 | 나만의 공작소에 |
| 5 | 밝은 흰색 | 입주하세요! |

## 구현 — `StudioSidePanel.tsx`

### 시냇물 배경 (CSS로 구현)
실제 이미지 대신 CSS gradient + animation으로 시냇물 느낌 표현:
- 여러 레이어의 반투명 파랑/초록 그라디언트를 `background` 합성
- `@keyframes stream-flow`로 배경을 수평 이동 → 물 흐르는 효과
- 약간의 빛 반짝임 효과 (밝은 줄무늬가 이동)

### `BillboardText` 수정
1. `BILLBOARD_TEXTS`를 객체 배열로 변경:
```ts
const BILLBOARD_SCREENS = [
  { text: "삶을 예배로 만드는 공간", bg: "stream" },
  { text: "WORSHIP ATELIER", bg: "stream" },
  { text: "by K-Worship", bg: "stream" },
  { text: "나만의 공작소에", bg: "white" },
  { text: "입주하세요!", bg: "white" },
];
```

2. `foreignObject` 내부 div에 배경 스타일 적용:
   - `bg === "stream"`: CSS 그라디언트 + `animation: stream-flow 4s linear infinite`
   - `bg === "white"`: 밝은 흰색 (`#ffffff`), 밤에도 밝게 유지
   - 텍스트 색상도 배경에 맞게 조정 (시냇물: 흰색/밝은색, 흰색 배경: 어두운색)

3. 스크린 4~5 밤모드: `isNight`와 무관하게 스크린 본체도 흰색으로 표시 (밝은 라이트 효과)

### `index.css` 추가
```css
@keyframes stream-flow {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}
```

## 파일
- `src/components/worship-studio/StudioSidePanel.tsx` — BillboardText 배경 로직
- `src/index.css` — stream-flow 키프레임

