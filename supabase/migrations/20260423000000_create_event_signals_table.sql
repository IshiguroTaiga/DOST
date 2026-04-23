-- Create event_signals table for hierarchical disaster alerts
CREATE TABLE IF NOT EXISTS public.event_signals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  province text NOT NULL,
  city text,
  barangay text,
  signal text,
  assigned_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT event_signals_pkey PRIMARY KEY (id),
  CONSTRAINT event_signals_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE,
  CONSTRAINT event_signals_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id),
  CONSTRAINT event_signals_event_province_city_barangay_key UNIQUE (event_id, province, city, barangay)
);

-- Enable RLS
ALTER TABLE public.event_signals ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable read access for all authenticated users" ON public.event_signals
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.event_signals
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON public.event_signals
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON public.event_signals
  FOR DELETE USING (auth.role() = 'authenticated');
