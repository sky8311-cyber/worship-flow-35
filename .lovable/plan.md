

## 곡 라이브러리 UI 개선 — 선택 모드 제거, 툴팁, 카트 아이콘

### 문제 요약
1. **"Select Songs" 체크모드** — 선택 후 할 수 있는 건 일괄편집/삭제뿐인데, 카트에 추가하는 기능과 혼동됨
2. **SongCard 액션 버튼 6개에 툴팁 없음** — `title` 속성만 있어 데스크탑에서도 즉시 알 수 없음
3. **카드의 `+` 버튼 ↔ 플로팅 `+` 버튼 혼동** — 둘 다 Plus 아이콘이지만 기능이 완전히 다름
4. **카트 아이콘이 0개일 때 안 보임** — 카트 기능 자체를 인지하기 어려움

---

### 변경 계획

#### 1. "Select Songs" 선택 모드 제거
**파일:** `SongLibrary.tsx`, `SongCard.tsx`, `SongTable.tsx`

- `selectionMode`, `selectedSongIds`, `BulkActionsBar` 관련 코드 전부 제거
- 모바일/데스크탑 양쪽의 `CheckSquare` 버튼 제거
- `bulkEditMode`, `showDeleteConfirm` 등 관련 상태도 제거
- SongCard/SongTable에서 `selectionMode` prop 제거

#### 2. SongCard 액션 버튼에 Tooltip 추가
**파일:** `SongCard.tsx`

현재 `title` 속성 → `<Tooltip>` 컴포넌트로 교체 (6개 버튼 모두):

| 버튼 | 아이콘 | 툴팁 내용 |
|------|--------|----------|
| 카트 추가 | `ShoppingCart` (변경) | "워십세트 카트에 추가" / "Add to worship set cart" |
| 사용 이력 | `BarChart3` | 기존 title 유지 |
| 즐겨찾기 | `Heart` | FavoriteButton 자체 처리 |
| 편집 | `Edit` | 기존 title 유지 |
| 삭제 | `Trash2` | 기존 title 유지 |

#### 3. 카트 버튼 아이콘 변경 — `Plus` → `ShoppingCart`
**파일:** `SongCard.tsx`, `FloatingCartIndicator.tsx`, `SongCartPopover.tsx`

- Lucide에 `ShoppingCart` 아이콘 존재 — 장바구니 의미가 명확
- SongCard: `<Plus>` → `<ShoppingCart>` (카트에 추가 버튼)
- FloatingCartIndicator: `<Music>` → `<ShoppingCart>`
- SongCartPopover: `<Music>` → `<ShoppingCart>`
- 이렇게 하면 "곡 추가(Plus)"와 "카트에 담기(ShoppingCart)"가 시각적으로 구분됨

#### 4. 카트 아이콘 항상 표시 (0개일 때도)
**파일:** `SongCartPopover.tsx`, `FloatingCartIndicator.tsx`, `SongLibrary.tsx`

- `SongCartPopover`: `if (cartCount === 0) return null` 제거 → 항상 렌더링, 빈 카트일 때 "0" 배지 표시
- `FloatingCartIndicator`: `if (count === 0) return null` 제거 → 항상 표시, 0일 때도 배지 "0"
- `SongLibrary.tsx`: `{cartCount > 0 && ...}` 조건 제거

#### 5. 플로팅 버튼에 텍스트 라벨 추가
**파일:** `SongLibrary.tsx`

- 플로팅 "곡 추가" 버튼: 원형 → 알약형으로 변경, `<Plus>` + "곡 추가"/"Add Song" 텍스트
- 플로팅 카트 버튼: `<ShoppingCart>` + 배지 (기존 유지)

---

### 수정 파일
1. `src/pages/SongLibrary.tsx` — 선택 모드 제거, 플로팅 버튼 텍스트 추가, 카트 항상 표시
2. `src/components/SongCard.tsx` — 툴팁 추가, ShoppingCart 아이콘
3. `src/components/SongTable.tsx` — selectionMode prop 제거
4. `src/components/FloatingCartIndicator.tsx` — ShoppingCart 아이콘, 항상 표시
5. `src/components/SongCartPopover.tsx` — ShoppingCart 아이콘, 항상 표시
6. `src/components/BulkActionsBar.tsx` — 파일 삭제 또는 import 제거

