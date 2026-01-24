
# 일정 수정 시 기존 데이터 로드 기능 추가

## 문제 분석

```text
현재 흐름:
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. 수정 버튼 클릭 → handleEditEvent(eventId) 호출                        │
│ 2. selectedEventId 설정 → CalendarEventDialog 열림                      │
│ 3. eventId prop 전달됨                                                  │
│ 4. BUT! 기존 이벤트 데이터를 fetch하는 로직이 없음                         │
│ 5. 폼은 defaultValues로만 초기화 → 빈 폼 표시                             │
└─────────────────────────────────────────────────────────────────────────┘

필요한 수정:
┌─────────────────────────────────────────────────────────────────────────┐
│ eventId가 있으면:                                                       │
│   1. useQuery로 calendar_events에서 해당 이벤트 데이터 fetch              │
│   2. 데이터 로드 완료 시 setValue로 폼에 기존 값 채우기                    │
│   3. 다이얼로그가 닫힐 때 폼 리셋                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 해결 방안

### src/components/CalendarEventDialog.tsx 수정

**1. 기존 이벤트 데이터 fetch 추가:**

```typescript
// eventId가 있으면 기존 이벤트 데이터 조회
const { data: existingEvent, isLoading: eventLoading } = useQuery({
  queryKey: ["calendar-event-detail", eventId],
  queryFn: async () => {
    if (!eventId) return null;
    
    const { data, error } = await supabase
      .from("calendar_events")
      .select("*")
      .eq("id", eventId)
      .single();
    
    if (error) throw error;
    return data;
  },
  enabled: !!eventId && open,
});
```

**2. 데이터 로드 시 폼 채우기:**

```typescript
// 기존 이벤트 데이터로 폼 초기화
useEffect(() => {
  if (existingEvent && open) {
    setValue("community_id", existingEvent.community_id);
    setValue("title", existingEvent.title);
    setValue("description", existingEvent.description || "");
    setValue("event_type", existingEvent.event_type);
    setValue("event_date", existingEvent.event_date);
    setValue("start_time", existingEvent.start_time || "");
    setValue("end_time", existingEvent.end_time || "");
    setValue("location", existingEvent.location || "");
    setValue("notification_enabled", existingEvent.notification_enabled ?? true);
    setValue("notification_time", existingEvent.notification_time ?? 60);
    setValue("rsvp_enabled", existingEvent.rsvp_enabled ?? false);
  }
}, [existingEvent, open, setValue]);
```

**3. 다이얼로그 닫힐 때 폼 리셋:**

```typescript
// 다이얼로그 닫힐 때 폼 초기화
useEffect(() => {
  if (!open) {
    reset({
      community_id: communityId || "",
      event_type: "rehearsal",
      notification_enabled: true,
      notification_time: 60,
      rsvp_enabled: false,
      title: "",
      description: "",
      event_date: "",
      start_time: "",
      end_time: "",
      location: "",
    });
  }
}, [open, communityId, reset]);
```

**4. 로딩 상태 표시:**

```typescript
// 다이얼로그 내용 부분에 로딩 상태 추가
{eventLoading ? (
  <div className="py-8 text-center text-muted-foreground">
    {t("common.loading")}
  </div>
) : (
  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
    {/* 기존 폼 내용 */}
  </form>
)}
```

---

## 변경 파일 요약

| 파일 | 변경 내용 |
|------|----------|
| `src/components/CalendarEventDialog.tsx` | eventId가 있을 때 기존 데이터 fetch 및 폼 초기화, 다이얼로그 닫힐 때 리셋 |

---

## 수정 후 흐름

```text
수정 버튼 클릭 시:
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. handleEditEvent("event-id-123") 호출                                 │
│ 2. CalendarEventDialog 열림 with eventId="event-id-123"                 │
│ 3. useQuery 실행 → calendar_events에서 해당 이벤트 조회                   │
│ 4. 로딩 중 → "Loading..." 표시                                          │
│ 5. 데이터 로드 완료 → useEffect에서 setValue로 폼 채움                    │
│ 6. 사용자에게 기존 데이터가 채워진 폼 표시                                 │
│    - 제목: "월간 하기 오스"                                              │
│    - 날짜/시간: 기존 설정값                                              │
│    - 장소: 기존 설정값                                                   │
│ 7. 수정 후 저장 → update 쿼리 실행                                       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 사용자 경험 개선

| 항목 | 수정 전 | 수정 후 |
|------|---------|---------|
| 수정 버튼 클릭 | 빈 폼 표시 | 기존 데이터로 채워진 폼 표시 |
| 제목 | 비어있음 | "월간 하기 오스" 표시 |
| 날짜/시간 | 비어있음 | 기존 설정값 표시 |
| RSVP 설정 | 기본값 OFF | 기존 설정값 유지 |
