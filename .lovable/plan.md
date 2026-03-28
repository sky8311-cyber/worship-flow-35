

# SpaceCanvas 툴바 확장 + 이웃 시스템 구현

## 개요
총 4개의 주요 기능을 순차적으로 구현합니다. 범위가 크므로 **3단계**로 나눕니다.

---

## Phase 1: 툴바 재설계 + Marquee Text Bar + 설정 이동

### 1-1. worship_rooms 테이블에 마퀴 컬럼 추가 (DB 마이그레이션)
```sql
ALTER TABLE worship_rooms
  ADD COLUMN marquee_text TEXT DEFAULT NULL,
  ADD COLUMN marquee_text_color TEXT DEFAULT '#333333',
  ADD COLUMN marquee_bg_color TEXT DEFAULT '#f5f0e8',
  ADD COLUMN marquee_speed INTEGER DEFAULT 50; -- px/sec
```

### 1-2. SpaceCanvas 툴바 레이아웃 변경
현재: `[Zoom] ─── [BGM] [편집]`
변경: `[Marquee Bar] ─── [BGM] [이웃추가] [편집] [⚙️ 설정]`

- **Marquee Text Bar**: 툴바 왼쪽에 소개 텍스트가 흐르는 바. 텍스트/배경 색상, 속도는 worship_rooms에서 로드. 값이 없으면 숨김.
- **이웃추가 버튼**: Phase 2에서 구현 (우선 UI placeholder)
- **편집 버튼**: 기존 로직 유지, 자기 스튜디오에서만 활성
- **⚙️ 설정 버튼**: 현재 ProfileDropdownMenu에서 `onSettings`로 열리는 StudioSettingsDialog를 툴바 아이콘 버튼으로 이동. 자기 스튜디오에서만 표시.

### 1-3. StudioSettingsDialog 확장
기존 설정 (공개/BGM)에 추가:
- **소개 텍스트** (textarea)
- **텍스트 색상** (color picker)
- **배경 색상** (color picker)
- **움직임 속도** (slider: 느림/보통/빠름)

### 1-4. Props 정리
- `WorshipStudio` → `StudioMainPanel` → `SpaceCanvas`로 마퀴 데이터 전달
- `SpaceCanvas`에 `onOpenSettings` prop 추가
- StudioHeader의 ProfileDropdownMenu에서 `onSettings` 제거

### 변경 파일
| 파일 | 작업 |
|------|------|
| DB 마이그레이션 | marquee 4개 컬럼 추가 |
| `useWorshipRoom.ts` | useUpdateRoom에 marquee 필드 추가 |
| `StudioSettingsDialog.tsx` | 마퀴 설정 UI 추가 |
| `SpaceCanvas.tsx` | 툴바 레이아웃 변경, Marquee 바 + 설정 버튼 추가 |
| `StudioMainPanel.tsx` | 마퀴 데이터 + onOpenSettings prop 전달 |
| `WorshipStudio.tsx` | 마퀴 데이터 추출, 설정 핸들러 SpaceCanvas로 이동 |
| `ProfileDropdownMenu.tsx` | onSettings 제거 |

---

## Phase 2: 이웃 시스템 (friends 테이블 활용)

### 기존 인프라 확인
- **`friends` 테이블**: 이미 존재 (`requester_user_id`, `addressee_user_id`, `status: pending/accepted/declined`)
- **`are_friends()` 함수**: 이미 존재
- **`friend_status` enum**: `pending | accepted | declined`

### 2-1. 이웃 추가 워크플로우
1. **타인 스튜디오 방문 시** → 툴바에 "이웃추가" 버튼 활성
2. 클릭 시 → 확인 다이얼로그: "상대편이 수락 시 맞추(상호 이웃)가 자동으로 이루어지며, 별도 동의 없이 서로 이웃이 됩니다. 이웃 신청을 보내시겠습니까?"
3. 확인 → `friends` INSERT (status: 'pending')
4. 상대편 → 알림 수신 ("OO님이 이웃 신청을 보냈습니다")
5. 상대편 응답:
   - **수락** → "맞추하시겠습니까?" 확인. 취소 시 다시 수락/거절 선택으로 돌아감. 확인 시 status='accepted', 별도 역방향 요청 없이 양방향 이웃 성립
   - **거절** → status='declined'
6. 이미 이웃인 경우 → 버튼이 "이웃 ✓" 표시 (해제 옵션 가능)
7. pending인 경우 → "신청 중..." + 취소 버튼

### 2-2. 알림 연동
- DB 트리거: `friends` INSERT 시 상대편에게 `friend_request` 알림
- `friends` UPDATE (accepted) 시 신청자에게 `friend_accepted` 알림
- `notifications` 테이블의 `valid_notification_type` constraint에 `friend_request`, `friend_accepted` 추가 필요

### 2-3. 사이드 패널 연동
- `StudioSidePanel`의 "친구" 섹션을 실제 `friends` 테이블에서 accepted 상태인 유저의 worship_room을 쿼리
- placeholder 데이터 대체

### 변경 파일
| 파일 | 작업 |
|------|------|
| DB 마이그레이션 | notification_type에 friend_request/friend_accepted 추가, friends 트리거 생성 |
| `useFriends.ts` (신규) | 이웃 신청/수락/거절/상태 조회 훅 |
| `SpaceCanvas.tsx` | 이웃추가 버튼 로직 구현 |
| `FriendRequestDialog.tsx` (신규) | 신청/수락/거절 다이얼로그 |
| `StudioSidePanel.tsx` | 실제 이웃 데이터 연동 |
| `useStoryBarStudios.ts` | 이웃 기반 스튜디오 목록 쿼리 |

---

## Phase 3: 앰배서더 노출 로직

### 현재 상태
- `profiles.is_ambassador` 필드 존재
- **AdminStudio 페이지**에서 관리자가 유저를 검색 → `is_ambassador` 토글 (이미 구현됨)
- `StudioDiscover`에서 앰배서더 목록 표시됨
- `StudioSidePanel`에서 앰배서더 층 표시 (현재 placeholder)

### 구현 내용
- `StudioSidePanel`의 앰배서더 섹션을 실제 `is_ambassador=true`인 유저의 public worship_room으로 교체
- 앰배서더 스튜디오 방문 시 이웃신청 버튼 활성 (일반 유저와 동일 로직)
- 앰배서더의 public 공간은 모든 유저에게 노출 (이미 visibility='public'으로 처리됨)

### 변경 파일
| 파일 | 작업 |
|------|------|
| `StudioSidePanel.tsx` | 앰배서더 placeholder → 실제 데이터 연동 |
| `useStoryBarStudios.ts` | 앰배서더 쿼리 추가 |

---

## 구현 순서
1. **Phase 1** 먼저 구현 (DB + 툴바 + 마퀴 + 설정 이동)
2. **Phase 2** 이웃 시스템 (DB 트리거 + 훅 + UI)
3. **Phase 3** 앰배서더 연동 (데이터 교체)

승인 시 Phase 1부터 시작합니다.

