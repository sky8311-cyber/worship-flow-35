

# 포지션 쿼리 400 에러 수정 + 버킷 Private 전환 (4단계)

## 문제 원인

`worship_set_signups` 테이블에 **foreign key가 하나도 없음**. `position_id → worship_set_positions`, `user_id → profiles` 관계가 DB에 정의되지 않아 PostgREST가 `profiles:user_id(...)` 조인을 해석할 수 없음.

## 작업 순서

### Step 1: worship_set_signups FK 추가 (마이그레이션)

```sql
ALTER TABLE public.worship_set_signups
  ADD CONSTRAINT worship_set_signups_position_id_fkey
    FOREIGN KEY (position_id) REFERENCES public.worship_set_positions(id) ON DELETE CASCADE,
  ADD CONSTRAINT worship_set_signups_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
```

이 FK가 추가되면 PostgREST 스키마 캐시가 갱신되어 `profiles:user_id(...)` 조인이 정상 작동.

### Step 2: 버킷 Private 전환 (마이그레이션)

```sql
UPDATE storage.buckets SET public = false WHERE id = 'scores';
```

코드 변경은 이미 완료됨 (Signed URL 로직, Edge Function 배포 완료). 버킷만 private으로 전환하면 4단계 완료.

## 영향 범위

- **FK 추가**: `PositionSignupCard.tsx`, `WorshipSetPositionsManager.tsx`의 기존 쿼리가 정상 작동하게 됨
- **버킷 전환**: 이미 배포된 Signed URL 코드가 활성화됨

