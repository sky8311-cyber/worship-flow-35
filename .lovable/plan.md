
# 곡 삭제 시 알림 자동 정리

## 현재 상황

- **중복곡 찾기 기능**: 이미 곡 라이브러리에 "중복 찾기" 버튼이 있고, `DuplicateReviewDialog`가 구현되어 있습니다. 추가 작업 불필요합니다.
- **중복곡 등록 경고**: 말씀하신 대로 중복곡은 악보/레퍼런스가 다를 수 있으므로 경고 없이 등록을 허용합니다 (현재 동작 그대로 유지).
- **곡 삭제 시 알림 잔존 문제**: 곡이 삭제되어도 해당 곡의 "새 곡 추가" 알림(`related_type = 'song'`)이 남아 있어 "유령 알림"이 발생합니다.

## 해결 방안

데이터베이스 트리거를 추가하여, 곡이 삭제될 때 해당 곡과 연관된 알림을 자동으로 함께 삭제합니다.

## 수정 내용

### DB 마이그레이션 (1건)

곡 삭제 시 관련 알림을 정리하는 트리거 함수 생성:

```sql
-- 곡 삭제 시 관련 알림 정리
CREATE OR REPLACE FUNCTION public.cleanup_song_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.notifications
  WHERE related_id = OLD.id
    AND related_type = 'song';
  RETURN OLD;
END;
$$;

CREATE TRIGGER on_song_deleted_cleanup_notifications
  BEFORE DELETE ON public.songs
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_song_notifications();
```

### 코드 변경: 없음

- 중복곡 찾기: 이미 구현 완료 (곡 라이브러리 > 중복 찾기 버튼)
- 중복곡 등록 경고: 추가하지 않음 (의도적 중복 허용)
- 프론트엔드 코드 수정 없음

## 결과

| 시나리오 | Before | After |
|---------|--------|-------|
| 곡 삭제 후 알림 | 알림이 남아있음 ("유령 알림") | 알림도 자동 삭제 |
| 곡 등록 시 중복 경고 | 없음 | 없음 (유지) |
| 중복곡 찾기 | 곡 라이브러리에서 가능 | 그대로 유지 |
