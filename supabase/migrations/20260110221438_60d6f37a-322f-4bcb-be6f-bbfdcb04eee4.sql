-- 1. user_seeds 레코드가 없는 유저들에게 레코드 생성
INSERT INTO user_seeds (user_id, total_seeds, current_level)
SELECT 
  p.id,
  COALESCE((SELECT SUM(seeds_earned) FROM seed_transactions st WHERE st.user_id = p.id), 0),
  1
FROM profiles p
WHERE NOT EXISTS (SELECT 1 FROM user_seeds us WHERE us.user_id = p.id);

-- 2. user_seeds 테이블의 total_seeds를 실제 트랜잭션 합계와 동기화
UPDATE user_seeds us
SET 
  total_seeds = (
    SELECT COALESCE(SUM(seeds_earned), 0) 
    FROM seed_transactions st 
    WHERE st.user_id = us.user_id
  ),
  updated_at = now();

-- 3. 레벨 재계산
UPDATE user_seeds us
SET current_level = COALESCE(
  (SELECT level FROM seed_levels sl 
   WHERE us.total_seeds >= sl.min_seeds 
   ORDER BY level DESC LIMIT 1),
  1
);

-- 4. 아바타 보너스 소급 지급 (아바타가 있는데 보너스 없는 유저)
INSERT INTO seed_transactions (user_id, activity_type, seeds_earned, description)
SELECT 
  p.id,
  'avatar_upload',
  30,
  'Avatar upload bonus (retroactive)'
FROM profiles p
WHERE p.avatar_url IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM seed_transactions st 
    WHERE st.user_id = p.id AND st.activity_type = 'avatar_upload'
  );

-- 5. 프로필 완성 보너스 소급 지급
INSERT INTO seed_transactions (user_id, activity_type, seeds_earned, description)
SELECT 
  p.id,
  'profile_setup',
  50,
  'Profile setup bonus (retroactive)'
FROM profiles p
WHERE p.full_name IS NOT NULL 
  AND p.bio IS NOT NULL 
  AND p.location IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM seed_transactions st 
    WHERE st.user_id = p.id AND st.activity_type = 'profile_setup'
  );

-- 6. 소급 지급 후 다시 total_seeds 동기화 및 레벨 재계산
UPDATE user_seeds us
SET 
  total_seeds = (
    SELECT COALESCE(SUM(seeds_earned), 0) 
    FROM seed_transactions st 
    WHERE st.user_id = us.user_id
  ),
  current_level = COALESCE(
    (SELECT level FROM seed_levels sl 
     WHERE (SELECT COALESCE(SUM(seeds_earned), 0) FROM seed_transactions st WHERE st.user_id = us.user_id) >= sl.min_seeds 
     ORDER BY level DESC LIMIT 1),
    1
  ),
  updated_at = now();