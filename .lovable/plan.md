

## 워십세트 게시 후 "작성중"으로 되돌아가는 버그 수정

### 원인 분석

**핵심 원인: Auto-save 타이머와 게시(Publish) 사이의 경쟁 조건(Race Condition)**

1. 사용자가 워십세트를 편집 → auto-save가 2초 타이머 예약
2. 사용자가 "게시하기" 클릭 → `saveSetMutation`이 `status: "published"`로 DB 저장
3. **2초 타이머가 아직 살아있음** → 타이머 실행 시 `autoSaveMutation.mutate()` 호출
4. Auto-save의 `mutationFn`은 **항상** `status: "draft"`를 하드코딩하여 저장 (line 249)
5. Auto-save가 게시 직후 또는 동시에 실행되면 → DB의 status가 다시 `"draft"`로 덮어씌워짐

`useAutoSaveDraft.ts` line 249:
```ts
status: "draft" as const,  // ← 항상 draft로 저장
```

Auto-save의 `status !== "draft"` 체크(line 214)는 **클로저에 캡쳐된 시점의 status**를 사용하므로, publish 전에 예약된 타이머는 여전히 `status = "draft"`로 인식합니다.

### 수정 방안

**파일: `src/pages/SetBuilder.tsx`**

`confirmPublish` 함수에서 게시 mutation 실행 전에:
1. `suppressAutoSaveRef.current = true` 설정 (auto-save 비활성화)
2. 기존 auto-save 타이머 취소를 위해 `forceSave` 대신 직접 타이머 클리어

**파일: `src/hooks/useAutoSaveDraft.ts`**

1. `saveTimeoutRef`를 외부에서 클리어할 수 있도록 `cancelPendingAutoSave` 함수 반환
2. `mutationFn` 내부에서 `statusRef`를 사용하여 최신 status 값을 읽도록 변경 (클로저 문제 해결)

### 구체적 변경

**`useAutoSaveDraft.ts`:**
- `useRef`로 `statusRef`를 만들어 최신 status 값을 항상 참조
- `mutationFn`에서 `status` 대신 `statusRef.current`로 체크
- `cancelPendingAutoSave` 함수를 반환값에 추가

**`SetBuilder.tsx`:**
- `confirmPublish`에서:
  ```ts
  const confirmPublish = () => {
    suppressAutoSaveRef.current = true;
    cancelPendingAutoSave(); // 대기중인 auto-save 타이머 취소
    saveSetMutation.mutate("published");
    setShowPublishConfirm(false);
  };
  ```
- `saveSetMutation.onSuccess`에서 게시 완료 후 `suppressAutoSaveRef`를 유지 (navigate 전까지)
- `saveSetMutation.onError`에서 실패 시 `suppressAutoSaveRef.current = false` 복원

