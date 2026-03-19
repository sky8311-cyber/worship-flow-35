
-- K-Worship Institute tables

-- 1. institute_courses
CREATE TABLE public.institute_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  title_ko text NOT NULL,
  description text,
  description_ko text,
  instructor_name text,
  duration_minutes integer,
  is_free boolean DEFAULT false,
  is_certification boolean DEFAULT false,
  badge_image_url text,
  thumbnail_url text,
  sort_order integer DEFAULT 0,
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 2. institute_modules
CREATE TABLE public.institute_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES public.institute_courses(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  title_ko text NOT NULL,
  content text,
  content_ko text,
  video_url text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 3. institute_enrollments
CREATE TABLE public.institute_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid REFERENCES public.institute_courses(id) ON DELETE CASCADE NOT NULL,
  enrolled_at timestamptz DEFAULT now(),
  completed_modules integer DEFAULT 0,
  completed_at timestamptz,
  assessment_passed boolean DEFAULT false,
  UNIQUE(user_id, course_id)
);

-- 4. institute_badges
CREATE TABLE public.institute_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid REFERENCES public.institute_courses(id) ON DELETE CASCADE NOT NULL,
  awarded_at timestamptz DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Enable RLS on all tables
ALTER TABLE public.institute_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institute_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institute_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institute_badges ENABLE ROW LEVEL SECURITY;

-- RLS: institute_courses — anyone can read published courses
CREATE POLICY "Anyone can view published courses"
  ON public.institute_courses FOR SELECT
  USING (is_published = true);

-- RLS: institute_modules — anyone can read modules of published courses
CREATE POLICY "Anyone can view modules of published courses"
  ON public.institute_modules FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.institute_courses
    WHERE id = institute_modules.course_id AND is_published = true
  ));

-- RLS: institute_enrollments — users can read their own enrollments
CREATE POLICY "Users can view own enrollments"
  ON public.institute_enrollments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- RLS: institute_enrollments — users can insert their own enrollments
CREATE POLICY "Users can enroll themselves"
  ON public.institute_enrollments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- RLS: institute_badges — anyone authenticated can view badges (for public profile display)
CREATE POLICY "Anyone can view badges"
  ON public.institute_badges FOR SELECT
  TO authenticated
  USING (true);
