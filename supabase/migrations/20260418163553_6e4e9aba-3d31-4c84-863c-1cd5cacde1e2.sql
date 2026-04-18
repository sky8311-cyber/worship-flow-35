CREATE TABLE public.set_song_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  set_song_id UUID NOT NULL REFERENCES public.set_songs(id) ON DELETE CASCADE,
  score_type TEXT NOT NULL CHECK (score_type IN ('web', 'upload')),
  score_url TEXT NOT NULL,
  score_thumbnail TEXT,
  musical_key TEXT NOT NULL DEFAULT 'C',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_set_song_scores_set_song_id ON public.set_song_scores(set_song_id);

ALTER TABLE public.set_song_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View set song scores"
ON public.set_song_scores FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.set_songs ss
    JOIN public.service_sets svc ON svc.id = ss.service_set_id
    WHERE ss.id = set_song_scores.set_song_id
      AND (svc.created_by = auth.uid() OR is_set_collaborator(auth.uid(), svc.id) OR is_admin(auth.uid()))
  )
);

CREATE POLICY "Insert set song scores"
ON public.set_song_scores FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.set_songs ss
    JOIN public.service_sets svc ON svc.id = ss.service_set_id
    WHERE ss.id = set_song_scores.set_song_id
      AND (svc.created_by = auth.uid() OR is_set_collaborator(auth.uid(), svc.id) OR is_admin(auth.uid()))
  )
);

CREATE POLICY "Update set song scores"
ON public.set_song_scores FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.set_songs ss
    JOIN public.service_sets svc ON svc.id = ss.service_set_id
    WHERE ss.id = set_song_scores.set_song_id
      AND (svc.created_by = auth.uid() OR is_set_collaborator(auth.uid(), svc.id) OR is_admin(auth.uid()))
  )
);

CREATE POLICY "Delete set song scores"
ON public.set_song_scores FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.set_songs ss
    JOIN public.service_sets svc ON svc.id = ss.service_set_id
    WHERE ss.id = set_song_scores.set_song_id
      AND (svc.created_by = auth.uid() OR is_set_collaborator(auth.uid(), svc.id) OR is_admin(auth.uid()))
  )
);