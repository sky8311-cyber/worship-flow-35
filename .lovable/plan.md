
# Settings About 섹션 확장 + Page Analytics 기능 구현

## 1부: Settings About 섹션에 약관/앱 히스토리 추가

### 현재 상태
About 카드에 뉴스, 주요 기능, 브랜드에셋 링크가 있음

### 추가할 항목
| 항목 | 경로 | 아이콘 |
|------|------|--------|
| 약관 및 정책 | `/legal` | `FileText` |
| 앱 히스토리 | `/app-history` | `History` |

### 변경 파일
| 파일 | 작업 |
|------|------|
| `src/pages/Settings.tsx` | About 카드에 2개 버튼 추가 |

---

## 2부: Page Analytics 기능 구현

Lovable Cloud에 이미 기본 애널리틱스가 있지만, 다음과 같은 **커스텀 페이지 추적 시스템**을 구축하면 더 상세한 인사이트를 얻을 수 있습니다:

### 기능 요구사항
1. **페이지뷰 추적**: 어느 페이지에 가장 많이 방문하는지
2. **체류 시간**: 각 페이지에서 얼마나 머무는지
3. **드롭오프 분석**: 어디에서 이탈하는지
4. **About 페이지 클릭 추적**: 새로 추가된 About 링크들의 사용률

### 기술 아키텍처

```text
┌─────────────────────────────────────────────────────────┐
│                    Frontend                              │
├─────────────────────────────────────────────────────────┤
│  usePageAnalytics Hook                                   │
│  - 페이지 진입 시 pageview 기록                           │
│  - 페이지 이탈 시 duration 업데이트                       │
│  - visibilitychange 이벤트로 정확한 체류시간 측정          │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    Database                              │
├─────────────────────────────────────────────────────────┤
│  page_analytics 테이블                                   │
│  - id, user_id (nullable), session_id                   │
│  - page_path, page_title                                │
│  - entered_at, exited_at, duration_seconds              │
│  - referrer_path (이전 페이지)                           │
│  - device_type, created_at                              │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              Admin Analytics Page                        │
├─────────────────────────────────────────────────────────┤
│  /admin/analytics                                        │
│  - Top Pages (막대 차트)                                 │
│  - Avg Duration per Page (차트)                          │
│  - User Flow / Drop-off 분석                            │
│  - 기간별 필터링                                          │
└─────────────────────────────────────────────────────────┘
```

### 구현 계획

#### Phase 1: 데이터베이스 스키마

```sql
-- 페이지 애널리틱스 테이블
CREATE TABLE page_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  page_path TEXT NOT NULL,
  page_title TEXT,
  referrer_path TEXT,
  entered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  exited_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  device_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_page_analytics_path ON page_analytics(page_path);
CREATE INDEX idx_page_analytics_entered_at ON page_analytics(entered_at);

-- RLS 정책 (INSERT는 모든 사용자, SELECT/UPDATE는 본인만, Admin은 모두)
ALTER TABLE page_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert analytics"
  ON page_analytics FOR INSERT TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Users can update own analytics"
  ON page_analytics FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all analytics"
  ON page_analytics FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );
```

#### Phase 2: Analytics Hook

| 파일 | 설명 |
|------|------|
| `src/hooks/usePageAnalytics.ts` | 페이지뷰/체류시간 추적 훅 |

핵심 로직:
- 페이지 진입 시 `page_analytics`에 INSERT
- `visibilitychange` 또는 route 변경 시 `exited_at`, `duration_seconds` UPDATE
- 세션 ID는 `sessionStorage`로 관리 (브라우저 탭당 고유)

#### Phase 3: App.tsx 통합

라우터 레벨에서 `usePageAnalytics` 훅 호출하여 모든 페이지에 자동 적용

#### Phase 4: Admin Analytics 페이지

| 파일 | 설명 |
|------|------|
| `src/pages/AdminAnalytics.tsx` | 관리자 분석 대시보드 |
| `src/components/admin/AdminNav.tsx` | 메뉴에 Analytics 추가 |
| `src/App.tsx` | 라우트 추가 |

#### Admin Analytics UI 구성

```text
┌─────────────────────────────────────────────────────────┐
│ 📊 Page Analytics                    [7일 ▼] [새로고침] │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────┐  ┌─────────────────┐               │
│  │ Total Views     │  │ Unique Visitors │               │
│  │     4,725       │  │     1,356       │               │
│  └─────────────────┘  └─────────────────┘               │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐│
│  │ 📈 Top Pages by Views                               ││
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ││
│  │ /                          ████████████████ 805     ││
│  │ /app                       ██████████ 329           ││
│  │ /dashboard                 ████████ 264             ││
│  │ /signup                    ███████ 235              ││
│  │ /songs                     █████ 158                ││
│  │ /settings (About 클릭)     ██ 45                    ││
│  └─────────────────────────────────────────────────────┘│
│                                                          │
│  ┌─────────────────────────────────────────────────────┐│
│  │ ⏱️ Average Duration by Page                         ││
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ││
│  │ /set-builder          4m 32s                        ││
│  │ /band-view            3m 15s                        ││
│  │ /songs                2m 48s                        ││
│  │ /settings             1m 12s                        ││
│  └─────────────────────────────────────────────────────┘│
│                                                          │
│  ┌─────────────────────────────────────────────────────┐│
│  │ 🚪 Drop-off Analysis (Bounce Rate by Page)          ││
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ││
│  │ / (Landing)           58% bounce                    ││
│  │ /signup               45% bounce                    ││
│  │ /login                32% bounce                    ││
│  └─────────────────────────────────────────────────────┘│
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 전체 파일 변경 목록

| 파일 | 작업 |
|------|------|
| `src/pages/Settings.tsx` | About 카드에 Legal, App History 버튼 추가 |
| `src/hooks/usePageAnalytics.ts` | 새 파일 - 페이지 추적 훅 |
| `src/App.tsx` | Analytics 훅 통합 + 라우트 추가 |
| `src/pages/AdminAnalytics.tsx` | 새 파일 - 관리자 분석 페이지 |
| `src/components/admin/AdminNav.tsx` | Analytics 메뉴 항목 추가 |
| Migration | `page_analytics` 테이블 생성 |

### 추가 고려사항

**프라이버시**: 
- 로그인하지 않은 사용자도 익명으로 추적 (user_id NULL 허용)
- 개인 식별 정보 최소화

**성능**:
- INSERT는 비동기로 처리 (페이지 로딩 차단하지 않음)
- 과도한 데이터 누적 방지를 위해 90일 이상 오래된 데이터 자동 삭제 정책 가능

### 기존 Lovable Analytics 활용

참고로 현재 Lovable Cloud에서 제공하는 기본 애널리틱스 데이터:
- **방문자**: 1,356명 (최근 7일)
- **페이지뷰**: 4,725
- **Top 페이지**: /, /app, /dashboard, /signup, /songs
- **트래픽 소스**: Threads (600), Direct (685)
- **기기**: Mobile 87%, Desktop 11%
- **국가**: KR 67%, CA 17%, US 7%

커스텀 시스템은 이 데이터를 보완하여:
- 페이지별 체류 시간
- 사용자 흐름 (A→B 이동 패턴)
- About 섹션 같은 특정 UI 요소 클릭 추적

을 추가로 제공합니다.

