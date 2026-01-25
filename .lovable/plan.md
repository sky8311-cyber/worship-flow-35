
# 예배공작소 UI/UX 대폭 리뉴얼 - 노션/핀터레스트 스타일 그리드 시스템

## 현재 상태 분석

현재 스튜디오는 **정적인 리스트 기반 레이아웃**으로, 게시물이 카테고리별로 수직 정렬됩니다. 사용자가 제공한 Pinterest 참조 이미지처럼 **동적 Masonry 그리드 + 위젯 시스템**이 필요합니다.

## 변경 목표

| 영역 | 현재 | 목표 |
|------|------|------|
| 메인 레이아웃 | 수직 리스트 (post cards) | **Masonry Grid + 드래그 가능한 위젯** |
| 사이드바 | 항상 펼쳐진 280px | **기본 숨김 (아바타만 표시), 펼침 가능** |
| 헤더 | 설정/공유 버튼 노출 | **아바타 드롭다운 메뉴로 통합** |
| 콘텐츠 관리 | 바로 게시 | **Drafts 탭에서 작성 → 그리드에 임베드** |
| 커버/프로필 | 단순 배경색 | **커버 이미지 + 스튜디오 이름 커스터마이징** |

---

## 1. 신규 DB 스키마

### 1.1 스튜디오 위젯 테이블

```sql
-- 스튜디오 그리드 위젯 저장
CREATE TABLE studio_widgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES worship_rooms(id) ON DELETE CASCADE,
  widget_type text NOT NULL, -- 'text', 'heading', 'quote', 'callout', 'image', 'video', 'post', 'todo', 'numbered-list', 'bullet-list', 'divider'
  content jsonb NOT NULL DEFAULT '{}',
  -- Grid positioning (like CSS Grid)
  grid_column integer NOT NULL DEFAULT 1, -- 1-based column position
  grid_row integer NOT NULL DEFAULT 1,    -- 1-based row position
  column_span integer NOT NULL DEFAULT 1, -- number of columns to span
  row_span integer NOT NULL DEFAULT 1,    -- number of rows to span
  -- Optional link to existing post
  post_id uuid REFERENCES room_posts(id) ON DELETE SET NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_studio_widgets_room ON studio_widgets(room_id);
CREATE INDEX idx_studio_widgets_order ON studio_widgets(room_id, sort_order);

-- RLS
ALTER TABLE studio_widgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read public studio widgets" ON studio_widgets 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM worship_rooms wr 
      WHERE wr.id = studio_widgets.room_id 
      AND (wr.visibility = 'public' OR wr.owner_user_id = auth.uid())
    )
  );
CREATE POLICY "Owners can manage their widgets" ON studio_widgets 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM worship_rooms wr 
      WHERE wr.id = studio_widgets.room_id AND wr.owner_user_id = auth.uid()
    )
  );
```

### 1.2 worship_rooms 컬럼 추가

```sql
ALTER TABLE worship_rooms ADD COLUMN IF NOT EXISTS 
  cover_image_url text,
  studio_name text,
  grid_columns integer DEFAULT 3; -- 그리드 컬럼 수 설정
```

---

## 2. 아키텍처 개요

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  StudioHeader (슬림화)                                                        │
│  [←] [예배공작소]                     [🔔] [👤 프로필 메뉴 ▼]                 │
├──────┬───────────────────────────────────────────────────────────────────────┤
│      │  ┌──────────────────────────────────────────────────────────────────┐ │
│  📌  │  │  COVER IMAGE (업로드 가능)                                       │ │
│  ──  │  │  [스튜디오 이름] [✏️ 편집]                                       │ │
│  👤  │  ├──────────────────────────────────────────────────────────────────┤ │
│  👤  │  │  [피드] [내 스튜디오] [초안함]                                    │ │
│  👤  │  ├──────────────────────────────────────────────────────────────────┤ │
│  👤  │  │                                                                  │ │
│  👤  │  │  ┌─────────┐ ┌─────────────────┐ ┌─────────┐                     │ │
│  ──  │  │  │ 🖼 IMAGE │ │    QUOTE        │ │ 📝 TEXT │                     │ │
│  🔍  │  │  │         │ │  "Worship is... │ │         │                     │ │
│      │  │  └─────────┘ │                 │ └─────────┘                     │ │
│[펼침]│  │              │    "            │                                 │ │
│      │  │              └─────────────────┘ ┌──────────────┐                │ │
│      │  │  ┌─────────────────────────────┐ │ 📹 VIDEO     │                │ │
│      │  │  │   ✨ TESTIMONY (Post)       │ │ (YouTube)    │                │ │
│      │  │  │   "오늘 하나님께서..."       │ │              │                │ │
│      │  │  └─────────────────────────────┘ └──────────────┘                │ │
│      │  │                                                                  │ │
│      │  │  [+ 위젯 추가]                                                   │ │
│      │  └──────────────────────────────────────────────────────────────────┘ │
├──────┴───────────────────────────────────────────────────────────────────────┤
│  🎵 BGM Bar (조건부)                                                         │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. 컴포넌트 구조

### 3.1 신규 컴포넌트

| 컴포넌트 | 역할 |
|----------|------|
| `StudioGrid.tsx` | Masonry 그리드 컨테이너 (dnd-kit 통합) |
| `StudioWidget.tsx` | 개별 위젯 래퍼 (드래그 핸들, 리사이즈) |
| `WidgetRenderer.tsx` | 위젯 타입별 렌더링 분기 |
| `WidgetPalette.tsx` | 위젯 추가 팔레트 (노션 `/` 메뉴 스타일) |
| `widgets/TextWidget.tsx` | 텍스트 블록 |
| `widgets/HeadingWidget.tsx` | H1/H2/H3 헤딩 |
| `widgets/QuoteWidget.tsx` | 인용구 |
| `widgets/CalloutWidget.tsx` | 콜아웃 박스 |
| `widgets/ImageWidget.tsx` | 이미지 |
| `widgets/VideoWidget.tsx` | YouTube/비디오 임베드 |
| `widgets/PostWidget.tsx` | 기존 room_posts 임베드 |
| `widgets/TodoWidget.tsx` | 체크리스트 |
| `widgets/ListWidget.tsx` | 번호/글머리 기호 목록 |
| `widgets/DividerWidget.tsx` | 구분선 |
| `StudioDraftsTab.tsx` | 초안함 탭 (기존 포스트 관리) |
| `StudioCoverEditor.tsx` | 커버 이미지 + 이름 편집 |
| `CollapsibleSidebar.tsx` | 접힘/펼침 사이드바 |
| `ProfileDropdownMenu.tsx` | 아바타 클릭 시 드롭다운 |

### 3.2 수정할 컴포넌트

| 컴포넌트 | 변경 사항 |
|----------|----------|
| `StudioHeader.tsx` | 설정/공유 버튼 제거 → 아바타 드롭다운으로 이동 |
| `StudioSidebar.tsx` | 접힘 모드 (아바타만 표시), 검색 → 아이콘만 |
| `StudioMainPanel.tsx` | "Drafts" 탭 추가, "내 스튜디오"를 그리드 뷰로 변경 |
| `StudioView.tsx` | 리스트 → 그리드 레이아웃으로 전환 |
| `StudioViewHeader.tsx` | 커버 이미지 업로드, 스튜디오 이름 편집 기능 |
| `StudioModules.tsx` | 기존 리스트 → 그리드 위젯으로 마이그레이션 |
| `StudioPostComposer.tsx` | Drafts 탭 전용으로 이동 |

---

## 4. 위젯 타입 상세

### 4.1 위젯 content JSONB 스키마

```typescript
type WidgetContent = {
  // text, heading, quote
  text?: string;
  level?: 1 | 2 | 3; // heading level
  
  // image
  imageUrl?: string;
  alt?: string;
  
  // video
  videoUrl?: string;
  platform?: 'youtube' | 'vimeo';
  
  // post (links to room_posts)
  postId?: string;
  
  // callout
  icon?: string;
  backgroundColor?: string;
  
  // list (todo, bullet, numbered)
  items?: { id: string; text: string; checked?: boolean }[];
  listType?: 'bullet' | 'numbered' | 'todo';
};
```

### 4.2 위젯 렌더링 예시

```text
┌─────────────────────────────┐
│ ═══ HEADING ═══             │   widget_type: 'heading'
│   "오늘의 묵상"              │   content: { text: "오늘의 묵상", level: 1 }
└─────────────────────────────┘

┌─────────────────────────────┐
│ 📸 IMAGE                    │   widget_type: 'image'
│ [  실제 이미지 렌더링  ]     │   content: { imageUrl: "...", alt: "..." }
│                             │   row_span: 2 (더 크게)
└─────────────────────────────┘

┌─────────────────────────────┐
│ 💬 QUOTE                    │   widget_type: 'quote'
│   "예배는 삶입니다..."       │   content: { text: "..." }
│            - 작성자          │
└─────────────────────────────┘

┌─────────────────────────────┐
│ 🙏 기도 (from Drafts)       │   widget_type: 'post'
│   "주님, 오늘도 감사..."     │   post_id: "uuid"
│   ❤️ 12  💬 3               │   (room_posts 테이블에서 가져옴)
└─────────────────────────────┘
```

---

## 5. 사이드바 접힘/펼침 동작

### 5.1 접힌 상태 (기본)

```text
┌──────┐
│  📌  │  ← 내 스튜디오 (고정)
│  ──  │  ← 구분선
│  👤  │  ← 친구1 아바타
│  👤  │  ← 친구2 아바타
│  👤  │  ← 친구3 아바타
│  ──  │  ← 구분선
│  🔍  │  ← 검색 아이콘
│      │
│ [→]  │  ← 펼침 버튼
└──────┘
  48px
```

### 5.2 펼친 상태

```text
┌────────────────────────┐
│  🔍 스튜디오 검색...    │
├────────────────────────┤
│  👤 My Network         │
│    • 홍길동             │
│    • 김예배             │
│  👑 Ambassadors        │
│    • 앰버서더1          │
│  🌐 Discover           │
│    • 공개 스튜디오...    │
│                        │
│         [←]            │  ← 접기 버튼
└────────────────────────┘
     280px
```

---

## 6. 헤더 및 아바타 메뉴

### 6.1 새 헤더 레이아웃

```text
┌──────────────────────────────────────────────────────────────────┐
│  [←]  예배공작소                            [🔔] [👤 ▼]          │
└──────────────────────────────────────────────────────────────────┘
```

### 6.2 아바타 드롭다운 메뉴

```text
┌────────────────────────┐
│ 👤 홍길동               │
│    팀원 • 3 시드         │
├────────────────────────┤
│ ⚙️  스튜디오 설정        │
│ 🔗  링크 공유            │
│ 🎵  BGM 설정             │
│ 👁️  공개 설정            │
├────────────────────────┤
│ ❓  도움말               │
│ 🚪  나가기               │
└────────────────────────┘
```

---

## 7. 드래그 앤 드롭 구현

### 7.1 dnd-kit 통합 (기존 패턴 활용)

```typescript
// StudioGrid.tsx
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";

// rectSortingStrategy: 그리드 정렬에 최적화
// verticalListSortingStrategy 대신 사용
```

### 7.2 위젯 드래그 핸들

```typescript
// StudioWidget.tsx
const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ 
  id: widget.id 
});

// 드래그 핸들 아이콘 (GripVertical)
<button {...listeners} {...attributes}>
  <GripVertical className="h-4 w-4 text-muted-foreground" />
</button>
```

---

## 8. 커버 이미지 및 스튜디오 이름

### 8.1 StudioCoverEditor 컴포넌트

```text
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│                    [  COVER IMAGE  ]                             │
│                                                                  │
│  [📷 커버 변경]                                                   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  👤 [스튜디오 이름 입력...]                         [✏️]    │ │
│  │      "홍길동의 예배공작소"                                   │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  공개 설정: [친구 공개 ▼]                                        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 9. 탭 구조 변경

### 9.1 기존 vs 신규

| 기존 | 신규 |
|------|------|
| 피드 | 피드 (변경 없음) |
| 내 스튜디오 (리스트) | **내 스튜디오 (그리드)** |
| - | **초안함 (Drafts)** |
| 탐색 (모바일) | 탐색 (모바일, 변경 없음) |

### 9.2 탭 흐름

```text
[피드]        → 친구/앰버서더 포스트 모아보기 (변경 없음)
[내 스튜디오] → 그리드 위젯 뷰 (Masonry layout)
[초안함]      → 기존 포스트 작성/관리 (나만 보는 게시판)
                - 여기서 작성한 글을 그리드에 임베드 가능
```

---

## 10. 파일 구조 (최종)

### 10.1 신규 생성

```text
src/components/worship-studio/
├── grid/
│   ├── StudioGrid.tsx              🆕 Masonry 그리드 컨테이너
│   ├── StudioWidget.tsx            🆕 위젯 래퍼 (드래그/리사이즈)
│   ├── WidgetRenderer.tsx          🆕 타입별 렌더링 분기
│   └── WidgetPalette.tsx           🆕 위젯 추가 팔레트
│
├── widgets/
│   ├── TextWidget.tsx              🆕 텍스트
│   ├── HeadingWidget.tsx           🆕 헤딩
│   ├── QuoteWidget.tsx             🆕 인용구
│   ├── CalloutWidget.tsx           🆕 콜아웃
│   ├── ImageWidget.tsx             🆕 이미지
│   ├── VideoWidget.tsx             🆕 비디오 임베드
│   ├── PostWidget.tsx              🆕 포스트 임베드
│   ├── TodoWidget.tsx              🆕 체크리스트
│   ├── ListWidget.tsx              🆕 목록
│   └── DividerWidget.tsx           🆕 구분선
│
├── CollapsibleSidebar.tsx          🆕 접힘/펼침 사이드바
├── ProfileDropdownMenu.tsx         🆕 아바타 드롭다운
├── StudioCoverEditor.tsx           🆕 커버/이름 편집
└── StudioDraftsTab.tsx             🆕 초안함 탭

src/hooks/
└── useStudioWidgets.ts             🆕 위젯 CRUD 훅
```

### 10.2 수정

```text
src/components/worship-studio/
├── StudioHeader.tsx               ♻️ 슬림화 + 아바타 메뉴
├── StudioSidebar.tsx              ♻️ 접힘 모드 추가
├── StudioMainPanel.tsx            ♻️ Drafts 탭 추가
├── StudioView.tsx                 ♻️ 그리드 레이아웃으로 변경
├── StudioViewHeader.tsx           ♻️ 커버 이미지 지원
└── StudioModules.tsx              ♻️ 그리드 위젯으로 마이그레이션

src/pages/
└── WorshipStudio.tsx              ♻️ 사이드바 접힘 상태 관리
```

---

## 11. 마이그레이션 순서

### Phase 1: DB 스키마
1. `studio_widgets` 테이블 생성
2. `worship_rooms`에 `cover_image_url`, `studio_name`, `grid_columns` 컬럼 추가
3. RLS 정책 설정

### Phase 2: 사이드바 & 헤더 UX
4. `CollapsibleSidebar.tsx` 구현 (접힌 상태 기본)
5. `ProfileDropdownMenu.tsx` 구현
6. `StudioHeader.tsx` 슬림화

### Phase 3: 그리드 시스템
7. `useStudioWidgets.ts` 훅 구현
8. `StudioGrid.tsx` (dnd-kit Masonry)
9. `StudioWidget.tsx` (드래그 핸들)
10. `WidgetRenderer.tsx`

### Phase 4: 위젯 컴포넌트
11-20. 각 위젯 타입 컴포넌트 구현

### Phase 5: 탭 통합
21. `StudioDraftsTab.tsx` (기존 포스트 관리)
22. `StudioMainPanel.tsx` 탭 추가
23. `StudioView.tsx` 그리드 뷰 전환

### Phase 6: 커버 & 커스터마이징
24. `StudioCoverEditor.tsx`
25. `StudioViewHeader.tsx` 업데이트

### Phase 7: 번역 & 마무리
26. translations.ts 업데이트
27. 통합 테스트

---

## 12. 기술 고려사항

### 12.1 Masonry 그리드 구현

CSS Grid + dnd-kit 조합으로 구현합니다. `react-masonry-css` 같은 라이브러리 추가 없이 Tailwind CSS Grid로 충분합니다.

```css
/* Tailwind 클래스 */
grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-min
```

### 12.2 이미지 저장소

커버 이미지 및 위젯 이미지는 기존 `component-images` 버킷 사용 또는 새 `studio-media` 버킷 생성.

### 12.3 기존 데이터 마이그레이션

기존 `room_posts`는 그대로 유지되며, 사용자가 원할 때 그리드에 "Post Widget"으로 임베드할 수 있습니다. 강제 마이그레이션 없음.

---

## 13. 예상 결과물

- **Pinterest 스타일 Masonry 그리드**: 다양한 크기의 위젯이 자동 정렬
- **드래그 앤 드롭**: 위젯 순서/위치 변경 가능
- **노션 스타일 블록**: 텍스트, 헤딩, 리스트, 인용구 등 다양한 콘텐츠 타입
- **감성적 커스터마이징**: 커버 이미지, 스튜디오 이름
- **공간 효율성**: 접힘 사이드바, 아바타 메뉴로 컴팩트한 UI
- **유연한 콘텐츠 관리**: Drafts 탭에서 글 작성 → 원하는 위치에 임베드

