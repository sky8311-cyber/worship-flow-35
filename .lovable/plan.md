
# 브라우저 탭 제목 동적 업데이트 수정

## 문제 분석

스크린샷에서 확인된 현상:
- 워십세트 페이지(`/band-view/:id`)에서 브라우저 탭이 "로그인 - K-Wo..."로 표시됨
- 실제로는 "금요 엎드림 기도회" 워십세트를 보고 있지만 탭 제목이 반영되지 않음

**원인:**
- `SetBuilder.tsx`와 `BandView.tsx` 페이지에 `SEOHead` 컴포넌트가 없음
- SPA 특성상 이전 페이지(로그인)에서 설정한 제목이 그대로 유지됨
- 다른 페이지들(Landing, Login, News 등)은 `SEOHead`로 제목을 설정하고 있음

---

## 해결 방안

### 1. BandView.tsx에 동적 SEOHead 추가

워십세트 제목을 브라우저 탭에 표시:

```typescript
import { SEOHead } from "@/components/seo/SEOHead";

// 컴포넌트 내부
const pageTitle = serviceSet 
  ? `${serviceSet.service_name || (language === "ko" ? "예배 세트" : "Worship Set")} - K-Worship`
  : (language === "ko" ? "예배 세트" : "Worship Set");

return (
  <AppLayout>
    <SEOHead 
      title={pageTitle}
      description={`${serviceSet?.service_name || ""} ${serviceSet?.date || ""}`}
      noIndex={true}
    />
    {/* 기존 내용 */}
  </AppLayout>
);
```

### 2. SetBuilder.tsx에 동적 SEOHead 추가

편집 중인 세트 또는 새 세트 생성 표시:

```typescript
import { SEOHead } from "@/components/seo/SEOHead";

// 컴포넌트 내부
const pageTitle = id && existingSet
  ? (language === "ko" 
      ? `${existingSet.service_name || "워십세트"} 편집`
      : `Edit ${existingSet.service_name || "Worship Set"}`)
  : (language === "ko" ? "새 워십세트" : "New Worship Set");

return (
  <AppLayout>
    <SEOHead 
      title={pageTitle}
      description={language === "ko" ? "워십세트 편집" : "Edit worship set"}
      noIndex={true}
    />
    {/* 기존 내용 */}
  </AppLayout>
);
```

---

## 파일 변경 요약

| 파일 | 변경 내용 |
|------|----------|
| `src/pages/BandView.tsx` | `SEOHead` 추가하여 워십세트 이름을 브라우저 탭에 표시 |
| `src/pages/SetBuilder.tsx` | `SEOHead` 추가하여 편집 중인 세트 이름 또는 "새 워십세트" 표시 |

---

## 예상 결과

```text
수정 전:
┌─────────────────────────────────────┐
│ 🎵 로그인 - K-Wo...  [x]           │  ← 이전 페이지 제목 유지
└─────────────────────────────────────┘

수정 후:
┌─────────────────────────────────────┐
│ 🎵 금요 엎드림 기도회 - K-Wo... [x] │  ← 실제 워십세트 이름 표시
└─────────────────────────────────────┘

편집 모드:
┌─────────────────────────────────────┐
│ 🎵 주일예배 편집 - K-Wor... [x]     │  ← 편집 중인 세트 이름 표시
└─────────────────────────────────────┘

새 세트:
┌─────────────────────────────────────┐
│ 🎵 새 워십세트 - K-Worship [x]     │  ← 새 세트 생성 표시
└─────────────────────────────────────┘
```

이 수정으로 사용자가 어떤 워십세트를 보거나 편집 중인지 브라우저 탭에서 바로 확인할 수 있습니다.
