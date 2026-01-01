-- Add set_deleted and set_unpublished to rewards_rules
INSERT INTO rewards_rules (code, amount, description, description_ko, enabled, daily_cap_amount)
VALUES 
  ('set_deleted', -15, 'Worship set deleted', '예배 세트 삭제', true, 0),
  ('set_unpublished', -10, 'Worship set unpublished', '예배 세트 발행 취소', true, 0)
ON CONFLICT (code) DO NOTHING;

-- Fix rewards_ledger entries where direction is debit but reason_code is wrong
UPDATE rewards_ledger 
SET reason_code = 'set_deleted' 
WHERE direction = 'debit' 
  AND reason_code = 'set_created'
  AND (meta->>'description' ILIKE '%deleted%' OR meta->>'description' ILIKE '%삭제%');

UPDATE rewards_ledger 
SET reason_code = 'set_unpublished' 
WHERE direction = 'debit' 
  AND reason_code = 'set_published'
  AND (meta->>'description' ILIKE '%unpublished%' OR meta->>'description' ILIKE '%발행 취소%');