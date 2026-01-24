

# 사이드바 일정 필터링 및 공동체 일정 탭 개선

## 문제 요약

```text
문제 1: MobileSidebarDrawer의 upcoming-sets 쿼리
┌─────────────────────────────────────────────────────────────┐
│ 현재: 모든 published 세트 조회 (공동체 필터 없음)             │
│       → 다른 유저의 워십세트가 내 사이드바에 표시됨             │
│                                                              │
│ 수정: communityIds 필터 추가                                 │
│       → 내가 속한 공동체의 세트만 표시                         │
└─────────────────────────────────────────────────────────────┘

문제 2: CommunityManagement > 일정 탭
┌─────────────────────────────────────────────────────────────┐
│ 현재: 반복 일정(recurring_schedules)만 표시                   │
│       "새 일정 만들기" 버튼 없음                              │
│                                                              │
│ 수정: 일회성 일정(calendar_events) 목록 + 생성 버튼 추가       │
└─────────────────────────────────────────────────────────────┘
```

---

## 수정 파일

### 1. src/components/layout/MobileSidebarDrawer.tsx

**문제**: 공동체 필터 없이 모든 published 세트 조회

**변경 내용:**
- `upcoming-sets` 쿼리에 `communityIds` 필터 추가
- Dashboard.tsx와 동일한 역할 기반 필터링 적용

**수정 위치:** lines 127-154

**수정 전:**
```tsx
const { data: upcomingSets = [] } = useQuery({
  queryKey: ["upcoming-sets", user?.id],
  queryFn: async () => {
    if (!user) return [];

    const today = new Date().toISOString().split("T")[0];

    let query = supabase
      .from("service_sets")
      .select("*")
      .gte("date", today)
      .order("date", { ascending: true });

    if (!isAdmin) {
      if (isCommunityLeaderInAnyCommunity) {
        query = query.or(`status.eq.published,created_by.eq.${user.id}`);
      } else {
        query = query.eq("status", "published");
      }
    }

    const { data } = await query.limit(4);
    return data || [];
  },
  ...
});
```

**수정 후:**
```tsx
const { data: upcomingSets = [] } = useQuery({
  queryKey: ["upcoming-sets-sidebar", user?.id, communityIds, isAdmin, isCommunityLeaderInAnyCommunity],
  queryFn: async () => {
    if (!user || communityIds.length === 0) return [];

    const now = new Date();
    const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    let query = supabase
      .from("service_sets")
      .select("*")
      .in("community_id", communityIds)  // 내 공동체로 제한
      .gte("date", localToday)
      .order("date", { ascending: true });

    // 역할 기반 필터링
    if (isAdmin) {
      // Admin: 모든 상태 표시
    } else if (isCommunityLeaderInAnyCommunity) {
      // 리더: 내 draft + published
      query = query.or(`status.eq.published,created_by.eq.${user.id}`);
    } else {
      // 일반 멤버: published만
      query = query.eq("status", "published");
    }

    const { data } = await query.limit(4);
    return data || [];
  },
  enabled: !!user && communityIds.length > 0,  // communityIds 로딩 후 실행
  staleTime: 0,
  refetchOnWindowFocus: true,
});
```

---

### 2. src/components/community/CommunityRecurringCalendarTab.tsx → 확장 또는 분리

**변경 옵션:** 공동체 관리의 "일정" 탭에 일회성 캘린더 이벤트 섹션 추가

**구현 방식:**
1. 기존 `CommunityRecurringCalendarTab` 상단에 캘린더 이벤트 섹션 추가
2. "새 일정 만들기" 버튼 + `CalendarEventDialog` 연동

**추가할 섹션 구조:**

```tsx
// 기존 반복 일정 위에 추가

// State 추가
const [eventDialogOpen, setEventDialogOpen] = useState(false);
const [selectedEventId, setSelectedEventId] = useState<string | undefined>();

// 캘린더 이벤트 조회
const { data: calendarEvents } = useQuery({
  queryKey: ["community-calendar-events", communityId],
  queryFn: async () => {
    const now = new Date();
    const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    const { data } = await supabase
      .from("calendar_events")
      .select("*")
      .eq("community_id", communityId)
      .gte("event_date", localToday)
      .order("event_date", { ascending: true });
    return data || [];
  },
});
```

**UI 구조:**

```tsx
<div className="space-y-6">
  {/* 일회성 일정 섹션 */}
  <Card>
    <CardHeader>
      <div className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {t("calendarEvent.upcomingEvents")}
        </CardTitle>
        <Button size="sm" onClick={() => setEventDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t("calendarEvent.addEvent")}
        </Button>
      </div>
    </CardHeader>
    <CardContent>
      {calendarEvents?.length > 0 ? (
        <div className="space-y-3">
          {calendarEvents.map(event => (
            <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">{event.title}</p>
                <p className="text-sm text-muted-foreground">
                  {format(parseDate(event.event_date), "yyyy년 M월 d일")}
                  {event.start_time && ` ${event.start_time}`}
                </p>
              </div>
              <DropdownMenu>
                {/* 수정/삭제 메뉴 */}
              </DropdownMenu>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-center py-4">
          {t("calendarEvent.noUpcoming")}
        </p>
      )}
    </CardContent>
  </Card>

  {/* 기존 반복 일정 섹션 */}
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <CalendarClock className="h-5 w-5" />
        {t("recurringCalendar.title")}
      </CardTitle>
      ...
    </CardHeader>
    ...
  </Card>
</div>

{/* CalendarEventDialog */}
<CalendarEventDialog
  open={eventDialogOpen}
  onOpenChange={setEventDialogOpen}
  communityId={communityId}
  eventId={selectedEventId}
  onSuccess={() => {
    setEventDialogOpen(false);
    setSelectedEventId(undefined);
  }}
/>
```

---

### 3. src/lib/translations.ts

**추가할 번역 키:**

| 키 | 영어 | 한국어 |
|----|------|--------|
| `calendarEvent.upcomingEvents` | Upcoming Events | 다가오는 일정 |
| `calendarEvent.addEvent` | Add Event | 일정 추가 |
| `calendarEvent.noUpcoming` | No upcoming events | 예정된 일정이 없습니다 |
| `calendarEvent.edit` | Edit | 수정 |

---

## Import 추가

**CommunityRecurringCalendarTab.tsx:**
```tsx
import { useState } from "react";
import { CalendarEventDialog } from "@/components/CalendarEventDialog";
import { Calendar, Plus, MoreHorizontal, Trash2, Pencil } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
```

---

## 개선 효과

| 영역 | 기존 | 개선 |
|------|------|------|
| 사이드바 일정 | 다른 공동체 세트도 표시 | 내 공동체만 표시 |
| 공동체 관리 > 일정 | 반복 일정만 표시 | 일회성 + 반복 일정 모두 표시 |
| 일정 생성 | 사이드바에서만 가능 | 공동체 관리에서도 가능 |

---

## 파일 변경 요약

| 파일 | 변경 내용 |
|------|----------|
| `src/components/layout/MobileSidebarDrawer.tsx` | communityIds 필터 추가, 쿼리키 분리 |
| `src/components/community/CommunityRecurringCalendarTab.tsx` | 일회성 일정 섹션 + 생성 버튼 추가 |
| `src/lib/translations.ts` | 4개 번역 키 추가 |

