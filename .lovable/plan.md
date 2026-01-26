

# 자동 이메일 시스템 버그 수정 계획

## 현재 상황 분석

### 발송 완료된 기록 (2026-01-26 06:49 UTC)
"지금 실행" 버튼으로 **총 42명**에게 이메일이 발송되었습니다:

| 이메일 유형 | 발송 수 | 수신자 예시 |
|------------|--------|------------|
| 미접속자 리마인더 | 0명 | 조건 충족자 없음 |
| 팀원 초대 리마인더 | 12명 | cs08sh@gmail.com, dornrrk9@gmail.com 등 |
| 워십세트 생성 리마인더 | 30명 | iblty88@gmail.com, testworship@test.com 등 |

### 발견된 버그 목록

1. **UI 데이터 로딩 문제**
   - DB에 설정 3개가 존재하지만 화면에 표시 안 됨
   - RLS 정책 또는 쿼리 오류 가능성

2. **"지금 실행" 결과 토스트 버그**
   - 현재: `data.results?.inactive_users?.sent`
   - 수정: `data.results?.inactive_user?.sent` (언더스코어 누락)

3. **발송 기록 표시 문제**
   - `automated_email_log` 테이블 구조와 쿼리 불일치
   - 기록은 저장되었지만 UI에서 조회 불가

---

## 수정 계획

### 1. AutomatedEmailSettings.tsx - "지금 실행" 결과 수정

```typescript
// 현재 (버그)
onSuccess: (data) => {
  toast.success(
    `${data.results?.inactive_users?.sent || 0} + ${data.results?.no_team_invite?.sent || 0}...`
  );
}

// 수정
onSuccess: (data) => {
  toast.success(
    `${data.results?.inactive_user?.sent || 0} + ${data.results?.no_team_invite?.sent || 0}...`
  );
}
```

### 2. RLS 정책 확인 및 수정

`automated_email_settings` 테이블의 RLS 정책 검증:
- 관리자만 조회 가능하도록 설정되어 있는지 확인
- 필요시 정책 수정

### 3. EmailLogs.tsx - 자동 발송 기록 조회 수정

```typescript
// 현재
.order("sent_at", { ascending: false })

// 이 부분은 정상 - sent_at 컬럼 존재 확인됨
```

### 4. Edge Function 로깅 개선

`process-automated-emails/index.ts`에서 발송 결과 로깅 확인:
- 현재 DB에 기록 저장 중
- UI에서 조회할 수 있도록 필드 매핑 확인

---

## 파일 변경 목록

| 파일 | 변경 내용 |
|------|----------|
| `src/components/admin/email/AutomatedEmailSettings.tsx` | "지금 실행" 결과 키 이름 수정 |
| `supabase/migrations/` | RLS 정책 조회 권한 확인/수정 |
| `src/components/admin/email/EmailLogs.tsx` | 자동 발송 기록 쿼리 검증 |

---

## 예상 결과

수정 후:
1. **설정 UI 표시**: 3개의 자동 이메일 설정이 화면에 정상 표시
2. **템플릿 편집**: 각 유형별 제목/본문 템플릿 편집 가능
3. **"지금 실행" 결과**: 정확한 발송 수 표시 (0 + 12 + 30 = 42명)
4. **발송 기록**: 자동 발송 탭에서 42건의 발송 기록 확인 가능

---

## 기술 세부사항

### DB 데이터 현황 확인됨

`automated_email_settings` 테이블에 3개 레코드 존재:
- `inactive_user`: 7일, 활성화됨
- `no_team_invite`: 7일, 활성화됨  
- `no_worship_set`: 14일, 활성화됨

`automated_email_log` 테이블 컬럼:
- `id`, `user_id`, `email_type`, `sent_at`, `metadata`, `status`, `error_message`, `recipient_email`, `recipient_name`

### 발송된 이메일 전체 목록

**팀원 초대 리마인더 (12명)**:
cs08sh@gmail.com, thecats_@naver.com, dsang3328@naver.com, shing92@naver.com, nsw715@naver.com, parkincheol@gmail.com, janice_o@naver.com, amor98@hanmail.net, idm01234@gmail.com, dornrrk9@gmail.com, pkym0528@gmail.com

**워십세트 생성 리마인더 (30명)**:
imssbb@gmail.com, testworship@test.com, kvision325@hotmail.com, heeeun0101@hotmail.com, taejinek@gmail.com, minheui0883@gmail.com, trustandwalk.2020@gmail.com, singingdiary@gmail.com, wangmoksa@gmail.com, admin@test.com, bjkim0864@gmail.com, shing92@naver.com, jea92@naver.com, g_park@kakao.com, leegyemy@gmail.com, jangchemy@naver.com, thecats_@naver.com, jinhc0207@hanmail.net, opwer1234@hanmail.net, dsang3328@naver.com, 0810002@naver.com, beeny81@naver.com, gsus4u@naver.com, rnflrh785@naver.com, kbb3927@naver.com, nsw715@naver.com, parkincheol@gmail.com, idm01234@gmail.com, dornrrk9@gmail.com, iblty88@gmail.com

