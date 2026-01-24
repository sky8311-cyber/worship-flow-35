

# 공동체 캘린더 뷰 + RSVP 기능 + 팀 로테이션 설정 (수정된 플랜)

## 요청 변경사항 반영

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ 변경 1: "다음에 보기" 로직 수정                                               │
│    → 24시간 후가 아닌, 대시보드 접속할 때마다 다시 표시                         │
│    → remind_later_until 제거, 세션 기반 처리                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ 변경 2: RSVP 참석자 명단 표시                                                │
│    → 대시보드 RSVP 다이얼로그에서 몇 명/누가 참석/불참하는지 표시               │
│    → 일정 탭에서 일정 클릭 시에도 참석자 명단 확인 가능                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ 변경 3: 캘린더 뷰 권한 확인                                                  │
│    → 공동체에 속한 사람만 볼 수 있음 (RLS로 이미 보장)                         │
│    → 일정 추가/수정은 canManage 권한자 (admin, owner, community_leader)       │
├─────────────────────────────────────────────────────────────────────────────┤
│ 변경 4: 일정 탭 스케줄 설정 권한 확인                                         │
│    → 현재 CommunityManagement에서 canManage 권한으로 이미 제한됨              │
│    → canManage = isAdmin || isOwner || community_leader 역할                │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 데이터베이스 변경

### 1. calendar_events 테이블 컬럼 추가

```sql
-- RSVP 기능을 위한 컬럼 추가
ALTER TABLE public.calendar_events 
ADD COLUMN IF NOT EXISTS rsvp_enabled BOOLEAN DEFAULT false;
```

### 2. 새 테이블: event_rsvp_responses

```sql
CREATE TABLE IF NOT EXISTS public.event_rsvp_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  response TEXT NOT NULL CHECK (response IN ('attending', 'not_attending')),
  responded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- RLS 정책
ALTER TABLE public.event_rsvp_responses ENABLE ROW LEVEL SECURITY;

-- 본인 RSVP 관리
CREATE POLICY "Users can manage their own RSVP"
ON public.event_rsvp_responses
FOR ALL
USING (auth.uid() = user_id);

-- 공동체 멤버는 같은 공동체 이벤트의 RSVP 명단 조회 가능
CREATE POLICY "Community members can view RSVPs"
ON public.event_rsvp_responses
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM calendar_events ce
  JOIN community_members cm ON cm.community_id = ce.community_id
  WHERE ce.id = event_rsvp_responses.event_id
  AND cm.user_id = auth.uid()
));
```

### 3. platform_feature_flags 테이블에 팀 로테이션 플래그 추가

```sql
INSERT INTO public.platform_feature_flags (key, enabled)
VALUES ('team_rotation_enabled', false)
ON CONFLICT (key) DO NOTHING;
```

---

## 파일 수정

### 1. src/hooks/useAppSettings.ts

**변경 내용:** Team Rotation 플래그 추가

```typescript
interface FeatureFlags {
  // ... 기존 플래그
  team_rotation_enabled: boolean;
}

const DEFAULT_FLAGS: FeatureFlags = {
  // ... 기존
  team_rotation_enabled: false,
};

return {
  // ... 기존
  isTeamRotationEnabled: !isLoading && (flags?.team_rotation_enabled ?? false),
  toggleTeamRotation: () => toggleFlag("team_rotation_enabled"),
};
```

---

### 2. src/pages/AdminDashboard.tsx

**변경 내용:** 플랫폼 설정에 Team Rotation 토글 추가

```tsx
{/* Separator 아래에 추가 */}
<div className="flex items-center justify-between">
  <div className="space-y-0.5">
    <Label className="text-base">
      {language === "ko" ? "팀 로테이션" : "Team Rotation"}
    </Label>
    <p className="text-sm text-muted-foreground">
      {language === "ko" 
        ? "공동체 팀 로테이션 관리 기능 활성화"
        : "Enable team rotation management for communities"}
    </p>
  </div>
  <Switch
    checked={isTeamRotationEnabled}
    onCheckedChange={toggleTeamRotation}
    disabled={isUpdating}
  />
</div>
```

---

### 3. src/components/CalendarEventDialog.tsx

**변경 내용:** RSVP 토글 옵션 추가

```typescript
// Form 인터페이스 확장
interface CalendarEventForm {
  // ... 기존 필드
  rsvp_enabled: boolean;
}

// defaultValues 추가
defaultValues: {
  // ...
  rsvp_enabled: false,
}
```

**UI 추가 (Notification Settings 섹션 아래):**

```tsx
{/* RSVP Settings */}
<div className="space-y-4 border-t pt-4">
  <h4 className="font-medium">{t("calendarEvent.rsvpSettings")}</h4>
  
  <div className="flex items-center justify-between">
    <div className="space-y-0.5">
      <Label htmlFor="rsvp_enabled">{t("calendarEvent.enableRsvp")}</Label>
      <p className="text-sm text-muted-foreground">
        {t("calendarEvent.enableRsvpDesc")}
      </p>
    </div>
    <Switch
      id="rsvp_enabled"
      checked={rsvpEnabled}
      onCheckedChange={(checked) => setValue("rsvp_enabled", checked)}
    />
  </div>
</div>
```

---

### 4. 새 파일: src/components/community/CommunityCalendarView.tsx

**월간/주간 캘린더 뷰 컴포넌트**

```typescript
interface CommunityCalendarViewProps {
  communityId: string;
  events: any[];
  onEventClick?: (event: any) => void;
  canManage: boolean;  // 권한에 따라 클릭 동작 제어
}

export function CommunityCalendarView({ 
  communityId, 
  events, 
  onEventClick,
  canManage 
}: CommunityCalendarViewProps)
```

**주요 기능:**
- 월간/주간 뷰 토글 (Tabs)
- date-fns로 달력 날짜 그리드 생성
- 각 날짜에 해당하는 이벤트 표시
- 이벤트 클릭 시 상세 다이얼로그 열기

---

### 5. 새 파일: src/components/community/EventRsvpListDialog.tsx

**RSVP 참석자 명단 다이얼로그**

```typescript
interface EventRsvpListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CalendarEvent;
}

export function EventRsvpListDialog({ open, onOpenChange, event }: EventRsvpListDialogProps) {
  // RSVP 응답 목록 조회
  const { data: rsvpResponses = [] } = useQuery({
    queryKey: ["event-rsvp-responses", event.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("event_rsvp_responses")
        .select(`
          id,
          response,
          user_id,
          profiles:user_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq("event_id", event.id);
      return data || [];
    },
    enabled: open && !!event.id,
  });

  // 참석/불참 그룹으로 분류
  const attending = rsvpResponses.filter(r => r.response === "attending");
  const notAttending = rsvpResponses.filter(r => r.response === "not_attending");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{event.title}</DialogTitle>
          <DialogDescription>
            {format(parseLocalDate(event.event_date), "yyyy년 M월 d일")}
          </DialogDescription>
        </DialogHeader>

        {/* 참석자 명단 */}
        <div className="space-y-4">
          <div>
            <h4 className="font-medium flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              {t("rsvp.attending")} ({attending.length})
            </h4>
            {attending.map(r => (
              <div key={r.id} className="flex items-center gap-2 py-1">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={r.profiles?.avatar_url} />
                  <AvatarFallback>{r.profiles?.full_name?.[0]}</AvatarFallback>
                </Avatar>
                <span className="text-sm">{r.profiles?.full_name}</span>
              </div>
            ))}
          </div>

          <div>
            <h4 className="font-medium flex items-center gap-2 mb-2">
              <XCircle className="h-4 w-4 text-red-500" />
              {t("rsvp.notAttending")} ({notAttending.length})
            </h4>
            {notAttending.map(r => (
              <div key={r.id} className="flex items-center gap-2 py-1">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={r.profiles?.avatar_url} />
                  <AvatarFallback>{r.profiles?.full_name?.[0]}</AvatarFallback>
                </Avatar>
                <span className="text-sm">{r.profiles?.full_name}</span>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

### 6. src/components/community/CommunityRecurringCalendarTab.tsx 수정

**변경 내용:** 

1. 캘린더 뷰 추가 (목록/캘린더 전환)
2. 이벤트 클릭 시 참석자 명단 다이얼로그 표시
3. canManage prop 전달받아 권한 체크

```tsx
interface CommunityRecurringCalendarTabProps {
  communityId: string;
  canManage?: boolean;  // 추가: 권한 체크
}

export function CommunityRecurringCalendarTab({ 
  communityId, 
  canManage = false  // 기본값 false
}: CommunityRecurringCalendarTabProps)

// State 추가
const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
const [rsvpListOpen, setRsvpListOpen] = useState(false);
const [selectedEventForRsvp, setSelectedEventForRsvp] = useState<any>(null);

// 이벤트 클릭 핸들러 수정
const handleEventClick = (event: any) => {
  if (canManage) {
    // 관리자는 수정 다이얼로그 열기
    handleEditEvent(event.id);
  } else if (event.rsvp_enabled) {
    // 일반 멤버는 RSVP 명단 보기
    setSelectedEventForRsvp(event);
    setRsvpListOpen(true);
  }
};
```

**UI 구조:**

```tsx
<div className="space-y-6">
  {/* 뷰 모드 전환 탭 */}
  <div className="flex items-center justify-between">
    <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
      <TabsList className="h-9">
        <TabsTrigger value="list">{t("calendarEvent.listView")}</TabsTrigger>
        <TabsTrigger value="calendar">{t("calendarEvent.calendarView")}</TabsTrigger>
      </TabsList>
    </Tabs>
    
    {canManage && (
      <Button size="sm" onClick={handleAddEvent}>
        <Plus className="h-4 w-4 mr-2" />
        {t("calendarEvent.addEvent")}
      </Button>
    )}
  </div>

  {viewMode === "calendar" ? (
    <CommunityCalendarView
      communityId={communityId}
      events={calendarEvents}
      onEventClick={handleEventClick}
      canManage={canManage}
    />
  ) : (
    <>
      {/* 기존 일정 리스트 */}
      {/* 이벤트 항목에 RSVP 상태 배지 표시 */}
      {event.rsvp_enabled && (
        <Badge variant="outline" className="text-xs">
          <Users className="h-3 w-3 mr-1" />
          RSVP
        </Badge>
      )}
    </>
  )}

  {/* RSVP 명단 다이얼로그 */}
  {selectedEventForRsvp && (
    <EventRsvpListDialog
      open={rsvpListOpen}
      onOpenChange={setRsvpListOpen}
      event={selectedEventForRsvp}
    />
  )}
</div>
```

---

### 7. src/pages/CommunityManagement.tsx 수정

**변경 내용:** 일정 탭에 canManage prop 전달

**수정 위치:** TabsContent value="calendar" 부분

```tsx
<TabsContent value="calendar">
  <CommunityRecurringCalendarTab 
    communityId={id!} 
    canManage={canManage}  // 권한 전달
  />
</TabsContent>
```

---

### 8. 새 파일: src/components/dashboard/RsvpPromptDialog.tsx

**대시보드 RSVP 프롬프트 다이얼로그 (수정된 버전)**

```typescript
interface RsvpPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RsvpPromptDialog({ open, onOpenChange }: RsvpPromptDialogProps) {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const queryClient = useQueryClient();
  
  // 세션 기반 "다음에 보기" 상태 (localStorage 대신 state)
  // 대시보드 접속할 때마다 초기화됨
  const [dismissedEventIds, setDismissedEventIds] = useState<Set<string>>(new Set());

  // RSVP 필요한 이벤트 조회 (아직 응답하지 않은 것만)
  const { data: pendingRsvpEvents = [] } = useQuery({
    queryKey: ["pending-rsvp-events", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // 유저가 속한 공동체
      const { data: memberships } = await supabase
        .from("community_members")
        .select("community_id")
        .eq("user_id", user.id);

      if (!memberships || memberships.length === 0) return [];
      const communityIds = memberships.map(m => m.community_id);

      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      // RSVP 활성화된 미래 이벤트
      const { data: events } = await supabase
        .from("calendar_events")
        .select("*")
        .in("community_id", communityIds)
        .eq("rsvp_enabled", true)
        .gte("event_date", today)
        .order("event_date", { ascending: true });

      if (!events || events.length === 0) return [];

      // 이미 응답한 이벤트 필터링
      const { data: responses } = await supabase
        .from("event_rsvp_responses")
        .select("event_id")
        .eq("user_id", user.id)
        .in("event_id", events.map(e => e.id));

      const respondedEventIds = new Set(responses?.map(r => r.event_id) || []);

      // 아직 응답하지 않은 이벤트만 반환
      return events.filter(event => !respondedEventIds.has(event.id));
    },
    enabled: !!user && open,
  });

  // 세션 중 dismissed 이벤트 제외한 실제 표시할 이벤트
  const eventsToShow = pendingRsvpEvents.filter(e => !dismissedEventIds.has(e.id));

  const rsvpMutation = useMutation({
    mutationFn: async ({ eventId, response }: { eventId: string; response: string }) => {
      const { error } = await supabase
        .from("event_rsvp_responses")
        .upsert({
          event_id: eventId,
          user_id: user!.id,
          response,
          responded_at: new Date().toISOString(),
        }, {
          onConflict: "event_id,user_id",
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-rsvp-events"] });
      queryClient.invalidateQueries({ queryKey: ["event-rsvp-responses"] });
      toast.success(t("rsvp.responseSaved"));
    },
  });

  const handleResponse = (eventId: string, response: string) => {
    rsvpMutation.mutate({ eventId, response });
  };

  const handleRemindLater = (eventId: string) => {
    // 세션 동안만 숨김 (대시보드 다시 접속하면 다시 표시)
    setDismissedEventIds(prev => new Set([...prev, eventId]));
  };

  // 모든 이벤트 처리되면 자동 닫기
  if (open && eventsToShow.length === 0) {
    onOpenChange(false);
    return null;
  }

  return (
    <Dialog open={open && eventsToShow.length > 0} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t("rsvp.title")}
          </DialogTitle>
          <DialogDescription>
            {t("rsvp.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {eventsToShow.map((event) => (
            <RsvpEventCard 
              key={event.id}
              event={event}
              onResponse={handleResponse}
              onRemindLater={handleRemindLater}
              isPending={rsvpMutation.isPending}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// 개별 이벤트 카드 (참석자 수 표시 포함)
function RsvpEventCard({ event, onResponse, onRemindLater, isPending }) {
  const { t, language } = useTranslation();
  
  // 현재 RSVP 응답 수 조회
  const { data: rsvpStats } = useQuery({
    queryKey: ["event-rsvp-stats", event.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("event_rsvp_responses")
        .select("response")
        .eq("event_id", event.id);
      
      const attending = data?.filter(r => r.response === "attending").length || 0;
      const notAttending = data?.filter(r => r.response === "not_attending").length || 0;
      
      return { attending, notAttending };
    },
  });

  return (
    <div className="p-4 border rounded-lg space-y-3">
      <div>
        <h4 className="font-medium">{event.title}</h4>
        <p className="text-sm text-muted-foreground">
          {format(parseLocalDate(event.event_date), language === "ko" ? "yyyy년 M월 d일 (eee)" : "PPP")}
          {event.start_time && ` ${event.start_time.slice(0, 5)}`}
        </p>
        {event.location && (
          <p className="text-xs text-muted-foreground">📍 {event.location}</p>
        )}
      </div>
      
      {/* 현재 응답 현황 */}
      {rsvpStats && (rsvpStats.attending > 0 || rsvpStats.notAttending > 0) && (
        <div className="flex gap-4 text-sm">
          <span className="text-green-600">
            <CheckCircle className="h-3 w-3 inline mr-1" />
            {t("rsvp.attending")}: {rsvpStats.attending}
          </span>
          <span className="text-red-600">
            <XCircle className="h-3 w-3 inline mr-1" />
            {t("rsvp.notAttending")}: {rsvpStats.notAttending}
          </span>
        </div>
      )}
      
      <div className="flex gap-2 flex-wrap">
        <Button
          size="sm"
          onClick={() => onResponse(event.id, "attending")}
          disabled={isPending}
          className="flex-1"
        >
          <CheckCircle className="h-4 w-4 mr-1" />
          {t("rsvp.attending")}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onResponse(event.id, "not_attending")}
          disabled={isPending}
          className="flex-1"
        >
          <XCircle className="h-4 w-4 mr-1" />
          {t("rsvp.notAttending")}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onRemindLater(event.id)}
          disabled={isPending}
          className="flex-1"
        >
          <Clock className="h-4 w-4 mr-1" />
          {t("rsvp.remindLater")}
        </Button>
      </div>
    </div>
  );
}
```

---

### 9. src/pages/Dashboard.tsx 수정

**변경 내용:** RSVP 프롬프트 다이얼로그 통합

```tsx
// Import 추가
import { RsvpPromptDialog } from "@/components/dashboard/RsvpPromptDialog";

// State 추가
const [showRsvpDialog, setShowRsvpDialog] = useState(false);

// 대시보드 로딩 완료 후 RSVP 체크 (온보딩 다이얼로그 이후)
useEffect(() => {
  const checkPendingRsvp = async () => {
    if (!user || !isDashboardReady) return;
    if (showRoleDialog || showInvitedDialog || showTeamMemberDialog) return;

    // pending RSVP 이벤트가 있는지 간단히 체크
    const { data: memberships } = await supabase
      .from("community_members")
      .select("community_id")
      .eq("user_id", user.id);

    if (!memberships || memberships.length === 0) return;

    const today = new Date().toISOString().split("T")[0];
    
    // RSVP 활성화된 미래 이벤트 중 미응답 건 체크
    const { data: events } = await supabase
      .from("calendar_events")
      .select("id")
      .in("community_id", memberships.map(m => m.community_id))
      .eq("rsvp_enabled", true)
      .gte("event_date", today);

    if (!events || events.length === 0) return;

    const { data: responses } = await supabase
      .from("event_rsvp_responses")
      .select("event_id")
      .eq("user_id", user.id)
      .in("event_id", events.map(e => e.id));

    const respondedIds = new Set(responses?.map(r => r.event_id) || []);
    const hasPending = events.some(e => !respondedIds.has(e.id));

    if (hasPending) {
      setShowRsvpDialog(true);
    }
  };

  checkPendingRsvp();
}, [user, isDashboardReady, showRoleDialog, showInvitedDialog, showTeamMemberDialog]);

// JSX에 다이얼로그 추가
<RsvpPromptDialog
  open={showRsvpDialog}
  onOpenChange={setShowRsvpDialog}
/>
```

---

### 10. src/lib/translations.ts

**추가할 번역 키:**

```typescript
// calendarEvent 객체에 추가
calendarEvent: {
  // ... 기존
  calendarView: "Calendar View",
  listView: "List View",
  monthView: "Monthly",
  weekView: "Weekly",
  today: "Today",
  rsvpSettings: "RSVP Settings",
  enableRsvp: "Enable RSVP",
  enableRsvpDesc: "Allow team members to respond with attendance",
},

// 새 rsvp 객체 추가
rsvp: {
  title: "Attendance Check",
  description: "Please respond to the following upcoming events",
  attending: "Attending",
  notAttending: "Not Attending",
  remindLater: "Remind Later",
  responseSaved: "Response saved",
  attendees: "Attendees",
  viewAttendees: "View Attendees",
},

// 한국어
calendarEvent: {
  // ... 기존
  calendarView: "캘린더 보기",
  listView: "목록 보기",
  monthView: "월간",
  weekView: "주간",
  today: "오늘",
  rsvpSettings: "참석 확인 설정",
  enableRsvp: "참석 확인 받기",
  enableRsvpDesc: "팀 멤버들이 참석 여부를 응답할 수 있습니다",
},

rsvp: {
  title: "참석 여부 확인",
  description: "다가오는 일정에 참석 여부를 알려주세요",
  attending: "참석",
  notAttending: "불참",
  remindLater: "다음에 보기",
  responseSaved: "응답이 저장되었습니다",
  attendees: "참석자",
  viewAttendees: "참석자 보기",
},
```

---

## 권한 구조 확인

### 일정 탭 스케줄 설정 권한 (현재 구조 확인)

```text
CommunityManagement.tsx:750-753:
┌─────────────────────────────────────────────────────────────────────────┐
│ canManage =                                                             │
│   isAdmin ||                    // 앱 관리자                             │
│   isOwner ||                    // 공동체 소유자 (worship_leader)         │
│   community_leader 역할          // 공동체 리더                           │
└─────────────────────────────────────────────────────────────────────────┘

→ 일정 탭의 "새 일정 만들기" 버튼 및 수정/삭제 기능은 canManage 권한자만 사용 가능
→ 일반 멤버는 캘린더 조회 및 RSVP 응답만 가능
```

---

## 변경 파일 요약

| 파일 | 변경 내용 |
|------|----------|
| `src/hooks/useAppSettings.ts` | team_rotation_enabled 플래그 추가 |
| `src/pages/AdminDashboard.tsx` | 팀 로테이션 토글 UI 추가 |
| `src/components/CalendarEventDialog.tsx` | RSVP 토글 옵션 추가 |
| `src/components/community/CommunityCalendarView.tsx` | **새 파일** - 월간/주간 캘린더 뷰 |
| `src/components/community/EventRsvpListDialog.tsx` | **새 파일** - RSVP 참석자 명단 다이얼로그 |
| `src/components/community/CommunityRecurringCalendarTab.tsx` | 캘린더 뷰 통합, canManage 권한 체크 |
| `src/pages/CommunityManagement.tsx` | canManage prop 전달 |
| `src/components/dashboard/RsvpPromptDialog.tsx` | **새 파일** - 대시보드 RSVP 프롬프트 (세션 기반) |
| `src/pages/Dashboard.tsx` | RSVP 다이얼로그 통합 |
| `src/lib/translations.ts` | 번역 키 추가 |

---

## 데이터베이스 변경 요약

| 테이블 | 변경 내용 |
|--------|----------|
| `calendar_events` | rsvp_enabled 컬럼 추가 |
| `event_rsvp_responses` | **새 테이블** (event_id, user_id, response) |
| `platform_feature_flags` | team_rotation_enabled 플래그 추가 |

---

## 시각화

```text
RSVP 플로우 (수정됨):
┌────────────────────────────────────────────────────────────────────────┐
│ 1. 일정 생성 시 RSVP 토글 ON (canManage 권한자만)                        │
│    ↓                                                                   │
│ 2. calendar_events.rsvp_enabled = true                                 │
│    ↓                                                                   │
│ 3. 팀 멤버가 대시보드 접속                                               │
│    ↓                                                                   │
│ 4. RsvpPromptDialog 표시                                               │
│    ┌────────────────────────────────────────────┐                      │
│    │  주일 예배 리허설                           │                      │
│    │  2026년 1월 25일 (토) 14:00                │                      │
│    │                                            │                      │
│    │  ✓ 참석: 3명  ✗ 불참: 1명                  │  ← 현황 표시          │
│    │                                            │                      │
│    │  [✓ 참석] [✗ 불참] [⏰ 다음에 보기]         │                      │
│    └────────────────────────────────────────────┘                      │
│    ↓                                                                   │
│ 5-A. 참석/불참 선택 → event_rsvp_responses 저장                         │
│ 5-B. "다음에 보기" → 현재 세션에서만 숨김, 대시보드 재접속 시 다시 표시    │
└────────────────────────────────────────────────────────────────────────┘

일정 탭에서 참석자 명단 보기:
┌────────────────────────────────────────────────────────────────────────┐
│ 일정 탭 > 일정 클릭                                                     │
│    ↓                                                                   │
│ 관리자(canManage): 수정 다이얼로그 열기                                  │
│ 일반 멤버: RSVP 참석자 명단 다이얼로그 열기                               │
│    ┌────────────────────────────────────────────┐                      │
│    │  주일 예배 리허설                           │                      │
│    │  2026년 1월 25일                           │                      │
│    │                                            │                      │
│    │  ✓ 참석 (3)                                │                      │
│    │    • 홍길동                                 │                      │
│    │    • 김철수                                 │                      │
│    │    • 이영희                                 │                      │
│    │                                            │                      │
│    │  ✗ 불참 (1)                                │                      │
│    │    • 박민수                                 │                      │
│    └────────────────────────────────────────────┘                      │
└────────────────────────────────────────────────────────────────────────┘
```

