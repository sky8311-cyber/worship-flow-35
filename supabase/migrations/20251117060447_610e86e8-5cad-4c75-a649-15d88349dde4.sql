-- admin@test.com 계정에 admin 역할 추가
-- 회원가입 후 이 마이그레이션이 실행되면 자동으로 admin 역할이 할당됩니다

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'admin@test.com'
ON CONFLICT (user_id, role) DO NOTHING;