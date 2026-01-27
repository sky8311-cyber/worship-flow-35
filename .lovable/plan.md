
# K-Worship 정보 페이지 신설 및 네비게이션 개편

## 요약

아바타 메뉴에 "K-Worship 정보" 메뉴를 새로 추가하고, 여기에 다음 페이지들을 통합합니다:
- 뉴스 (News)
- 주요 기능 (Features)
- 브랜드에셋 (Brand Assets)
- 약관 및 정책 (Legal)
- 앱 히스토리 (App History)
- 소셜미디어 링크

기존 아바타 메뉴의 "약관 및 정책", "앱 히스토리" 메뉴는 삭제하고, Settings 페이지의 About 카드도 제거합니다.

---

## 변경 파일 목록

| 파일 | 작업 |
|------|------|
| `src/pages/KWorshipInfo.tsx` | **신규** - K-Worship 정보 페이지 |
| `src/App.tsx` | 라우트 추가 (`/kworship-info`) |
| `src/components/layout/AppHeader.tsx` | 아바타 메뉴 변경 (K-Worship 정보 추가, 약관/앱히스토리 제거) |
| `src/pages/Settings.tsx` | About K-Worship 카드 섹션 제거 |
| `src/pages/Help.tsx` | Breadcrumb 추가 |
| `src/pages/Referral.tsx` | Breadcrumb 추가 |

---

## 상세 구현

### 1. K-Worship 정보 페이지 (신규)

경로: `/kworship-info`

```text
┌─────────────────────────────────────────────────────────┐
│ [AppHeader - 기존 Top Nav 유지]                          │
├─────────────────────────────────────────────────────────┤
│ 🏠 > K-Worship 정보                    (Breadcrumb)     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ K-Worship 정보                                          │
│ K-Worship에 대해 알아보세요                              │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 📰 뉴스                                  [바로가기 →] │ │
│ │    최신 소식과 업데이트를 확인하세요                   │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ ✨ 주요 기능                             [바로가기 →] │ │
│ │    K-Worship의 핵심 기능을 알아보세요                 │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ 🎨 브랜드에셋                            [바로가기 →] │ │
│ │    로고, 컬러 등 브랜드 자료                          │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ 📄 약관 및 정책                          [바로가기 →] │ │
│ │    이용약관, 개인정보처리방침                          │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ 📜 앱 히스토리                           [바로가기 →] │ │
│ │    K-Worship의 발자취                                │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ ─────────────────────────────────────────────────────── │
│                                                          │
│ 팔로우하기                                               │
│ [Instagram] [Threads] [YouTube] [Email]                 │
│                                                          │
│ ─────────────────────────────────────────────────────── │
│                                                          │
│ © 2026 Goodpapa Inc. All rights reserved.               │
│ K-Worship™ is a trademark of Goodpapa Inc.              │
│                                                          │
├─────────────────────────────────────────────────────────┤
│ [BottomTabNavigation - 기존 Bottom Nav 유지]             │
└─────────────────────────────────────────────────────────┘
```

**구현 특징:**
- `AppLayout` 사용하여 Top/Bottom Nav 유지
- 각 링크는 `Link` 컴포넌트로 해당 페이지로 이동
- Breadcrumb으로 현재 위치 표시

### 2. 아바타 메뉴 변경

**변경 전 (AppHeader.tsx):**
```
- 설정
- 도움말
- 친구 초대
- 약관 및 정책  ← 제거
- 앱 히스토리   ← 제거
- 로그아웃
```

**변경 후:**
```
- 설정
- 도움말
- 친구 초대
- K-Worship 정보  ← 신규 (Info 아이콘)
- 로그아웃
```

### 3. 하위 페이지 Breadcrumb 추가

각 하위 페이지에서 AppLayout의 `breadcrumb` prop을 활용하여 위치 표시:

**News 페이지:**
```
🏠 > K-Worship 정보 > 뉴스
```

**Features 페이지:**
```
🏠 > K-Worship 정보 > 주요 기능
```

**Press (Brand Assets) 페이지:**
```
🏠 > K-Worship 정보 > 브랜드에셋
```

**Legal 페이지:**
```
🏠 > K-Worship 정보 > 약관 및 정책
```

**AppHistory 페이지:**
```
🏠 > K-Worship 정보 > 앱 히스토리
```

### 4. Help, Settings, Referral 페이지 Breadcrumb 추가

현재 이 페이지들은 breadcrumb이 없으므로 추가:

**Help 페이지:**
```
🏠 > 도움말
```

**Settings 페이지:**
```
🏠 > 설정
```

**Referral 페이지:**
```
🏠 > 친구 초대
```

### 5. Settings 페이지 About 카드 제거

Settings.tsx 하단의 "K-Worship 정보" Card 섹션을 제거합니다.
(약 660~742번째 줄)

---

## 기술 세부 사항

### Breadcrumb 컴포넌트 사용

```tsx
import { 
  Breadcrumb, 
  BreadcrumbList, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbSeparator, 
  BreadcrumbPage 
} from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import { Home } from "lucide-react";

// 예시: K-Worship 정보 페이지
<AppLayout 
  breadcrumb={
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/dashboard"><Home className="h-4 w-4" /></Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>K-Worship 정보</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  }
>
```

### K-Worship 정보 페이지 링크 목록

```tsx
const infoLinks = [
  {
    path: "/news",
    icon: Newspaper,
    titleKo: "뉴스",
    titleEn: "News",
    descriptionKo: "최신 소식과 업데이트를 확인하세요",
    descriptionEn: "Check latest news and updates",
  },
  {
    path: "/features",
    icon: Sparkles,
    titleKo: "주요 기능",
    titleEn: "Key Features",
    descriptionKo: "K-Worship의 핵심 기능을 알아보세요",
    descriptionEn: "Discover K-Worship's core features",
  },
  {
    path: "/press",
    icon: Palette,
    titleKo: "브랜드에셋",
    titleEn: "Brand Assets",
    descriptionKo: "로고, 컬러 등 브랜드 자료",
    descriptionEn: "Logo, colors, and brand materials",
  },
  {
    path: "/legal",
    icon: FileText,
    titleKo: "약관 및 정책",
    titleEn: "Terms & Policies",
    descriptionKo: "이용약관, 개인정보처리방침",
    descriptionEn: "Terms of service, privacy policy",
  },
  {
    path: "/app-history",
    icon: History,
    titleKo: "앱 히스토리",
    titleEn: "App History",
    descriptionKo: "K-Worship의 발자취",
    descriptionEn: "K-Worship's journey",
  },
];
```

---

## 예상 결과

1. **아바타 메뉴 간소화**: 5개 항목에서 약관/앱히스토리 제거, K-Worship 정보 1개 추가
2. **일관된 위치 표시**: 모든 서브페이지에 Breadcrumb으로 현재 위치 표시
3. **정보 통합**: 앱 관련 정보를 한 곳에서 쉽게 접근
4. **Settings 페이지 정리**: About 카드 제거로 페이지 간소화
