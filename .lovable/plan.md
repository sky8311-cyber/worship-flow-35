

# 자동 이메일 스팸 + iOS 하단 네비게이션 문제 수정

## 문제 1: 자동 이메일 스팸 발송

### 원인 분석
스크린샷에서 동일 사용자에게 4:01 PM에 3개의 다른 자동 이메일이 동시에 발송됨:
- "32 days of new songs..."
- "60 days of new songs..."
- "32 days of new songs were added..."

**근본 원인:**
1. Admin UI의 "지금 실행" 버튼이 Edge Function을 즉시 호출하여 모든 활성화된 이메일 타입을 한번에 발송
2. 쿨다운 로직이 "발송 후" 체크하므로, 같은 실행에서 여러 이메일 타입이 동시에 발송됨
3. 중복 제거 로직이 "실행 내"에서만 작동하고, 각 이메일 타입별로 독립적으로 체크

### 해결책: 수동 전용 모드로 전환

**1. 모든 자동 이메일 비활성화 (즉시)**
```sql
UPDATE automated_email_settings SET enabled = false;
```

**2. Edge Function 수정: 보호 장치 추가**
`supabase/functions/process-automated-emails/index.ts` 수정:

```typescript
// 함수 시작 부분에 추가
const MANUAL_MODE_ONLY = true; // 수동 실행만 허용

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // 수동 모드가 아닌 경우 (예: cron에서 호출) 거부
  const authHeader = req.headers.get("authorization");
  const isManualTrigger = authHeader?.includes("Bearer"); // Admin UI에서만 Bearer 토큰 전송
  
  if (MANUAL_MODE_ONLY && !isManualTrigger) {
    console.log("Automated emails disabled - manual mode only");
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: "Automated emails are in manual-only mode",
        results: {} 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  // ... 기존 코드
};
```

**3. Admin UI에서 명시적 경고 추가**
`AutomatedEmailSettings.tsx` 수정:
- "지금 실행" 버튼에 확인 다이얼로그 추가
- 발송 대상 수 미리 표시 후 확인 요청

---

## 문제 2: iOS 하단 네비게이션 위치 이탈

### 원인 분석
iOS Safari에서 스크롤 시:
1. 주소창이 동적으로 표시/숨김 → 뷰포트 높이 변경
2. `backdrop-blur-sm` (backdrop-filter: blur())가 GPU 레이어 생성
3. `fixed bottom-0` 요소가 레이어 재계산 중 일시적으로 위치 이탈

### 해결책: iOS에서 블러 효과 제거

**`BottomTabNavigation.tsx` 수정:**

```typescript
import { useState, useEffect, useMemo } from "react";

// iOS 감지 함수
const isIOS = () => {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

export const BottomTabNavigation = () => {
  // ... 기존 코드
  
  const isiOSDevice = useMemo(() => isIOS(), []);

  // iOS에서는 backdrop-blur 제거하여 안정성 확보
  const navClassName = cn(
    "fixed inset-x-0 bottom-0 z-50 border-t border-border/50",
    isiOSDevice 
      ? "bg-card" // iOS: 블러 없이 불투명 배경
      : "bg-card/95 backdrop-blur-sm" // 기타: 블러 효과 유지
  );

  return (
    <nav 
      className={navClassName}
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        transform: 'translate3d(0, 0, 0)',
        WebkitTransform: 'translate3d(0, 0, 0)',
      }}
    >
      {/* ... 기존 콘텐츠 */}
    </nav>
  );
};
```

**로딩 상태 skeleton도 동일하게 적용:**
```typescript
if (navLoading) {
  return (
    <nav 
      className={navClassName}
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        transform: 'translate3d(0, 0, 0)',
        WebkitTransform: 'translate3d(0, 0, 0)',
      }}
    >
      {/* skeleton */}
    </nav>
  );
}
```

---

## 수정 파일 요약

| 파일 | 변경 내용 |
|------|----------|
| `supabase/functions/process-automated-emails/index.ts` | MANUAL_MODE_ONLY 플래그 + Bearer 토큰 체크 |
| `src/components/admin/email/AutomatedEmailSettings.tsx` | 실행 전 확인 다이얼로그 추가 |
| `src/components/layout/BottomTabNavigation.tsx` | iOS 기기에서 backdrop-blur 제거 |

---

## 데이터베이스 변경

```sql
-- 모든 자동 이메일 즉시 비활성화
UPDATE automated_email_settings SET enabled = false;
```

---

## 예상 결과

| 항목 | 수정 전 | 수정 후 |
|-----|--------|--------|
| 자동 이메일 | 여러 이메일 동시 발송 가능 | Admin이 수동으로만 실행 가능 |
| 이메일 확인 | 즉시 발송 | 발송 전 확인 다이얼로그 |
| iOS 네비게이션 | 스크롤 시 위치 이탈 | 항상 화면 바닥에 고정 |
| iOS 시각 효과 | 블러 + 불안정 | 불투명 배경 + 안정 |

