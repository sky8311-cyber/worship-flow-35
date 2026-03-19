
-- Add columns to institute_courses
ALTER TABLE institute_courses
ADD COLUMN IF NOT EXISTS required_tier integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS instructor_user_id uuid REFERENCES auth.users(id);

-- Add column to institute_modules
ALTER TABLE institute_modules
ADD COLUMN IF NOT EXISTS required_tier integer NOT NULL DEFAULT 0;

-- Create institute_instructors table
CREATE TABLE IF NOT EXISTS institute_instructors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  display_name text,
  bio text,
  bio_ko text,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

-- RLS for institute_instructors
ALTER TABLE institute_instructors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view instructors"
  ON institute_instructors FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage instructors"
  ON institute_instructors FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Instructors can update own record"
  ON institute_instructors FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Drop existing admin-only policies on institute_courses to add instructor access
DROP POLICY IF EXISTS "Admins can manage courses" ON institute_courses;

CREATE POLICY "Admins can manage courses"
  ON institute_courses FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Instructors can update own courses"
  ON institute_courses FOR UPDATE
  TO authenticated
  USING (instructor_user_id = auth.uid())
  WITH CHECK (instructor_user_id = auth.uid());

-- Drop existing admin-only policies on institute_modules to add instructor access
DROP POLICY IF EXISTS "Admins can manage modules" ON institute_modules;

CREATE POLICY "Admins can manage modules"
  ON institute_modules FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Instructors can manage own course modules"
  ON institute_modules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM institute_courses
      WHERE id = institute_modules.course_id
      AND instructor_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM institute_courses
      WHERE id = institute_modules.course_id
      AND instructor_user_id = auth.uid()
    )
  );
