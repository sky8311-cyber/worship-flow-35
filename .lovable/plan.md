

# 매 업로드마다 저작권 동의 체크박스 표시

## 문제
현재 체크박스를 한 번 누르면 DB에 저장되어 이후 체크박스가 사라짐. 면책 문구(노란 박스)는 유지되지만, 사용자가 매번 새 곡을 등록할 때마다 동의 확인을 받아야 법적으로 더 강력함.

## 변경 방향
- DB 저장 방식을 유지하되, **매 업로드 세션마다** 체크박스를 표시
- 체크박스는 **로컬 상태**로 관리 (곡 등록 다이얼로그 열 때마다 초기화)
- DB 기록은 감사 로그(audit trail)로 계속 쌓음 (upsert → insert로 변경하여 매 동의를 기록)
- 면책 문구(노란 박스)는 항상 표시

## 변경 파일

| 파일 | 변경 |
|---|---|
| `src/components/copyright/CopyrightUploadNotice.tsx` | 체크박스를 항상 표시. `checked` 상태를 props로 받아 부모가 제어. `onAcknowledge` 콜백 추가 |
| `src/hooks/useCopyrightAcknowledgment.ts` | DB 조회 로직 제거 (매번 체크 필요하므로). `acknowledge()`는 insert로 변경하여 감사 로그 누적 |
| `src/components/songs/SmartSongFlow.tsx` | 로컬 `copyrightChecked` state 추가. 다이얼로그 열릴 때 false로 초기화. 체크 안 되면 업로드 버튼 비활성화 |
| `src/components/SongDialog.tsx` | 동일하게 로컬 state로 관리 |

## 동작 흐름

1. 곡 등록/편집 다이얼로그 열림 → 체크박스 unchecked 상태
2. 면책 문구(노란 박스)는 항상 보임
3. 체크박스도 항상 보임 → 사용자가 체크
4. 체크 시 DB에 새 행 insert (감사 로그)
5. 체크해야 악보 업로드 버튼 활성화
6. 다이얼로그 닫았다가 다시 열면 다시 unchecked

