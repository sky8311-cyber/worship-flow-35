

## X 버튼 / 취소 버튼 프리즈 수정

### 원인
SmartSongFlow 내부의 `AlertDialog` (z-index: 50)가 부모 `Dialog` (z-index: 60) 뒤에 렌더링됩니다. 확인 창이 열리지만 Dialog 오버레이에 가려져 클릭 불가 → 프리즈 현상.

### 해결 방법
SmartSongFlow의 취소 확인 `AlertDialog`에 z-index를 `z-[70]`으로 올려서 부모 Dialog 위에 표시되도록 수정.

### 변경 내용

**파일: `src/components/songs/SmartSongFlow.tsx`** — line 554-567 (Cancel Confirmation AlertDialog)

현재:
```tsx
<AlertDialogContent>
```

변경:
```tsx
<AlertDialogContent className="z-[70]">
```

그리고 AlertDialog의 overlay도 z-[70]으로 올려야 하므로, AlertDialogContent만으로는 부족합니다. Radix AlertDialog Portal 안의 overlay가 z-50이기 때문입니다.

실제 수정: SmartSongFlow의 AlertDialog를 쓰지 않고, **SmartSongFlow에서 `onCancel` 콜백을 호출 → SongDialog에서 취소 확인 AlertDialog를 렌더링**하는 방식으로 변경. SongDialog의 AlertDialog는 이미 Dialog 바깥에 렌더링되므로 z-index 충돌 없음.

구체적으로:
1. **SmartSongFlow**: `showCancelConfirm` 상태와 AlertDialog 제거. X/취소 버튼 클릭 시 `onCancel()` 콜백 호출
2. **SmartSongFlow props**: `onCancel: () => void` 추가
3. **SongDialog**: SmartSongFlow 모드일 때 `handleOpenChange`에서 `showCloseConfirm`을 사용하여 확인 다이얼로그 표시. 기존 `showCloseConfirm` AlertDialog 재활용 (이미 Dialog 바깥에 렌더링됨)

### 수정 파일
1. `src/components/songs/SmartSongFlow.tsx` — AlertDialog 제거, onCancel prop 추가
2. `src/components/SongDialog.tsx` — SmartSongFlow에 onCancel 전달, handleOpenChange에서 확인 다이얼로그 표시

