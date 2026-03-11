-- Add user settings field for developer/agency/agent profiles
-- Default behavior: all toggles are false

BEGIN;

-- Canonical default settings structure (per feature)
-- Example:
-- "reminders": { "sms": true, "email": false }
-- "two_factor": { "sms": true }

ALTER TABLE public.developers
  ADD COLUMN IF NOT EXISTS settings jsonb DEFAULT '{
    "two_factor": { "sms": false },
    "reminders": { "sms": false, "email": false },
    "appointments": { "sms": false, "email": false },
    "service_charges": { "sms": false, "email": false },
    "engagements": { "sms": false, "email": false }
  }'::jsonb;

ALTER TABLE public.agencies
  ADD COLUMN IF NOT EXISTS settings jsonb DEFAULT '{
    "two_factor": { "sms": false },
    "reminders": { "sms": false, "email": false },
    "appointments": { "sms": false, "email": false },
    "service_charges": { "sms": false, "email": false },
    "engagements": { "sms": false, "email": false }
  }'::jsonb;

ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS settings jsonb DEFAULT '{
    "two_factor": { "sms": false },
    "reminders": { "sms": false, "email": false },
    "appointments": { "sms": false, "email": false },
    "service_charges": { "sms": false, "email": false },
    "engagements": { "sms": false, "email": false }
  }'::jsonb;

-- Backfill rows:
-- 1) null settings -> set canonical default
-- 2) old schema that has top-level keys "notification" / "sms" / "email" -> migrate to canonical default
UPDATE public.developers
SET settings = '{
  "two_factor": { "sms": false },
  "reminders": { "sms": false, "email": false },
  "appointments": { "sms": false, "email": false },
  "service_charges": { "sms": false, "email": false },
  "engagements": { "sms": false, "email": false }
}'::jsonb
WHERE settings IS NULL
   OR settings ? 'notification'
   OR settings ? 'sms'
   OR settings ? 'email';

UPDATE public.agencies
SET settings = '{
  "two_factor": { "sms": false },
  "reminders": { "sms": false, "email": false },
  "appointments": { "sms": false, "email": false },
  "service_charges": { "sms": false, "email": false },
  "engagements": { "sms": false, "email": false }
}'::jsonb
WHERE settings IS NULL
   OR settings ? 'notification'
   OR settings ? 'sms'
   OR settings ? 'email';

UPDATE public.agents
SET settings = '{
  "two_factor": { "sms": false },
  "reminders": { "sms": false, "email": false },
  "appointments": { "sms": false, "email": false },
  "service_charges": { "sms": false, "email": false },
  "engagements": { "sms": false, "email": false }
}'::jsonb
WHERE settings IS NULL
   OR settings ? 'notification'
   OR settings ? 'sms'
   OR settings ? 'email';

-- Enforce presence and JSON object shape
ALTER TABLE public.developers
  ALTER COLUMN settings SET NOT NULL;
ALTER TABLE public.agencies
  ALTER COLUMN settings SET NOT NULL;
ALTER TABLE public.agents
  ALTER COLUMN settings SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'developers_settings_is_object'
  ) THEN
    ALTER TABLE public.developers
      ADD CONSTRAINT developers_settings_is_object
      CHECK (jsonb_typeof(settings) = 'object');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'agencies_settings_is_object'
  ) THEN
    ALTER TABLE public.agencies
      ADD CONSTRAINT agencies_settings_is_object
      CHECK (jsonb_typeof(settings) = 'object');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'agents_settings_is_object'
  ) THEN
    ALTER TABLE public.agents
      ADD CONSTRAINT agents_settings_is_object
      CHECK (jsonb_typeof(settings) = 'object');
  END IF;
END $$;

COMMIT;

