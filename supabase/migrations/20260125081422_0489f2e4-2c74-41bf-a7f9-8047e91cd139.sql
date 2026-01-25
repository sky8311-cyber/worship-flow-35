-- 스튜디오 그리드 위젯 저장 테이블
CREATE TABLE public.studio_widgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.worship_rooms(id) ON DELETE CASCADE,
  widget_type text NOT NULL, -- 'text', 'heading', 'quote', 'callout', 'image', 'video', 'post', 'todo', 'numbered-list', 'bullet-list', 'divider'
  content jsonb NOT NULL DEFAULT '{}',
  -- Grid positioning
  grid_column integer NOT NULL DEFAULT 1,
  grid_row integer NOT NULL DEFAULT 1,
  column_span integer NOT NULL DEFAULT 1,
  row_span integer NOT NULL DEFAULT 1,
  -- Optional link to existing post
  post_id uuid REFERENCES public.room_posts(id) ON DELETE SET NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_studio_widgets_room ON public.studio_widgets(room_id);
CREATE INDEX idx_studio_widgets_order ON public.studio_widgets(room_id, sort_order);

-- RLS 활성화
ALTER TABLE public.studio_widgets ENABLE ROW LEVEL SECURITY;

-- 공개 스튜디오 또는 본인 스튜디오 위젯 조회 가능
CREATE POLICY "Anyone can read accessible studio widgets" ON public.studio_widgets 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.worship_rooms wr 
      WHERE wr.id = studio_widgets.room_id 
      AND (
        wr.visibility = 'public' 
        OR wr.owner_user_id = auth.uid()
        OR (wr.visibility = 'friends' AND public.are_friends(auth.uid(), wr.owner_user_id))
      )
    )
  );

-- 본인 스튜디오 위젯 관리 가능
CREATE POLICY "Owners can insert widgets" ON public.studio_widgets 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.worship_rooms wr 
      WHERE wr.id = studio_widgets.room_id AND wr.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can update widgets" ON public.studio_widgets 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.worship_rooms wr 
      WHERE wr.id = studio_widgets.room_id AND wr.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can delete widgets" ON public.studio_widgets 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.worship_rooms wr 
      WHERE wr.id = studio_widgets.room_id AND wr.owner_user_id = auth.uid()
    )
  );

-- worship_rooms 컬럼 추가
ALTER TABLE public.worship_rooms 
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS studio_name text,
  ADD COLUMN IF NOT EXISTS grid_columns integer DEFAULT 3;

-- updated_at 트리거
CREATE TRIGGER update_studio_widgets_updated_at
  BEFORE UPDATE ON public.studio_widgets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_worship_room_updated_at();