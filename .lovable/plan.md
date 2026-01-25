
# 🎨 예배공작소 (Worship Studio) - 수정된 완전 리워크 계획

## 변경된 요구사항 요약

| 항목 | 기존 계획 | 수정된 계획 |
|------|----------|------------|
| Isometric/가구 코드 | UI에서만 제거, DB 유지 | **완전 삭제** (파일 + 사용하지 않는 DB 테이블) |
| 포스트 카테고리 | 고정 (prayer, note, testimony 등) | **Admin 관리 가능** (동적 카테고리) |
| BGM 동작 | 스튜디오 입장시 자동재생 | **자동 바 표시 + 수동 재생** |
| 화면 전환 | AppLayout 내부 탭 | **Full-Screen Immersive** |
| 스튜디오 생성 | 자동 생성 (모든 유저) | **계약 시스템** (옵트인) |
| Admin 기능 | 없음 | **신규 Admin 페이지** |

---

## 1. 아키텍처 개요 (수정)

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                    /rooms (또는 /studio)                                  │
│                    Full-Screen Immersive Experience                       │
├──────────────────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────────────────┐   │
│ │ [← Back to App]                     [설정] [친구] [알림]           │   │
│ ├────────────────────────────────────────────────────────────────────┤   │
│ │                                                                    │   │
│ │  Desktop: Sidebar + Main                                          │   │
│ │  ┌──────────┬──────────────────────────────────────────────┐      │   │
│ │  │ Sidebar  │  [피드] [내 스튜디오] [탐색]                 │      │   │
│ │  │ - 친구   │  ────────────────────────────────────────── │      │   │
│ │  │ - 앰버서더│  Content Area                               │      │   │
│ │  │ - 탐색   │                                             │      │   │
│ │  └──────────┴──────────────────────────────────────────────┘      │   │
│ │                                                                    │   │
│ │  Mobile: Top Tabs Only (No sidebar)                               │   │
│ │  ┌────────────────────────────────────────────────────────────┐   │   │
│ │  │  [피드]  [내 스튜디오]  [탐색]                              │   │   │
│ │  │  ──────────────────────────────────────────────────────────│   │   │
│ │  │  Content Area                                              │   │   │
│ │  └────────────────────────────────────────────────────────────┘   │   │
│ └────────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│ ┌────────────────────────────────────────────────────────────────────┐   │
│ │ 🎵 BGM Bar (자동 표시, 수동 재생)                                  │   │
│ └────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 삭제할 파일 (완전 삭제)

### 2.1 컴포넌트 파일 삭제

| 파일 | 이유 |
|------|------|
| `src/components/worship-rooms/IsometricRoomSVG.tsx` | 아이소메트릭 방 렌더링 |
| `src/components/worship-rooms/RoomCanvas.tsx` | 800x500 캔버스 |
| `src/components/worship-rooms/EditableFurnitureLayer.tsx` | 가구 편집 |
| `src/components/worship-rooms/DraggableFurniture.tsx` | 드래그 가구 |
| `src/components/worship-rooms/IsometricFurnitureLayer.tsx` | 가구 레이어 |
| `src/components/worship-rooms/IsometricAvatar.tsx` | 아바타 |
| `src/components/worship-rooms/IsometricTalkBubble.tsx` | 말풍선 |
| `src/components/worship-rooms/IsometricStatusBubble.tsx` | 상태 버블 |
| `src/components/worship-rooms/RoomScene.tsx` | 씬 오케스트레이션 |
| `src/components/worship-rooms/RoomSceneLayout.tsx` | 씬 레이아웃 |
| `src/components/worship-rooms/FloorSlots.ts` | 바닥 슬롯 정의 |
| `src/components/worship-rooms/GridOverlay.tsx` | 그리드 오버레이 |
| `src/components/worship-rooms/FurnitureSprites.tsx` | 가구 스프라이트 |
| `src/components/worship-rooms/RoomFurnitureCatalog.tsx` | 가구 카탈로그 |
| `src/components/worship-rooms/RoomFurnitureLayer.tsx` | 가구 레이어 |
| `src/components/worship-rooms/RoomMiniAvatar.tsx` | 미니 아바타 |
| `src/components/worship-rooms/RoomPostObject.tsx` | 포스트 오브젝트 |
| `src/components/worship-rooms/RoomStatusBubble.tsx` | 상태 버블 |
| `src/components/worship-rooms/RoomTalkBubble.tsx` | 말풍선 |
| `src/components/worship-rooms/RoomBackground.tsx` | 방 배경 |
| `src/components/worship-rooms/hooks/useFurnitureEditor.ts` | 가구 편집 훅 |

### 2.2 DB 테이블 (정리 - 사용 안 함 표시)

```sql
-- 삭제하지 않고 사용 중단 표시 (데이터 보존)
-- room_furniture_catalog, room_furniture_placements
-- 추후 마이그레이션에서 정리 가능
```

---

## 3. 신규 DB 스키마

### 3.1 스튜디오 계약 시스템

```sql
-- worship_rooms 테이블 수정: 자동 생성 트리거 제거
-- 대신 옵트인 기반으로 변경

-- 트리거 비활성화
DROP TRIGGER IF EXISTS on_profile_created_create_room ON profiles;

-- worship_rooms에 is_active 컬럼 추가 (기존 방은 true)
ALTER TABLE worship_rooms 
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- 스튜디오 미개설 유저 확인용
-- worship_rooms 레코드 없음 = 스튜디오 없음
```

### 3.2 동적 포스트 카테고리

```sql
-- 새 테이블: studio_post_categories
CREATE TABLE IF NOT EXISTS studio_post_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,           -- 'prayer', 'note', 'testimony' 등
  label_en text NOT NULL,             -- 영문 라벨
  label_ko text NOT NULL,             -- 한글 라벨
  icon text NOT NULL DEFAULT 'FileText', -- lucide 아이콘 이름
  color text NOT NULL DEFAULT 'gray', -- 색상 키
  sort_order integer NOT NULL DEFAULT 0,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 기본 카테고리 삽입
INSERT INTO studio_post_categories (key, label_en, label_ko, icon, color, sort_order) VALUES
('prayer', 'Prayer', '기도', 'Heart', 'red', 1),
('note', 'Note', '노트', 'FileText', 'blue', 2),
('testimony', 'Testimony', '간증', 'Sparkles', 'yellow', 3),
('concern', 'Concern', '고민', 'HelpCircle', 'orange', 4),
('general', 'General', '일반', 'MessageSquare', 'gray', 5);

-- room_posts.post_type을 text로 변경 (enum 제거)
-- 마이그레이션 필요

-- RLS
ALTER TABLE studio_post_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read categories" ON studio_post_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON studio_post_categories FOR ALL USING (public.has_role(auth.uid(), 'admin'));
```

---

## 4. 신규 Admin 페이지

### 4.1 라우트 추가

```typescript
// App.tsx
<Route path="/admin/studio" element={<AdminRoute><AdminStudio /></AdminRoute>} />
```

### 4.2 AdminStudio 페이지 구조

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ 🎨 Worship Studio 관리                                                   │
├─────────────────────────────────────────────────────────────────────────┤
│ [카테고리] [앰버서더] [스튜디오 목록] [통계]                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ === 카테고리 탭 ===                                                      │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ 📝 노트      [✓ 활성]  [순서: 1]  [편집] [삭제]                      │ │
│ │ 🙏 기도      [✓ 활성]  [순서: 2]  [편집] [삭제]                      │ │
│ │ ✨ 간증      [✓ 활성]  [순서: 3]  [편집] [삭제]                      │ │
│ │ ❓ 고민      [✓ 활성]  [순서: 4]  [편집] [삭제]                      │ │
│ │ 💬 일반      [✓ 활성]  [순서: 5]  [편집] [삭제]                      │ │
│ │                                                                     │ │
│ │ [+ 카테고리 추가]                                                   │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ === 앰버서더 탭 ===                                                      │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ 👑 현재 앰버서더 (3명)                                               │ │
│ │   • 홍길동   [해제]                                                 │ │
│ │   • 김예배   [해제]                                                 │ │
│ │   • 박찬송   [해제]                                                 │ │
│ │                                                                     │ │
│ │ 🔍 앰버서더 추가: [유저 검색...]                                     │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ === 스튜디오 목록 탭 ===                                                 │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ 활성 스튜디오: 177개                                                │ │
│ │ [검색...]  [공개] [친구] [비공개]                                   │ │
│ │                                                                     │ │
│ │ • 홍길동 스튜디오  [공개]  포스트 12개  마지막 활동: 2시간 전       │ │
│ │ • 김예배 스튜디오  [친구]  포스트 8개   마지막 활동: 1일 전         │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ === 통계 탭 ===                                                          │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ 📊 총 스튜디오: 177개                                               │ │
│ │ 📝 총 포스트: 1,234개                                               │ │
│ │ 🙏 총 리액션: 5,678개                                               │ │
│ │ 📈 이번 주 신규: 12개                                               │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Full-Screen Immersive Experience

### 5.1 StudioPage 구조 (AppLayout 미사용)

```typescript
// src/pages/WorshipStudio.tsx (WorshipRooms.tsx 대체)
const WorshipStudio = () => {
  // AppLayout 사용 안 함 - 완전 독립 레이아웃
  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* 상단 헤더: 뒤로가기 + 액션 버튼 */}
      <StudioHeader onBack={() => navigate('/dashboard')} />
      
      {/* 메인 콘텐츠 영역 */}
      <div className="flex-1 overflow-hidden flex">
        {/* Desktop: Sidebar */}
        {!isMobile && <StudioSidebar />}
        
        {/* Main Panel with Tabs */}
        <StudioMainPanel />
      </div>
      
      {/* BGM Bar (조건부 표시) */}
      {currentStudioBgm && <StudioBGMBar />}
    </div>
  );
};
```

### 5.2 Bottom Nav 클릭 시 전환

```typescript
// BottomTabNavigation.tsx 수정
// /rooms 클릭 시 전체 화면으로 전환
// Link 대신 navigate 사용하여 전환 효과 적용 가능
```

---

## 6. 스튜디오 계약 시스템

### 6.1 계약 플로우

```text
1. 유저가 "내 스튜디오" 탭 클릭
2. worship_rooms 레코드 확인
   - 있음: 스튜디오 표시
   - 없음: 계약 프롬프트 표시

┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                    🎨                                                   │
│                                                                         │
│              나만의 예배공작소를 열어보세요                               │
│                                                                         │
│   "예배는 삶입니다. 공작소는 그 삶이 쌓이는 곳입니다."                    │
│                                                                         │
│   스튜디오에서 할 수 있는 것들:                                          │
│   ✓ 기도, 묵상, 간증 기록하기                                           │
│   ✓ 친구들과 나눔하기                                                   │
│   ✓ BGM으로 분위기 만들기                                               │
│                                                                         │
│   [예, 스튜디오를 오픈합니다]    [나중에]                                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.2 스튜디오 생성 로직

```typescript
// useCreateStudio hook
const createStudio = useMutation({
  mutationFn: async () => {
    const { data, error } = await supabase
      .from('worship_rooms')
      .insert({
        owner_user_id: user.id,
        visibility: 'friends',
        is_active: true,
        theme_config: {
          wallpaper: 'default',
          backgroundColor: '#f8fafc',
        }
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
});
```

---

## 7. BGM 동작 수정

### 7.1 현재 vs 수정

| 항목 | 현재 | 수정 |
|------|------|------|
| 바 표시 | 재생 시작 시 | **스튜디오 입장 시 자동 표시** |
| 재생 시작 | 자동 | **플레이 버튼 클릭 시** |
| 바 위치 | GlobalMiniPlayer | **StudioBGMBar (스튜디오 전용)** |

### 7.2 StudioBGMBar 컴포넌트

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ 🎵 Amazing Grace - Chris Tomlin        [▶️]  [⏭️]  [🔊]              │
└─────────────────────────────────────────────────────────────────────────┘

// 재생 전
┌─────────────────────────────────────────────────────────────────────────┐
│ 🎵 Amazing Grace - Chris Tomlin        [▶️ 재생]                       │
└─────────────────────────────────────────────────────────────────────────┘

// 재생 중
┌─────────────────────────────────────────────────────────────────────────┐
│ 🎵 Amazing Grace - Chris Tomlin  ━━━━━●━━━━━  [⏸️] [⏭️]  1:23/4:56   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 8. 파일 구조 (최종)

### 8.1 삭제

```text
src/components/worship-rooms/
├── hooks/useFurnitureEditor.ts         ❌ 삭제
├── DraggableFurniture.tsx              ❌ 삭제
├── EditableFurnitureLayer.tsx          ❌ 삭제
├── FloorSlots.ts                       ❌ 삭제
├── FurnitureSprites.tsx                ❌ 삭제
├── GridOverlay.tsx                     ❌ 삭제
├── IsometricAvatar.tsx                 ❌ 삭제
├── IsometricFurnitureLayer.tsx         ❌ 삭제
├── IsometricRoomSVG.tsx                ❌ 삭제
├── IsometricStatusBubble.tsx           ❌ 삭제
├── IsometricTalkBubble.tsx             ❌ 삭제
├── RoomBackground.tsx                  ❌ 삭제
├── RoomCanvas.tsx                      ❌ 삭제
├── RoomFurnitureCatalog.tsx            ❌ 삭제
├── RoomFurnitureLayer.tsx              ❌ 삭제
├── RoomMiniAvatar.tsx                  ❌ 삭제
├── RoomPostObject.tsx                  ❌ 삭제
├── RoomScene.tsx                       ❌ 삭제
├── RoomSceneLayout.tsx                 ❌ 삭제
├── RoomStatusBubble.tsx                ❌ 삭제
└── RoomTalkBubble.tsx                  ❌ 삭제
```

### 8.2 신규 생성

```text
src/components/worship-studio/
├── StudioPage.tsx                      🆕 메인 full-screen 페이지
├── StudioHeader.tsx                    🆕 상단 헤더 (뒤로가기 포함)
├── StudioSidebar.tsx                   🆕 사이드바 (친구/앰버서더/탐색)
├── StudioMainPanel.tsx                 🆕 메인 패널 (탭 + 콘텐츠)
├── StudioFeed.tsx                      🆕 피드 탭
├── StudioFeedCard.tsx                  🆕 피드 카드
├── StudioView.tsx                      🆕 스튜디오 뷰 (프로필)
├── StudioModules.tsx                   🆕 모듈 컬렉션
├── StudioPostComposer.tsx              🆕 포스트 작성기
├── StudioSettingsDialog.tsx            🆕 설정 다이얼로그
├── StudioBGMBar.tsx                    🆕 BGM 바 (하단 고정)
├── StudioBGMSelector.tsx               ♻️ RoomBGMSelector 리팩터
├── StudioEmptyState.tsx                🆕 빈 스튜디오 상태
├── StudioLockedState.tsx               🆕 접근 불가 상태
├── StudioContractPrompt.tsx            🆕 스튜디오 계약 프롬프트
├── FriendStudioList.tsx                🆕 친구 스튜디오 목록
├── VisibilityBadge.tsx                 ♻️ 기존 유지
├── FriendRequestButton.tsx             ♻️ 기존 유지
└── index.ts                            🆕 배럴 export

src/pages/
├── WorshipStudio.tsx                   🆕 (WorshipRooms.tsx 대체)
└── AdminStudio.tsx                     🆕 Admin 스튜디오 관리

src/hooks/
├── useStudioFeed.ts                    🆕 피드 데이터
├── useFriendStudios.ts                 🆕 친구 스튜디오
├── useStudioCategories.ts              🆕 동적 카테고리
└── useCreateStudio.ts                  🆕 스튜디오 생성
```

### 8.3 수정

| 파일 | 변경 내용 |
|------|----------|
| `src/App.tsx` | WorshipRooms → WorshipStudio, AdminStudio 라우트 추가 |
| `src/lib/translations.ts` | studio 섹션 추가 |
| `src/lib/navigationConfig.ts` | 아이콘 변경 (Palette) |
| `src/components/admin/AdminNav.tsx` | Studio 메뉴 추가 |
| `src/hooks/useWorshipRoom.ts` | 스튜디오 존재 여부 체크 로직 추가 |
| `src/hooks/useRoomPosts.ts` | 동적 카테고리 지원 |

---

## 9. 마이그레이션 순서

### Phase 1: DB 스키마 (안전)
1. `studio_post_categories` 테이블 생성
2. 기본 카테고리 데이터 삽입
3. `worship_rooms.is_active` 컬럼 추가
4. 자동 생성 트리거 비활성화

### Phase 2: Admin 페이지
5. `AdminStudio.tsx` 생성
6. 카테고리 CRUD UI 구현
7. 앰버서더 관리 UI 구현
8. AdminNav에 메뉴 추가

### Phase 3: 코드 삭제
9. Isometric/가구 관련 파일 21개 삭제
10. 관련 import 정리

### Phase 4: 신규 컴포넌트
11. worship-studio 폴더 및 기본 컴포넌트 생성
12. StudioPage (full-screen) 구현
13. StudioBGMBar 구현
14. StudioContractPrompt 구현

### Phase 5: 피드 & 스튜디오 뷰
15. StudioFeed 구현
16. StudioView 구현
17. StudioModules 구현

### Phase 6: 사이드바 & 탐색
18. StudioSidebar 구현
19. FriendStudioList 구현
20. 탐색 기능 구현

### Phase 7: 번역 & 네비게이션
21. translations.ts 업데이트
22. navigationConfig.ts 업데이트
23. BottomTabNavigation 수정

### Phase 8: 통합 테스트
24. 전체 플로우 테스트
25. BGM 동작 확인
26. 계약 시스템 확인

---

## 10. 번역 키 (수정)

```typescript
studio: {
  title: "Worship Studio",
  titleKo: "예배공작소",
  
  // 철학 문구
  tagline: "Worship is a life. The Studio is where it accumulates.",
  taglineKo: "예배는 삶입니다. 공작소는 그 삶이 쌓이는 곳입니다.",
  
  // 탭
  feed: "Feed",
  feedKo: "피드",
  myStudio: "My Studio", 
  myStudioKo: "내 스튜디오",
  discover: "Discover",
  discoverKo: "탐색",
  
  // 계약 프롬프트
  contractTitle: "Open your own Worship Studio",
  contractTitleKo: "나만의 예배공작소를 열어보세요",
  contractBody: "A workshop for the worshiper—where life becomes ministry.",
  contractBodyKo: "예배자를 위한 작업실—삶이 사역이 되는 곳.",
  contractConfirm: "Yes, open my Studio",
  contractConfirmKo: "예, 스튜디오를 오픈합니다",
  contractLater: "Later",
  contractLaterKo: "나중에",
  
  // BGM
  bgmTitle: "Studio BGM",
  bgmTitleKo: "스튜디오 BGM",
  bgmPlay: "Play",
  bgmPlayKo: "재생",
  bgmChange: "Change BGM",
  bgmChangeKo: "BGM 변경",
  
  // ... 기존 번역 유지
}
```

---

## 11. 신뢰성 체크리스트

- [ ] `/rooms` 라우트가 full-screen으로 로드됨
- [ ] 기존 스튜디오(177개) 정상 표시
- [ ] 스튜디오 없는 유저에게 계약 프롬프트 표시
- [ ] 계약 후 스튜디오 생성 및 표시
- [ ] 포스트 카테고리가 Admin에서 관리 가능
- [ ] 피드에서 친구/앰버서더 포스트 표시
- [ ] BGM 바가 스튜디오 입장 시 표시 (수동 재생)
- [ ] 친구 시스템 정상 작동
- [ ] Isometric 관련 코드 완전 제거 (import 에러 없음)

---

## 12. 기술 노트

### Full-Screen 구현

```typescript
// StudioPage.tsx
// AppLayout 사용 안 함 - 완전 독립
// z-50 + fixed inset-0으로 전체 화면 점유
// 하단 네비게이션 숨김 (스튜디오 내부에서만)
```

### 기존 데이터 보존

- 177개 기존 스튜디오: `is_active = true`로 마이그레이션
- 기존 포스트: 그대로 유지
- 기존 리액션: 그대로 유지
- 친구 관계: 그대로 유지

### 성능 고려

- 가구 관련 코드 삭제로 번들 크기 감소
- 캔버스 렌더링 제거로 모바일 성능 향상
- 옵트인 시스템으로 DB 부하 감소 (미사용 유저는 레코드 없음)
