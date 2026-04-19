## 3가지 정리

### 1) 악보 관리 다이얼로그 — 이중 스크롤 제거 (데스크탑/iPad)

**현재** (`SetSongScoreDialog.tsx` 661-1003):

- `DialogContent`: `flex flex-col`, `maxHeight: calc(100dvh - 2rem)`, `overflow-hidden`
- 상단 탭 콘텐츠 영역: `flex-1 overflow-y-auto` (스크롤 1)
- 하단 sticky 영역(선택된 악보 + 푸터 버튼): `flex-shrink-0`, 그리고 선택된 악보 패널 자체에 `max-h-40 overflow-y-auto` (스크롤 2)
- 결과: 데스크탑/iPad에서 두 개의 분리된 스크롤바 → UX 안 좋음

**수정**:

- `DialogContent` 자체를 단일 스크롤 컨테이너로 전환: `overflow-hidden` → 내부를 하나의 스크롤로 통합
- 구조 변경:
  ```
  DialogContent (flex flex-col, max-h-[calc(100dvh-2rem)])
    └ 단일 스크롤 영역 (flex-1 overflow-y-auto)
        ├ DialogHeader (상단 X 닫기 — sticky 제거, 그냥 일반 흐름)
        ├ Tabs + 모든 탭 콘텐츠 (자연 흐름)
        ├ 선택된 악보 패널 (max-h 제거 — 자연 흐름)
        └ 푸터 (취소/저장 — 자연 흐름, 마지막에 등장)
  ```
- 모바일과 동일하게 한 스크롤로 위→아래 모두 도달. X 버튼은 Dialog 기본 우상단(absolute), 저장/취소는 마지막까지 스크롤하면 보임
- 선택된 악보 패널의 `max-h-40 overflow-y-auto` 제거 → 자연스럽게 늘어남
- 탭 콘텐츠 영역의 `flex-1 overflow-y-auto` 제거 → 외부 단일 스크롤로 위임

### 2) 진행 설정 박스 라벨/버튼 직관화

**파일**: `src/lib/translations.ts` (KO + EN 모두)

- `setSongItem.progression.title`: 
  - KO: `"진행 설정"` → `"진행 설정 (선택사항)"`
  - EN: `"Progression Settings"` → `"Progression Settings (Optional)"`
- `setSongItem.progression.history`:
  - KO: `"이력"` → `"이전 진행 불러오기"`
  - EN: `"History"` → `"Use Previous"`
- `setSongItem.progression.save`:
  - KO: `"저장"` → `"오늘 진행 저장"`
  - EN: `"Save"` → `"Save This Progression"`

(`SongProgressionSettings.tsx`는 이미 `t("...")` 키를 쓰므로 코드 변경 없음)

### 3) "게시하기" → "공동체에 게시하기" (KO만)

**파일**: `src/lib/translations.ts` — KO만 수정, EN의 `"Publish"`는 유지

- 라인 2749: `publish: "게시하기"` → `publish: "공동체에 게시하기"`
- 라인 3630: `publish: "게시하기"` → `publish: "공동체에 게시하기"`
- 라인 3873: `publish: "게시하기"` → `publish: "공동체에 게시하기"`
- 하드코딩된 "게시하기" 문자열도 동일 변경:
  - `src/pages/Dashboard.tsx:819`
  - `src/components/dashboard/UpcomingEventsWidget.tsx:367`
  - `src/pages/SetBuilder.tsx:2385`

(FAQ 본문 라인 4153은 설명문이므로 변경하지 않음)

### 영향 파일

1. `src/components/SetSongScoreDialog.tsx` — 다이얼로그 단일 스크롤 구조로 재구성
2. `src/lib/translations.ts` — 진행 설정 라벨 + 게시하기 라벨 변경 (KO)
3. `src/pages/Dashboard.tsx`, `src/components/dashboard/UpcomingEventsWidget.tsx`, `src/pages/SetBuilder.tsx` — 하드코딩된 "게시하기" → "공동체에 게시하기"

데이터/DB 변경 없음. 승인 후 default 모드에서 적용. iPad/데스크탑/모바일 재테스트 요청.  
  
[AGENTIC MODE - NO PLAN, IMPLEMENT DIRECTLY]

4가지 UX 개선 즉시 구현:

=== 1. 탭 이름 변경 ===

SetSongScoreDialog 탭3:

  KO: "히스토리 클라우드" → "악보 사용 히스토리"

  EN: "Score History" → "Score Usage History"

translations.ts 영문 키도 함께 업데이트.

=== 2. 탭3 빈 상태(empty state) 텍스트 ===

user_score_vault 조회 결과가 0건일 때 표시할 안내 문구:

  KO: "이 곡에 사용한 악보가 여기에 기록됩니다.\n악보를 검색하거나 파일을 업로드해보세요."

  EN: "Scores you've used for this song will appear here.\nTry searching or uploading a score."

현재 빈 상태 UI가 있으면 교체, 없으면 중앙 정렬 텍스트로 추가.

=== 3. 업로드 즉시 저장 완료 토스트 ===

SetSongScoreDialog 업로드 탭에서 파일 선택 → Storage 업로드 완료 시:

  toast({ title: "악보 저장 완료", description: "악보 사용 히스토리에 저장됐습니다." })

  EN: toast({ title: "Score saved", description: "Added to your Score Usage History." })

기존 업로드 성공 핸들러 바로 뒤에 추가.

=== 4. [이력] 버튼 툴팁 ===

SetSongItem의 SongProgressionSettings 컴포넌트 내 [이력] 버튼에

TooltipProvider + Tooltip 래핑 추가:

  KO 툴팁: "이 곡의 과거 진행 설정을 불러올 수 있습니다"

  EN 툴팁: "Load a previous performance setting for this song"

shadcn/ui Tooltip 컴포넌트 사용. trigger는 기존 이력 버튼.