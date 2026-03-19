BEGIN;

ALTER TABLE IF EXISTS public.client_service_charges
  ADD COLUMN IF NOT EXISTS next_due_time TIME DEFAULT '08:00:00';

UPDATE public.client_service_charges
SET next_due_time = '08:00:00'
WHERE next_due_time IS NULL;

CREATE INDEX IF NOT EXISTS idx_client_service_charges_next_due_time
  ON public.client_service_charges(next_due_time);

COMMIT;
