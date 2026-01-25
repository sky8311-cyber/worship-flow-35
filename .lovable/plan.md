

# 다가오는 일정 카드 디자인 통일

## 문제점 분석

스크린샷에서 보이는 문제:
1. **카운트다운 배지 위치 불일치** - 첫 이벤트는 제목 아래, 두번째는 오른쪽 끝
2. **배지 크기 불일치** - "7h to go"는 크고, "6d to go"는 작음
3. **레이아웃 불균형** - "게시됨"이 별도 줄에 표시
4. **flex-wrap으로 인한 줄바꿈** - 공간 부족 시 요소들이 다음 줄로 이동

---

## 개선된 디자인

```text
┌─────────────────────────────────────────────────────────────┐
│ ┌────────┐                                                  │
│ │  Jan   │  🏛 주일 3부 찬양예배                      ⋮    │
│ │   24   │  최광은 • 게시됨           [7h to go]           │
│ └────────┘                                                  │
├─────────────────────────────────────────────────────────────┤
│ ┌────────┐                                                  │
│ │  Jan   │  👥 월간 하기오스  [RSVP]                  ⋮    │
│ │   30   │  친교실 • 모임             [6d to go]           │
│ └────────┘                                                  │
└─────────────────────────────────────────────────────────────┘
```

**레이아웃 규칙:**
- **1줄**: 아이콘 + 제목 + RSVP 배지 (있는 경우)
- **2줄**: 부제목 (위치/리더 • 타입) + 카운트다운 배지 (오른쪽 정렬)
- `flex-wrap` 제거하여 줄바꿈 방지
- 카운트다운 배지를 항상 두 번째 줄 오른쪽에 고정

---

## 수정 내용

**파일: `src/components/dashboard/UpcomingEventsWidget.tsx`**

### 변경 전 (현재)
```tsx
<div className="flex-1 min-w-0">
  <div className="flex items-center gap-1.5 flex-wrap">
    {event.icon}
    <p>제목</p>
    {rsvp_enabled && <Badge>RSVP</Badge>}
    {countdown && <Badge className="ml-auto">7h to go</Badge>}  {/* ← 이 줄에서 wrap됨 */}
  </div>
  <p>최광은 • 게시됨</p>
</div>
```

### 변경 후
```tsx
<div className="flex-1 min-w-0">
  {/* 첫째 줄: 아이콘 + 제목 + RSVP만 */}
  <div className="flex items-center gap-1.5">
    {event.icon}
    <p className="truncate flex-1">제목</p>
    {rsvp_enabled && <Badge>RSVP</Badge>}
  </div>
  
  {/* 둘째 줄: 부제목 + 카운트다운 (항상 오른쪽) */}
  <div className="flex items-center justify-between gap-2 mt-0.5">
    <p className="text-xs truncate">최광은 • 게시됨</p>
    {countdown && (
      <Badge className="shrink-0">7h to go</Badge>
    )}
  </div>
</div>
```

---

## 배지 스타일 통일

| 배지 | 스타일 |
|------|--------|
| RSVP | `variant="outline"` / 높이 `h-5` / 텍스트 `text-[10px]` |
| 카운트다운 | `bg-accent` / 높이 `h-5` / 텍스트 `text-[10px]` / 둥근 모서리 |

---

## 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/components/dashboard/UpcomingEventsWidget.tsx` | 이벤트 카드 레이아웃 재구성 - 2줄 고정 구조로 변경, 카운트다운 위치 통일 |

---

## 최종 결과

- 모든 이벤트 카드가 동일한 2줄 구조 유지
- 카운트다운 배지가 항상 두 번째 줄 오른쪽에 위치
- 배지 크기와 스타일 일관성 확보
- `flex-wrap` 제거로 예상치 못한 줄바꿈 방지

