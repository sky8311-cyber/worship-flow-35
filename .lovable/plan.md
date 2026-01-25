

# 앱 히스토리 업데이트 및 버그 픽스 탭 추가

## 요청 사항 정리

1. **마지막 앱 히스토리(2026-01-10) 이후 주요 업데이트 정리** - 관리자 페이지에 토글 OFF 상태로 추가
2. **AppHistory 페이지에 버그 픽스 탭 추가** - 전체 업데이트 히스토리 (기능 + 버그 픽스) 나열

---

## Part 1: 새 마일스톤 데이터 추가 (2026-01-10 이후 업데이트)

### 추가할 마일스톤 목록 (토글 OFF 상태로 생성)

| 날짜 | 카테고리 | 제목 (KO/EN) | 설명 |
|------|----------|--------------|------|
| 2026-01-25 | update | 플랫폼 속도 최적화 / Platform Speed Optimization | N+1 쿼리 해결, 배치 쿼리 패턴, 캐시 최적화로 체감 속도 향상 |
| 2026-01-25 | feature | 서버 집계 리더보드 / Server-side Leaderboard | DB RPC로 리더보드 집계 최적화, 데이터 전송량 80% 감소 |
| 2026-01-24 | feature | 웹 푸시 알림 / Web Push Notifications | 브라우저 닫아도 일정, 워십세트, 커뮤니티 알림 수신 |
| 2026-01-23 | update | 이벤트 위젯 UI 개선 / Event Widget UI Improvement | 메뉴 버튼 겹침 해결, 2줄 레이아웃 통일 |
| 2026-01-22 | bugfix | 시드 레벨업 중복 알림 수정 / Seed Level-up Duplicate Fix | 레벨업 알림 1회만 표시, 트랜잭션 동기화 |
| 2026-01-21 | bugfix | 생일 쿼리 N+1 해결 / Birthday Query N+1 Fix | 피드 로딩 속도 개선 |
| 2026-01-20 | feature | 일정 상세 다이얼로그 / Event Detail Dialog | 일반 멤버도 일정 상세 및 RSVP 목록 확인 가능 |
| 2026-01-19 | feature | 팀 로테이션 관리 / Team Rotation Management | 커뮤니티별 팀 로테이션 스케줄 설정 |

---

## Part 2: DB 스키마 - bugfix 카테고리 추가

현재 `category` 컬럼은 text 타입으로 `launch`, `feature`, `milestone`, `update` 값을 사용합니다.

**새 카테고리 추가**: `bugfix` (별도 마이그레이션 불필요 - text 타입이므로 바로 사용 가능)

---

## Part 3: MilestoneDialog 카테고리 옵션 추가

**파일: `src/components/admin/MilestoneDialog.tsx`**

```typescript
const categories = [
  { value: "launch", label: language === "ko" ? "출시" : "Launch" },
  { value: "feature", label: language === "ko" ? "기능" : "Feature" },
  { value: "milestone", label: language === "ko" ? "마일스톤" : "Milestone" },
  { value: "update", label: language === "ko" ? "업데이트" : "Update" },
  { value: "bugfix", label: language === "ko" ? "버그수정" : "Bug Fix" }, // 추가
];
```

---

## Part 4: AdminHistory 버그픽스 카테고리 지원

**파일: `src/pages/AdminHistory.tsx`**

```text
┌──────────────────────────────────────────────────────────────┐
│ 플랫폼 히스토리 관리                         [+ 마일스톤 추가] │
├──────────────────────────────────────────────────────────────┤
│ [전체] [출시] [기능] [마일스톤] [업데이트] [버그수정] 🔍검색  │
├──────────────────────────────────────────────────────────────┤
│ 날짜       │ 카테고리   │ 제목                │ 공개 │ 액션  │
│ 2026-01-25 │ 🔧 버그수정│ 시드 레벨업 수정    │ [ ]  │ ✏️ 🗑️│
│ 2026-01-24 │ ✨ 기능    │ 웹 푸시 알림        │ [ ]  │ ✏️ 🗑️│
│ ...        │ ...       │ ...                 │ ...  │ ...  │
└──────────────────────────────────────────────────────────────┘
```

**변경 내용**:
1. `CategoryFilter` 타입에 `"bugfix"` 추가
2. `categories` 배열에 `"bugfix"` 추가
3. `getCategoryIcon`에 `Wrench` 아이콘 추가
4. `getCategoryLabel`에 버그수정 라벨 추가

---

## Part 5: AppHistory 탭 구조 추가

**파일: `src/pages/AppHistory.tsx`**

```text
┌──────────────────────────────────────────────────────────────┐
│              K-Worship 히스토리                               │
│              우리의 여정                                      │
├──────────────────────────────────────────────────────────────┤
│       [주요 기능]           [전체 기록]                       │
├──────────────────────────────────────────────────────────────┤
│ (현재 타임라인 UI 유지)     (버그 픽스 포함 전체 목록)        │
│                                                              │
│ ● 2026-01-10 공개 밴드뷰    │ ● 2026-01-25 속도 최적화      │
│ ● 2026-01-09 뮤직 플레이어  │ ● 2026-01-24 푸시 알림        │
│ ● 2026-01-08 정식 출시      │ 🔧 2026-01-22 레벨업 버그 수정│
│                             │ ...                           │
└──────────────────────────────────────────────────────────────┘
```

**탭 구성**:
- **주요 기능 (Highlights)**: 기존 로직 유지 - `is_visible: true` 필터
- **전체 기록 (All Updates)**: 모든 기록 표시 - `is_visible` 무시, bugfix 포함

**UI 변경**:
1. `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` 임포트
2. 헤더 아래에 탭 네비게이션 추가
3. 탭별 필터링 로직 구현
4. bugfix 아이콘 및 스타일 추가

---

## Part 6: AppHistory 아이콘 및 스타일 확장

```typescript
import { Wrench } from "lucide-react"; // 추가

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "launch": return <Rocket className="h-5 w-5" />;
    case "feature": return <Sparkles className="h-5 w-5" />;
    case "milestone": return <Flag className="h-5 w-5" />;
    case "update": return <ArrowUpCircle className="h-5 w-5" />;
    case "bugfix": return <Wrench className="h-5 w-5" />; // 추가
    default: return <Flag className="h-5 w-5" />;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case "launch": return "bg-green-500 text-white";
    case "feature": return "bg-blue-500 text-white";
    case "milestone": return "bg-purple-500 text-white";
    case "update": return "bg-orange-500 text-white";
    case "bugfix": return "bg-red-500 text-white"; // 추가
    default: return "bg-muted text-muted-foreground";
  }
};
```

---

## 수정 파일 목록

| 파일 | 변경 내용 |
|------|----------|
| `src/components/admin/MilestoneDialog.tsx` | bugfix 카테고리 옵션 추가 |
| `src/pages/AdminHistory.tsx` | bugfix 필터, 아이콘, 라벨 추가 |
| `src/pages/AppHistory.tsx` | 탭 구조 (주요 기능 / 전체 기록), bugfix 스타일 추가 |
| DB Insert | 2026-01-10 이후 마일스톤 8건 추가 (is_visible: false) |

---

## 예상 결과

1. **관리자 페이지**: 새 업데이트 항목들이 토글 OFF 상태로 표시됨 → 원하는 항목만 ON
2. **앱 히스토리 페이지**: 
   - "주요 기능" 탭: 기존과 동일 (공개 마일스톤만)
   - "전체 기록" 탭: 버그 픽스 포함 전체 히스토리

