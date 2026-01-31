
# 사용자 계정 삭제 기능 구현 계획

## 요구사항 정리

사용자(특히 예배인도자)가 설정 페이지에서 본인 계정을 삭제할 수 있어야 합니다.

### 데이터 처리 정책

| 데이터 유형 | 처리 방식 |
|------------|----------|
| **커뮤니티** | 다른 멤버가 있으면 가장 오래된 멤버에게 소유권 자동 이전 → 멤버가 없으면 커뮤니티 삭제 |
| **워십세트** | 유지 (created_by를 null로 변경) |
| **곡 라이브러리** | is_private=true인 곡만 삭제, 공개 곡은 created_by를 null로 변경하여 유지 |
| **커뮤니티 포스트** | 유지 (author_id를 null로 변경) |
| **기타 개인 데이터** | 삭제 (알림, 좋아요, 즐겨찾기, 멤버십 등) |

---

## 구현 계획

### 1. Edge Function 생성 (`self-delete-user`)

기존 `admin-delete-user`를 참고하되, **본인만 삭제 가능**하도록 수정한 새 Edge Function 생성

**주요 로직:**

```text
1. 인증 확인 - 본인 세션인지 검증
2. 커뮤니티 소유권 처리
   a. 본인이 owner인 커뮤니티 조회
   b. 각 커뮤니티에 대해:
      - 다른 멤버가 있으면 → 가장 오래된 멤버를 owner로 승격
      - 다른 멤버가 없으면 → 커뮤니티 삭제 (CASCADE로 관련 데이터 자동 삭제)
3. 곡 처리
   a. is_private=true인 곡 삭제
   b. 공개 곡은 created_by=null로 업데이트
4. 콘텐츠 attribution 정리 (created_by/author_id → null)
   - service_sets, calendar_events, community_posts, post_comments 등
5. 개인 데이터 삭제
   - community_members, notifications, post_likes, user_favorite_songs 등
6. auth.users에서 사용자 삭제 (CASCADE로 profiles, user_roles 자동 삭제)
```

### 2. Settings 페이지 UI 추가

설정 페이지에 **"계정 삭제"** 섹션 추가

**UI 요소:**
- 삭제 확인 다이얼로그 (AlertDialog)
- 삭제 전 확인 문구 입력 (예: "삭제합니다" 또는 이메일 입력)
- 처리 중 로딩 상태 표시
- 커뮤니티 소유권 이전 또는 삭제 예정 알림 표시

### 3. config.toml 설정

Edge Function 인증 설정 추가

---

## 수정 파일 목록

| 파일 | 변경 내용 |
|------|----------|
| `supabase/functions/self-delete-user/index.ts` | 신규 생성 - 사용자 자가 삭제 로직 |
| `supabase/config.toml` | Edge Function 설정 추가 |
| `src/pages/Settings.tsx` | 계정 삭제 UI 섹션 추가 |

---

## 세부 구현 사항

### Edge Function: `self-delete-user`

```typescript
// 핵심 흐름
1. 본인 인증 확인
2. 커뮤니티 소유권 이전/삭제 처리
   - community_members에서 owner 역할인 커뮤니티 조회
   - 각 커뮤니티의 다른 멤버 중 가장 오래된 멤버 찾기
   - 있으면: 해당 멤버를 owner로 업데이트 + worship_communities.leader_id 업데이트
   - 없으면: worship_communities 삭제 (FK CASCADE로 관련 테이블 정리)
3. 비공개 곡 삭제
4. 공개 곡 created_by → null
5. 콘텐츠 attribution 정리
6. 개인 데이터 삭제
7. auth.admin.deleteUser 호출
```

### Settings 페이지 UI

```text
┌───────────────────────────────────────────┐
│ ⚠️ 계정 삭제                              │
├───────────────────────────────────────────┤
│ 계정을 삭제하면 되돌릴 수 없습니다.       │
│                                           │
│ • 워십세트와 공개 곡은 유지됩니다         │
│ • 비공개 곡은 삭제됩니다                  │
│ • 커뮤니티 소유권은 자동 이전됩니다       │
│                                           │
│           [🗑️ 계정 삭제]                  │
└───────────────────────────────────────────┘
```

**삭제 확인 다이얼로그:**
```text
┌───────────────────────────────────────────┐
│ 정말 삭제하시겠습니까?                    │
├───────────────────────────────────────────┤
│ 이 작업은 되돌릴 수 없습니다.             │
│                                           │
│ 소유한 커뮤니티:                          │
│ • "찬양팀" → 김철수님에게 이전 예정       │
│ • "새벽기도팀" → 멤버 없음, 삭제 예정     │
│                                           │
│ 확인을 위해 "삭제합니다"를 입력하세요:    │
│ ┌─────────────────────────────────────┐   │
│ │                                     │   │
│ └─────────────────────────────────────┘   │
│                                           │
│          [취소]    [삭제하기]             │
└───────────────────────────────────────────┘
```

---

## 주요 고려사항

### 데이터 무결성
- 삭제 전 소유권 이전 시 `worship_communities.leader_id`와 `community_members.role` 모두 업데이트
- FK CASCADE 활용하여 커뮤니티 삭제 시 관련 데이터(posts, events, invitations) 자동 정리

### 보안
- Edge Function에서 요청자 본인만 삭제 가능하도록 검증
- 관리자 권한 불필요 (본인 계정만 삭제)

### 사용자 경험
- 삭제 전 영향 받는 데이터 목록 표시
- 삭제 확인 입력 필수
- 처리 완료 후 로그인 페이지로 리다이렉트
