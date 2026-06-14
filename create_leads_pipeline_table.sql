-- Custom lead pipeline stages per lister (developer, agent, or agency)
CREATE TABLE IF NOT EXISTS public.leads_pipeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('developer', 'agent', 'agency')),
  status VARCHAR(100) NOT NULL,
  value VARCHAR(255) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT leads_pipeline_user_status_unique UNIQUE (user_id, user_type, status)
);

CREATE INDEX IF NOT EXISTS idx_leads_pipeline_user
  ON public.leads_pipeline (user_id, user_type);

CREATE INDEX IF NOT EXISTS idx_leads_pipeline_user_sort
  ON public.leads_pipeline (user_id, user_type, sort_order);

COMMENT ON TABLE public.leads_pipeline IS 'Custom lead pipeline stages per lister';
COMMENT ON COLUMN public.leads_pipeline.status IS 'Machine key stored on leads.status';
COMMENT ON COLUMN public.leads_pipeline.value IS 'Display label shown in the UI';
