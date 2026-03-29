

# 페이지 삭제 버튼 수정 + 블록 폰트 전체 표준화

## 문제 1: 페이지 삭제 버튼이 세팅 버튼에 가려져 클릭 불가
현재 페이지 삭제 버튼이 `absolute top-2 right-2 z-20`으로 각 페이지 내부에 배치되어 있으나, 캔버스 상단 컨트롤 바(`z-30`)에 가려짐.

## 해결: 삭제 버튼 위치 변경

### 데스크탑 (각 페이지마다 삭제 버튼)
- 각 페이지 내부의 삭제 버튼을 제거하고, **캔버스 상단 컨트롤 바**에 편집 모드일 때 "저장" → "취소" → **"🗑️ 삭제"** 순서로 배치
- 2페이지 스프레드에서는 좌측/우측 페이지 각각에 대한 삭제 버튼 2개를 표시: "P{n+1} 삭제", "P{n+2} 삭제"
- 삭제 시 `onDeletePage(해당 페이지 번호)` 호출

### 모바일
- 편집 모드에서 FAB 영역에 기존 "블록 추가/수정" 버튼 위에 "🗑️ 캔버스 삭제" 버튼을 같은 크기로 추가
- 클릭 시 현재 `currentPage`를 삭제

**파일:** `src/components/worship-studio/spaces/SpaceCanvas.tsx`
- `renderPage` 내부의 페이지 삭제 버튼 제거
- 상단 컨트롤 바에서 편집 모드일 때 저장/취소 뒤에 각 visible 페이지에 대한 삭제 버튼 추가
- `pageCount > 1` 조건 유지

**파일:** `src/components/worship-studio/StudioMainPanel.tsx`
- 모바일 FAB 영역에 "캔버스 삭제" 버튼 추가 (편집 모드 + `pageCount > 1` 조건)
- `currentPage`를 `handleDeletePage`에 전달

## 문제 2: 블록 폰트가 전체적으로 너무 큼

### 현재 → 변경 (전체 표준화: text-xs 기반, 강조만 text-sm~base)

| 블록 | 현재 | 변경 |
|------|------|------|
| **TitleBlock** | default `2xl`, options `xl/2xl/3xl` | default `lg`, options `sm/base/lg` |
| **SubtitleBlock** | default `md`(=base), options `sm/md/lg` | default `sm`, options `xs/sm/base` |
| **StickyNoteBlock** | `text-sm` | `text-xs` |
| **NumberedListBlock** | `text-sm` | `text-xs` |
| **ChecklistBlock** | `text-sm` | `text-xs` |
| **MusicBlock** | title `text-sm`, artist `text-xs` | title `text-xs font-medium`, artist `text-[10px]` |
| **BusinessCardBlock** | name `text-base`, role/email/phone `text-xs` | name `text-sm`, 나머지 `text-[10px]` |
| **LinkButtonBlock** | `text-sm` | `text-xs` |
| **FileDownloadBlock** | filename `text-xs`, size `text-[10px]` | 유지 (이미 작음) |
| **PhotoBlock** | placeholder `text-xs` | 유지 |
| **YoutubeBlock** | placeholder `text-xs` | 유지 |
| **SpaceWorshipSetBlock** | `text-xs` | 유지 |
| **BlockSettingsPanel** | title fontSize options `xl/2xl/3xl` | `sm/base/lg` |
| **BlockSettingsPanel** | subtitle fontSize options `sm/md/lg` | `xs/sm/base` |

### 파일 변경

| 파일 | 변경 |
|------|------|
| `SpaceCanvas.tsx` | 페이지 내부 삭제 버튼 제거, 상단 바에 삭제 버튼 추가 |
| `StudioMainPanel.tsx` | 모바일 FAB에 캔버스 삭제 버튼 추가 |
| `TitleBlock.tsx` | FONT_MAP → `{sm: "text-sm", base: "text-base", lg: "text-lg"}`, default `lg` |
| `SubtitleBlock.tsx` | FONT_MAP → `{xs: "text-xs", sm: "text-sm", base: "text-base"}`, default `sm` |
| `StickyNoteBlock.tsx` | text-sm → text-xs |
| `NumberedListBlock.tsx` | text-sm → text-xs |
| `ChecklistBlock.tsx` | text-sm → text-xs |
| `MusicBlock.tsx` | title text-sm → text-xs, artist text-xs → text-[10px] |
| `BusinessCardBlock.tsx` | name text-base → text-sm, role/email/phone text-xs → text-[10px] |
| `LinkButtonBlock.tsx` | text-sm → text-xs |
| `BlockSettingsPanel.tsx` | title options `xl/2xl/3xl` → `sm/base/lg`, subtitle options `sm/md/lg` → `xs/sm/base` |

