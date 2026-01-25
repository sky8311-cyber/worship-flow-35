

# 예배공작소 위젯 시스템 종합 감사 및 개선 계획

## 현재 문제점 분석

### 1. 위젯 기능 부재

| 문제 | 현재 상태 | 필요 사항 |
|------|----------|----------|
| **이미지 추가** | 위젯 생성만 됨, 업로드 UI 없음 | 이미지 업로드 다이얼로그 필요 |
| **초안함 불러오기** | Post 위젯 placeholder만 존재 | 초안함 목록에서 선택하는 UI 필요 |
| **YouTube/링크 입력** | Video 위젯 placeholder만 존재 | URL 입력 다이얼로그 필요 |
| **스크롤** | StudioView에 ScrollArea 있으나 작동 안함 | 컨테이너 높이 문제 해결 필요 |

### 2. 그리드 설정 부재

- 그리드 컬럼 수 변경 UI 없음 (DB에는 `grid_columns` 컬럼 존재)
- 위젯 개수 제한 없음 (무한 추가 가능)
- 갤러리/테이블 뷰 전환 없음

### 3. 철학/온보딩 부재

- 빈 스튜디오 Empty State가 단조로움
- "스튜디오 놀러가기" 같은 재미있는 안내 없음
- 예배공작소 철학 표현 부족

### 4. 추가 위젯 필요

현재 위젯: `text`, `heading`, `quote`, `callout`, `image`, `video`, `post`, `todo`, `bullet-list`, `numbered-list`, `divider`

**필요한 추가 위젯:**
- 외부 링크 (External Link)
- 노래/음악 (Song/Music)
- 최근 초안 자동 표시 (Recent Drafts)
- 갤러리 (Gallery - 여러 이미지)
- 프로필 카드 (Profile Card)
- 성경 말씀 (Bible Verse)

---

## 구현 계획

### Phase 1: 위젯 편집 다이얼로그 시스템

**신규 컴포넌트: `WidgetEditDialog.tsx`**

```text
┌─────────────────────────────────────────────────────┐
│  위젯 편집                                     [X]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [타입별 편집 폼]                                   │
│                                                     │
│  - 텍스트: Textarea                                │
│  - 이미지: 파일 업로드 + 미리보기                   │
│  - 영상: YouTube URL 입력                          │
│  - 게시물: 초안함 목록에서 선택                     │
│  - 외부링크: URL + 제목 + 아이콘                   │
│                                                     │
├─────────────────────────────────────────────────────┤
│               [취소]           [저장]               │
└─────────────────────────────────────────────────────┘
```

**구현 세부사항:**

1. `WidgetEditDialog.tsx` - 통합 편집 다이얼로그
2. `ImageUploader.tsx` - 이미지 업로드 with 미리보기
3. `VideoUrlInput.tsx` - YouTube/Vimeo URL 입력 with 썸네일 미리보기
4. `PostSelector.tsx` - 초안함에서 게시물 선택
5. `ExternalLinkEditor.tsx` - URL + 메타데이터 편집

### Phase 2: 스크롤 및 레이아웃 수정

**문제:** `StudioView.tsx`의 `ScrollArea`가 작동하지 않음

**원인:** 부모 컨테이너 높이 문제

**수정 사항:**
- `StudioMainPanel.tsx`: TabsContent에 `h-0 flex-1` 추가
- `StudioView.tsx`: ScrollArea에 `h-full` 확인
- `StudioGrid.tsx`: 내부 컨텐츠 min-height 제거

### Phase 3: 그리드 설정 UI

**StudioSettingsDialog 또는 새 GridSettingsPanel에 추가:**

```text
┌─────────────────────────────────────────────────────┐
│  그리드 설정                                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  컬럼 수:  [2] [3] [4]                              │
│                                                     │
│  레이아웃: [○ 그리드] [○ 갤러리] [○ 리스트]        │
│                                                     │
│  최대 위젯 수: [12] ▼                               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**DB 변경:** `worship_rooms` 테이블에 `layout_type` 컬럼 추가 (`grid`, `gallery`, `list`)

### Phase 4: 새로운 위젯 타입 추가

**4.1 외부 링크 위젯 (`external-link`)**

```typescript
type WidgetContent = {
  // ... existing
  url?: string;
  linkTitle?: string;
  linkDescription?: string;
  linkIcon?: string; // 이모지 또는 아이콘 이름
  linkType?: "youtube-channel" | "book" | "ebook" | "website" | "social" | "other";
};
```

**렌더링:**
```text
┌─────────────────────────────────────────────────────┐
│ 🎬 유튜브 채널                                       │
│ "홍길동의 예배 채널"                                 │
│ youtube.com/@worshipchannel                          │
│                                           [→ 방문]  │
└─────────────────────────────────────────────────────┘
```

**4.2 노래/음악 위젯 (`song`)**

기존 DB의 `songs` 테이블과 연동하거나, 단순 임베드

```typescript
type WidgetContent = {
  // ... existing
  songTitle?: string;
  songArtist?: string;
  songUrl?: string; // YouTube/Spotify/etc
  isOriginal?: boolean; // 자작곡 여부
};
```

**4.3 최근 초안 위젯 (`recent-drafts`)**

자동으로 최근 N개 초안을 표시

```typescript
type WidgetContent = {
  // ... existing
  draftCount?: number; // 표시할 초안 수 (1-5)
  draftFilter?: string; // 카테고리 필터 (optional)
};
```

**렌더링:**
```text
┌─────────────────────────────────────────────────────┐
│ 📝 최근 노트                                        │
├─────────────────────────────────────────────────────┤
│ 🙏 오늘의 기도          2시간 전                    │
│ ✨ 주일 예배 묵상        어제                       │
│ 📝 성경공부 노트        3일 전                      │
└─────────────────────────────────────────────────────┘
```

**4.4 갤러리 위젯 (`gallery`)**

여러 이미지를 그리드로 표시

```typescript
type WidgetContent = {
  // ... existing
  images?: { url: string; alt?: string }[];
  galleryLayout?: "grid" | "carousel" | "masonry";
};
```

**4.5 성경 말씀 위젯 (`bible-verse`)**

```typescript
type WidgetContent = {
  // ... existing
  verseReference?: string; // "요한복음 3:16"
  verseText?: string;
  translation?: string; // "개역개정", "NIV", etc
};
```

**4.6 프로필 카드 위젯 (`profile-card`)**

```typescript
type WidgetContent = {
  // ... existing
  bio?: string;
  socialLinks?: { platform: string; url: string }[];
};
```

### Phase 5: 철학 표현 및 온보딩 개선

**5.1 빈 스튜디오 Empty State 개선**

현재:
```text
"나만의 공간을 꾸며보세요"
```

개선:
```text
┌─────────────────────────────────────────────────────┐
│                                                     │
│                       ✨                            │
│                                                     │
│         "예배는 일상에서 빚어집니다"                 │
│                                                     │
│    하나님이 오늘 빚어가시는 것들을 이곳에           │
│    하나씩 모아보세요—기도, 묵상, 노래               │
│                                                     │
│    [🎨 공간 꾸미기 시작]     [💡 어떻게 쓸까요?]    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**5.2 StudioEmptyState.tsx 개선**

- 철학적 메시지 추가
- 시작 가이드 링크
- 예시 스튜디오 둘러보기 버튼

**5.3 WelcomeGuideDialog 추가**

첫 방문 시 표시되는 가이드:
```text
┌─────────────────────────────────────────────────────┐
│  예배공작소에 오신 것을 환영합니다! 🎉              │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [1] 📝 먼저 '초안함'에서 기도나 묵상을 적어보세요   │
│                                                     │
│  [2] 🧩 그리드에 위젯을 추가해 공간을 꾸며보세요     │
│                                                     │
│  [3] 🎵 BGM을 설정해 분위기를 만들어보세요          │
│                                                     │
│  [4] 👋 친구를 초대해 서로의 공간을 방문해보세요     │
│                                                     │
├─────────────────────────────────────────────────────┤
│  [앰버서더 스튜디오 둘러보기]    [시작하기]         │
└─────────────────────────────────────────────────────┘
```

**5.4 Sidebar에 "스튜디오 놀러가기" 버튼 추가**

`CollapsibleSidebar.tsx`에 랜덤 공개 스튜디오 방문 버튼:
```text
[🎲 랜덤 스튜디오 방문]
```

### Phase 6: WidgetPalette 개선

현재 팔레트를 카테고리별로 그룹화:

```text
┌─────────────────────────────────────────────────────┐
│  위젯 추가                                          │
├─────────────────────────────────────────────────────┤
│  📝 기본                                            │
│    텍스트 | 제목 | 인용구 | 콜아웃 | 구분선         │
│                                                     │
│  🎨 미디어                                          │
│    이미지 | 갤러리 | 영상 | 노래                    │
│                                                     │
│  📋 목록                                            │
│    체크리스트 | 글머리 | 번호목록                   │
│                                                     │
│  🔗 임베드                                          │
│    게시물 | 최근초안 | 외부링크 | 성경말씀          │
│                                                     │
│  ℹ️ 정보                                            │
│    프로필카드                                       │
└─────────────────────────────────────────────────────┘
```

---

## 파일 변경 요약

### 신규 생성

| 파일 | 설명 |
|------|------|
| `grid/WidgetEditDialog.tsx` | 위젯 편집 통합 다이얼로그 |
| `grid/editors/ImageEditor.tsx` | 이미지 업로드 폼 |
| `grid/editors/VideoEditor.tsx` | 영상 URL 입력 폼 |
| `grid/editors/PostSelector.tsx` | 초안함 게시물 선택기 |
| `grid/editors/ExternalLinkEditor.tsx` | 외부 링크 편집기 |
| `grid/editors/ListEditor.tsx` | 체크리스트/목록 편집기 |
| `grid/editors/GalleryEditor.tsx` | 갤러리 편집기 |
| `grid/editors/BibleVerseEditor.tsx` | 성경 말씀 편집기 |
| `grid/editors/SongEditor.tsx` | 노래 위젯 편집기 |
| `grid/GridSettingsPanel.tsx` | 그리드 설정 패널 |
| `WelcomeGuideDialog.tsx` | 첫 방문 가이드 |

### 수정

| 파일 | 변경 사항 |
|------|----------|
| `useStudioWidgets.ts` | 새 위젯 타입 추가 (`external-link`, `song`, `recent-drafts`, `gallery`, `bible-verse`, `profile-card`) |
| `WidgetPalette.tsx` | 카테고리별 그룹화, 새 위젯 추가 |
| `WidgetRenderer.tsx` | 새 위젯 렌더링 로직 추가 |
| `StudioWidget.tsx` | onEdit 콜백 연결 |
| `StudioGrid.tsx` | 위젯 편집 다이얼로그 통합, 위젯 개수 제한 |
| `StudioMainPanel.tsx` | TabsContent 높이 수정 (`h-0 flex-1`) |
| `StudioView.tsx` | 스크롤 컨테이너 수정 |
| `StudioEmptyState.tsx` | 철학 메시지 추가, 가이드 버튼 |
| `CollapsibleSidebar.tsx` | "랜덤 스튜디오 방문" 버튼 추가 |
| `StudioSettingsDialog.tsx` | 그리드 설정 추가 |

### DB 마이그레이션

```sql
-- worship_rooms에 레이아웃 타입 추가
ALTER TABLE worship_rooms 
  ADD COLUMN IF NOT EXISTS layout_type text DEFAULT 'grid' CHECK (layout_type IN ('grid', 'gallery', 'list')),
  ADD COLUMN IF NOT EXISTS max_widgets integer DEFAULT 20;
```

---

## 구현 우선순위

### 높음 (즉시 필요)
1. 스크롤 문제 해결
2. 이미지 업로드 다이얼로그
3. 영상 URL 입력 다이얼로그
4. 초안함에서 게시물 불러오기

### 중간 (핵심 기능)
5. 외부 링크 위젯
6. 노래/음악 위젯
7. 그리드 설정 (컬럼 수)
8. 위젯 편집 기능 (현재 삭제만 가능)

### 낮음 (개선)
9. 최근 초안 자동 위젯
10. 갤러리 위젯
11. 성경 말씀 위젯
12. 온보딩 가이드
13. 랜덤 스튜디오 방문

---

## 기술 고려사항

### 이미지 업로드
- 기존 `component-images` 버킷 사용
- 경로: `studio-widgets/{room_id}/{widget_id}.{ext}`
- 최대 크기: 5MB

### YouTube 썸네일 미리보기
```typescript
const getThumbnail = (videoId: string) => 
  `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
```

### 위젯 개수 제한
- 기본 최대 20개
- 프리미엄 사용자: 50개

### 성능 최적화
- 이미지 lazy loading
- 위젯 가상화 (많을 경우)

