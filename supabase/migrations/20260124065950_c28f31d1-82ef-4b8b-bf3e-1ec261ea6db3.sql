-- 1. 기존 SELECT 정책 삭제
DROP POLICY IF EXISTS "Users can view own favorites" ON user_favorite_songs;

-- 2. 새로운 SELECT 정책: 모든 인증된 사용자가 조회 가능
-- (Favorite 카운트를 모든 유저에게 공개하기 위함)
CREATE POLICY "Authenticated users can view favorites for counting"
ON user_favorite_songs FOR SELECT
TO authenticated
USING (true);