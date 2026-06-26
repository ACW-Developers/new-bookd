CREATE TABLE public.schedule_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL,
  title text NOT NULL,
  notes text,
  event_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  repeats text NOT NULL DEFAULT 'none',
  repeat_until date,
  blocks_availability boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.schedule_entries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.schedule_entries TO authenticated;
GRANT ALL ON public.schedule_entries TO service_role;

ALTER TABLE public.schedule_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Schedule entries are publicly readable"
  ON public.schedule_entries FOR SELECT
  USING (true);

CREATE POLICY "Professionals manage their own schedule entries (insert)"
  ON public.schedule_entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = professional_id);

CREATE POLICY "Professionals manage their own schedule entries (update)"
  ON public.schedule_entries FOR UPDATE
  TO authenticated
  USING (auth.uid() = professional_id)
  WITH CHECK (auth.uid() = professional_id);

CREATE POLICY "Professionals manage their own schedule entries (delete)"
  ON public.schedule_entries FOR DELETE
  TO authenticated
  USING (auth.uid() = professional_id);

CREATE TRIGGER set_schedule_entries_updated_at
  BEFORE UPDATE ON public.schedule_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
