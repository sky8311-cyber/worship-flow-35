
# Logged-in 사용자를 위한 Footer/About 정보 접근성 개선

## 현재 상황

로그인한 사용자는 랜딩 페이지에 접근하지 않으므로, Footer에 있는 다음 정보에 접근할 수 없습니다:

| 항목 | 현재 접근 가능? |
|------|----------------|
| 법적 문서 (Legal) | ✅ 프로필 메뉴에 있음 |
| 앱 히스토리 | ✅ 프로필 메뉴에 있음 |
| **주요 기능 (Features)** | ❌ 접근 불가 |
| **뉴스 (News)** | ❌ 접근 불가 |
| **브랜드에셋 (Brand Assets)** | ❌ 접근 불가 |
| **소셜 미디어 아이콘** | ❌ 접근 불가 |

---

## 권장 해결 방안: Settings 페이지에 "About / 정보" 섹션 추가

Help 페이지나 별도 페이지보다 **Settings 페이지** 하단에 "About" 카드를 추가하는 것을 권장합니다.

### 이유
1. 사용자가 앱 정보를 찾을 때 자연스럽게 Settings를 먼저 확인
2. 메뉴 항목을 과도하게 늘리지 않음
3. iOS/Android 앱 패턴과 일치 (Settings 하단에 About 섹션)

---

## 구현 계획

### 변경 파일
| 파일 | 작업 |
|------|------|
| `src/pages/Settings.tsx` | "About K-Worship" 카드 섹션 추가 |

### 추가할 내용

Settings 페이지 하단에 새로운 카드 추가:

```text
┌─────────────────────────────────────────────┐
│ ℹ️ About K-Worship                          │
├─────────────────────────────────────────────┤
│                                             │
│  📰 뉴스           🎯 주요 기능              │
│  🎨 브랜드에셋                               │
│                                             │
│  ─────────────────────────────────────────  │
│                                             │
│  팔로우하기                                  │
│  [Instagram] [Threads] [YouTube] [Email]   │
│                                             │
│  ─────────────────────────────────────────  │
│                                             │
│  © 2026 Goodpapa Inc.                       │
│  K-Worship™ is a trademark of Goodpapa Inc. │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 세부 구현

### 1. About Card 컴포넌트 추가 (Settings.tsx 하단)

다음 링크들을 포함:
- **뉴스** → `/news`
- **주요 기능** → `/features`  
- **브랜드에셋** → `/press`

소셜 미디어 아이콘:
- Instagram → `https://www.instagram.com/kworship.app`
- Threads → `https://www.threads.net/@kworship.app`
- YouTube → `https://youtube.com/@kworship.app`
- Email → `mailto:hello@kworship.app`

Copyright 정보:
- `© 2026 Goodpapa Inc. All rights reserved.`
- `K-Worship™ is a trademark of Goodpapa Inc.`

### 2. 아이콘 사용
- `Newspaper` (뉴스)
- `Sparkles` 또는 `ListChecks` (주요 기능)
- `Palette` (브랜드에셋)
- `Instagram`, `AtSign` (Threads), `Youtube`, `Mail` (소셜)

---

## 대안 고려사항

### 대안 1: Help 페이지에 추가
- 장점: 기존 정보 페이지와 통합
- 단점: Help는 FAQ 중심이라 About 정보와 맥락이 다름

### 대안 2: 프로필 드롭다운에 링크 추가
- 장점: 빠른 접근
- 단점: 메뉴가 이미 8개 항목으로 복잡함, 소셜 아이콘 표시 어려움

### 대안 3: 별도 About 페이지 생성
- 장점: 깔끔한 분리
- 단점: 또 다른 페이지 추가, 메뉴 항목 증가

**권장**: Settings 하단에 About 카드 추가 (대안 1보다 자연스럽고, 대안 2/3보다 단순함)

---

## 기술 구현 상세

### Settings.tsx 수정 위치
Premium Subscription 카드 아래 (파일 마지막 부분)에 About 카드 추가

### 코드 구조

```tsx
{/* About K-Worship */}
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Info className="h-5 w-5" />
      {language === "ko" ? "K-Worship 정보" : "About K-Worship"}
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Quick Links */}
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" asChild>
        <Link to="/news">
          <Newspaper className="mr-2 h-4 w-4" />
          {language === "ko" ? "뉴스" : "News"}
        </Link>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <Link to="/features">
          <Sparkles className="mr-2 h-4 w-4" />
          {language === "ko" ? "주요 기능" : "Features"}
        </Link>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <Link to="/press">
          <Palette className="mr-2 h-4 w-4" />
          {language === "ko" ? "브랜드에셋" : "Brand Assets"}
        </Link>
      </Button>
    </div>
    
    <Separator />
    
    {/* Social Links */}
    <div>
      <p className="text-sm text-muted-foreground mb-3">
        {language === "ko" ? "팔로우하기" : "Follow Us"}
      </p>
      <div className="flex items-center gap-4">
        <a href="https://www.instagram.com/kworship.app" target="_blank">
          <Instagram className="h-5 w-5" />
        </a>
        <a href="https://www.threads.net/@kworship.app" target="_blank">
          <AtSign className="h-5 w-5" />
        </a>
        <a href="https://youtube.com/@kworship.app" target="_blank">
          <Youtube className="h-5 w-5" />
        </a>
        <a href="mailto:hello@kworship.app">
          <Mail className="h-5 w-5" />
        </a>
      </div>
    </div>
    
    <Separator />
    
    {/* Copyright */}
    <div className="text-xs text-muted-foreground">
      <p>© {currentYear} Goodpapa Inc. All rights reserved.</p>
      <p>K-Worship™ is a trademark of Goodpapa Inc.</p>
    </div>
  </CardContent>
</Card>
```

---

## 예상 결과

로그인한 사용자가 Settings 페이지에서:
1. 뉴스, 주요 기능, 브랜드에셋 페이지에 쉽게 접근
2. 소셜 미디어 계정 팔로우 가능
3. 회사 정보 및 저작권 확인 가능

이 방식은 앱의 "정보" 섹션을 하나의 자연스러운 위치에 통합합니다.
