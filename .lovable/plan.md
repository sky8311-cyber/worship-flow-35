

# 위젯 시스템 버그 수정 계획

## 발견된 문제점 분석

### 1. 게시물 임베드 위젯에서 게시물이 불러오질 않음

**원인 분석:**
- `PostSelector.tsx` (line 21)에서 `useRoomPosts(roomId)`를 호출하는데, **전달되는 `roomId`가 스튜디오의 room_id**
- `WidgetEditDialog.tsx`에서 `PostSelector`에 `roomId={roomId}`를 전달 (line 110-112)
- 이 `roomId`는 `StudioGrid`에서 받은 스튜디오 room_id
- **문제:** 사용자가 초안함에서 작성한 글은 해당 사용자의 `room_id`에 저장되어 있어야 하는데, 현재 다른 사람의 스튜디오를 방문할 때도 그 스튜디오의 room_id로 게시물을 조회하고 있음

실제로 데이터베이스를 확인한 결과, `room_posts` 테이블에 게시물이 존재함:
- room_id: `137cab82-0876-4b2a-ab73-c2037b58e6e4`에 3개의 게시물 확인

**해결 방법:**
- `PostSelector`는 **현재 로그인한 사용자의 스튜디오 room_id**로 초안을 조회해야 함
- `WidgetEditDialog`에서 사용자의 own room_id를 별도로 전달하거나, `PostSelector` 내부에서 `useAuth` + `useWorshipRoom`으로 자체 조회

---

### 2. 스크롤이 없음

**원인 분석:**
- `StudioView.tsx` (line 99): `<ScrollArea className="h-full">` 사용
- `StudioMainPanel.tsx` (line 69): `<TabsContent value="studio" className="flex-1 overflow-auto mt-0 p-0">`
- 문제: **부모 컨테이너의 높이가 명시적으로 정의되지 않음**

`TabsContent`에 `flex-1`만 있고 `h-0`이 없음. Flexbox에서 자식이 부모를 넘어설 때 스크롤이 작동하려면:
1. 부모에 명시적 높이 또는 `h-0 flex-1` 패턴 필요
2. 자식에 `overflow-auto` 또는 `ScrollArea` 필요

**현재 구조:**
```
WorshipStudio (fixed inset-0)
└─ div.flex-1.overflow-hidden.flex
   └─ StudioMainPanel (flex-1 flex flex-col overflow-hidden)
      └─ Tabs (flex-1 flex flex-col)
         └─ TabsContent (flex-1 overflow-auto) ← 여기에 h-0 필요
            └─ StudioView
               └─ ScrollArea (h-full) ← 부모 높이 없으면 작동 안함
```

**해결 방법:**
- `StudioMainPanel.tsx` line 69: `className="flex-1 overflow-auto mt-0 p-0"` → `"flex-1 h-0 overflow-hidden mt-0 p-0"`
- 동일하게 다른 `TabsContent`에도 적용 (line 76, 81, 87)

---

### 3. "새 위젯 추가" 버튼이 보이지 않음

**원인 분석:**
- `StudioGrid.tsx` line 167-174: 버튼은 `isOwner && ...` 조건으로 렌더링
- 버튼 자체는 존재하지만, 스크롤이 작동하지 않아 **화면 아래에 숨겨져 있음**

추가로 확인:
- `StudioGrid.tsx` line 120: `<div className="p-4 pb-20">` - 하단 패딩이 있음
- 빈 상태(empty state)일 때 (line 150-164) 위젯이 없으면 메시지가 표시됨
- 버튼은 line 167-174에 `{isOwner && ...}` 조건으로 표시됨

**문제 확인:**
- 스크롤이 없어서 버튼까지 도달 불가
- 또한 `isOwner` 값이 제대로 전달되지 않을 가능성도 있음

`StudioView.tsx`에서 `StudioGrid`로 `isOwner={isActuallyOwnRoom}` 전달 (line 106), `isActuallyOwnRoom = room?.owner_user_id === user?.id` (line 31)

**해결 방법:**
1. 스크롤 문제 해결 (문제 #2)
2. 빈 상태에서는 버튼을 empty state 내부에 배치하여 바로 보이도록 수정

---

## 구현 계획

### Phase 1: 스크롤 문제 해결 (최우선)

**파일:** `src/components/worship-studio/StudioMainPanel.tsx`

```typescript
// 변경 전 (line 69)
<TabsContent value="studio" className="flex-1 overflow-auto mt-0 p-0">

// 변경 후
<TabsContent value="studio" className="flex-1 h-0 overflow-hidden mt-0 p-0">
```

동일 패턴을 모든 `TabsContent`에 적용:
- Line 69: studio 탭
- Line 76: feed 탭  
- Line 81: drafts 탭
- Line 87: discover 탭

**파일:** `src/components/worship-studio/StudioView.tsx`

`ScrollArea`에 명시적 높이 확인 (현재 `h-full`은 부모가 높이를 가지면 작동함)

---

### Phase 2: PostSelector 게시물 조회 수정

**파일:** `src/components/worship-studio/grid/editors/PostSelector.tsx`

현재:
```typescript
interface PostSelectorProps {
  roomId: string;  // 이 값이 스튜디오 room_id
  selectedPostId?: string;
  onSelect: (postId: string | undefined) => void;
}

export function PostSelector({ roomId, selectedPostId, onSelect }: PostSelectorProps) {
  const { data: posts, isLoading } = useRoomPosts(roomId);
  // ...
}
```

수정:
```typescript
export function PostSelector({ roomId, selectedPostId, onSelect }: PostSelectorProps) {
  const { user } = useAuth();
  const { room: myRoom } = useWorshipRoom(user?.id);
  
  // 사용자 자신의 스튜디오에서 게시물 조회
  const { data: posts, isLoading } = useRoomPosts(myRoom?.id);
  // ...
}
```

**이유:** 게시물 임베드 위젯에서 선택할 수 있는 게시물은 **자신이 초안함에서 작성한 게시물**이어야 함. 다른 사람의 스튜디오에 위젯을 추가할 때도 자신의 게시물을 가져와야 함.

---

### Phase 3: 위젯 추가 버튼 가시성 개선

**파일:** `src/components/worship-studio/grid/StudioGrid.tsx`

빈 상태(empty state)일 때 버튼을 empty state 컨테이너 내부로 이동:

```typescript
// 변경 전 (line 150-174)
{sortedWidgets.length === 0 && (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
      <span className="text-3xl">✨</span>
    </div>
    <h3>...</h3>
    <p>...</p>
  </div>
)}

{/* Add widget button - 별도 위치 */}
{isOwner && (
  <div className="mt-6">
    <WidgetPalette ... />
  </div>
)}
```

```typescript
// 변경 후
{sortedWidgets.length === 0 && (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
      <span className="text-3xl">✨</span>
    </div>
    <h3>...</h3>
    <p>...</p>
    
    {/* Empty state 내부에 버튼 배치 */}
    {isOwner && (
      <div className="mt-8 w-full max-w-sm">
        <WidgetPalette 
          onAddWidget={handleAddWidget} 
          disabled={createWidget.isPending}
        />
      </div>
    )}
  </div>
)}

{/* 위젯이 있을 때만 하단에 버튼 표시 */}
{isOwner && sortedWidgets.length > 0 && (
  <div className="mt-6">
    <WidgetPalette 
      onAddWidget={handleAddWidget} 
      disabled={createWidget.isPending}
    />
  </div>
)}
```

---

## 파일 변경 요약

| 파일 | 변경 내용 |
|------|----------|
| `src/components/worship-studio/StudioMainPanel.tsx` | TabsContent에 `h-0` 추가 (4곳) |
| `src/components/worship-studio/grid/editors/PostSelector.tsx` | `useAuth` + `useWorshipRoom` 추가, 자신의 room_id로 게시물 조회 |
| `src/components/worship-studio/grid/StudioGrid.tsx` | Empty state 내부에 WidgetPalette 배치, 조건부 렌더링 분리 |

---

## 기술 검증

**스크롤 문제 해결 원리:**
```
flex container (height: fixed)
└─ flex-1 h-0 overflow-hidden
   └─ ScrollArea h-full
      └─ content (자유 높이)
```
- `h-0`은 flex item의 기본 높이를 0으로 설정
- `flex-1`이 남은 공간을 채움
- 이 조합으로 컨테이너가 명시적 높이를 가지게 되어 내부 스크롤 작동

**게시물 조회 수정 원리:**
- 현재 로그인한 사용자의 `user.id`로 `useWorshipRoom(user.id)` 호출
- 반환된 `myRoom.id`로 `useRoomPosts(myRoom.id)` 호출
- 이렇게 하면 항상 자신의 초안함 게시물만 조회됨

