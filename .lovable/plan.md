

# 게시 후 상태가 "작성중"으로 되돌아가는 버그 분석 및 수정

## 문제 원인

**Auto-save와 Publish 사이의 Race Condition**

`useAutoSaveDraft.ts` 259번 줄에서 auto-save는 **항상 `status: "draft"`로 저장**합니다. 게시 시 다음 시나리오가 발생할 수 있습니다:

```text
시간 →
1. Auto-save debounce 타이머 발동 (status 아직 "draft")
2. Auto-save mutation 시작 → DB에 status: "draft" 쓰기 시작
3. 사용자가 "게시" 클릭 → confirmPublish() 호출
4. suppressAutoSaveRef = true, cancelPendingAutoSave() — 이미 in-flight인 mutation은 취소 불가
5. saveSetMutation 실행 → DB에 status: "published" 저장
6. Auto-save mutation이 뒤늦게 완료 → status: "draft"로 덮어씀 ← 버그!
```

결과: DB에는 `status: "draft"`가 저장되어 있지만, UI의 React state는 `"published"`로 표시 → "게시취소" 버튼이 보임. 다른 사용자가 접근하면 RLS 정책(`status = 'published'` 조건)에 의해 "접근 권한 없음" 표시.

## 수정 계획

### 1. `src/hooks/useAutoSaveDraft.ts` — Auto-save에 published 상태 보호 추가
- `mutationFn` 시작 부분(line ~219)에서 `statusRef.current` 체크 외에, **실제 DB 상태도 확인**하는 안전장치 추가
- 기존 세트 업데이트 시, 현재 DB의 status가 `"published"`이면 auto-save를 건너뛰도록 처리
- 이렇게 하면 in-flight auto-save가 publish 후 완료되더라도 DB 상태를 덮어쓰지 않음

### 2. `src/pages/SetBuilder.tsx` — Publish 전 auto-save mutation 완료 대기
- `confirmPublish`에서 auto-save mutation이 현재 진행 중인지 확인하고, 진행 중이면 완료를 기다린 후 publish 실행
- 또는 `saveSetMutation`에서 publish 시 항상 최신 DB 상태를 먼저 확인

### 기술 상세

**방법 A (권장)**: auto-save update 쿼리에 `.eq("status", "draft")` 조건 추가

```typescript
// useAutoSaveDraft.ts line ~274
const { error } = await supabase
  .from("service_sets")
  .update(dataToSave)
  .eq("id", setId)
  .eq("status", "draft");  // ← published 상태면 업데이트 안 됨
```

이 한 줄 추가로 auto-save가 이미 published된 세트를 draft로 되돌리는 것을 DB 레벨에서 방지합니다. 가장 안전하고 간단한 수정입니다.

**방법 B (추가 안전장치)**: `confirmPublish`에서 auto-save mutation이 진행 중일 때 대기

```typescript
const confirmPublish = async () => {
  suppressAutoSaveRef.current = true;
  cancelPendingAutoSave();
  // auto-save가 in-flight이면 완료까지 잠시 대기
  if (autoSaveIsSaving) {
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  saveSetMutation.mutate("published");
  setShowPublishConfirm(false);
};
```

### 변경 파일
- `src/hooks/useAutoSaveDraft.ts` — update 쿼리에 `.eq("status", "draft")` 조건 추가
- `src/pages/SetBuilder.tsx` — confirmPublish에 auto-save 완료 대기 로직 추가 (선택적)

