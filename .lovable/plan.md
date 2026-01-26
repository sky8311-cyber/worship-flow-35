
# 자동 이메일 리마인더 시스템 구현 계획

## 개요

Kworship 플랫폼에 3가지 자동 이메일 리마인더 기능을 추가합니다:
1. **미접속자 알림** - X일간 로그인하지 않은 사용자에게 리마인더
2. **팀원 초대 리마인더** - 커뮤니티 멤버 없는 워십리더에게 초대 권장 이메일
3. **워십세트 생성 리마인더** - 2주간 세트 미생성 워십리더에게 독려 이메일

---

## 현재 인프라 분석

### 기존 시스템
- **이메일 전송**: `send-admin-email` Edge Function + Resend API
- **자동화**: `pg_cron` + `pg_net`으로 Edge Function 호출
- **템플릿**: `email_templates` 테이블 (변수 치환 지원: `{{user_name}}`, `{{app_url}}` 등)
- **로깅**: `admin_email_logs`, `email_recipients` 테이블

### 참고할 기존 패턴
- `process-event-reminders` - 이벤트 알림 처리 (중복 방지 로직 포함)
- `process-recurring-schedules` - 반복 일정 처리 (매시간 cron 실행)

---

## 구현 계획

### 1단계: 데이터베이스 스키마 확장

#### 1.1 자동 이메일 발송 추적 테이블 생성

```sql
CREATE TABLE automated_email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL,  -- 'inactive_user', 'no_team_invite', 'no_worship_set'
  sent_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, email_type)  -- 동일 유형 이메일 중복 발송 방지
);

-- RLS 정책
ALTER TABLE automated_email_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view all" ON automated_email_log FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );
```

#### 1.2 사용자 마지막 활동 추적 컬럼 추가

```sql
ALTER TABLE profiles ADD COLUMN last_active_at TIMESTAMPTZ;

-- 로그인 시 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_last_active()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET last_active_at = now() WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 1.3 자동 이메일 템플릿 추가

3개의 이메일 템플릿을 `email_templates` 테이블에 삽입:

| slug | 제목 (한/영) | 용도 |
|------|-------------|------|
| `inactive-user-reminder` | "그동안 뵙지 못했네요!" | 미접속자 리마인더 |
| `team-invite-reminder` | "팀원을 초대해 협업하세요" | 팀원 초대 독려 |
| `worship-set-reminder` | "새로운 예배를 준비하세요" | 워십세트 생성 독려 |

---

### 2단계: Edge Function 생성

#### 2.1 `process-automated-emails` Edge Function

```
supabase/functions/process-automated-emails/index.ts
```

**기능 흐름:**

```text
┌─────────────────────────────────────────────────────────────┐
│                  process-automated-emails                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 미접속자 체크 (inactive_user)                           │
│     ├─ profiles WHERE last_active_at < NOW() - INTERVAL    │
│     ├─ automated_email_log에 없는 사용자 필터               │
│     └─ 이메일 발송 + 로그 기록                              │
│                                                             │
│  2. 팀원 미초대 워십리더 체크 (no_team_invite)              │
│     ├─ worship_leader 역할 사용자                           │
│     ├─ community_members에서 owner인 커뮤니티 조회          │
│     ├─ 해당 커뮤니티 멤버 수 = 1 (본인만 있는 경우)         │
│     ├─ 가입 후 7일 이상 경과                                │
│     └─ 이메일 발송 + 로그 기록                              │
│                                                             │
│  3. 워십세트 미생성 워십리더 체크 (no_worship_set)          │
│     ├─ worship_leader 역할 사용자                           │
│     ├─ service_sets WHERE created_by = user.id             │
│     ├─ 최근 14일간 생성 기록 없음                           │
│     ├─ 최소 1개 이상 세트 생성 이력 있음 (신규 제외)        │
│     └─ 이메일 발송 + 로그 기록                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**핵심 로직:**

```typescript
// 1. 미접속자 조회
const inactiveUsers = await supabase
  .from("profiles")
  .select("id, email, full_name, last_active_at")
  .lt("last_active_at", new Date(Date.now() - INACTIVE_DAYS * 24 * 60 * 60 * 1000).toISOString())
  .not("id", "in", alreadyEmailed);

// 2. 팀원 미초대 워십리더 조회
const lonelyCommunities = await supabase.rpc("get_communities_with_single_owner");

// 3. 워십세트 미생성 워십리더 조회  
const inactiveLeaders = await supabase.rpc("get_inactive_worship_leaders", { 
  days: 14 
});
```

---

### 3단계: Cron Job 설정

매일 아침 9시(KST)에 실행하는 cron job 추가:

```sql
SELECT cron.schedule(
  'process-automated-emails-daily',
  '0 0 * * *',  -- UTC 00:00 = KST 09:00
  $$
    SELECT net.http_post(
      url:='https://jihozsqrrmzzrqvwilyy.supabase.co/functions/v1/process-automated-emails',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer [ANON_KEY]"}'::jsonb,
      body:='{}'::jsonb
    ) AS request_id;
  $$
);
```

---

### 4단계: 헬퍼 RPC 함수 생성

#### 4.1 팀원 없는 커뮤니티 조회

```sql
CREATE OR REPLACE FUNCTION get_communities_with_single_owner()
RETURNS TABLE (
  user_id UUID,
  community_id UUID,
  community_name TEXT,
  created_at TIMESTAMPTZ
) AS $$
  SELECT 
    cm.user_id,
    cm.community_id,
    wc.name AS community_name,
    wc.created_at
  FROM community_members cm
  JOIN worship_communities wc ON wc.id = cm.community_id
  WHERE cm.role = 'owner'
  GROUP BY cm.user_id, cm.community_id, wc.name, wc.created_at
  HAVING COUNT(*) = 1  -- 커뮤니티에 본인만 있음
  AND wc.created_at < NOW() - INTERVAL '7 days';  -- 생성 후 7일 경과
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

#### 4.2 워십세트 미생성 워십리더 조회

```sql
CREATE OR REPLACE FUNCTION get_inactive_worship_leaders(days INTEGER)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  last_set_date DATE
) AS $$
  SELECT 
    p.id AS user_id,
    p.email,
    p.full_name,
    MAX(ss.created_at)::date AS last_set_date
  FROM profiles p
  JOIN user_roles ur ON ur.user_id = p.id AND ur.role = 'worship_leader'
  LEFT JOIN service_sets ss ON ss.created_by = p.id
  WHERE ss.id IS NOT NULL  -- 최소 1개 이상 생성 이력
  GROUP BY p.id, p.email, p.full_name
  HAVING MAX(ss.created_at) < NOW() - INTERVAL '1 day' * days
     OR MAX(ss.created_at) IS NULL;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

---

### 5단계: 이메일 템플릿 디자인

#### 5.1 미접속자 리마인더

```html
<h2>{{user_name}}님, 그동안 어떻게 지내셨나요?</h2>
<p>{{days}}일 동안 Kworship에 방문하지 않으셨네요.</p>
<p>새로운 곡과 예배 자료가 기다리고 있습니다!</p>
<a href="{{app_url}}/dashboard">지금 바로 확인하기</a>
```

#### 5.2 팀원 초대 리마인더

```html
<h2>{{user_name}}님, 팀원과 함께 협업하세요!</h2>
<p>"{{community_name}}" 커뮤니티에서 혼자 예배를 준비하고 계시네요.</p>
<p>팀원을 초대하면 함께 예배 세트를 만들고, 일정을 공유할 수 있습니다.</p>
<ul>
  <li>🎵 함께 곡을 선정하고 편집</li>
  <li>📅 연습 일정 공유</li>
  <li>💬 실시간 소통</li>
</ul>
<a href="{{app_url}}/community/{{community_id}}">팀원 초대하기</a>
<p><strong>지금 초대하면 30 K-Seed 보상!</strong></p>
```

#### 5.3 워십세트 생성 리마인더

```html
<h2>{{user_name}}님, 다음 예배를 준비하세요!</h2>
<p>마지막 예배 세트를 만든 지 {{days}}일이 지났습니다.</p>
<p>새로운 세트를 만들어 다가올 예배를 준비해보세요.</p>
<a href="{{app_url}}/set-builder">예배 세트 만들기</a>
```

---

### 6단계: 관리자 설정 UI (선택사항)

**Admin Dashboard에 자동 이메일 설정 탭 추가:**

```text
┌─────────────────────────────────────────────────────────┐
│  자동 이메일 설정                                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ☑ 미접속자 리마인더                                    │
│     └─ [7] 일 이상 미접속 시 발송                       │
│                                                         │
│  ☑ 팀원 초대 리마인더                                   │
│     └─ 커뮤니티 생성 후 [7] 일 경과 시                  │
│                                                         │
│  ☑ 워십세트 생성 리마인더                               │
│     └─ 마지막 세트 생성 후 [14] 일 경과 시              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

설정값은 `platform_feature_flags` 또는 별도 `automated_email_settings` 테이블에 저장.

---

## 파일 변경 요약

| 파일 | 변경 유형 | 설명 |
|------|----------|------|
| `supabase/functions/process-automated-emails/index.ts` | **새로 생성** | 자동 이메일 처리 메인 로직 |
| `supabase/config.toml` | 수정 | 새 Edge Function 설정 추가 |
| 데이터베이스 마이그레이션 | **새로 생성** | 테이블, 함수, cron job |

---

## 보안 고려사항

1. **중복 발송 방지**: `automated_email_log` 테이블로 동일 유형 이메일 중복 차단
2. **사용자 제외 옵션**: 향후 `notification_preferences`에 마케팅 이메일 수신 거부 옵션 추가 가능
3. **관리자 권한**: Edge Function은 Service Role Key 사용, 외부 호출 불가

---

## 테스트 계획

1. **단위 테스트**: 각 조회 쿼리 (미접속자, 팀원 없는 워십리더, 세트 미생성) 검증
2. **통합 테스트**: Edge Function 수동 호출 후 이메일 발송 확인
3. **Cron 테스트**: 로그 확인으로 일일 자동 실행 검증

---

## 기술적 세부사항

### 마지막 활동 추적 방법

Supabase Auth에서 `last_sign_in_at`을 직접 조회할 수 없으므로, 두 가지 방법 중 선택:

**방법 A (권장): 클라이언트에서 업데이트**
```typescript
// AuthContext.tsx에서 로그인 성공 시
await supabase.from('profiles').update({ 
  last_active_at: new Date().toISOString() 
}).eq('id', user.id);
```

**방법 B: Auth Webhook 활용**
`send-auth-email` 같은 Auth Hook에서 로그인 이벤트 시 `last_active_at` 업데이트
