
# 일정 클릭 동작 변경 및 디자인 정리

## 요약
1. **일정 클릭 시 모든 사용자(관리자 포함)가 일정 상세 및 참석/불참 명단 보기**로 동작 변경
2. **수정 기능은 드롭다운 메뉴의 "수정" 버튼으로만 접근**
3. **디자인 정리**: 과도한 Row 중첩 정리, 레이아웃 개선

---

## 변경 내용

### 1단계: 일정 클릭 동작 변경

**파일: `src/components/dashboard/UpcomingEventsWidget.tsx`**

현재 코드 (241-252줄):
```typescript
const handleCalendarEventClick = (event: any) => {
  const canManageEvent = isAdmin || (isCommunityLeader && event.created_by === currentUserId);
  
  if (canManageEvent) {
    // Managers: open edit dialog ← 문제: 클릭 시 수정 모드
    setSelectedEventId(event.id);
    setEventDialogOpen(true);
  } else {
    // Regular members: open detail view dialog
    setSelectedEventForDetail(event);
    setDetailDialogOpen(true);
  }
};
```

**변경 후**: 모든 사용자가 클릭 시 상세 보기(EventDetailDialog) 열기
```typescript
const handleCalendarEventClick = (event: any) => {
  // 모든 사용자: 일정 상세 및 참석자 명단 보기
  setSelectedEventForDetail(event);
  setDetailDialogOpen(true);
};
```

수정은 드롭다운 메뉴의 "수정" 버튼(459줄)으로만 접근 가능하도록 유지합니다.

---

### 2단계: 디자인 정리 - 이벤트 카드 레이아웃 개선

현재 레이아웃 문제:
- 제목 + RSVP 배지 + 카운트다운 배지가 한 줄에 감싸지며 복잡
- 날짜 정보와 위치 정보가 별도 줄에 표시되어 세로로 길어짐
- 이벤트 타입 배지까지 별도 줄 차지

**개선 디자인**:
```text
┌─────────────────────────────────────────────────────────┐
│ ┌────────┐                                              │
│ │  Jan   │  🏛 주일 3부 찬양예배          7h to go  ⋮  │
│ │   24   │  최광은 • 게시됨                             │
│ └────────┘                                              │
├─────────────────────────────────────────────────────────┤
│ ┌────────┐                                              │
│ │  Jan   │  👥 월간 하기오스  RSVP        6d to go  ⋮  │
│ │   30   │  친교실 • 모임                               │
│ └────────┘                                              │
└─────────────────────────────────────────────────────────┘
```

**변경사항**:
- 첫 줄: 아이콘 + 제목 + RSVP 배지(있는 경우) + 카운트다운
- 둘째 줄: subtitle(리더명/장소) + 이벤트 타입 배지를 한 줄로 결합
- 날짜(예: 2026.01.31 토요일) 표시 제거 - 왼쪽 날짜 블록으로 충분
- 배지 스타일 간소화

---

### 3단계: EventDetailDialog 개선

관리자도 이 다이얼로그를 사용하게 되므로, RSVP가 비활성화된 경우에도 기본 정보를 표시하도록 확인합니다. 현재 구현에서는 이미 event_date, start_time, end_time, location, description을 표시하고 있어 수정 불필요합니다.

---

## 수정 파일 요약

| 파일 | 변경 내용 |
|------|----------|
| `src/components/dashboard/UpcomingEventsWidget.tsx` | 1. `handleCalendarEventClick` - 모든 사용자 상세보기로 변경<br>2. 이벤트 카드 레이아웃 간소화 (Row 중첩 제거) |

---

## 최종 동작

| 액션 | 동작 |
|------|------|
| 일정 카드 클릭 (모든 사용자) | EventDetailDialog 열림 - 일정 상세 + 참석/불참 명단 보기 |
| 드롭다운 > 수정 (관리자만) | CalendarEventDialog 열림 - 일정 수정 |
| 드롭다운 > 삭제 (관리자만) | 일정 삭제 확인 후 삭제 |
