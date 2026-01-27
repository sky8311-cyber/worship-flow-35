
# 공개 페이지 통합 헤더 네비게이션 구현 계획

## 개요

랜딩페이지와 모든 공개 서브페이지에 일관된 상단 네비게이션 바를 적용합니다. 앱스토어/플레이스토어 버튼(Coming Soon), 웹앱 접근, 언어 토글을 포함하며, 향후 앱스토어 링크가 준비되면 한 곳만 수정해도 모든 페이지에 반영됩니다.

---

## 현재 상태 분석

| 페이지 | 현재 헤더 | 문제점 |
|--------|----------|--------|
| Landing (/) | `LandingNav` - 플로팅 아이콘 바 (Apple, Play, Globe, Language) | 올바르게 구현됨 |
| Features (/features) | 로고 + LanguageToggle만 | 앱스토어 버튼 없음 |
| News (/news) | 로고 + LanguageToggle만 | 앱스토어 버튼 없음 |
| App History (/app-history) | 로고 + LanguageToggle만 | 앱스토어 버튼 없음 |
| Press (/press) | 로고 + LanguageToggle만 | 앱스토어 버튼 없음, 미디어 보도 섹션 중복 |
| Legal (/legal) | 로고 + LanguageToggle만 | 앱스토어 버튼 없음 |
| Help (/help) | AppLayout 사용 (로그인 사용자용) | 비로그인 시 헤더 없음 - 별도 처리 필요 |

---

## 변경 사항

### 1. 공용 헤더 컴포넌트 생성

**새 파일:** `src/components/landing/PublicPageHeader.tsx`

이미지에서 보이는 것처럼 플로팅 스타일의 아이콘 바를 포함:
- Apple 아이콘 (Coming Soon 표시)
- Play Store 아이콘 (Coming Soon 표시)
- Globe 아이콘 (웹앱 링크)
- 언어 토글

```text
┌─────────────────────────────────────────────────┐
│ [Logo]                    [ ○○○ ] (floating bar)│
│                           App/Play/Globe/Lang   │
└─────────────────────────────────────────────────┘
```

기존 `LandingNav`의 플로팅 바 패턴을 재사용하되, 서브페이지용으로 로고도 포함합니다.

### 2. 각 페이지 헤더 교체

다음 페이지들의 기존 헤더를 `PublicPageHeader`로 교체:

| 페이지 | 수정 내용 |
|--------|----------|
| `Features.tsx` | 기존 헤더 → `<PublicPageHeader />` |
| `News.tsx` | 기존 헤더 → `<PublicPageHeader />` |
| `NewsDetail.tsx` | 기존 헤더 → `<PublicPageHeader />` |
| `AppHistory.tsx` | 기존 헤더 → `<PublicPageHeader />` |
| `Press.tsx` | 기존 헤더 → `<PublicPageHeader />` |
| `Legal.tsx` | 기존 헤더 → `<PublicPageHeader />` |
| `Help.tsx` | 비로그인 사용자를 위한 헤더 추가 |

### 3. Press.tsx 수정사항

1. **페이지 제목 변경**: "보도자료" → "브랜드에셋" / "Press Kit" → "Brand Assets"
2. **"미디어 보도" 섹션 삭제**: 이제 `/news` 페이지에서 press 카테고리로 보도자료를 관리하므로 중복됨
3. **Footer 링크 업데이트**: "보도자료" → "브랜드에셋"

---

## 기술 세부사항

### PublicPageHeader 컴포넌트 구조

```typescript
interface PublicPageHeaderProps {
  showLogo?: boolean; // 기본값 true
}

export const PublicPageHeader = ({ showLogo = true }: PublicPageHeaderProps) => {
  // 앱스토어 링크 설정 (한 곳에서 관리)
  const APP_STORE_URL = null; // 준비되면 URL 입력
  const PLAY_STORE_URL = null; // 준비되면 URL 입력
  
  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur ...">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo */}
          {showLogo && (
            <Link to="/">
              <img src={logoMobile} alt="K-Worship" className="h-10 md:hidden" />
              <img src={logoDesktop} alt="K-Worship" className="hidden md:block h-12" />
            </Link>
          )}
          
          {/* Right: Floating Icon Bar */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-white/90 ...">
            {/* App Store Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="relative h-8 w-8 rounded-full"
                  onClick={() => APP_STORE_URL 
                    ? window.open(APP_STORE_URL, '_blank') 
                    : toast("Coming Soon", { description: "iOS app is coming soon!" })
                  }
                >
                  {!APP_STORE_URL && <span className="absolute ... animate-pulse" />}
                  <AppleIcon />
                </Button>
              </TooltipTrigger>
            </Tooltip>
            
            {/* Play Store, Globe, Language - 동일 패턴 */}
          </div>
        </div>
      </div>
    </header>
  );
};
```

### 향후 앱스토어 링크 추가 시

`PublicPageHeader.tsx`에서 상수만 수정하면 모든 페이지에 자동 반영:
```typescript
const APP_STORE_URL = "https://apps.apple.com/app/kworship/id123456789";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=app.kworship";
```

---

## 파일 변경 요약

| 파일 | 작업 |
|------|------|
| `src/components/landing/PublicPageHeader.tsx` | 새 파일 - 공용 헤더 컴포넌트 |
| `src/pages/Features.tsx` | 헤더 교체 |
| `src/pages/News.tsx` | 헤더 교체 |
| `src/pages/NewsDetail.tsx` | 헤더 교체 |
| `src/pages/AppHistory.tsx` | 헤더 교체 |
| `src/pages/Press.tsx` | 헤더 교체 + 제목 변경 + 미디어 보도 섹션 삭제 |
| `src/pages/Legal.tsx` | 헤더 교체 |
| `src/pages/Help.tsx` | 비로그인 사용자를 위한 헤더 추가 |
| `src/components/landing/LandingFooter.tsx` | "보도자료" → "브랜드에셋" 변경 |

---

## 예상 결과

### Before (현재)
```text
Features: [Logo] ------------------- [한국어/EN]
News:     [Logo] ------------------- [한국어/EN]
Press:    [Logo] ------------------- [한국어/EN]
```

### After (변경 후)
```text
모든 페이지: [Logo] ---- [ ⚫ ⚫ 🌐 언어 ] (플로팅 아이콘 바)
                          ↑  ↑  ↑
                        Apple Play Globe
```

### Press 페이지 변경
- 제목: "보도자료" → "브랜드에셋"
- 부제: "K-Worship 브랜드 자료 및 미디어 리소스" → "K-Worship 브랜드 자료"
- "미디어 보도" 카드 섹션 완전 삭제 (약 80줄 제거)
