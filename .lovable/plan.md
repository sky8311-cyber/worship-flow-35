

# 자동 이메일 전역 쿨다운 수정 계획

## 문제 분석 결과

### 발견된 문제

1. **데이터베이스에 두 개의 RPC 함수 버전이 공존**
   - 이전 버전 (2개 파라미터): 타입별 쿨다운만 적용
   - 새 버전 (3개 파라미터): 전역 쿨다운 적용 (제가 만든 것)

2. **Live 환경의 RPC 함수에 오류가 있음**
   - `no_team_invite`: `column wc.created_by does not exist`
   - `no_worship_set`: `relation "worship_sets" does not exist`

3. **Test vs Live 환경 불일치**
   - Test 데이터베이스: 1월 27일 이후 해당 이메일들의 발송 기록 없음
   - Live 환경: 2월 3일, 4일, 5일 연속 발송됨 (사용자 확인)

---

## 해결 방안

### 1단계: 이전 버전 RPC 함수 완전 삭제

PostgreSQL에서 파라미터 수가 다르면 별도 함수로 취급됩니다.
이전 버전을 명시적으로 삭제해야 합니다.

```sql
DROP FUNCTION IF EXISTS get_automated_email_recipients(text, integer);
```

### 2단계: RPC 함수 오류 수정

현재 함수가 참조하는 테이블/컬럼이 잘못되어 있음:
- `worship_sets` → 실제 테이블 이름 확인 필요 (아마 `service_sets`)
- `wc.created_by` → 올바른 컬럼 확인 필요 (아마 `wc.leader_id`)

### 3단계: 수정된 함수 재배포

올바른 테이블/컬럼 이름으로 RPC 함수 재생성

---

## 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `supabase/migrations/xxx.sql` | 이전 RPC 함수 삭제 + 새 함수 재생성 (올바른 테이블명) |

---

## 중요: 추가 확인 필요

다음 테이블/컬럼 이름을 확인해야 정확한 수정이 가능합니다:
- worship set 테이블: `service_sets` vs `worship_sets`
- community 생성자 컬럼: `leader_id` vs `created_by`

---

## 예상 결과

| 항목 | 수정 전 | 수정 후 |
|-----|--------|--------|
| RPC 함수 버전 | 2개 공존 (충돌) | 1개만 존재 |
| 테이블 참조 | 잘못된 이름 | 올바른 테이블명 |
| 전역 쿨다운 | 미적용 (이전 버전 호출됨) | 정상 작동 |

