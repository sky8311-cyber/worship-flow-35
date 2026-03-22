

## 공동체 가입 알림 한국어 지원

### 원인
DB 트리거(`notify_join_request_result`, `notify_leaders_join_request`)가 영어 메시지만 하드코딩하여 저장. 사용자 언어 설정은 클라이언트(localStorage)에만 존재하므로 DB에서 언어를 알 수 없음.

### 해결 방법
DB 메시지는 그대로 두고, **클라이언트에서 알림 타입 + metadata 기반으로 한국어 메시지를 렌더링**.

### 변경 사항

#### 1. `src/components/dashboard/NotificationItem.tsx` — 타입별 로컬라이즈 메시지 렌더링

`join_approved`, `join_rejected`, `join_request` 타입일 때 `notification.message` 대신 언어별 메시지 생성:

```
join_approved + ko: "{community_name} 가입이 승인되었습니다!"
join_approved + en: 기존 message 그대로
join_rejected + ko: "{community_name} 가입이 거절되었습니다."
join_rejected + en: 기존 message 그대로
join_request + ko: "{actor_name}님이 {community_name} 가입을 요청했습니다"
join_request + en: 기존 message 그대로
```

`community_name`은 이미 `notification.metadata`에 저장되어 있음.

#### 2. `src/components/dashboard/NotificationItem.tsx` — title도 로컬라이즈 (표시되는 경우)

현재 title은 UI에 직접 표시되지 않으므로 message만 처리하면 충분.

### 수정 파일
1. `src/components/dashboard/NotificationItem.tsx` — join 관련 알림 메시지를 언어에 따라 클라이언트에서 렌더링

