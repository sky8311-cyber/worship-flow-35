-- 1. post_comments 테이블의 CHECK 제약조건 수정
ALTER TABLE post_comments DROP CONSTRAINT IF EXISTS post_comments_post_type_check;
ALTER TABLE post_comments ADD CONSTRAINT post_comments_post_type_check 
  CHECK (post_type = ANY (ARRAY['community_post'::text, 'worship_set'::text, 'calendar_event'::text, 'feedback_post'::text]));

-- 2. post_likes 테이블의 CHECK 제약조건 수정
ALTER TABLE post_likes DROP CONSTRAINT IF EXISTS post_likes_post_type_check;
ALTER TABLE post_likes ADD CONSTRAINT post_likes_post_type_check 
  CHECK (post_type = ANY (ARRAY['community_post'::text, 'worship_set'::text, 'calendar_event'::text, 'feedback_post'::text]));