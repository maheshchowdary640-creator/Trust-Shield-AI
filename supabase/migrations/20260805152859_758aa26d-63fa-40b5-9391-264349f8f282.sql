CREATE TABLE public.scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_type text NOT NULL CHECK (scan_type IN ('screenshot','job_offer','url')),
  input_label text NOT NULL,
  trust_score integer NOT NULL DEFAULT 0,
  risk_level text NOT NULL DEFAULT 'unknown',
  verdict text NOT NULL DEFAULT '',
  summary text NOT NULL DEFAULT '',
  recommendation text NOT NULL DEFAULT '',
  threat_categories text[] NOT NULL DEFAULT '{}',
  findings jsonb NOT NULL DEFAULT '[]'::jsonb,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.scans TO anon;
GRANT SELECT, INSERT ON public.scans TO authenticated;
GRANT ALL ON public.scans TO service_role;

ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read scans" ON public.scans FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can create scans" ON public.scans FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE INDEX scans_created_at_idx ON public.scans (created_at DESC);