

## 두 가지 문제 수정

### 문제 1: "다음" 버튼이 안 보임

스크린샷에서 Step 4 화면에 하단 버튼(취소/임시저장/다음)이 보이지 않음. 원인: 가사 textarea가 `rows={10}`으로 크고, dialog 높이 `max-h-[calc(85vh-4rem)]` 안에서 footer가 화면 밖으로 밀림.

**수정**: `SmartSongFlow.tsx`
- 가사 textarea `rows={10}` → `rows={6}` 으로 축소
- 또는 dialog 구조에서 footer가 항상 보이도록 `min-h-0`을 content 영역에 추가하여 flex shrink가 제대로 작동하게 함
- content 영역에 `min-h-0` 추가 (flex column에서 overflow scroll이 제대로 작동하도록)

### 문제 2: 재시도 시 가사 못 찾음

Edge Function 로그를 보면 실제로 가사를 찾은 경우도 있음 (23:40 시도에서 성공). 하지만 외부 사이트(Gasazip, Bugs)가 일관되지 않은 응답을 줄 수 있음. 

**수정**: `SmartSongFlow.tsx`
- 이미 가사가 있는 상태에서 재검색 시, 기존 가사를 덮어쓰지 않도록 확인 추가
- 재시도 전에 `setLyrics("")`를 하지 않고, 새 가사가 발견된 경우에만 업데이트
- 검색 실패 시 기존 가사 유지

### 수정 파일: 1개

| 파일 | 변경 |
|---|---|
| `src/components/songs/SmartSongFlow.tsx` | textarea rows 축소 + content에 min-h-0 추가 + 재시도 로직 개선 |

