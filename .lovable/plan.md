

## Admin 정식멤버 설정 Toggle 수정 계획

### 문제 분석

DB를 확인한 결과 토글 값은 실제로 저장되고 있습니다 (`premium_enabled`의 `updated_at`이 방금 전 시간). 그러나 두 가지 버그가 UX를 깨뜨리고 있습니다:

#### Bug 1: Toast가 중복 발생
`AdminDashboard.tsx`의 `useEffect`에서 `[updateSuccess, t]`를 dependency로 사용합니다. `t` 함수가 렌더마다 새로운 참조를 반환하면, `updateSuccess`가 `true`인 동안 toast가 반복 발생합니다. Session replay에서 토글 1회 클릭에 toast 2개가 뜨는 것이 확인됨.

#### Bug 2: Optimistic update 없음 → 토글이 시각적으로 반응 안 함
`toggleFlag`가 DB 업데이트 → 쿼리 무효화 → 리패치 후에야 UI가 바뀝니다. 리패치 완료 전까지 Switch가 이전 상태를 유지하므로 "작동 안 함"으로 보입니다. 또한 `isUpdating`이 모든 Switch를 동시에 disable해서 UX가 더 불안정.

### 수정 계획

#### A. Toast 중복 수정 (`AdminDashboard.tsx`)
- `useEffect` 대신 mutation의 `onSuccess`/`onError` 콜백에서 직접 toast 호출
- `useAppSettings.ts`의 `updateFlagMutation`에 `onSuccess`/`onError` 콜백 추가하여 toast 표시

#### B. Optimistic update 추가 (`useAppSettings.ts`)
- `useMutation`에 `onMutate`로 즉시 queryData 업데이트 (토글 즉시 반영)
- `onError`에서 rollback 처리
- 개별 Switch의 `disabled`를 제거하거나 해당 key만 disable

### 수정 파일

| 파일 | 변경 |
|---|---|
| `src/hooks/useAppSettings.ts` | Optimistic update 추가 + onSuccess에서 toast 호출 |
| `src/pages/AdminDashboard.tsx` | useEffect toast 제거 (hook에서 처리) |

