

# 관리자 CRM 디테일 패널 수정

## 문제 1: X 닫기 아이콘 두 개
모바일에서 `Sheet` 컴포넌트가 자체 X 버튼을 내장하고 있는데, `DetailPanel`도 자체 X 버튼을 렌더링하여 총 2개의 닫기 아이콘이 표시됨.

## 문제 2: 버튼들이 작동하지 않음
Edit, Announce, View Page, Delete 등의 버튼들이 `onClick` 핸들러 없이 순수 UI만 렌더링되어 있어 아무 동작도 하지 않음.

---

## 해결 방법

### 1. X 아이콘 중복 제거
**파일**: `src/components/admin/crm/DetailPanel.tsx`

`DetailPanel` 내부의 자체 X 닫기 버튼을 제거. `Sheet`의 내장 X 버튼만 사용하도록 변경.

현재 (라인 557-564):
```text
<div className={`border-l-4 ${getAccentColor()}`}>
  <div className="flex items-center justify-between mb-4">
    <h3 className="font-semibold text-lg">{getTitle()}</h3>
    <Button variant="ghost" size="icon" onClick={onClose}>
      <X className="h-4 w-4" />
    </Button>
  </div>
```

수정 후: 데스크톱(PanelGroup)에서는 X 버튼이 필요하므로, `showCloseButton` prop을 추가하여 모바일 Sheet에서는 숨기고 데스크톱에서는 표시.

### 2. 작동하는 버튼 구현
DetailPanel의 Quick Actions 버튼들에 실제 기능 연결:

- **Edit / Edit Profile**: `toast`로 "준비 중" 안내 (또는 해당 관리 페이지로 이동)
- **Announce / Message**: `toast`로 "준비 중" 안내
- **View Page**: 해당 커뮤니티/프로필 페이지로 `window.open` 또는 `navigate`
- **Delete / Remove**: 확인 다이얼로그 후 삭제 (위험 동작이므로 1차로는 `toast`로 "준비 중" 안내)
- **Manage / Change Role**: `toast`로 "준비 중" 안내

최소한 `View Page`는 실제 동작하도록 구현하고, 나머지는 "Coming soon" 토스트로 피드백 제공.

---

## 기술적 변경 사항

### 파일 1: `src/components/admin/crm/DetailPanel.tsx`

1. `showCloseButton` prop 추가 (기본값 `true`)
2. 모바일에서는 `showCloseButton={false}`로 전달하여 중복 X 제거
3. 모든 Quick Action 버튼에 `onClick` 핸들러 추가:
   - `View Page` 버튼: 커뮤니티 페이지로 이동
   - 나머지 버튼: `toast({ title: "준비 중", description: "이 기능은 준비 중입니다." })` 표시
4. `sonner`의 `toast` import 추가

### 파일 2: `src/pages/AdminCRM.tsx`

모바일 Sheet에서 `DetailPanel`에 `showCloseButton={false}` prop 전달.

## 변경 범위
- 파일 2개 수정
- 기존 기능에 영향 없음
