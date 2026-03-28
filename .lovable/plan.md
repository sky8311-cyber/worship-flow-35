

# 인스티튜트 & 스튜디오 플래그 false 전환

## 현재 상태
- `institute_enabled` = **true**, `studio_enabled` = **true** → 모든 유저 접근 가능
- 관리자/샌드박스 테스터만 접근시키려면 플래그를 `false`로 전환 필요

## 변경 사항

### DB 데이터 업데이트 (insert 도구 사용)
```sql
UPDATE platform_feature_flags SET enabled = false WHERE key = 'institute_enabled';
UPDATE platform_feature_flags SET enabled = false WHERE key = 'studio_enabled';
```

### 코드 변경: 관리자는 플래그 무시하고 항상 접근 가능

현재 게이팅 로직은 플래그가 `false`이면 관리자도 Coming Soon을 봅니다. 관리자는 항상 접근 가능하도록 수정:

**1. `src/layouts/InstituteLayout.tsx`**
- `useAuth`에서 `isAdmin` 가져오기
- 조건 변경: `if (!isLoading && !isInstituteEnabled && !isAdmin)` → 관리자는 Coming Soon 우회

**2. `src/pages/WorshipStudio.tsx`**
- `useAuth`에서 이미 `user`를 가져오고 있으므로 `isAdmin` 추가
- 조건 변경: `if (!settingsLoading && !isStudioEnabled && !isAdmin)` → 관리자는 Coming Soon 우회

### 결과
- 일반 유저: Institute/Studio 접속 시 "Coming Soon" 페이지 표시
- 관리자: 정상 접근
- 샌드박스 테스터: `sandbox_testers` 테이블에 해당 feature가 등록된 유저도 정상 접근 (기존 `hasSandboxAccess` 로직 그대로 작동)

