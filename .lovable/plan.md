

# 전광판 텍스트 위치 이탈 수정

## 원인 분석
- "나만의 공작소에"는 typewriter 애니메이션(CSS transform 없음)이라 정상 위치
- 나머지 텍스트는 `translateY(40%)`, `translateX(-40%)`, `scale(0.4)` 등 CSS transform 애니메이션 사용
- `foreignObject` 내부 div에 `overflow: hidden`이 있지만, 모바일 WebKit에서 foreignObject의 overflow 클리핑이 불안정
- 애니메이션 시작 프레임에서 텍스트가 전광판 영역 밖으로 렌더링됨

## 수정 방법

### `src/components/worship-studio/StudioSidePanel.tsx`
- 전광판 텍스트를 감싸는 `<g>` 태그에 SVG `clipPath`를 추가하여 전광판 영역 밖 콘텐츠를 강제 클리핑
- `<defs>`에 전광판 크기의 `<clipPath>` 정의 → 텍스트 그룹에 `clipPath` 적용

```tsx
// Billboard 렌더링 부분에 clipPath 추가
<defs>
  <clipPath id="bbClip">
    <rect x={0} y={0} width={bbW - bezelPad*2} height={bbH - bezelPad*2} />
  </clipPath>
</defs>
<g transform={`translate(${bbX + bezelPad}, ${bbY + bezelPad})`} clipPath="url(#bbClip)">
  <BillboardText ... />
</g>
```

이렇게 하면 CSS 애니메이션이 어떤 transform을 사용하든 SVG 레벨에서 전광판 경계 밖으로 나가지 않습니다.

### 수정 파일
- `src/components/worship-studio/StudioSidePanel.tsx` (1곳)

