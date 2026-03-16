-- Add notification tracking fields for scheduled reminders/appointments/service charges/engagements
-- Run in Supabase SQL Editor

BEGIN;

-- reminders
ALTER TABLE IF EXISTS public.reminders
  ADD COLUMN IF NOT EXISTS notification_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS notification_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notification_last_attempt_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notification_error TEXT,
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS user_type TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'reminders_notification_status_check'
  ) THEN
    ALTER TABLE public.reminders
      ADD CONSTRAINT reminders_notification_status_check
      CHECK (notification_status IN ('pending', 'sent', 'failed', 'cancelled'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_reminders_notification_status
  ON public.reminders(notification_status);

-- appointments
ALTER TABLE IF EXISTS public.appointments
  ADD COLUMN IF NOT EXISTS notification_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS notification_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notification_last_attempt_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notification_error TEXT,
  ADD COLUMN IF NOT EXISTS created_by_user_type TEXT DEFAULT 'property_seeker';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'appointments_notification_status_check'
  ) THEN
    ALTER TABLE public.appointments
      ADD CONSTRAINT appointments_notification_status_check
      CHECK (notification_status IN ('pending', 'sent', 'failed', 'cancelled'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_appointments_notification_status
  ON public.appointments(notification_status);

-- client_service_charges
ALTER TABLE IF EXISTS public.client_service_charges
  ADD COLUMN IF NOT EXISTS notification_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS notification_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notification_last_attempt_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notification_error TEXT,
  ADD COLUMN IF NOT EXISTS created_by_user_id UUID,
  ADD COLUMN IF NOT EXISTS created_by_user_type TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'client_service_charges_notification_status_check'
  ) THEN
    ALTER TABLE public.client_service_charges
      ADD CONSTRAINT client_service_charges_notification_status_check
      CHECK (notification_status IN ('pending', 'sent', 'failed', 'cancelled'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_client_service_charges_notification_status
  ON public.client_service_charges(notification_status);

-- client_engagement_log
ALTER TABLE IF EXISTS public.client_engagement_log
  ADD COLUMN IF NOT EXISTS notification_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS notification_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notification_last_attempt_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notification_error TEXT,
  ADD COLUMN IF NOT EXISTS created_by_user_type TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'client_engagement_log_notification_status_check'
  ) THEN
    ALTER TABLE public.client_engagement_log
      ADD CONSTRAINT client_engagement_log_notification_status_check
      CHECK (notification_status IN ('pending', 'sent', 'failed', 'cancelled'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_client_engagement_log_notification_status
  ON public.client_engagement_log(notification_status);

COMMIT;

