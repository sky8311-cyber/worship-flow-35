

# 애플리케이션 UX/UI 개선 계획 - ✅ 완료

## 티어 명칭 최종 확정

| 티어 키 | English | 한국어 |
|---------|---------|--------|
| `member` | Team Member | 팀멤버 |
| `worship_leader` | Basic Member | **기본멤버** |
| `premium` | Full Member | 정식멤버 |
| `church` | Community Account | 공동체계정 |

---

## ✅ 완료된 구현

### 1. 명칭 정리 및 베타 완전 제거 ✅

- `src/hooks/useTierFeature.ts`: TIER_CONFIG 내 labelKo 수정
  - "팀 멤버" → "팀멤버"
  - "기본 멤버" → "기본멤버"
  - "정식 멤버" → "정식멤버"
  - "예배 공동체 계정" → "공동체계정"
  - "Worship Community Account" → "Community Account"

- `src/lib/translations.ts`:
  - `betaFree` 키 → `freeLabel`로 변경
  - "예배 공동체 계정" → "공동체계정"
  - "팀 멤버" → "팀멤버"
  - "기본 멤버" → "기본멤버"

### 2. Settings 페이지 정리 ✅

- `src/pages/Settings.tsx`:
  - `PremiumBillingCard` 제거
  - 멤버십 관리 링크 카드 추가 → `/membership`으로 이동
  - `PremiumBillingCard` import 제거

### 3. 네비게이션 로직 개선 ✅

- `src/components/layout/AppHeader.tsx`:
  - 멤버십 메뉴가 `isChurchMenuVisible`에 의존하지 않고 항상 표시
  - 업그레이드 뱃지 로직 개선: Church 구독이 없으면 표시

### 4. Admin 페이지 동기화 ✅

- `src/pages/AdminCRM.tsx`:
  - "일반멤버" → "기본멤버"
  - 주석 업데이트

- `src/pages/AdminDashboard.tsx`:
  - "기본 멤버 (워십리더)" → "기본멤버"
  - "정식 멤버 (프리미엄)" → "정식멤버"
  - 설명 텍스트 통일

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
