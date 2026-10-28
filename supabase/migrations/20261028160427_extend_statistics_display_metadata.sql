ALTER TABLE public.statistics
  RENAME COLUMN last_reviewed_at TO last_checked_at;

ALTER TABLE public.statistics
  ADD COLUMN category text,
  ADD COLUMN display_text text,
  ADD COLUMN visualization_type text,
  ADD COLUMN visualization_config jsonb NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(visualization_config) = 'object');
