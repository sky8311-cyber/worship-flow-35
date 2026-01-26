

# 수신자 명단 스크롤 수정 + 미접속 로직 검토 + 브랜드 템플릿 적용

## 1. 스크롤 문제 수정

### 원인 분석
현재 `ScrollArea` 컴포넌트는 Radix UI 기반으로 **세로 스크롤만** 기본 제공합니다. 가로 스크롤을 위해 내부에 `overflow-x-auto`를 추가했지만, `ScrollAreaPrimitive.Viewport`의 스타일 제약으로 작동하지 않습니다.

### 해결 방법
`ScrollArea` 대신 일반 `div`를 사용하여 양방향 스크롤 지원

```text
변경 전: <ScrollArea><div className="overflow-x-auto">...</div></ScrollArea>
변경 후: <div className="overflow-auto max-h-[400px] border rounded-lg">...</div>
```

| 파일 | 변경 내용 |
|------|----------|
| `AutomatedEmailPreviewDialog.tsx` | `ScrollArea` → `overflow-auto` div로 변경 |

---

## 2. 미접속자 로직 검토 결과

### 현재 상태 (정상)
| 항목 | 값 |
|------|------|
| 전체 유저 | 196명 |
| `last_active_at`이 NULL | 195명 (99.5%) |
| 가입 7일 이상 | 82명 |
| 조건 충족 (발송 대상) | 81명 |

### 로직 설명
```sql
-- inactive_user 조건
WHERE (last_active_at IS NULL OR last_active_at < 7일전)  -- 미접속 조건
  AND created_at < 7일전  -- 신규가입 제외
  AND NOT EXISTS (최근 7일 내 발송 기록)  -- 쿨다운
```

**결론:** 로직 자체는 정확합니다. 단, `last_active_at`이 대부분 NULL인 이유는:
1. 기존 유저들이 로그인해도 `last_active_at`이 업데이트되지 않았음
2. `AuthContext.tsx`의 업데이트 로직이 최근에 추가되었음

### 개선 제안 (선택사항)
마이그레이션으로 기존 유저들의 `last_active_at`을 `created_at`으로 초기화하면 좀 더 정확한 추적 가능

---

## 3. 브랜드 로고 및 색상 적용 (템플릿 업데이트)

### 브랜드 정보
| 항목 | 값 |
|------|------|
| Primary Blue | `#2b4b8a` (HSL 220 52% 35%) |
| Accent Coral | `#d16265` (HSL 358 55% 60%) |
| 로고 URL | `https://kworship.app/kworship-icon.png` |

### 현재 템플릿 문제
- 버튼 색상: `#7c3aed` (보라색) → **브랜드 색상 아님**
- 로고 없음
- 심플한 텍스트 디자인

### 새 템플릿 디자인

```text
┌────────────────────────────────────────────────────────┐
│                    [K-Worship 로고]                     │
│                     K-Worship                           │
├────────────────────────────────────────────────────────┤
│                                                        │
│   안녕하세요, {{user_name}}님!                         │
│                                                        │
│   그동안 K-Worship에서 뵙지 못했네요.                  │
│   {{days}}일 동안 새로운 기능들이 추가되었습니다.      │
│                                                        │
│   ┌──────────────────────────────────────────────┐    │
│   │  [블루→코랄 그라데이션 버튼]                  │    │
│   │        K-Worship 방문하기                    │    │
│   └──────────────────────────────────────────────┘    │
│                                                        │
│   ────────────────────────────────────────────────    │
│   감사합니다,                                          │
│   K-Worship 팀                                         │
│   ────────────────────────────────────────────────    │
│                                                        │
│   [로고]  [소셜 아이콘들]                              │
│   © 2026 K-Worship. All rights reserved.               │
└────────────────────────────────────────────────────────┘
```

### 적용할 템플릿 (3개)

**1. inactive_user (미접속자 리마인더)**
```html
<div style="font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  <!-- Header with Logo -->
  <div style="background: linear-gradient(135deg, #2b4b8a 0%, #d16265 100%); padding: 32px; text-align: center;">
    <img src="https://kworship.app/kworship-icon.png" alt="K-Worship" style="width: 64px; height: 64px; margin-bottom: 12px;" />
    <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">K-Worship</h1>
  </div>
  
  <!-- Content -->
  <div style="padding: 32px;">
    <h2 style="color: #2b4b8a; margin: 0 0 16px;">안녕하세요, {{user_name}}님!</h2>
    <p style="color: #333; line-height: 1.6;">그동안 K-Worship에서 뵙지 못했네요. <strong>{{days}}일</strong> 동안 새로운 찬양곡과 기능들이 추가되었습니다.</p>
    <p style="color: #333; line-height: 1.6;">다시 방문해서 확인해보세요!</p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="{{cta_url}}" style="display: inline-block; background: linear-gradient(135deg, #2b4b8a 0%, #d16265 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">K-Worship 방문하기</a>
    </div>
  </div>
  
  <!-- Footer -->
  <div style="background: #f8f9fa; padding: 24px; text-align: center; border-top: 1px solid #e9ecef;">
    <p style="color: #666; font-size: 14px; margin: 0 0 8px;">감사합니다,<br><strong>K-Worship 팀</strong></p>
    <p style="color: #999; font-size: 12px; margin: 0;">© 2026 K-Worship. All rights reserved.</p>
  </div>
</div>
```

**2. no_team_invite (팀원 초대 리마인더)**
- 동일한 헤더/푸터 디자인
- 팀원 초대 혜택 아이콘 리스트 추가

**3. no_worship_set (워십세트 리마인더)**
- 동일한 헤더/푸터 디자인
- 워십세트 생성 CTA

---

## 변경 파일 목록

| 파일 | 변경 내용 |
|------|----------|
| `AutomatedEmailPreviewDialog.tsx` | `ScrollArea` → `overflow-auto div`로 스크롤 수정 |
| `supabase/migrations/` | 3개 자동 이메일 템플릿 브랜드 적용 UPDATE |

---

## 예상 결과

1. **스크롤 정상 작동**: 수신자 명단을 상하좌우로 스크롤하여 모든 정보 확인 가능
2. **로직 확인 완료**: 81명은 "가입 7일+ AND 미접속" 조건 충족 (정확함)
3. **브랜드 템플릿**: 로고 + 블루/코랄 그라데이션 버튼으로 마케팅 효과 향상

