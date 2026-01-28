

# 애플리케이션 UX/UI 개선 계획 (수정됨)

## 티어 명칭 최종 확정

| 티어 키 | English | 한국어 |
|---------|---------|--------|
| `member` | Team Member | 팀멤버 |
| `worship_leader` | Basic Member | **기본멤버** |
| `premium` | Full Member | 정식멤버 |
| `church` | Community Account | 공동체계정 |

**변경사항**: "일반멤버" 대신 "기본멤버" 사용 (기존 명칭 유지, 베타만 제거)

---

## 구현 단계

### 1. 명칭 정리 및 베타 완전 제거

**수정 파일:**
- `src/hooks/useTierFeature.ts`: TIER_CONFIG 내 labelKo 확인 및 통일
- `src/lib/translations.ts`: 
  - `betaFree` 키 → `freeLabel`로 변경
  - 모든 "(베타)" 텍스트 제거 확인
  - "예배 공동체 계정" → "공동체계정" (간결화)
- `src/components/church/ChurchBillingTab.tsx`: `betaFree` → `freeLabel` 참조 수정

### 2. Settings 페이지 정리

**수정 파일:** `src/pages/Settings.tsx`
- `PremiumBillingCard` 제거 (통합 멤버십 페이지로 이동했으므로)
- 대신 "멤버십 관리" 링크 카드 추가 → `/membership`으로 이동

### 3. 네비게이션 로직 개선

**수정 파일:** `src/components/layout/AppHeader.tsx`
- 멤버십 메뉴가 `isChurchMenuVisible`에 의존하는 문제 수정
- 모든 로그인 사용자에게 멤버십 메뉴 표시
- 업그레이드 뱃지 로직 개선: Premium 및 Church 업그레이드 모두 고려

### 4. Membership 페이지 텍스트 확인

**수정 파일:** `src/pages/Membership.tsx`
- 하드코딩된 텍스트가 "기본멤버"로 표시되는지 확인
- 번역 키 사용으로 일관성 유지

### 5. Admin 페이지 동기화

**수정 파일:**
- `src/pages/AdminCRM.tsx`: 티어 필터 라벨 확인
- `src/pages/AdminDashboard.tsx`: 통계 라벨 확인

---

## 파일별 변경 요약

| 파일 | 변경 내용 |
|------|----------|
| `src/hooks/useTierFeature.ts` | labelKo: "기본 멤버" → "기본멤버" (띄어쓰기 제거), "예배 공동체 계정" → "공동체계정" |
| `src/lib/translations.ts` | betaFree → freeLabel 키 변경, 공동체계정 간결화 |
| `src/pages/Settings.tsx` | PremiumBillingCard 제거, 멤버십 링크 추가 |
| `src/components/layout/AppHeader.tsx` | 메뉴 표시 조건 및 뱃지 로직 수정 |
| `src/pages/Membership.tsx` | 텍스트 일관성 확인 |
| `src/components/church/ChurchBillingTab.tsx` | betaFree → freeLabel 참조 수정 |

---

## 최종 사용자 경험

```text
아바타 메뉴:
┌─────────────────────────────────────┐
│ ✨ 멤버십              [업그레이드] │
└─────────────────────────────────────┘
              ↓
/membership 페이지:
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│  팀멤버  │ │ 기본멤버 │ │ 정식멤버 │ │공동체계정│
│  (무료)  │ │  (무료)  │ │(₩59,000) │ │(₩39,900) │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

