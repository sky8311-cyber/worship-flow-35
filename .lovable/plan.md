
# 공개 페이지 통합 헤더 네비게이션 - 구현 완료 ✅

## 개요

모든 공개 서브페이지에 일관된 상단 네비게이션 바를 적용했습니다. 앱스토어/플레이스토어 버튼(Coming Soon), 웹앱 접근, 언어 토글을 포함합니다.

---

## 구현 완료 사항

### 1. 공용 헤더 컴포넌트 생성 ✅
- `src/components/landing/PublicPageHeader.tsx` 생성
- 앱스토어 URL 중앙 관리 (한 곳에서 수정하면 모든 페이지 반영)
- 플로팅 아이콘 바 스타일 적용

### 2. 각 페이지 헤더 교체 ✅
| 페이지 | 상태 |
|--------|------|
| `Features.tsx` | ✅ 완료 |
| `News.tsx` | ✅ 완료 |
| `NewsDetail.tsx` | ✅ 완료 |
| `AppHistory.tsx` | ✅ 완료 |
| `Press.tsx` | ✅ 완료 |
| `Legal.tsx` | ✅ 완료 |
| `Help.tsx` | ✅ 완료 |

### 3. Press.tsx → Brand Assets 변경 ✅
- 페이지 제목: "보도자료" → "브랜드에셋" / "Press Kit" → "Brand Assets"
- "미디어 보도" 섹션 삭제 (이제 `/news`에서 press 카테고리로 관리)
- Footer 링크 업데이트 완료

---

## 향후 앱스토어 링크 추가 시

`src/components/landing/PublicPageHeader.tsx` 상단의 상수만 수정:
```typescript
const APP_STORE_URL = "https://apps.apple.com/app/kworship/id123456789";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=app.kworship";
```

모든 페이지에 자동으로 반영됩니다.
