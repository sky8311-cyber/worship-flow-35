
## BandView 접근 제어 + SetBuilder 공유 링크 UI

### 기능 1: BandView 접근 제어 (`src/pages/BandView.tsx`)
1. service_set 쿼리에 `band_view_visibility`, `share_token`, `church_id` (또는 community_id) 추가.
2. `useSearchParams`로 `?token=` 읽기.
3. 접근 판정 로직:
   - `'public'` → 통과
   - `'team'` → `useAuth`의 user 필요 + `community_members` (또는 church 멤버 테이블) 멤버십 확인
   - `'link'` → `searchParams.get('token') === serviceSet.share_token`
4. 접근 불가 시 신규 컴포넌트 `<BandViewAccessGate variant="team"|"link"|"login" />` 렌더링.

> **⚠️ 확인 필요 (한 가지)**: 코드베이스에 `service_sets`에 직접 `church_id`는 없을 가능성이 큼. 대신 `community_id` 또는 `worship_communities` 연결을 사용 중. 'team' 멤버십 판정은:
> - `service_sets.community_id` → `community_members.user_id` 일치 여부
> 이 방식으로 진행합니다 (코드베이스 표준). 다른 의도였으면 알려주세요.

### 기능 2: SetBuilder 공유 UI (`src/pages/SetBuilder.tsx` 상단 헤더)
- 기존 service_set 쿼리에 `has_private_scores`, `band_view_visibility`, `share_token` 추가.
- 신규 컴포넌트 `<PrivateShareControls serviceSetId visibility shareToken hasPrivate />`:
  - `has_private_scores=false`: null 반환 (기존 UI 그대로)
  - `has_private_scores=true`:
    - 🔒 뱃지 ("비공개 (팀 전용)" / "공유 링크 활성")
    - visibility='team': "공유 링크 생성" 버튼 → DB update visibility='link' (+ share_token 없으면 생성) → 링크 복사 → toast
    - visibility='link': "공유 링크 다시 복사" + "비공개로 되돌리기" (visibility='team')
  - 링크 형식: `${window.location.origin}/band-view/${serviceSetId}?token=${shareToken}`

### 데이터/쿼리 변경
- 기존 service_set 쿼리만 수정 (필드 추가). 별도 쿼리 없음.
- BandView 접근 체크: visibility='team' 일 때만 community_members 1회 조회 (그 외엔 0회).

### 영향받는 파일
- `src/pages/BandView.tsx` — 쿼리 필드 추가, 접근 게이트 분기
- `src/pages/SetBuilder.tsx` — 헤더에 `<PrivateShareControls>` 삽입, 쿼리 필드 추가
- `src/components/band-view/BandViewAccessGate.tsx` (신규)
- `src/components/set-builder/PrivateShareControls.tsx` (신규)

### 보안
- `band_view_visibility='team'` 클라이언트 체크는 UX용. RLS는 별도 작업이 필요하면 다음 턴에서 처리 (이번 턴은 UI 게이트만, 사용자 요청대로).
- 'link' 토큰은 UUID라 추측 불가.

승인하시면 구현 시작합니다.
