

# 곡 추가 후 다운 현상 수정

## 문제 원인

`AddToSetDialog`의 `onSuccess` 핸들러에서 여러 작업이 동시에 실행되면서 충돌 발생:

1. 토스트 메시지 표시
2. 여러 쿼리 무효화 (비동기)
3. `onSuccess` 콜백 호출 (부모 다이얼로그도 닫으려 함)
4. `onOpenChange(false)` → 다이얼로그 닫기
5. `navigate()` → 페이지 이동

특히 SongDialog에서 호출 시, `onSuccess` 콜백이 SongDialog까지 닫으면서 부모 컴포넌트가 언마운트되는 도중에 `navigate()`가 실행됨. 쿼리 무효화로 인한 리렌더링과 겹치면서 앱이 먹통이 됨.

## 해결 방법

**파일**: `src/components/AddToSetDialog.tsx`

`onSuccess` 핸들러에서 `navigate()`를 `setTimeout`으로 지연시켜 다이얼로그 닫기와 콜백 처리가 완료된 후 페이지 이동이 실행되도록 수정:

```text
현재:
  onSuccess?.();
  onOpenChange(false);
  navigate(`/set-builder/${setId}`);

수정 후:
  onOpenChange(false);
  onSuccess?.();
  setTimeout(() => {
    navigate(`/set-builder/${setId}`);
  }, 100);
```

변경 사항:
- `onOpenChange(false)`를 먼저 호출하여 다이얼로그부터 닫음
- `navigate()`를 100ms 지연시켜 다이얼로그/부모 컴포넌트 정리가 끝난 후 이동
- 쿼리 무효화와 페이지 이동 간의 경쟁 상태 해소

## 변경 범위
- 파일 1개 (`AddToSetDialog.tsx`), `onSuccess` 핸들러 부분만 수정

