

# Membership 기능 Sandbox/Admin 전용 제한 계획

## 목표
멤버십 페이지 (`/membership`)와 관련 UI 요소를 **Sandbox 테스터**와 **Admin** 사용자에게만 표시하고 기능하도록 제한합니다.

---

## 현재 상태

현재 `/membership` 페이지와 아바타 메뉴의 "멤버십" 항목은 **모든 로그인 사용자**에게 표시됩니다.

**Sandbox 테스터 시스템**은 이미 구현되어 있습니다:
- `sandbox_testers` 테이블에 사용자 ID와 허용 기능 목록 저장
- `useAppSettings` 훅에서 `hasSandboxAccess(feature)` 함수 제공
- `isSandboxTester` 플래그로 테스터 여부 확인 가능

---

## 구현 계획

### 1. AppHeader.tsx - 멤버십 메뉴 가시성 제한

**변경 내용:**
- `useAppSettings`에서 `isSandboxTester` 또는 `hasSandboxAccess("membership")` 가져오기
- 멤버십 메뉴 항목을 `isAdmin || isSandboxTester` 조건으로 감싸기

```typescript
// 변경 전
{!settingsLoading && (
  <DropdownMenuItem asChild>
    <Link to="/membership">멤버십</Link>
  </DropdownMenuItem>
)}

// 변경 후
{!settingsLoading && (isAdmin || isSandboxTester) && (
  <DropdownMenuItem asChild>
    <Link to="/membership">멤버십</Link>
  </DropdownMenuItem>
)}
```

### 2. Membership.tsx - 페이지 접근 제한

**변경 내용:**
- `useAppSettings`에서 `isSandboxTester` 가져오기
- Admin 또는 Sandbox 테스터가 아닌 경우 다른 페이지로 리다이렉트

```typescript
// 추가할 코드
const { isSandboxTester, isLoading: settingsLoading } = useAppSettings();

// 접근 권한 체크
if (!settingsLoading && !isAdmin && !isSandboxTester) {
  return <Navigate to="/dashboard" replace />;
}
```

### 3. Settings.tsx - 멤버십 링크 카드 제한

**변경 내용:**
- Settings 페이지의 "멤버십 관리" 카드도 동일한 조건으로 제한

---

## 파일 변경 요약

| 파일 | 변경 내용 |
|------|----------|
| `src/components/layout/AppHeader.tsx` | 멤버십 메뉴를 `isAdmin \|\| isSandboxTester` 조건으로 제한 |
| `src/pages/Membership.tsx` | 페이지 상단에 접근 권한 체크 추가, 비인가자는 대시보드로 리다이렉트 |
| `src/pages/Settings.tsx` | 멤버십 링크 카드도 동일 조건 적용 |

---

## 결과

```text
일반 사용자:
┌─────────────────────────────────┐
│ 아바타 메뉴                     │
│ ├─ 설정                         │
│ ├─ 도움말                       │
│ └─ ... (멤버십 메뉴 숨김)       │
└─────────────────────────────────┘

Admin 또는 Sandbox 테스터:
┌─────────────────────────────────┐
│ 아바타 메뉴                     │
│ ├─ 관리자 페이지 (Admin만)      │
│ ├─ ✨ 멤버십 [업그레이드]  ←    │
│ ├─ 설정                         │
│ └─ ...                          │
└─────────────────────────────────┘
```

---

## 추가 고려사항

**Sandbox 테스터 추가 방법:**
- Admin이 `sandbox_testers` 테이블에 사용자 추가
- `features` 컬럼에 `["membership"]` 또는 `["all"]` 설정
- 해당 사용자는 멤버십 기능에 접근 가능

**나중에 전체 공개 시:**
- AppHeader와 Membership 페이지에서 조건문만 제거하면 됨

