-- Create platform_milestones table for app history/timeline
CREATE TABLE public.platform_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_date DATE NOT NULL,
  title_ko TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_ko TEXT,
  description_en TEXT,
  category TEXT NOT NULL DEFAULT 'milestone' CHECK (category IN ('launch', 'feature', 'milestone', 'update')),
  is_visible BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_milestones ENABLE ROW LEVEL SECURITY;

-- Everyone can view visible milestones
CREATE POLICY "Anyone can view visible milestones"
ON public.platform_milestones
FOR SELECT
USING (is_visible = true);

-- Admins can view all milestones
CREATE POLICY "Admins can view all milestones"
ON public.platform_milestones
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Admins can insert milestones
CREATE POLICY "Admins can insert milestones"
ON public.platform_milestones
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Admins can update milestones
CREATE POLICY "Admins can update milestones"
ON public.platform_milestones
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Admins can delete milestones
CREATE POLICY "Admins can delete milestones"
ON public.platform_milestones
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_platform_milestones_updated_at
BEFORE UPDATE ON public.platform_milestones
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial milestone data based on research
INSERT INTO public.platform_milestones (event_date, title_ko, title_en, description_ko, description_en, category, is_visible, sort_order) VALUES
('2025-11-16', '플랫폼 개발 시작', 'Development Started', '첫 번째 마이그레이션 실행, songs/service_sets/set_songs 테이블 생성', 'First migration executed, songs/service_sets/set_songs tables created', 'milestone', false, 1),
('2025-11-17', '첫 번째 사용자 가입', 'First User Signup', '플랫폼 첫 사용자가 가입했습니다', 'The first user signed up to the platform', 'milestone', true, 2),
('2025-11-21', '첫 번째 곡 등록', 'First Song Added', '노래 라이브러리에 첫 번째 곡이 추가되었습니다', 'First song was added to the library', 'milestone', true, 3),
('2025-11-22', '공동체 시스템 출시', 'Community System Launch', '예배 공동체 생성 및 멤버 관리 기능 출시', 'Worship community creation and member management launched', 'feature', true, 4),
('2025-11-24', '워십리더 신청 시스템', 'Worship Leader Application', '워십리더 승급 신청 시스템 도입', 'Worship leader promotion application system introduced', 'feature', true, 5),
('2025-12-23', '공동체 소유자 역할', 'Community Owner Role', '공동체 소유자 역할 시스템 추가', 'Community owner role system added', 'feature', true, 6),
('2025-12-27', '예배세트 히스토리', 'Set History & Versioning', '실시간 동기화, 버전 관리, 되돌리기 기능 출시', 'Real-time sync, version control, and revert features launched', 'feature', true, 7),
('2025-12-28', 'K-Seed 리워드 시스템', 'K-Seed Rewards System', '활동 포인트, 레벨 시스템, 리워드 스토어 출시', 'Activity points, level system, and rewards store launched', 'feature', true, 8),
('2026-01-08', '정식 출시', 'Official Launch', 'K-Worship 플랫폼 정식 서비스 출시', 'K-Worship platform officially launched', 'launch', true, 9);