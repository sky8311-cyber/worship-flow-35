

# 방명록 스튜디오 레벨로 변경 + 탭 배지 superscript 스타일

## 1. 방명록을 스튜디오(Room) 단위로 변경

### 현재 문제
- `space_guestbook` 테이블이 `space_id` FK로 각 공간마다 방명록 존재
- 설정에서 각 공간마다 `guestbook_enabled` / `guestbook_permission` 토글 존재
- 실제로는 스튜디오당 방명록 1개만 필요

### 해결: 새 `room_guestbook` 테이블 생성

**DB 마이그레이션:**
- `room_guestbook` 테이블 생성 (`id`, `room_id` FK → `worship_rooms`, `author_user_id` FK → `auth.users`, `body`, `created_at`)
- `worship_rooms`에 `guestbook_enabled boolean default true`, `guestbook_permission text default 'all'` 컬럼 추가
- 기존 `space_guestbook` 데이터를 `room_guestbook`으로 마이그레이션 (space → room 매핑)
- RLS: 읽기는 모두 허용, 쓰기는 인증 사용자, 삭제는 작성자 또는 room 소유자

**파일 변경:**

| 파일 | 변경 |
|------|------|
| `useGuestbook.ts` | `space_guestbook` → `room_guestbook`, `space_id` → `room_id`, query key 변경 |
| `GuestbookPanel.tsx` | props `spaceId` → `roomId` |
| `GuestbookEntry.tsx` | 변경 없음 (entry 구조 동일) |
| `StudioSettingsDialog.tsx` | 각 공간의 방명록 토글 제거, room 레벨로 방명록 설정 이동 (BGM 섹션 아래에 1개의 토글 + permission 라디오) |
| `SpaceCanvas.tsx` | `guestbookEnabled` prop을 room 레벨에서 받음 (변경 최소) |
| `StudioMainPanel.tsx` | 방명록 데이터를 room 기준으로 fetch, `useGuestbook(roomId)` |
| `SpaceTabBar.tsx` | space별 guestbook 참조 제거 |

### 설정 UI 변경 (StudioSettingsDialog)
- 각 공간의 "방명록 활성화" 스위치 + permission 라디오 **제거**
- BGM 섹션 아래에 새 "방명록" 섹션 추가:
  - `Switch`: 방명록 활성화 (room.guestbook_enabled)
  - `RadioGroup`: 전체/친구만 (room.guestbook_permission)
- `handleSave`에 `guestbook_enabled`, `guestbook_permission` 포함

## 2. 탭 배지를 superscript 스타일로 변경

### 현재 문제
- "비공개" / "친구만" 배지가 탭 내부에 있어 탭이 너무 길어짐

### 해결
- 탭을 `relative` + `overflow-visible`로 설정
- 배지를 `absolute -top-1.5 -right-2` 위치에 superscript로 배치
- 크기: `text-[7px] px-1 py-0 leading-tight rounded-full`
- 비공개: 🔒 아이콘만 (텍스트 없이), friends: 👥 아이콘만
- 탭 본문에서 배지 제거

**파일:** `SpaceTabBar.tsx`
- 각 탭 `div`에 `relative overflow-visible` 추가
- 배지를 `absolute` 위치의 작은 원형 아이콘으로 변경

