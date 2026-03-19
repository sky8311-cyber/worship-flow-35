
-- 1. Create institute_certifications table
CREATE TABLE public.institute_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  title_ko text NOT NULL,
  description_ko text,
  badge_image_url text,
  certificate_template_url text,
  is_published boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.institute_certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read certifications"
  ON public.institute_certifications FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage certifications"
  ON public.institute_certifications FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- 2. Create institute_certification_courses junction table
CREATE TABLE public.institute_certification_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  certification_id uuid REFERENCES public.institute_certifications(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.institute_courses(id) ON DELETE CASCADE,
  sort_order integer DEFAULT 0,
  UNIQUE(certification_id, course_id)
);

ALTER TABLE public.institute_certification_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read certification courses"
  ON public.institute_certification_courses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage certification courses"
  ON public.institute_certification_courses FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- 3. Modify institute_badges: drop course_id, add certification_id
ALTER TABLE public.institute_badges
  DROP CONSTRAINT IF EXISTS institute_badges_course_id_fkey,
  DROP COLUMN IF EXISTS course_id,
  ADD COLUMN IF NOT EXISTS certification_id uuid REFERENCES public.institute_certifications(id) ON DELETE CASCADE;

-- Drop the old unique constraint and add new one
ALTER TABLE public.institute_badges
  DROP CONSTRAINT IF EXISTS institute_badges_user_id_course_id_key;

ALTER TABLE public.institute_badges
  ADD CONSTRAINT institute_badges_user_id_certification_id_key UNIQUE (user_id, certification_id);
