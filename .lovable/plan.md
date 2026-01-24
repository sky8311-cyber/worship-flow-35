

# 공동체 페이지 - 현재 공동체 식별 개선

## 문제 분석

현재 공동체 관리 페이지(`/community/:id`)에서:
1. 헤더에 "공동체 관리"라는 일반 제목만 표시됨
2. 사이드바의 공동체 목록에서 현재 페이지의 공동체가 하이라이트되지 않음
3. 여러 공동체에 소속된 경우 어느 공동체를 관리 중인지 혼란스러움

```text
현재:
┌─────────────────────────────────────┐
│  공동체 관리                         │  ← 어느 공동체인지 알 수 없음
├─────────────────────────────────────┤
│  [멤버] [로테이션] [설정]            │
└─────────────────────────────────────┘

개선 후:
┌─────────────────────────────────────┐
│  ┌───┐                              │
│  │🏠│ 하나교회 예배팀                │  ← 공동체 아바타 + 이름
│  └───┘ 공동체 관리                   │
├─────────────────────────────────────┤
│  [멤버] [로테이션] [설정]            │
└─────────────────────────────────────┘
```

---

## 수정 파일

### 1. src/pages/CommunityManagement.tsx

**변경 내용:**
- 헤더 영역에 공동체 아바타와 이름 표시
- 공동체 이름을 눈에 띄게 표시

**수정 위치:** lines 781-788

**수정 전:**
```tsx
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
  <h1 className="text-3xl font-bold">{t("community.manage")}</h1>
  {!canManage && (
    <Badge variant="outline" className="text-sm">
      {t("community.readOnlyMode")}
    </Badge>
  )}
</div>
```

**수정 후:**
```tsx
<div className="flex flex-col gap-4 mb-8">
  {/* 공동체 아바타 + 이름 */}
  <div className="flex items-center gap-4">
    <Avatar className="w-14 h-14 border-2 border-primary/20">
      <AvatarImage src={community?.avatar_url || undefined} />
      <AvatarFallback className="text-lg bg-primary/10 text-primary">
        {community?.name?.[0] || "?"}
      </AvatarFallback>
    </Avatar>
    <div className="flex-1 min-w-0">
      <h1 className="text-2xl sm:text-3xl font-bold truncate">
        {community?.name}
      </h1>
      <p className="text-sm text-muted-foreground flex items-center gap-2">
        {t("community.manage")}
        {!canManage && (
          <Badge variant="outline" className="text-xs">
            {t("community.readOnlyMode")}
          </Badge>
        )}
      </p>
    </div>
  </div>
</div>
```

---

### 2. src/components/dashboard/CommunitiesSidebarList.tsx

**변경 내용:**
- `currentCommunityId` prop 추가
- 현재 공동체 하이라이트 스타일 적용

**수정 후 interface:**
```tsx
interface CommunitiesSidebarListProps {
  communities: Community[];
  maxVisible?: number;
  currentCommunityId?: string;  // 신규 추가
}
```

**수정 후 Link 스타일:**
```tsx
<Link
  key={community.id}
  to={`/community/${community.id}`}
  className={cn(
    "flex items-center gap-3 p-2 rounded-lg transition-colors group",
    community.id === currentCommunityId
      ? "bg-primary/10 border border-primary/30"  // 현재 공동체 하이라이트
      : "hover:bg-accent",
    isInactive && "opacity-70"
  )}
>
  ...
</Link>
```

---

### 3. src/components/layout/MobileSidebarDrawer.tsx

**변경 내용:**
- 현재 route에서 community ID 추출
- `CommunitiesSidebarList`에 `currentCommunityId` 전달

```tsx
import { useParams } from "react-router-dom";

// 컴포넌트 내부
const { id: currentCommunityId } = useParams();

// CommunitiesSidebarList 렌더링 시
<CommunitiesSidebarList 
  communities={communitiesWithCounts} 
  currentCommunityId={currentCommunityId}
/>
```

---

### 4. src/pages/Dashboard.tsx

**변경 내용:**
- 대시보드에서는 `currentCommunityId`를 전달하지 않음 (undefined)
- 별도 수정 불필요 (props가 optional이므로)

---

## 추가 Import

**CommunitiesSidebarList.tsx:**
```tsx
import { cn } from "@/lib/utils";  // 조건부 클래스 결합용
```

**MobileSidebarDrawer.tsx:**
```tsx
import { useParams } from "react-router-dom";
```

---

## UI 개선 효과

| 위치 | 기존 | 개선 |
|------|------|------|
| 공동체 관리 헤더 | "공동체 관리" 일반 제목 | 공동체 아바타 + 이름 + 관리 레이블 |
| 사이드바 목록 | 모든 항목 동일 스타일 | 현재 공동체 하이라이트 (primary 테두리) |

---

## 파일 변경 요약

| 파일 | 변경 내용 |
|------|----------|
| `src/pages/CommunityManagement.tsx` | 헤더에 공동체 아바타/이름 표시 |
| `src/components/dashboard/CommunitiesSidebarList.tsx` | currentCommunityId prop 추가, 하이라이트 스타일 |
| `src/components/layout/MobileSidebarDrawer.tsx` | useParams로 현재 공동체 ID 전달 |

