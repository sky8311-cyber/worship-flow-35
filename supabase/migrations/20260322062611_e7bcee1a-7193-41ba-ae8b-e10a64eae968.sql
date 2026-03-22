
-- ============================================================
-- KWI 4계층 아키텍처 + 초대 시스템 테이블 생성
-- ============================================================

-- 1. institute_pathways
CREATE TABLE institute_pathways (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  title_ko text,
  description_ko text,
  badge_image_url text,
  is_published boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE institute_pathways ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view published pathways"
  ON institute_pathways FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage pathways"
  ON institute_pathways FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- 2. institute_pathway_courses (junction)
CREATE TABLE institute_pathway_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pathway_id uuid REFERENCES institute_pathways(id) ON DELETE CASCADE,
  course_id uuid REFERENCES institute_courses(id) ON DELETE CASCADE,
  sort_order integer DEFAULT 0
);
ALTER TABLE institute_pathway_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view pathway courses"
  ON institute_pathway_courses FOR SELECT USING (true);
CREATE POLICY "Admins can manage pathway courses"
  ON institute_pathway_courses FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- 3. institute_chapters
CREATE TABLE institute_chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid REFERENCES institute_modules(id) ON DELETE CASCADE,
  title text,
  title_ko text,
  content_ko text,
  video_url text,
  audio_url text,
  sort_order integer DEFAULT 0,
  required_tier integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE institute_chapters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view chapters"
  ON institute_chapters FOR SELECT USING (true);
CREATE POLICY "Admins can manage chapters"
  ON institute_chapters FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- 4. institute_chapter_progress
CREATE TABLE institute_chapter_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  chapter_id uuid REFERENCES institute_chapters(id) ON DELETE CASCADE NOT NULL,
  completed_at timestamptz,
  quiz_passed boolean DEFAULT false,
  UNIQUE(user_id, chapter_id)
);
ALTER TABLE institute_chapter_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own chapter progress"
  ON institute_chapter_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chapter progress"
  ON institute_chapter_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own chapter progress"
  ON institute_chapter_progress FOR UPDATE USING (auth.uid() = user_id);

-- 5. institute_invitations
CREATE TABLE institute_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invited_by uuid REFERENCES profiles(id),
  user_id uuid REFERENCES profiles(id),
  course_id uuid REFERENCES institute_courses(id),
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  accepted_at timestamptz,
  UNIQUE(user_id, course_id)
);
ALTER TABLE institute_invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own invitations"
  ON institute_invitations FOR SELECT USING (auth.uid() = user_id OR auth.uid() = invited_by);
CREATE POLICY "Users can insert invitations"
  ON institute_invitations FOR INSERT WITH CHECK (auth.uid() = invited_by);
CREATE POLICY "Users can update own invitations"
  ON institute_invitations FOR UPDATE USING (auth.uid() = user_id);
