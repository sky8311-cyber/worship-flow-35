INSERT INTO platform_feature_flags (key, description, enabled)
VALUES ('worship_leader_auto_approve', '예배인도자 승급신청 자동 승인 (베타)', true)
ON CONFLICT (key) DO NOTHING;