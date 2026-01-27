

# Breadcrumb 추가: K-Worship 정보 하위 페이지들

## 문제점

K-Worship 정보에서 링크된 5개 하위 페이지들(뉴스, 주요 기능, 브랜드에셋, 약관 및 정책, 앱 히스토리)에 breadcrumb이 없습니다.

현재 이 페이지들은 `AppLayout`을 사용하지만 `breadcrumb` prop을 전달하지 않아 사용자가 현재 위치를 파악하기 어렵습니다.

---

## 수정 파일

| 파일 | 작업 |
|------|------|
| `src/pages/News.tsx` | Breadcrumb 추가 |
| `src/pages/Features.tsx` | Breadcrumb 추가 |
| `src/pages/Press.tsx` | Breadcrumb 추가 |
| `src/pages/Legal.tsx` | Breadcrumb 추가 |
| `src/pages/AppHistory.tsx` | Breadcrumb 추가 |

---

## Breadcrumb 구조

각 페이지에 다음 형태의 breadcrumb 추가:

```
🏠 > K-Worship 정보 > [현재 페이지명]
```

예시:
- 뉴스: `🏠 > K-Worship 정보 > 뉴스`
- 주요 기능: `🏠 > K-Worship 정보 > 주요 기능`
- 브랜드에셋: `🏠 > K-Worship 정보 > 브랜드에셋`
- 약관 및 정책: `🏠 > K-Worship 정보 > 약관 및 정책`
- 앱 히스토리: `🏠 > K-Worship 정보 > 앱 히스토리`

---

## 기술 구현

각 페이지에서 인증된 사용자(`user` 있을 때)가 `AppLayout`을 사용할 때 breadcrumb prop을 전달합니다.

### 공통 Breadcrumb 패턴

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

// 예: News 페이지
const breadcrumb = (
  <Breadcrumb>
    <BreadcrumbList>
      <BreadcrumbItem>
        <BreadcrumbLink asChild>
          <Link to="/dashboard">
            <Home className="h-4 w-4" />
          </Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbLink asChild>
          <Link to="/kworship-info">
            {language === "ko" ? "K-Worship 정보" : "About K-Worship"}
          </Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbPage>
          {language === "ko" ? "뉴스" : "News"}
        </BreadcrumbPage>
      </BreadcrumbItem>
    </BreadcrumbList>
  </Breadcrumb>
);

// AppLayout에 전달
return user ? <AppLayout breadcrumb={breadcrumb}>{content}</AppLayout> : content;
```

---

## 각 페이지별 변경 사항

### 1. News.tsx (뉴스)
- import 추가: Breadcrumb 컴포넌트, Link, Home 아이콘
- breadcrumb 변수 생성
- `<AppLayout breadcrumb={breadcrumb}>` 형태로 변경

### 2. Features.tsx (주요 기능)
- import 추가: Breadcrumb 컴포넌트
- breadcrumb 변수 생성
- `<AppLayout breadcrumb={breadcrumb}>` 형태로 변경

### 3. Press.tsx (브랜드에셋)
- import 추가: Breadcrumb 컴포넌트, Home 아이콘
- breadcrumb 변수 생성
- `<AppLayout breadcrumb={breadcrumb}>` 형태로 변경

### 4. Legal.tsx (약관 및 정책)
- import 추가: Breadcrumb 컴포넌트, Link, Home 아이콘
- breadcrumb 변수 생성
- `<AppLayout breadcrumb={breadcrumb}>` 형태로 변경

### 5. AppHistory.tsx (앱 히스토리)
- import 추가: Breadcrumb 컴포넌트, Link, Home 아이콘
- breadcrumb 변수 생성
- `<AppLayout breadcrumb={breadcrumb}>` 형태로 변경

---

## 예상 결과

로그인한 사용자가 K-Worship 정보 페이지에서 하위 메뉴를 클릭하면:
1. 해당 페이지의 헤더 아래에 breadcrumb이 표시됨
2. `🏠 > K-Worship 정보 > [페이지명]` 형태로 현재 위치 파악 가능
3. breadcrumb의 각 항목을 클릭하여 상위 페이지로 이동 가능

