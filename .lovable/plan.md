

# 로고 태그라인 + 건물 하단 설명/링크 추가

## 1. 로고 SVG에 태그라인 추가

### `src/assets/worship-atelier-logo.svg`
- 텍스트 "WORSHIP ATELIER" 아래에 태그라인 추가: "삶을 예배로 만드는 공간"
- 작은 폰트 사이즈(~80px), 적절한 letter-spacing, 기존 스타일과 일관된 서체

```xml
<text x="0" y="120"
      fill="#555"
      font-family="Georgia, 'Times New Roman', serif"
      font-size="80"
      letter-spacing="6">삶을 예배로 만드는 공간</text>
```

- SVG viewBox 높이를 900 → 1050 정도로 확장하여 태그라인 공간 확보

## 2. 건물 하단 설명 + 링크 섹션

### `src/components/worship-studio/StudioSidePanel.tsx`
AnimatedRoad 아래에 새로운 footer 영역 추가:

**설명 텍스트:**
```
Worship Atelier는 예배를
'준비'에서 '삶의 흐름'으로
확장시키는 창작 기반 플랫폼입니다.
```

**링크 행:**
- 홈으로 (Home 아이콘 + 텍스트) → `/dashboard`로 navigate
- K-Worship 소셜 아이콘 가로 정렬: Instagram, Threads(AtSign), YouTube, Mail
  - 기존 `LandingFooter.tsx`와 동일한 URL 사용

**스타일:**
- 배경: 투명 또는 subtle한 색상, 건물 하단과 자연스럽게 연결
- 텍스트: 작은 폰트(text-xs), muted 색상, 중앙 정렬
- 아이콘: lucide-react의 Home, Instagram, AtSign, Youtube, Mail (크기 h-4 w-4)
- collapsed 상태에서는 숨김

### 파일
- `src/assets/worship-atelier-logo.svg` — 태그라인 텍스트 추가
- `src/components/worship-studio/StudioSidePanel.tsx` — 건물 하단 footer 섹션

