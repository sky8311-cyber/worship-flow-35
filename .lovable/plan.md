
# 웹 푸시 알림 시스템 구현

## 개요

웹 푸시 알림을 구현하여 브라우저가 닫혀 있어도 사용자가 중요한 알림을 받을 수 있도록 합니다.

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          웹 푸시 알림 아키텍처                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐      ┌──────────────────┐      ┌──────────────────┐      │
│  │   사용자     │ ───► │  Service Worker  │ ◄─── │   푸시 서버      │      │
│  │   브라우저   │      │  (sw.js)         │      │   (Edge Func)    │      │
│  └──────────────┘      └──────────────────┘      └──────────────────┘      │
│         │                      │                         │                 │
│         ▼                      ▼                         ▼                 │
│  ┌──────────────┐      ┌──────────────────┐      ┌──────────────────┐      │
│  │   설정 UI    │      │   구독 정보      │      │   VAPID 키       │      │
│  │   (토글)     │      │   (DB 저장)      │      │   (Secrets)      │      │
│  └──────────────┘      └──────────────────┘      └──────────────────┘      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 구현 단계

### 1단계: VAPID 키 저장

사용자가 생성한 VAPID 키를 Supabase Secrets에 저장합니다:
- `VAPID_PUBLIC_KEY` - 클라이언트에서 구독 시 사용
- `VAPID_PRIVATE_KEY` - Edge Function에서 푸시 전송 시 사용

---

### 2단계: Service Worker 생성

**새 파일: public/sw.js**

Service Worker는 브라우저 백그라운드에서 실행되어 푸시 알림을 수신합니다.

```javascript
// Service Worker for Push Notifications
self.addEventListener('push', function(event) {
  const data = event.data?.json() || {};
  
  const options = {
    body: data.body || '새 알림이 있습니다',
    icon: '/kworship-icon.png',
    badge: '/kworship-icon.png',
    data: {
      url: data.url || '/',
      notificationId: data.notificationId
    },
    vibrate: [200, 100, 200]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'K-Worship', options)
  );
});

// 알림 클릭 시 앱으로 이동
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
```

---

### 3단계: 푸시 구독 관리 훅 생성

**새 파일: src/hooks/usePushNotifications.ts**

```typescript
export function usePushNotifications() {
  const { user } = useAuth();
  
  // 푸시 알림 지원 여부 확인
  const isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
  
  // 현재 구독 상태 조회
  const { data: subscription } = useQuery(...);
  
  // 알림 설정 조회
  const { data: preferences } = useQuery(...);
  
  // Service Worker 등록 및 푸시 구독
  const subscribePush = async () => {
    const registration = await navigator.serviceWorker.register('/sw.js');
    const pushSubscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: VAPID_PUBLIC_KEY
    });
    
    // DB에 구독 정보 저장
    await supabase.from('push_subscriptions').upsert({...});
  };
  
  // 구독 해제
  const unsubscribePush = async () => {...};
  
  // 알림 설정 업데이트
  const updatePreferences = async (prefs) => {...};
  
  return { 
    isSupported, 
    isSubscribed, 
    preferences,
    subscribePush, 
    unsubscribePush,
    updatePreferences 
  };
}
```

---

### 4단계: 설정 페이지에 알림 설정 UI 추가

**수정 파일: src/pages/Settings.tsx**

```typescript
// 새 카드 추가: 알림 설정
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Bell className="h-5 w-5" />
      {language === "ko" ? "푸시 알림 설정" : "Push Notification Settings"}
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* 푸시 알림 활성화 토글 */}
    <div className="flex items-center justify-between">
      <Label>푸시 알림 켜기</Label>
      <Switch 
        checked={isSubscribed} 
        onCheckedChange={handleTogglePush}
      />
    </div>
    
    <Separator />
    
    {/* 항목별 알림 설정 */}
    {isSubscribed && (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span>📅 일정 리마인더</span>
          <Switch checked={preferences.event_reminder} ... />
        </div>
        <div className="flex items-center justify-between">
          <span>🎵 새 워십세트 업로드</span>
          <Switch checked={preferences.new_worship_set} ... />
        </div>
        <div className="flex items-center justify-between">
          <span>📝 커뮤니티 피드 글</span>
          <Switch checked={preferences.community_post} ... />
        </div>
        <div className="flex items-center justify-between">
          <span>💬 채팅 메시지</span>
          <Switch checked={preferences.chat_message} ... />
        </div>
      </div>
    )}
  </CardContent>
</Card>
```

---

### 5단계: 대시보드에 알림 활성화 프롬프트 추가

**새 파일: src/components/dashboard/PushNotificationPrompt.tsx**

첫 방문 시 또는 알림이 비활성화된 경우 사용자에게 활성화를 요청하는 배너/다이얼로그:

```typescript
export function PushNotificationPrompt() {
  const { isSupported, isSubscribed, subscribePush } = usePushNotifications();
  const [dismissed, setDismissed] = useState(() => 
    localStorage.getItem('push-prompt-dismissed') === 'true'
  );
  
  if (!isSupported || isSubscribed || dismissed) return null;
  
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5 text-primary" />
          <span>중요한 알림을 놓치지 마세요!</span>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleDismiss}>
            나중에
          </Button>
          <Button size="sm" onClick={subscribePush}>
            알림 켜기
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

### 6단계: 푸시 알림 전송 Edge Function

**새 파일: supabase/functions/send-push-notification/index.ts**

web-push 라이브러리를 사용하여 실제 푸시 알림을 전송합니다:

```typescript
import webpush from "npm:web-push@3.6.7";

Deno.serve(async (req) => {
  const { userId, title, body, url, notificationType } = await req.json();
  
  // VAPID 키 설정
  webpush.setVapidDetails(
    'mailto:hello@kworship.app',
    Deno.env.get('VAPID_PUBLIC_KEY'),
    Deno.env.get('VAPID_PRIVATE_KEY')
  );
  
  // 사용자의 푸시 구독 정보 조회
  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId);
  
  // 사용자 알림 설정 확인
  const { data: preferences } = await supabase
    .from('push_notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  // 알림 유형별 설정 확인
  if (preferences && !preferences[notificationType]) {
    return; // 해당 유형 알림이 비활성화됨
  }
  
  // 각 구독에 푸시 전송
  for (const sub of subscriptions) {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify({ title, body, url })
    );
  }
});
```

---

### 7단계: 기존 알림 시스템에 푸시 통합

기존 알림이 생성될 때 푸시 알림도 함께 전송되도록 수정합니다.

**수정 파일: supabase/functions/process-event-reminders/index.ts**

```typescript
// 알림 삽입 후 푸시 전송
const { error: notifError } = await supabase
  .from("notifications")
  .insert({...});

if (!notifError) {
  // 푸시 알림 전송
  await supabase.functions.invoke('send-push-notification', {
    body: {
      userId: member.user_id,
      title: "일정 알림",
      body: `"${event.title}" 일정이 ${timeMessage} 시작됩니다.`,
      url: `/dashboard`,
      notificationType: 'event_reminder'
    }
  });
}
```

---

### 8단계: 추가 알림 트리거 구현

새 워십세트, 커뮤니티 피드 글, 채팅 메시지에 대한 푸시 알림도 구현합니다.

1. **새 워십세트 업로드**: worship_sets 테이블에 INSERT 후 커뮤니티 멤버들에게 알림
2. **커뮤니티 피드 글**: community_posts 테이블에 INSERT 후 팔로워/멤버에게 알림
3. **채팅 메시지**: 기존 채팅 시스템에 푸시 통합

---

## 파일 수정/생성 요약

| 파일 | 작업 | 설명 |
|------|------|------|
| `public/sw.js` | 생성 | Service Worker - 푸시 수신 및 표시 |
| `src/main.tsx` | 수정 | Service Worker 등록 코드 추가 |
| `src/hooks/usePushNotifications.ts` | 생성 | 푸시 구독 관리 훅 |
| `src/pages/Settings.tsx` | 수정 | 알림 설정 UI 추가 |
| `src/components/dashboard/PushNotificationPrompt.tsx` | 생성 | 알림 활성화 프롬프트 |
| `src/pages/Dashboard.tsx` | 수정 | 프롬프트 컴포넌트 추가 |
| `supabase/functions/send-push-notification/index.ts` | 생성 | 푸시 전송 Edge Function |
| `supabase/functions/process-event-reminders/index.ts` | 수정 | 푸시 전송 호출 추가 |
| `supabase/config.toml` | 수정 | 새 Edge Function 설정 |

---

## 알림 유형별 동작

```text
┌────────────────────┬─────────────────────────────────────────────────────────┐
│ 알림 유형           │ 동작                                                    │
├────────────────────┼─────────────────────────────────────────────────────────┤
│ 📅 일정 리마인더    │ 일정 시작 전 설정된 시간에 푸시 전송                     │
│                    │ 클릭 시 → 대시보드 또는 일정 상세                        │
├────────────────────┼─────────────────────────────────────────────────────────┤
│ 🎵 새 워십세트      │ 내 커뮤니티에 새 세트 발행 시 푸시 전송                  │
│                    │ 클릭 시 → 해당 워십세트 페이지                           │
├────────────────────┼─────────────────────────────────────────────────────────┤
│ 📝 커뮤니티 피드    │ 내 커뮤니티에 새 글 작성 시 푸시 전송                    │
│                    │ 클릭 시 → 대시보드 피드                                  │
├────────────────────┼─────────────────────────────────────────────────────────┤
│ 💬 채팅 메시지      │ 새 채팅 메시지 수신 시 푸시 전송                         │
│                    │ 클릭 시 → 채팅 페이지                                    │
└────────────────────┴─────────────────────────────────────────────────────────┘
```

---

## 구현 순서

1. **VAPID 키 저장** - Secrets에 키 추가
2. **Service Worker 생성** - public/sw.js 작성
3. **훅 생성** - usePushNotifications.ts 구현
4. **설정 UI** - Settings.tsx에 알림 설정 카드 추가
5. **프롬프트** - 대시보드에 활성화 프롬프트 추가
6. **Edge Function** - send-push-notification 함수 작성
7. **기존 시스템 통합** - 알림 생성 시 푸시 호출

---

## 기술 요약

- **Service Worker**: 브라우저 백그라운드에서 푸시 수신
- **web-push 라이브러리**: Edge Function에서 푸시 전송
- **VAPID**: 브라우저가 푸시 서버를 신뢰할 수 있도록 하는 인증 방식
- **PushManager API**: 브라우저의 푸시 구독 관리
- **Push Subscription**: endpoint, p256dh, auth 키로 구성된 구독 정보
