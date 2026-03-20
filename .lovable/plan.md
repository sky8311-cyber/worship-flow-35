

## SongCard & SongTable Draft 상태 UI 추가

### 현황 확인 결과

**Draft 비공개 보호 상태:**

| 위치 | `published` 필터 | 상태 |
|---|---|---|
| `SongLibrary.tsx` | 클라이언트 필터 (`created_by !== user.id` → hide) | ✅ |
| `RoomBGMSelector.tsx` | `.eq("status", "published")` | ✅ |
| `ArtistSelector.tsx` | `.eq("status", "published")` | ✅ |
| `SetImportDialog.tsx` | **없음** | ❌ 수정 필요 |
| `StudioBGMSelector.tsx` | **없음** | ❌ 수정 필요 |
| `SongSelectorDialog.tsx` (에디터) | **없음** | ❌ 수정 필요 |

→ 3개 파일에서 draft 곡이 다른 사용자에게 노출될 수 있음. 함께 수정합니다.

---

### 변경사항

#### 1. SongCard (`src/components/SongCard.tsx`)

- `song.status === 'draft'`일 때:
  - 카드 우상단에 주황색 "임시저장" 배지 (absolute position)
  - 미디어 버튼(YouTube/Score) 숨김
  - 기존 action 버튼(edit/delete/cart/favorite 등) 대신 **"곡 등록 마무리"** 버튼 1개만 표시
  - 클릭 시 `onEdit(song)` 호출 → SongDialog에서 SmartSongFlow 재개
- published 곡: 기존 동작 100% 유지

#### 2. SongTable (`src/components/SongTable.tsx`)

- `song.status === 'draft'`일 때:
  - 제목 옆에 주황색 "임시저장" 배지
  - action 셀: 기존 버튼 대신 "마무리" 버튼
  - 행에 `opacity-70` 스타일
- published 곡: 기존 동작 100% 유지

#### 3. Draft 누출 방지 (published 필터 추가)

| 파일 | 변경 |
|---|---|
| `SetImportDialog.tsx` (line 67) | `.eq("status", "published")` 추가 |
| `StudioBGMSelector.tsx` (line 26) | `.eq("status", "published")` 추가 |
| `SongSelectorDialog.tsx` (line 36) | `.eq("status", "published")` 추가 |

---

### 수정 파일 총 5개

1. `src/components/SongCard.tsx` — draft 배지 + 마무리 버튼
2. `src/components/SongTable.tsx` — draft 배지 + 마무리 버튼
3. `src/components/SetImportDialog.tsx` — published 필터
4. `src/components/worship-studio/StudioBGMSelector.tsx` — published 필터
5. `src/components/worship-studio/editor/SongSelectorDialog.tsx` — published 필터

