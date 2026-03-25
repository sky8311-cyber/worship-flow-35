-- 1. Create ai_prompts table
CREATE TABLE public.ai_prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0',
  content TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ai_prompts ENABLE ROW LEVEL SECURITY;

-- Trigger for updated_at
CREATE TRIGGER update_ai_prompts_updated_at
  BEFORE UPDATE ON public.ai_prompts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Add columns to service_sets
ALTER TABLE public.service_sets
  ADD COLUMN theological_proposition TEXT,
  ADD COLUMN emotional_journey TEXT,
  ADD COLUMN tempo_pattern TEXT,
  ADD COLUMN conductor_note TEXT,
  ADD COLUMN ai_generated BOOLEAN DEFAULT false;