

# K-Worship 한국어 SEO 최적화 구현 계획

## 개요

네이버 검색엔진 등록을 포함한 한국어 SEO 최적화를 진행합니다.

---

## Phase 1: 즉시 적용 (핵심 변경)

### 1-1. 네이버 사이트 인증 메타태그 추가

**파일: `index.html`** (Line 11 이후)

```html
<!-- Search Engine Verification -->
<meta name="naver-site-verification" content="b67f89c17fdb4d23872bab1eac72749038feaacb" />
```

### 1-2. 키워드 강화

**파일: `index.html`** (Line 8)

현재:
```html
<meta name="keywords" content="K-Worship, 케이워십, 예배, 찬양, 워십, 콘티, 세트리스트, 찬양팀, 예배 인도자, 교회, worship, church, setlist, worship leader, praise, CCM, 악보, sheet music">
```

변경:
```html
<meta name="keywords" content="K-Worship, 케이워십, 예배, 찬양, 워십, 콘티, 세트리스트, 예배콘티, 예배순서, 찬양팀, 예배 인도자, 찬양인도자, 찬양인도, 예배인도, 교회, worship, church, setlist, worship leader, praise, CCM, 악보, sheet music, 마커스워십, 어노인팅, 피아워십, 아이자야씩스티원, 예수전도단, 찬양콘티, 주일예배, 찬양팀관리, 워십밴드, 찬양팀 관리 앱">
```

### 1-3. Landing 페이지 SEOHead 추가

**파일: `src/pages/Landing.tsx`**

SEOHead 컴포넌트 import 및 추가:

```typescript
import { SEOHead } from "@/components/seo/SEOHead";

// return 문 내부 최상단에 추가
<SEOHead
  title="K-Worship - 예배팀을 위한 통합 플랫폼"
  titleKo="K-Worship - 예배팀을 위한 콘티 제작 및 찬양팀 관리 플랫폼"
  description="K-Worship is an all-in-one worship team management platform for song library, setlist creation, and team collaboration."
  descriptionKo="K-Worship은 예배 인도자와 찬양팀을 위한 콘티 제작, 곡 라이브러리, 악보 관리, 팀 협업 플랫폼입니다. 마커스워십, 어노인팅, 피아워십 등 다양한 찬양을 관리하세요."
  keywords="K-Worship, 케이워십, 예배콘티, 찬양팀관리, 워십세트, worship setlist, CCM"
  keywordsKo="K-Worship, 케이워십, 예배콘티, 찬양인도, 예배인도, 마커스워십, 어노인팅, 피아워십, 찬양팀관리, 워십세트, 주일예배, CCM악보"
  canonicalPath="/"
/>
```

### 1-4. Help 페이지 FAQPage 스키마 추가

**파일: `src/pages/Help.tsx`**

FAQ JSON-LD 스키마를 SEOHead에 전달:

```typescript
// faqItems 정의 후 스키마 생성
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqItems.slice(0, 10).map(item => ({
    "@type": "Question",
    "name": item.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": item.answer.substring(0, 500)
    }
  }))
};

// SEOHead에 jsonLd prop 추가
<SEOHead
  title="Help Center"
  titleKo="도움말 센터"
  description="..."
  jsonLd={faqSchema}
  ...
/>
```

---

## Phase 2: llms.txt 한국어 강화

**파일: `public/llms.txt`**

한국어 섹션 추가:

```markdown
## 주요 기능 (한국어)

K-Worship(케이워십)은 예배팀을 위한 통합 관리 플랫폼입니다.

### 핵심 기능
- **곡 라이브러리**: 마커스워십, 어노인팅, 피아워십, 아이자야씩스티원, 예수전도단 등 500곡 이상의 찬양
- **콘티 제작**: 드래그 앤 드롭으로 예배 순서(세트리스트) 구성
- **찬양팀 협업**: 실시간 팀 커뮤니케이션 및 일정 공유
- **악보 관리**: 악보 이미지 저장 및 공유, 키 변경

### 검색 키워드
예배콘티, 찬양콘티, 예배순서, 찬양인도, 예배인도, 워십세트, 찬양팀관리, 주일예배, CCM악보

### 지원 아티스트
마커스워십, 어노인팅, 피아워십, 아이자야씩스티원, 예수전도단, 만나교회, 한성교회, 제이어스, 새생명비전교회, 조이풀처치
```

---

## 변경 파일 요약

| 파일 | 변경 내용 |
|------|----------|
| `index.html` | 네이버 인증 메타태그 + 키워드 강화 |
| `src/pages/Landing.tsx` | SEOHead 컴포넌트 추가 |
| `src/pages/Help.tsx` | FAQPage JSON-LD 스키마 추가 |
| `public/llms.txt` | 한국어 섹션 추가 |

---

## 예상 효과

1. **네이버 검색엔진**: 사이트 인증 완료 → 네이버 검색 결과 노출
2. **키워드 노출**: "예배콘티", "찬양인도", "마커스워십" 검색 시 K-Worship 노출
3. **Google Rich Results**: FAQ 스키마로 검색 결과에 FAQ 표시
4. **AI 검색**: llms.txt 한국어 강화로 AI 검색 최적화

---

## 보안 영향

- 없음 (메타데이터 및 정적 파일만 변경)
- 사용자 데이터나 인증에 영향 없음

