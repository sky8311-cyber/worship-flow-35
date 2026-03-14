

## 곡 저장 후 프리즈 수정

### 원인
곡 수정 후 저장 시 `onClose()` → 부모가 `open=false` 설정 → `handleOpenChange(false)` 실행 → `hasUnsavedChanges()`가 아직 갱신 안 된 `song` prop과 수정된 `formData`를 비교하여 `true` 반환 → 닫기 확인 다이얼로그가 뜨면서 충돌 → UI 프리즈

### 해결 방안

**파일: `src/components/SongDialog.tsx`**

1. **저장 완료 플래그 추가**: `const [justSaved, setJustSaved] = useState(false)` 상태 추가
2. **handleSubmit에서 플래그 설정**: `onClose()` 호출 전에 `setJustSaved(true)` 설정
3. **handleOpenChange에서 플래그 확인**: `justSaved`가 `true`이면 `hasUnsavedChanges()` 체크를 건너뛰고 바로 닫기
4. **다이얼로그 열릴 때 플래그 초기화**: 기존 초기화 로직에서 `setJustSaved(false)` 추가

이렇게 하면 저장 직후에는 변경사항 확인을 생략하여 프리즈 없이 정상 종료됩니다.

