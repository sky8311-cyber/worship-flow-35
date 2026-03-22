

## 닫기 확인 다이얼로그에 "임시저장" 옵션 추가

### 현재 상태
`SongDialog.tsx` line 1573-1595: AlertDialog에 2개 버튼만 존재
- "계속 작성" (Stay) — 다이얼로그 닫기 취소
- "닫기" (Close) — 저장 없이 닫기

### 문제
"임시저장 후 닫기" 옵션이 없어서, 사용자가 닫기 전 반드시 수동으로 임시저장 버튼을 눌러야 함.

### 해결 방법

#### 1. SmartSongFlow에 `onDraftSaveAndClose` 콜백 노출
**파일:** `src/components/songs/SmartSongFlow.tsx`

- 새 prop 추가: `onRequestDraftSave?: () => void`
- 이 prop이 호출되면 내부 `handleDraftSave()`를 실행한 후 `onClose()` 호출
- 실제로는 **`useImperativeHandle` + `forwardRef`**를 사용하여 SongDialog에서 SmartSongFlow의 `triggerDraftSave`를 호출할 수 있게 함

#### 2. SongDialog에서 ref로 임시저장 트리거
**파일:** `src/components/SongDialog.tsx`

- `smartFlowRef`를 생성하여 SmartSongFlow에 전달
- AlertDialog에 3번째 버튼 추가: "임시저장" (Save Draft)
- 클릭 시 `smartFlowRef.current.triggerDraftSave()` 호출 → 저장 완료 후 다이얼로그 닫기

#### 3. AlertDialog UI 변경
```text
┌─────────────────────────────────┐
│  창을 닫으시겠습니까?              │
│  작성 중인 내용이 저장되지 않습니다.  │
│                                   │
│  [계속 작성]  [임시저장]  [닫기]    │
└─────────────────────────────────┘
```

- "계속 작성" — AlertDialogCancel (기존)
- "임시저장" — Button variant="outline", 임시저장 실행 후 닫기
- "닫기" — AlertDialogAction destructive (기존)

### 수정 파일
1. `src/components/songs/SmartSongFlow.tsx` — `forwardRef` + `useImperativeHandle`로 `triggerDraftSave` 노출
2. `src/components/SongDialog.tsx` — ref 연결 + AlertDialog에 "임시저장" 버튼 추가

