
## i18n: 오늘 추가된 한국어 UI 텍스트 영문 번역

### 접근
프로젝트는 `useTranslation` + `src/lib/translations.ts` 사용. 새 키를 `setBuilder` 섹션 하위 `progression` 그룹으로 추가하고, 기존 키는 재사용. BandView 게이트는 이미 인라인 EN/KO 처리됨(변경 불필요).

### 1. `src/lib/translations.ts` — 새 키 추가

**en.setBuilder.progression** (신규):
```ts
progression: {
  title: "Performance Settings",
  bpm: "BPM",
  timeSignature: "Time Signature",
  energyLevel: "Energy Level",
  energyPlaceholder: "1-5",
  notes: "Notes",
  notesPlaceholder: "e.g. Chorus ×2, skip bridge",
  history: "History",
  historyTitle: "Performance History",
  historyEmpty: "No saved history",
  save: "Save",
  saveSuccess: "Saved",
  saveError: "Failed to save",
  loadError: "Failed to load history",
}
```

**en.setBuilder.reorder** (신규):
```ts
reorder: {
  title: "Reorder Songs",
  tooltip: "Reorder songs",
  componentTooltip: "Reorder",
  hint: "Click a number to reorder",
  cancel: "Cancel",
  save: "Save",
}
```

**en.setSongScoreDialog** (신규 또는 setSongItem 내):
```ts
score: {
  vaultTab: "Score History",
  webTab: "Search Web",
  uploadTab: "My Uploads",
  vaultLoadError: "Failed to load score history",
  vaultDeleteTitle: "Delete from score history",
}
```

**ko** 동일 구조로 한국어 원문 매핑:
- progression: `진행 설정 / BPM / 박자 / 에너지 레벨 / 1-5 / 진행설명 / 예: 후렴 2번 반복, 브리지 생략 / 이력 / 진행 설정 이력 / 저장된 이력이 없습니다 / 저장 / 저장되었습니다 / 저장 실패 / 이력 불러오기 실패`
- reorder: `곡 순서 변경 / 곡 순서 변경 / 순서 변경 / 번호를 눌러 순서를 변경할 수 있어요 / 취소 / 저장`
- score: `히스토리 클라우드 / 악보 웹 검색 / 내 악보 업로드 / 히스토리 클라우드 불러오기 실패 / 히스토리 클라우드에서 삭제`

> 기존 `setSongItem.score = "악보 선택" / "Select Score"` 는 이미 존재 — 변경 없음.
> 기존 `common.cancel / common.save` 는 재사용 가능.

### 2. 컴포넌트 적용

**`src/components/set-builder/SongProgressionSettings.tsx`**:
- `useTranslation` import 추가
- `진행 설정` → `t("setBuilder.progression.title")`
- `이력` 버튼 → `t("setBuilder.progression.history")`
- `진행 설정 이력` → `t("setBuilder.progression.historyTitle")`
- `저장된 이력이 없습니다` → `t("setBuilder.progression.historyEmpty")`
- `저장` → `t("setBuilder.progression.save")`
- toast: `저장되었습니다 / 저장 실패 / 이력 불러오기 실패` → 각 키

**`src/components/SetSongItem.tsx`** (라인 339, 353, 357, 204):
- `에너지 레벨` → `t("setBuilder.progression.energyLevel")`
- `진행설명` 라벨 → `t("setBuilder.progression.notes")`
- placeholder `예: 후렴...` → `t("setBuilder.progression.notesPlaceholder")`
- Tooltip `곡 순서 변경` → `t("setBuilder.reorder.tooltip")`
- (참고: `악보 선택` 라인 442는 이미 `setSongItem.score` 존재 → `t("setSongItem.score")`로 교체)

**`src/components/SetComponentItem.tsx`** (라인 120):
- Tooltip `순서 변경` → `t("setBuilder.reorder.componentTooltip")`

**`src/components/set-builder/ReorderItemsDialog.tsx`**:
- `useTranslation` import
- DialogTitle `곡 순서 변경` → `t("setBuilder.reorder.title")`
- 버튼 `취소` → `t("common.cancel")`, `저장` → `t("common.save")`

**`src/components/SetSongScoreDialog.tsx`**:
- 탭 `히스토리 클라우드` → `t("setSongItem.score.vaultTab")` (또는 별도 키)
- 탭 `악보 웹 검색`, `내 악보 업로드` → 각 키
- toast `히스토리 클라우드 불러오기 실패` → 키
- title `히스토리 클라우드에서 삭제` → 키

**`src/pages/SetBuilder.tsx`** (이전에 추가한 hint):
- `번호를 눌러 순서를 변경할 수 있어요` → `t("setBuilder.reorder.hint")`

### 3. BandView 게이트 — 변경 없음
`BandViewAccessGate.tsx` 의 모든 안내 문구는 이미 `language === "ko"` 분기로 EN/KO 모두 존재. 확인 완료, 그대로 유지.

### 영향 파일
1. `src/lib/translations.ts` — 신규 키 추가 (en/ko 양쪽)
2. `src/components/set-builder/SongProgressionSettings.tsx`
3. `src/components/SetSongItem.tsx`
4. `src/components/SetComponentItem.tsx`
5. `src/components/set-builder/ReorderItemsDialog.tsx`
6. `src/components/SetSongScoreDialog.tsx`
7. `src/pages/SetBuilder.tsx`
