
## 작업 이해 (5가지 변경)

새 곡 추가 다이얼로그(SmartSongFlow) 개선:

1. **프로그레스 바 라벨링** — 현재 6개 막대만 있고 각 단계가 뭘 의미하는지 시각적 안내 없음. 각 단계명(곡 제목 / YouTube / 추가링크 / 가사 / 태그 / 검토)을 막대 아래에 작게 표시.
2. **YouTube 멀티 선택** — Step 2에서 현재 단일 선택만 가능. 악보처럼 여러 개 체크박스로 선택 가능하게 변경.
3. **선택된 YouTube → Step 3에서 표시 + 편집** — Step 2에서 멀티 선택한 YouTube들이 Step 3에 카드 형태로 자동 표시. 각 항목 X로 제거, "추가 URL" 입력으로 직접 추가 가능.
4. **Step 4 가사 → Step 5 태그 (AI Fill 버튼)** — 새로운 "태그" 단계 추가. SongDialog의 `enrich-song`(AI 자동입력) 기능을 그대로 복제해 "AI로 채우기" 버튼 제공. (확인됨: 29개 사전 정의 한국어 주제 목록 중에서 AI가 자동 선택. 가사 스크래핑 + 키 제안도 함께)
5. **버튼 색상/순서** — 푸터: `[닫기] [임시저장] [계속 작성/저장]` 순서. "계속 작성"만 플랫폼 블루(`bg-primary`, 이미 적용됨), 임시저장/닫기는 outline·ghost 유지.

## 변경 계획

### Step 구조 재정의 (현 6단계 → 신 6단계)

| # | 현재 | 신규 | 비고 |
|---|------|------|------|
| 1 | 곡 정보 | 곡 정보 | 변경 없음 |
| 2 | YouTube + 아티스트 (단일) | YouTube + 아티스트 (**멀티**) | 체크박스 선택, 첫 선택이 대표곡 |
| 3 | 추가 YouTube 링크 | **선택된 YouTube 관리** | Step2에서 선택한 항목 + 수동 URL 추가/제거 |
| 4 | 가사 | 가사 | 별도 개선은 없음 (실패 시 후보 링크는 이미 있음) |
| 5 | 언어/템포/주제 | **태그 + 언어/템포 + AI 채우기** | `enrich-song` 호출 버튼 추가 |
| 6 | 검토 | 검토 | 변경 없음 |

### `src/components/songs/SmartSongFlow.tsx` 변경

**A. 프로그레스 바에 단계명 표시 (라인 363~377)**
- 각 막대 아래 `text-[10px]` 라벨 표시 (모바일: 활성/완료 단계만 굵게, 나머지는 흐리게).
- 현재 단계는 `text-primary font-semibold`, 완료는 `text-foreground`, 미완료는 `text-muted-foreground`.
- 라벨: "제목", "YouTube", "링크 정리", "가사", "태그", "검토" (간결)

**B. Step2 멀티 선택 (라인 526~667)**
- `selectedYoutubeResult` (단일) → `selectedVideoIds: Set<string>` (멀티) state로 변경.
- 카드에 체크박스 또는 Check 토글. 클릭 시 add/remove from Set.
- 첫 선택이 자동으로 `youtubeLinks[0]` (대표). `youtubeLinks` 배열을 선택된 결과들로 동기화.
- `canGoNext` Step2 조건: `selectedVideoIds.size >= 1 && artist.trim()`.

**C. Step3 "선택된 YouTube 관리"**
- 상단: Step2에서 선택된 YouTube들이 썸네일+제목+라벨 입력 카드로 표시. X로 제거 (= Step2 선택도 동기 해제).
- 하단: "직접 URL 추가" 섹션 — 라벨 + URL 입력 필드, [추가] 버튼. 추가된 항목은 `youtubeLinks`에 append.
- 기존 Step3 로직 유지하되 UI를 "검색 결과 카드 + 수동 추가" 두 영역으로 분리.

**D. 새 Step5 "태그 + AI 채우기"**
- 상단에 큰 **"AI로 자동 채우기"** 버튼 — `supabase.functions.invoke('enrich-song', { body: { title, artist, language, subtitle, youtube_url: youtubeLinks[0]?.url } })` 호출.
- 응답의 `suggestions.tags`(2~3개, 사전 정의 29개 목록 중 선택)를 `topics`에 자동 적용. `suggestions.lyrics`가 비어있고 응답에 가사가 있으면 사용자에게 "가사도 채울까요?" 확인 후 적용. `default_key`는 곡에 키 필드가 노출돼 있지 않으므로 일단 무시.
- AI 실행 중 spinner + "AI가 가사를 분석 중..." 메시지.
- 기존 `TopicSelector`(2~3개), 언어/템포 select 그대로 유지.
- AI 실패/rate limit/payment required 토스트 처리 (`enrich-song` 응답 패턴 그대로).

**E. 푸터 버튼 (라인 446~479)**
- 좌측: `[닫기]`(ghost) + `[이전]`(outline, 2단계부터)
- 우측: `[임시저장]`(outline) + `[계속 작성]`(default, primary blue — 마지막 단계만 "저장")
- 텍스트: 한국어 "계속 작성" / 영어 "Continue" 추가 (i18n 키 신규: `songFlow.continue`)
- 색상은 이미 `bg-primary`(플랫폼 블루 #2b4b8a)이므로 추가 변경 없음, 텍스트만 교체.

### 부수 변경
- i18n 키 추가: `songFlow.steps.tags`, `songFlow.continue`, `songFlow.aiFillButton`, `songFlow.aiFilling`, `songFlow.aiFilled`, `songFlow.selectedYoutubes`, `songFlow.addCustomUrl`, 단계 라벨 6개.
- `youtubeLinks` 동기화 로직 유틸 함수 (`syncLinksFromSelection`).

### 영향 파일
- `src/components/songs/SmartSongFlow.tsx` — 전체 step 구조 재배치, 멀티 선택, AI fill 통합 (주된 변경)
- `src/i18n/ko.json`, `src/i18n/en.json` — 신규 키 추가

### 미변경 (확인됨)
- `enrich-song` 엣지 함수: 이미 29개 사전 정의 한국어 주제 목록(`ALLOWED_TOPICS`)에서 AI가 선택하도록 강제됨. **그대로 재사용**.
- `match-lyrics`, `scrape-lyrics`: Step4는 손대지 않음 (사용자가 가사 단계는 별도 개선 요청 안 함, 단지 "실패율이 높다" 언급만).

데이터/스키마/RLS 변경 없음. 순수 UI/UX 개선 + 기존 엣지 함수 재사용.
