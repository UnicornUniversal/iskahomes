-- Add terms_of_agreement status to developers, agencies, and agents
-- Default is awaiting_acceptance for all existing and new rows

BEGIN;

ALTER TABLE public.developers
  ADD COLUMN IF NOT EXISTS terms_of_agreement character varying(30) DEFAULT 'awaiting_acceptance';

ALTER TABLE public.agencies
  ADD COLUMN IF NOT EXISTS terms_of_agreement character varying(30) DEFAULT 'awaiting_acceptance';

ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS terms_of_agreement character varying(30) DEFAULT 'awaiting_acceptance';

-- Backfill existing NULLs in case the column existed without default
UPDATE public.developers
SET terms_of_agreement = 'awaiting_acceptance'
WHERE terms_of_agreement IS NULL;

UPDATE public.agencies
SET terms_of_agreement = 'awaiting_acceptance'
WHERE terms_of_agreement IS NULL;

UPDATE public.agents
SET terms_of_agreement = 'awaiting_acceptance'
WHERE terms_of_agreement IS NULL;

-- Constrain allowed values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'developers_terms_of_agreement_valid'
  ) THEN
    ALTER TABLE public.developers
      ADD CONSTRAINT developers_terms_of_agreement_valid
      CHECK (terms_of_agreement IN ('awaiting_acceptance', 'accepted'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'agencies_terms_of_agreement_valid'
  ) THEN
    ALTER TABLE public.agencies
      ADD CONSTRAINT agencies_terms_of_agreement_valid
      CHECK (terms_of_agreement IN ('awaiting_acceptance', 'accepted'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'agents_terms_of_agreement_valid'
  ) THEN
    ALTER TABLE public.agents
      ADD CONSTRAINT agents_terms_of_agreement_valid
      CHECK (terms_of_agreement IN ('awaiting_acceptance', 'accepted'));
  END IF;
END $$;

COMMENT ON COLUMN public.developers.terms_of_agreement IS 'Terms of agreement status: awaiting_acceptance or accepted';
COMMENT ON COLUMN public.agencies.terms_of_agreement IS 'Terms of agreement status: awaiting_acceptance or accepted';
COMMENT ON COLUMN public.agents.terms_of_agreement IS 'Terms of agreement status: awaiting_acceptance or accepted';

COMMIT;
