
# 어드민 대시보드 활동지표 동적 기간 필터 구현

## 현재 상태 분석

**현재 구현:**
- 8개 고정 통계 카드 (총 사용자, 기본멤버, 정식멤버, 교회계정, 워십세트, 곡, 주간가입, 월간세트)
- 일부만 기간 필터링 (주간 가입, 월간 세트만)
- 변화율(증감) 표시 없음
- 기간 선택 UI 없음

**데이터 가용성:**
- 모든 주요 테이블에 `created_at` 컬럼 존재 (profiles, service_sets, songs, community_posts, worship_communities 등)
- 기간별 비교 쿼리 가능 확인됨

---

## 제안 기능: SaaS 베스트 프랙티스 기반

### 1. 기간 선택기 (Period Selector)
| 기간 | 비교 대상 |
|------|----------|
| 오늘 (Today) | 어제 대비 |
| 최근 7일 (Last 7 Days) | 이전 7일 대비 |
| 이번 달 (This Month) | 지난달 대비 |
| YoY (Year over Year) | 작년 동기간 대비 |

### 2. 개선된 활동지표 카드

각 카드에 다음 정보 표시:
```text
┌─────────────────────────────────┐
│  👤 신규 가입                   │
│                                 │
│  47        ↑ 12 (+34.3%)        │
│  [===================    ] 70%  │
│  vs 이전 기간: 35               │
└─────────────────────────────────┘
```

**카드 구성 요소:**
- 현재 기간 값 (굵은 숫자)
- 변화량 및 변화율 (↑/↓ 화살표 + 퍼센트)
- 이전 기간 값 (비교 참조)
- 증가는 녹색, 감소는 빨간색

### 3. 추적할 핵심 지표 (SaaS 베스트 프랙티스)

| 카테고리 | 지표 | 설명 |
|----------|------|------|
| **사용자 성장** | 신규 가입 | 기간 내 새 프로필 생성 |
| | 활성 사용자 | 기간 내 페이지 방문한 고유 사용자 |
| | 전환율 | 가입 → 예배인도자 승급 비율 |
| **콘텐츠 생성** | 신규 워십세트 | 기간 내 생성된 세트 |
| | 신규 곡 | 기간 내 추가된 곡 |
| | 커뮤니티 포스트 | 기간 내 작성된 게시물 |
| **참여도** | 커뮤니티 활동 | 좋아요, 댓글 수 |
| | 일일 활성 비율 (DAU/MAU) | 월간 대비 일간 활성 비율 |
| **성장** | 신규 커뮤니티 | 기간 내 생성된 커뮤니티 |
| | 신규 멤버십 가입 | 교회계정/프리미엄 전환 |

---

## 구현 계획

### 파일 구조

```text
src/
├── components/
│   └── admin/
│       ├── ActivityMetricsSection.tsx    # 새 컴포넌트
│       ├── StatCardWithChange.tsx        # 변화율 표시 카드
│       └── PeriodSelector.tsx            # 기간 선택 컴포넌트
└── pages/
    └── AdminDashboard.tsx                # 기존 파일 수정
```

### 1단계: PeriodSelector 컴포넌트

```typescript
type Period = "today" | "7days" | "month" | "yoy";

interface PeriodRange {
  current: { start: Date; end: Date };
  previous: { start: Date; end: Date };
  label: string;
  compareLabel: string;
}
```

**기간별 날짜 계산:**
- 오늘: 오늘 00:00 ~ 현재 vs 어제 00:00 ~ 어제 23:59
- 7일: 최근 7일 vs 그 이전 7일
- 이번달: 1일 ~ 오늘 vs 지난달 1일 ~ 지난달 같은 일
- YoY: 올해 1월 1일 ~ 오늘 vs 작년 같은 기간

### 2단계: StatCardWithChange 컴포넌트

```typescript
interface StatCardWithChangeProps {
  title: string;
  currentValue: number;
  previousValue: number;
  icon: LucideIcon;
  color: string;
  format?: "number" | "percent";
}
```

**변화율 계산:**
```typescript
const change = currentValue - previousValue;
const changePercent = previousValue > 0 
  ? ((change / previousValue) * 100).toFixed(1) 
  : currentValue > 0 ? "+100" : "0";
const isPositive = change > 0;
const isNegative = change < 0;
```

### 3단계: ActivityMetricsSection 컴포넌트

**데이터 쿼리 로직:**
```typescript
const { data: metrics } = useQuery({
  queryKey: ["admin-activity-metrics", period],
  queryFn: async () => {
    const { current, previous } = getPeriodRange(period);
    
    // 병렬 쿼리로 현재/이전 기간 데이터 수집
    const [
      currentUsers, previousUsers,
      currentSets, previousSets,
      currentSongs, previousSongs,
      currentPosts, previousPosts,
      currentCommunities, previousCommunities,
      currentActiveUsers, previousActiveUsers,
    ] = await Promise.all([
      // profiles 쿼리
      supabase.from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", current.start.toISOString())
        .lt("created_at", current.end.toISOString()),
      supabase.from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", previous.start.toISOString())
        .lt("created_at", previous.end.toISOString()),
      // ... 나머지 테이블들
    ]);
    
    return {
      newUsers: { current: currentUsers.count, previous: previousUsers.count },
      newSets: { current: currentSets.count, previous: previousSets.count },
      // ...
    };
  },
});
```

### 4단계: AdminDashboard.tsx 수정

**변경 사항:**
1. 기존 statCards 배열을 ActivityMetricsSection으로 교체
2. 기간 선택 상태 추가
3. 헤더에 PeriodSelector 배치

---

## UI 디자인

### 전체 레이아웃
```text
┌─────────────────────────────────────────────────────────────────────┐
│ 📊 활동 지표                          [오늘 ▼] [새로고침]           │
├─────────────────────────────────────────────────────────────────────┤
│ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────┐ │
│ │ 👤 신규 가입  │ │ 📝 워십세트  │ │ 🎵 신규 곡   │ │ 💬 포스트 │ │
│ │     12       │ │      8       │ │     24       │ │    15     │ │
│ │  ↑5 (+71%)   │ │  ↓2 (-20%)   │ │  ↑8 (+50%)   │ │  → 0 (0%) │ │
│ │  vs 어제: 7  │ │  vs 어제: 10 │ │  vs 어제: 16 │ │  vs: 15   │ │
│ └───────────────┘ └───────────────┘ └───────────────┘ └───────────┘ │
│ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────┐ │
│ │ 🏘️ 커뮤니티  │ │ 👥 활성사용자 │ │ ❤️ 좋아요    │ │ 🔔 댓글   │ │
│ │     2        │ │     156      │ │     89       │ │    34     │ │
│ │  ↑1 (+100%)  │ │  ↑23 (+17%)  │ │  ↑12 (+16%)  │ │  ↑8 (+31%)│ │
│ │  vs 어제: 1  │ │  vs: 133     │ │  vs: 77      │ │  vs: 26   │ │
│ └───────────────┘ └───────────────┘ └───────────────┘ └───────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### 변화율 표시 스타일
- **증가**: 녹색 배경, ↑ 화살표, `text-emerald-600`
- **감소**: 빨간색 배경, ↓ 화살표, `text-red-600`
- **변화 없음**: 회색, → 화살표, `text-muted-foreground`

### 기간 선택기
```text
┌───────────────────────────────────┐
│ 기간 선택:  [오늘 ▼]              │
│             ├─ 오늘               │
│             ├─ 최근 7일           │
│             ├─ 이번 달            │
│             └─ 전년 동기 대비      │
└───────────────────────────────────┘
```

---

## 수정 파일 목록

| 파일 | 변경 내용 |
|------|----------|
| `src/components/admin/PeriodSelector.tsx` | 신규 - 기간 선택 드롭다운 |
| `src/components/admin/StatCardWithChange.tsx` | 신규 - 변화율 표시 통계 카드 |
| `src/components/admin/ActivityMetricsSection.tsx` | 신규 - 활동지표 섹션 컴포넌트 |
| `src/pages/AdminDashboard.tsx` | 수정 - 새 컴포넌트 통합 |

---

## 추가 고려사항

### 성능 최적화
- 기간별 쿼리 캐싱 (react-query의 staleTime 활용)
- 병렬 쿼리로 로딩 시간 최소화
- 오늘/7일 데이터는 5분마다 갱신, 월간/연간은 1시간마다

### 접근성
- 색맹 사용자를 위해 화살표 아이콘과 텍스트 함께 표시
- 스크린 리더용 aria-label 추가

### 향후 확장
- 그래프/차트 추가 (시간별 트렌드)
- CSV 내보내기 기능
- 목표 설정 및 달성률 표시
- 실시간 업데이트 (Supabase Realtime 활용)
