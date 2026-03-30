

# 전체 텍스트 폰트 통일: 고운돋움 (Gowun Dodum)

## 접근 방식

가장 깔끔한 방법: **CSS body에 `font-family: 'Gowun Dodum'`을 기본 폰트로 설정**하여 모든 텍스트가 자동으로 고운돋움을 상속받도록 합니다. `font-serif` (Playfair Display)를 명시적으로 사용하는 로고 텍스트만 예외로 유지됩니다.

## 변경 사항

### 1. `src/index.css` — body 기본 폰트 설정
```css
body {
  @apply bg-background text-foreground font-korean;
}
```

### 2. `tailwind.config.ts` — sans 폰트 패밀리에 고운돋움 추가
```ts
fontFamily: {
  sans: ['Gowun Dodum', 'sans-serif'],  // 기본 폰트를 고운돋움으로
  serif: ['Playfair Display', 'Georgia', 'serif'],  // 로고 전용
  korean: ['Gowun Dodum', 'sans-serif'],  // 기존 유틸리티 유지
}
```

이렇게 하면 `font-sans` (Tailwind 기본)와 `font-korean` 모두 고운돋움을 가리키므로, 별도 클래스 없이도 모든 텍스트가 통일됩니다. 사이드바, 빌딩 패널, 모든 하위 페이지 포함.

## 수정 파일
- `tailwind.config.ts` (1줄 추가)
- `src/index.css` (1줄 수정)

