
## 작업 이해

`SongDialog.tsx` 편집 모드(`song` 존재할 때) 폼의 **필드 순서**를 사용자가 지정한 순서로 재배치. 헤더(곡편집/AI자동입력/X)와 최근사용내역은 이미 그 순서. 모든 화면 크기 동일 (이미 반응형 단일 컬럼).

## 변경 계획

### `src/components/SongDialog.tsx` (라인 647~837 form 내부)

**현재 순서:**
1. Title → 2. Subtitle → 3. **Private toggle** → 4. Artist → 5. YouTube → 6. Lyrics → 7. Language → 8. Tempo → 9. Topics

**변경 후 순서 (사용자 요청):**
1. Title (곡 제목)
2. Subtitle (부제)
3. Artist (아티스트)
4. Language (언어)
5. Topics (태그/주제 선택)
6. Tempo (템포)
7. YouTube (유튜브 링크)
8. Lyrics (가사)
9. Private toggle (비공개 곡)
10. Cancel/Save 버튼

### 헤더/상단 영역 (변경 없음, 이미 사용자 순서와 일치)
- DialogHeader: "곡 편집" 타이틀 + AI 자동입력 버튼 + X 닫기
- "최근 사용 내역" 박스 (사용 이력 있을 때만)

### 구현 방식
폼 내 `<div>` 블록들을 사용자 지정 순서대로 재배열만 수행. 각 필드의 내부 마크업/로직/스타일 변경 없음. Private toggle 블록(border 박스)은 그대로 유지하되 위치만 마지막 직전으로 이동.

## 영향 파일
- `src/components/SongDialog.tsx` — form 내부 필드 순서 재배치 (라인 647-827 영역)

데이터/로직/번역 변경 없음. 순수 JSX 순서 변경. 모든 뷰포트(모바일/태블릿/데스크톱) 동일 적용 (현재도 단일 컬럼).
