
## 프리즈 재수정 계획 (원인 재진단 반영)

### 원인 재진단
현재 증상(배경만 검게 되고 박스 프리즈)은 여전히 **중첩 모달 레이어 충돌**입니다.

- 기본 Dialog: `z-[60]` (`src/components/ui/dialog.tsx`)
- Close 확인 AlertDialog: `z-50` (`src/components/ui/alert-dialog.tsx`)

즉, 확인창이 실제로는 부모 Dialog 뒤에 떠서 클릭이 막히고 포커스만 잠겨 프리즈처럼 보입니다.  
또한 SmartSongFlow 모드에서 바깥 클릭 동작이 명시적으로 제어되지 않아 즉시 닫힘처럼 보일 수 있습니다.

---

## 구현 계획

### 1) AlertDialog 레이어 우선순위 상향 (공통 UI)
**파일:** `src/components/ui/alert-dialog.tsx`

- `AlertDialogOverlay`와 `AlertDialogContent`의 z-index를 Dialog보다 높게 조정
  - `z-50` → `z-[70]` (또는 상위 고정값)
- 이렇게 하면 SongDialog 위에서 확인창이 항상 클릭 가능

### 2) SmartSongFlow 모드의 바깥 클릭/ESC 닫힘 제어
**파일:** `src/components/SongDialog.tsx`

- SmartSongFlow 모드(`!song || song.status === 'draft'`)에서:
  - `DialogContent`에 `onPointerDownOutside`, `onInteractOutside`, `onEscapeKeyDown` 처리 추가
  - 기본 닫힘을 `preventDefault()`로 막고 `setShowCloseConfirm(true)` 실행
- 목표: 바깥 클릭/ESC도 X/취소와 동일하게 “닫기 확인”으로 통일

### 3) Close confirm 상태 누수 방지
**파일:** `src/components/SongDialog.tsx`

- 다이얼로그가 닫힐 때 `showCloseConfirm`를 강제 false로 리셋하는 effect 추가
- 재오픈 시 이전 confirm 상태가 남아 검은 오버레이만 뜨는 케이스 차단

### 4) SmartSongFlow 접근성 경고 정리 (안정성 보강)
**파일:** `src/components/SongDialog.tsx`

- SmartSongFlow 분기에서도 `DialogTitle`/`DialogDescription`(sr-only) 제공
- 현재 콘솔 경고:
  - DialogTitle required
  - Missing Description
- 경고 제거로 포커스/모달 동작 안정성 개선

---

## 수정 파일
1. `src/components/ui/alert-dialog.tsx`
2. `src/components/SongDialog.tsx`

---

## 검증 시나리오 (데스크탑 + 모바일)
1. 곡 추가 창에서 **X 클릭** → 확인창이 Dialog 위에 정상 표시되고 버튼 클릭 가능
2. **취소 버튼 클릭** → 동일 동작
3. **창 바깥 클릭** → 즉시 닫히지 않고 확인창 표시
4. 확인창에서 **Stay/계속 작성** → 원래 폼으로 복귀, 프리즈 없음
5. 확인창에서 **Close/닫기** → 완전 종료, 배경 검은 오버레이 잔존 없음
