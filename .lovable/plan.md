

# 자동 발송 로그 표시 문제 및 중복 발송 방지 수정

## 발견된 문제들

### 문제 1: 수신자 정보가 없는 로그 (12건)
- **원인**: 이전 버전 Edge Function에서 `recipient_name`, `recipient_email` 필드를 저장하지 않았음
- **현황**: 52건 중 12건이 NULL
- **해결**: 기존 NULL 데이터를 profiles 테이블에서 조회하여 업데이트

### 문제 2: 중복 유저 발송
- **원인**: `no_team_invite`에서 한 유저가 여러 커뮤니티를 운영하면 각 커뮤니티별로 별도 발송
- **현재 쿨다운**: `user_id` + `email_type` 기준
- **해결**: 동일 유저에게 같은 유형의 이메일은 쿨다운 기간 내 1회만 발송

---

## 수정 계획

### 1. 기존 NULL 데이터 복구 (1회성 마이그레이션)

```sql
-- 기존 로그에서 NULL인 recipient 정보를 profiles에서 가져와 업데이트
UPDATE automated_email_log ael
SET 
  recipient_email = p.email,
  recipient_name = p.full_name
FROM profiles p
WHERE ael.user_id = p.id
  AND (ael.recipient_email IS NULL OR ael.recipient_name IS NULL);
```

### 2. RPC 함수 수정 - 중복 발송 방지

`no_team_invite`에서 커뮤니티별이 아닌 유저별로 중복 체크:

| 현재 | 변경 |
|------|------|
| 커뮤니티별로 발송 (같은 유저에게 여러 번 가능) | 유저별 최초 1개 커뮤니티만 발송 |

```sql
-- 수정: DISTINCT ON 사용하여 유저당 1개 커뮤니티만
ELSIF p_email_type = 'no_team_invite' THEN
  RETURN QUERY
  SELECT DISTINCT ON (p.id)  -- 유저당 1건만
    p.id,
    p.email,
    p.full_name,
    wc.created_at as last_active_at,
    EXTRACT(DAY FROM (now() - wc.created_at))::INTEGER as days_inactive,
    wc.name as community_name
  FROM worship_communities wc
  JOIN profiles p ON p.id = wc.leader_id
  WHERE wc.created_at < now() - (p_trigger_days || ' days')::INTERVAL
    AND (SELECT COUNT(*) FROM community_members cm WHERE cm.community_id = wc.id) = 1
    AND NOT EXISTS (
      SELECT 1 FROM automated_email_log ael
      WHERE ael.user_id = p.id
        AND ael.email_type = 'no_team_invite'
        AND ael.sent_at > now() - (p_cooldown_days || ' days')::INTERVAL
    )
  ORDER BY p.id, wc.created_at ASC;  -- 가장 오래된 커뮤니티 우선
```

---

## 파일 변경 목록

| 파일 | 변경 내용 |
|------|----------|
| `supabase/migrations/` | NULL 데이터 복구 + RPC 함수 수정 (DISTINCT ON 추가) |

---

## 예상 결과

1. **기존 12건 로그**: 수신자 이름/이메일이 표시됨
2. **중복 발송 방지**: 한 유저가 여러 커뮤니티를 운영해도 쿨다운 기간 내 1회만 발송
3. **UI 표시**: 모든 로그에 수신자 정보가 정상 표시됨

---

## 중복 발송 로직 요약

```text
유저 A가 3개 커뮤니티 운영 (모두 혼자)

[현재 로직]
- 커뮤니티1 → 이메일 발송
- 커뮤니티2 → 이메일 발송  
- 커뮤니티3 → 이메일 발송
→ 동시에 3통 발송 가능

[수정 후 로직]
- DISTINCT ON (user_id) → 1개 커뮤니티만 선택
- 커뮤니티1 → 이메일 발송 (가장 오래된 커뮤니티)
- 커뮤니티2, 3 → 쿨다운 기간 후 순차 발송
→ 쿨다운 기간 내 1통만 발송
```

