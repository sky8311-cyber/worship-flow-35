
-- Table: upload_copyright_acknowledgments
CREATE TABLE public.upload_copyright_acknowledgments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  acknowledgment_version TEXT NOT NULL DEFAULT '1.0',
  language TEXT NOT NULL DEFAULT 'en',
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, acknowledgment_version)
);

ALTER TABLE public.upload_copyright_acknowledgments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own acknowledgments"
  ON public.upload_copyright_acknowledgments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own acknowledgments"
  ON public.upload_copyright_acknowledgments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Table: copyright_reports
CREATE TABLE public.copyright_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_email TEXT NOT NULL,
  reporter_name TEXT,
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'song_score',
  reason TEXT NOT NULL,
  evidence_url TEXT,
  status TEXT NOT NULL DEFAULT 'submitted',
  reviewer_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  uploader_user_id UUID
);

ALTER TABLE public.copyright_reports ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can submit a report
CREATE POLICY "Anyone can submit copyright report"
  ON public.copyright_reports FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can view reports
CREATE POLICY "Admins can view copyright reports"
  ON public.copyright_reports FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can update reports
CREATE POLICY "Admins can update copyright reports"
  ON public.copyright_reports FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Index for looking up reports by uploader
CREATE INDEX idx_copyright_reports_uploader ON public.copyright_reports (uploader_user_id) WHERE uploader_user_id IS NOT NULL;
CREATE INDEX idx_copyright_reports_status ON public.copyright_reports (status);
CREATE INDEX idx_copyright_reports_content ON public.copyright_reports (content_id, content_type);

-- Helper function: get validated strike count for a user
CREATE OR REPLACE FUNCTION public.get_validated_strike_count(_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.copyright_reports
  WHERE uploader_user_id = _user_id
    AND status IN ('validated', 'removed', 'user_warned', 'user_suspended');
$$;
