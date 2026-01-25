
# Three-Dot 메뉴 위치 수정

## 문제점

스크린샷에서 보이는 문제:
- 3점 메뉴(⋮)가 RSVP 배지/카운트다운 배지와 겹쳐서 표시됨
- 현재 메뉴 버튼이 `absolute top-2 right-2`로 위치해 있어서 콘텐츠와 겹침

## 해결 방안

### 옵션 1: 콘텐츠에 오른쪽 패딩 추가
메뉴 버튼 영역을 확보하기 위해 콘텐츠 영역에 오른쪽 패딩 추가

### 옵션 2: 레이아웃 재구성 (권장)
절대 위치 대신 Flex 레이아웃으로 변경하여 메뉴 버튼을 콘텐츠 오른쪽에 배치

```text
┌─────────────────────────────────────────────────────────────┐
│ ┌────────┐                                                  │
│ │  Jan   │  🏛 주일 3부 찬양예배                            │
│ │   24   │  최광은 • 게시됨      [6h to go]            [⋮] │
│ └────────┘                                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 수정 내용

**파일: `src/components/dashboard/UpcomingEventsWidget.tsx`**

### 변경 전
```tsx
<div key={...} className="relative group">
  <div onClick={...} className="flex items-start gap-3 p-2 ...">
    {/* 날짜 블록 */}
    {/* 콘텐츠 영역 */}
  </div>
  {canManage && (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="absolute top-2 right-2 ..." />  {/* 겹침 발생 */}
      </DropdownMenuTrigger>
      ...
    </DropdownMenu>
  )}
</div>
```

### 변경 후
```tsx
<div key={...} className="relative group">
  <div className="flex items-start gap-3 p-2 ...">
    <div onClick={...} className="flex items-start gap-3 flex-1 cursor-pointer">
      {/* 날짜 블록 */}
      {/* 콘텐츠 영역 */}
    </div>
    {canManage && (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="shrink-0 h-8 w-8 ..." />  {/* Flex 내부에 배치 */}
        </DropdownMenuTrigger>
        ...
      </DropdownMenu>
    )}
  </div>
</div>
```

---

## 주요 변경

1. **메뉴 버튼을 Flex 레이아웃 내부로 이동** - `absolute` 위치 대신 flex item으로 배치
2. **클릭 영역 분리** - 날짜/콘텐츠는 클릭 시 상세보기, 메뉴 버튼은 별도 클릭
3. **shrink-0 적용** - 메뉴 버튼 크기 고정으로 겹침 방지
4. **items-center 또는 self-center** - 메뉴 버튼 세로 중앙 정렬

---

## 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/components/dashboard/UpcomingEventsWidget.tsx` | 이벤트 카드 레이아웃 재구성 - 메뉴 버튼을 flex item으로 변경 |
