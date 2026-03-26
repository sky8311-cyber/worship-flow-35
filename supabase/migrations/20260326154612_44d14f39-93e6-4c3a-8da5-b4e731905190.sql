
-- 1. institute_quizzes: 모듈별 퀴즈
CREATE TABLE public.institute_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.institute_modules(id) ON DELETE CASCADE,
  title TEXT,
  title_ko TEXT,
  description_ko TEXT,
  pass_threshold INTEGER NOT NULL DEFAULT 70,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  time_limit_minutes INTEGER,
  is_published BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 999,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.institute_quizzes ENABLE ROW LEVEL SECURITY;

-- RLS: anyone can read
CREATE POLICY "Anyone can view quizzes"
  ON public.institute_quizzes FOR SELECT
  USING (true);

-- RLS: admins can do everything
CREATE POLICY "Admins can manage quizzes"
  ON public.institute_quizzes FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- 2. institute_quiz_questions: 퀴즈 질문
CREATE TABLE public.institute_quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.institute_quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_text_ko TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_answer_index INTEGER NOT NULL,
  explanation_ko TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.institute_quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view quiz questions"
  ON public.institute_quiz_questions FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage quiz questions"
  ON public.institute_quiz_questions FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- 3. institute_quiz_attempts: 퀴즈 응시 기록
CREATE TABLE public.institute_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES public.institute_quizzes(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  passed BOOLEAN NOT NULL DEFAULT false,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.institute_quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own attempts"
  ON public.institute_quiz_attempts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attempts"
  ON public.institute_quiz_attempts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all attempts"
  ON public.institute_quiz_attempts FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- 4. institute_chapters: content_type + content_blocks 추가
ALTER TABLE public.institute_chapters
  ADD COLUMN IF NOT EXISTS content_type TEXT NOT NULL DEFAULT 'html',
  ADD COLUMN IF NOT EXISTS content_blocks JSONB NOT NULL DEFAULT '[]'::jsonb;

-- content_type validation trigger (CHECK 대신)
CREATE OR REPLACE FUNCTION public.validate_chapter_content_type()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.content_type NOT IN ('html', 'blocks') THEN
    RAISE EXCEPTION 'content_type must be html or blocks, got: %', NEW.content_type;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_chapter_content_type
  BEFORE INSERT OR UPDATE ON public.institute_chapters
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_chapter_content_type();

-- 5. institute_modules: description_ko 추가
ALTER TABLE public.institute_modules
  ADD COLUMN IF NOT EXISTS description_ko TEXT;
