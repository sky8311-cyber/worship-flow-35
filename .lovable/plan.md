
# 대시보드 RSVP 및 일정 기능 개선

## 발견된 문제들

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ 문제 1: RSVP 다이얼로그가 사이드바를 열기 전까지 표시되지 않음               │
│    → Dashboard.tsx의 RSVP 체크가 communityIds에 의존하지만,                 │
│      UpcomingEventsWidget에서 별도로 communityIds를 가져오며                │
│      초기화 타이밍 불일치 발생                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ 문제 2: 사이드바에서 캘린더 일정 클릭 시 모든 사용자에게 수정 화면 표시       │
│    → UpcomingEventsWidget에서 캘린더 이벤트 클릭 시                         │
│      handleEventClick 로직이 없이 무조건 수정 다이얼로그 열림                │
│    → 일반 멤버: 상세 내용 + 참석자 명단 보기                                 │
│    → 관리자: 수정 다이얼로그 보기 (현재대로)                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ 문제 3: 지나간 일정과 다가올 일정 구분 표시 필요                             │
│    → 지나간 일정: 희미하게 표시 (WorshipSet History 스타일)                  │
│    → 다가올 일정: 카운트다운 배지 표시 (WorshipSet처럼)                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ 문제 4: 일정 삭제 버튼 필요 (canManage 권한자용)                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 해결 방안

### 1. RSVP 다이얼로그 타이밍 문제 수정 (src/pages/Dashboard.tsx)

**문제 원인:** RSVP 체크 useEffect가 `isDashboardReady`에만 의존하지만, 실제로는 `communitiesData`가 로드된 후에 실행되어야 함

**수정 내용:**
```typescript
// 기존: community_members를 다시 조회
const { data: memberships } = await supabase
  .from("community_members")
  .select("community_id")
  .eq("user_id", user.id);

// 변경: 이미 로드된 communityIds 활용
useEffect(() => {
  const checkPendingRsvp = async () => {
    if (!user || !isDashboardReady) return;
    if (showRoleDialog || showInvitedDialog || showTeamMemberDialog) return;
    if (communityIds.length === 0) return;  // 커뮤니티 데이터 확인

    const today = new Date().toISOString().split("T")[0];
    
    // 이미 로드된 communityIds 사용
    const { data: events } = await supabase
      .from("calendar_events")
      .select("id")
      .in("community_id", communityIds)  // 변경
      .eq("rsvp_enabled", true)
      .gte("event_date", today);

    // ... 나머지 동일
  };

  const timer = setTimeout(checkPendingRsvp, 500);  // 타이밍 조정
  return () => clearTimeout(timer);
}, [user, isDashboardReady, showRoleDialog, showInvitedDialog, showTeamMemberDialog, communityIds]);  // communityIds 의존성 추가
```

---

### 2. 일반 멤버용 일정 상세 보기 다이얼로그 생성

**새 파일: src/components/community/EventDetailDialog.tsx**

```typescript
interface EventDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CalendarEvent | null;
}

export function EventDetailDialog({ open, onOpenChange, event }: EventDetailDialogProps) {
  // 일정 상세 정보 표시
  // - 제목, 날짜/시간, 장소, 설명
  // - RSVP가 활성화된 경우 참석자 명단 표시
  // - 내 참석 여부 변경 가능 (RSVP 활성화 시)
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{event?.title}</DialogTitle>
        </DialogHeader>
        
        {/* 일정 상세 정보 */}
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm">
              📅 {format(parseLocalDate(event.event_date), "yyyy년 M월 d일 (eee)")}
              {event.start_time && ` ${event.start_time}`}
            </p>
            {event.location && (
              <p className="text-sm">📍 {event.location}</p>
            )}
            {event.description && (
              <p className="text-sm text-muted-foreground">{event.description}</p>
            )}
          </div>
          
          {/* RSVP 섹션 - rsvp_enabled일 때만 */}
          {event?.rsvp_enabled && (
            <div className="border-t pt-4">
              {/* 내 참석 여부 버튼 */}
              {/* 참석자/불참자 명단 */}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

### 3. UpcomingEventsWidget에서 권한별 클릭 처리 (src/components/dashboard/UpcomingEventsWidget.tsx)

**변경 내용:**
1. EventDetailDialog import 및 state 추가
2. 캘린더 이벤트 클릭 시 권한 체크
3. 삭제 버튼 추가 (canManage 권한자용)

```typescript
// State 추가
const [detailDialogOpen, setDetailDialogOpen] = useState(false);
const [selectedEventForDetail, setSelectedEventForDetail] = useState<any>(null);

// 이벤트 클릭 핸들러 수정
const handleCalendarEventClick = (event: any, e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  
  const canManageEvent = isAdmin || (isCommunityLeader && event.created_by === currentUserId);
  
  if (canManageEvent) {
    // 관리자: 수정 다이얼로그
    setSelectedEventId(event.id);
    setEventDialogOpen(true);
  } else {
    // 일반 멤버: 상세 보기 다이얼로그
    setSelectedEventForDetail(event);
    setDetailDialogOpen(true);
  }
};

// onClick 수정 (calendar_event 타입)
onClick: (e) => handleCalendarEventClick(event, e),
```

---

### 4. 지나간 일정과 다가올 일정 시각적 구분 (CommunityRecurringCalendarTab)

**변경 내용:**
1. 과거/미래 일정 모두 표시하도록 쿼리 수정
2. 지나간 일정: 희미하게 표시 + "지난 일정" 배지
3. 다가올 일정: 카운트다운 배지 표시

```typescript
// 쿼리 수정 - 과거 일정도 포함 (최근 30일)
const { data: calendarEvents = [], isLoading: eventsLoading } = useQuery({
  queryKey: ["community-calendar-events", communityId],
  queryFn: async () => {
    const now = new Date();
    const past30Days = new Date(now);
    past30Days.setDate(past30Days.getDate() - 30);
    
    const pastDate = `${past30Days.getFullYear()}-${String(past30Days.getMonth() + 1).padStart(2, '0')}-${String(past30Days.getDate()).padStart(2, '0')}`;
    
    const { data, error } = await supabase
      .from("calendar_events")
      .select("*")
      .eq("community_id", communityId)
      .gte("event_date", pastDate)  // 최근 30일 포함
      .order("event_date", { ascending: true });
    
    if (error) throw error;
    return data || [];
  },
});

// 렌더링 시 스타일 분기
{calendarEvents.map((event) => {
  const isPast = isPastDate(event.event_date);
  const countdown = getCountdown(event.event_date, event.start_time);
  
  return (
    <div
      key={event.id}
      className={cn(
        "flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50",
        isPast && "opacity-60 bg-muted/30"  // 지나간 일정 스타일
      )}
      onClick={() => handleEventClick(event)}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={cn("font-medium truncate", isPast && "line-through text-muted-foreground")}>
            {event.title}
          </p>
          
          {/* 지나간 일정 배지 */}
          {isPast && (
            <Badge variant="outline" className="text-xs opacity-60">
              {t("calendarEvent.past") || "지난 일정"}
            </Badge>
          )}
          
          {/* 카운트다운 배지 (7일 이내 미래 일정) */}
          {!isPast && countdown.text && (
            <Badge className="text-xs bg-accent text-white hover:bg-accent">
              {countdown.text}
            </Badge>
          )}
          
          {event.rsvp_enabled && (
            <Badge variant="outline" className="text-xs">
              <Users className="h-3 w-3 mr-1" />
              RSVP
            </Badge>
          )}
        </div>
        {/* ... 나머지 내용 */}
      </div>
      
      {/* 관리 메뉴 (수정/삭제) */}
      {canManage && (
        <DropdownMenu>
          {/* ... 기존 메뉴에 삭제 버튼 포함 */}
        </DropdownMenu>
      )}
    </div>
  );
})}
```

---

### 5. UpcomingEventsWidget에 카운트다운 배지 추가

**변경 내용:**
```typescript
import { getCountdown } from "@/lib/countdownHelper";

// 렌더링 시 카운트다운 추가
{unifiedEvents.map((event) => {
  const isPast = isPastDate(event.date);
  const countdown = getCountdown(event.date);  // 추가
  
  return (
    <div key={event.id}>
      {/* ... 기존 내용 */}
      
      <div className="flex items-center gap-2 flex-wrap">
        {/* 기존 배지들 */}
        {event.badgeLabel && (
          <Badge variant="secondary" className="text-xs">
            {event.badgeLabel}
          </Badge>
        )}
        
        {/* 카운트다운 배지 추가 */}
        {!isPast && countdown.text && (
          <Badge className="text-xs bg-accent text-white hover:bg-accent">
            {countdown.text}
          </Badge>
        )}
      </div>
    </div>
  );
})}
```

---

## 파일 수정 요약

| 파일 | 변경 내용 |
|------|----------|
| `src/pages/Dashboard.tsx` | RSVP 체크 로직 수정 - communityIds 의존성 추가 |
| `src/components/community/EventDetailDialog.tsx` | **새 파일** - 일반 멤버용 일정 상세 보기 다이얼로그 |
| `src/components/dashboard/UpcomingEventsWidget.tsx` | 권한별 클릭 처리, 카운트다운 배지, 상세 보기 다이얼로그 연동 |
| `src/components/community/CommunityRecurringCalendarTab.tsx` | 과거 일정 포함, 카운트다운 배지, 시각적 구분 |
| `src/lib/translations.ts` | 번역 키 추가 (calendarEvent.past 등) |

---

## 시각화

```text
캘린더 일정 클릭 시 동작 분기:
┌─────────────────────────────────────────────────────────────────────────────┐
│ 사용자가 캘린더 일정 클릭                                                    │
│    ↓                                                                        │
│ 권한 체크: isAdmin || (isCommunityLeader && event.created_by === userId)    │
│    ↓                                                                        │
│ ┌──────────────────────┐    ┌──────────────────────────────────────────────┐│
│ │ 관리자 (canManage)   │    │ 일반 멤버                                     ││
│ │    ↓                 │    │    ↓                                         ││
│ │ 수정 다이얼로그 열기  │    │ 상세 보기 다이얼로그 열기                      ││
│ │ (CalendarEventDialog)│    │ (EventDetailDialog)                          ││
│ │                      │    │    - 일정 정보 표시                           ││
│ │                      │    │    - RSVP 응답 가능                           ││
│ │                      │    │    - 참석자 명단 확인                          ││
│ └──────────────────────┘    └──────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘

일정 목록 시각적 구분:
┌─────────────────────────────────────────────────────────────────────────────┐
│ 지나간 일정 (opacity-60, bg-muted/30)                                       │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ [1/20] ̶월̶간̶ ̶하̶기̶오̶스̶                              [지난 일정]           │ │
│ │        2026년 1월 20일 (월)                                             │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ 다가올 일정 (정상 스타일 + 카운트다운 배지)                                   │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ [1/25] 주일 예배 리허설            [RSVP] [3d to go]         [수정][삭제]│ │
│ │        2026년 1월 25일 (토) 14:00                                       │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ [1/26] 주일 예배                   [RSVP] [4d to go]         [수정][삭제]│ │
│ │        2026년 1월 26일 (일) 11:00                                       │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```
