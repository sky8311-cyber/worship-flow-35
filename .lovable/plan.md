
# 어드민 전용 하단 네비게이션 고객상담 메뉴 구현

## 현재 상태

현재 하단 네비게이션의 채팅 아이콘은 모든 사용자에게 동일하게 작동:
- 커뮤니티 채팅 + 고객지원 탭이 있는 `ChatFullScreenOverlay` 열기
- 일반 채팅 알림 뱃지 (`chatUnreadCount`) 표시

## 변경 사항

**어드민 계정 전용으로:**
- 채팅 아이콘 클릭 시 `/admin/support` 페이지로 직접 이동
- 뱃지에 `useAdminSupportUnreadCount` (고객상담 읽지 않은 건수) 표시
- 어드민은 커뮤니티 멤버가 아니므로 일반 커뮤니티 채팅이 불필요

**일반 사용자:**
- 기존과 동일하게 `ChatFullScreenOverlay` 열기

## 구현 다이어그램

```text
채팅 아이콘 클릭
       │
       ▼
   ┌─────────────┐
   │ isAdmin ?   │
   └─────────────┘
       │
   ┌───┴───┐
   │       │
  Yes      No
   │       │
   ▼       ▼
┌─────────────────┐  ┌────────────────────────┐
│ /admin/support  │  │ ChatFullScreenOverlay  │
│ 페이지로 이동   │  │ 열기 (기존 동작)       │
└─────────────────┘  └────────────────────────┘
```

## 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/components/layout/BottomTabNavigation.tsx` | isAdmin 체크 추가, 어드민일 경우 고객상담으로 이동 및 어드민 뱃지 표시 |

## 코드 변경 요약

```tsx
// BottomTabNavigation.tsx

import { useAdminSupportUnreadCount } from "@/hooks/useSupportChat";

// 컴포넌트 내부
const { isAdmin } = useAuth();
const adminSupportUnread = useAdminSupportUnreadCount();

// 채팅 탭 핸들러
{chatItem && (
  <button
    onClick={() => {
      if (isAdmin) {
        navigate("/admin/support");  // 어드민: 고객상담 페이지로 이동
      } else {
        setChatOpen(true);  // 일반 사용자: 채팅 오버레이 열기
      }
    }}
  >
    <div className="relative">
      <ChatIcon />
      {/* 어드민: 고객상담 unread, 일반: 커뮤니티 채팅 unread */}
      {(isAdmin ? adminSupportUnread : chatUnreadCount) > 0 && (
        <span className="...badge...">
          {isAdmin ? adminSupportUnread : chatUnreadCount}
        </span>
      )}
    </div>
    <span>{/* 라벨 */}</span>
  </button>
)}
```

## 예상 결과

```text
일반 사용자:
┌─────────────────────────────────┐
│ 🏠  📅  🎵  🚪  💬(3)          │  ← 커뮤니티 채팅 unread 뱃지
└─────────────────────────────────┘
    클릭 → ChatFullScreenOverlay

어드민 사용자:
┌─────────────────────────────────┐
│ 🏠  📅  🎵  🚪  💬(5)          │  ← 고객상담 unread 뱃지  
└─────────────────────────────────┘
    클릭 → /admin/support 페이지
```

이 구현으로 어드민은 하단 네비게이션에서 바로 고객상담 대시보드로 접근하고, 읽지 않은 고객상담 건수를 실시간으로 확인할 수 있습니다.
