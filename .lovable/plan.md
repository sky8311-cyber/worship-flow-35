

## 스크롤 애니메이션 속도 개선 + 튜토리얼 버튼 툴팁 + 곡 추가 튜토리얼 수정

### 문제 3가지

1. **스크롤 애니메이션 너무 느림**: `revealOnScroll` (1.2초), `revealCard` (1.0초), `revealText` (0.8초) — clip-path + scale 조합이 체감상 매우 느림
2. **튜토리얼 `?` 버튼에 텍스트 툴팁 없음**: SetBuilder, SongDialog의 HelpCircle 아이콘만 있고 "가이드 보기" 같은 안내 없음
3. **곡 추가 페이지 튜토리얼 없음**: SongDialog에서 tutorial key가 `"song-edit"`이고 `autoStart: false`로 설정되어 있어, 새 곡 추가 시 튜토리얼이 전혀 시작되지 않음

### 수정 계획

#### 1. `src/lib/animations.ts` — 애니메이션 속도 50% 단축
- `revealOnScroll`: 1.2s → 0.6s, scale 1.5 → 1.15
- `revealCard`: 1.0s → 0.5s, scale 1.1 → 1.05
- `revealText`: 0.8s → 0.4s, y: 50 → 30
- `staggerChildren` / `delayChildren` 값도 비례 축소

#### 2. `src/pages/SetBuilder.tsx` — `?` 버튼에 Tooltip 추가
- HelpCircle 버튼을 `TooltipProvider > Tooltip > TooltipTrigger` 로 감싸기
- 툴팁 내용: "가이드 보기"

#### 3. `src/components/SongDialog.tsx` — 곡 추가 튜토리얼 수정
- tutorial key: `"song-edit"` → `"song-add"`로 변경
- 새 곡 추가 모드(`!song`)일 때 `autoStart: true`로 설정하여 첫 접속 시 자동 시작
- `?` 버튼에도 동일하게 Tooltip 추가 ("가이드 보기")

### 수정 파일 (3개)
1. `src/lib/animations.ts` — 애니메이션 duration 단축
2. `src/pages/SetBuilder.tsx` — `?` 버튼 Tooltip
3. `src/components/SongDialog.tsx` — tutorial key/autoStart 수정 + Tooltip

