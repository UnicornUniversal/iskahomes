-- =============================================
-- SUBSCRIPTION REMINDER TABLES (option 3)
-- =============================================
-- 1. subscription_reminder_state — one row per subscription being tracked
-- 2. subscription_reminder_log — append-only audit of every reminder attempt
--
-- Run after: subscriptions, invoices (optional FK), subscriptions_package exists.
-- Grace period length (14 days) is enforced in app logic when creating rows;
-- grace_days here is a snapshot for auditing if policy changes later.
-- =============================================

BEGIN;

-- =============================================
-- 1. SUBSCRIPTION_REMINDER_STATE
-- =============================================
CREATE TABLE IF NOT EXISTS public.subscription_reminder_state (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('developer', 'agent', 'agency')),

  cadence_days INTEGER NOT NULL DEFAULT 4 CHECK (cadence_days > 0),
  grace_days INTEGER NOT NULL DEFAULT 14 CHECK (grace_days >= 0),

  reminder_phase VARCHAR(30) NOT NULL DEFAULT 'before_end' CHECK (
    reminder_phase IN ('before_end', 'in_grace', 'completed', 'stopped')
  ),

  first_reminder_at TIMESTAMPTZ,
  next_reminder_at TIMESTAMPTZ,
  last_reminder_at TIMESTAMPTZ,
  reminders_sent_count INTEGER NOT NULL DEFAULT 0 CHECK (reminders_sent_count >= 0),

  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (
    status IN ('active', 'paused', 'completed', 'cancelled')
  ),
  stopped_reason VARCHAR(40) CHECK (
    stopped_reason IS NULL OR stopped_reason IN (
      'paid',
      'renewed',
      'grace_ended_downgraded',
      'manual_cancel',
      'admin',
      'subscription_replaced',
      'expired_no_reminder'
    )
  ),

  last_invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,

  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT subscription_reminder_state_subscription_unique UNIQUE (subscription_id)
);

CREATE INDEX IF NOT EXISTS idx_subscription_reminder_state_user
  ON public.subscription_reminder_state(user_id, user_type);

CREATE INDEX IF NOT EXISTS idx_subscription_reminder_state_next_active
  ON public.subscription_reminder_state(next_reminder_at)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_subscription_reminder_state_status
  ON public.subscription_reminder_state(status);

CREATE INDEX IF NOT EXISTS idx_subscription_reminder_state_metadata_gin
  ON public.subscription_reminder_state USING GIN (metadata);

COMMENT ON TABLE public.subscription_reminder_state IS
  'Tracks per-subscription payment reminder scheduling; one row per subscriptions.id.';
COMMENT ON COLUMN public.subscription_reminder_state.grace_days IS
  'Snapshot of grace policy (e.g. 14) when this state row was created.';
COMMENT ON COLUMN public.subscription_reminder_state.next_reminder_at IS
  'When the cron/worker should next consider sending a reminder.';

-- =============================================
-- 2. SUBSCRIPTION_REMINDER_LOG
-- =============================================
CREATE TABLE IF NOT EXISTS public.subscription_reminder_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  subscription_reminder_state_id UUID NOT NULL REFERENCES public.subscription_reminder_state(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,

  user_id UUID NOT NULL,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('developer', 'agent', 'agency')),

  reminder_sequence INTEGER NOT NULL CHECK (reminder_sequence >= 1),

  scheduled_for TIMESTAMPTZ NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  outcome VARCHAR(20) NOT NULL CHECK (outcome IN ('sent', 'failed', 'skipped')),
  skip_reason VARCHAR(80) CHECK (
    skip_reason IS NULL OR skip_reason IN (
      'already_paid',
      'not_in_grace',
      'channels_disabled',
      'no_email',
      'duplicate_guard',
      'state_not_active',
      'subscription_not_eligible'
    )
  ),
  failure_reason TEXT,

  channel VARCHAR(20) NOT NULL DEFAULT 'email' CHECK (channel IN ('email', 'sms')),
  recipient_email VARCHAR(255),
  provider VARCHAR(30),
  provider_message_id VARCHAR(255),
  template_key VARCHAR(80),

  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT subscription_reminder_log_subscription_scheduled_unique UNIQUE (subscription_id, scheduled_for)
);

CREATE INDEX IF NOT EXISTS idx_subscription_reminder_log_state
  ON public.subscription_reminder_log(subscription_reminder_state_id);

CREATE INDEX IF NOT EXISTS idx_subscription_reminder_log_subscription_created
  ON public.subscription_reminder_log(subscription_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_subscription_reminder_log_outcome
  ON public.subscription_reminder_log(outcome);

CREATE INDEX IF NOT EXISTS idx_subscription_reminder_log_metadata_gin
  ON public.subscription_reminder_log USING GIN (metadata);

COMMENT ON TABLE public.subscription_reminder_log IS
  'Append-only log of each subscription payment reminder attempt (sent, failed, or skipped).';
COMMENT ON CONSTRAINT subscription_reminder_log_subscription_scheduled_unique ON public.subscription_reminder_log IS
  'Idempotency: at most one log row per subscription per scheduled_for instant.';

-- =============================================
-- updated_at trigger (subscription_reminder_state)
-- =============================================
CREATE OR REPLACE FUNCTION public.update_subscription_reminder_state_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_subscription_reminder_state_updated_at ON public.subscription_reminder_state;
CREATE TRIGGER update_subscription_reminder_state_updated_at
  BEFORE UPDATE ON public.subscription_reminder_state
  FOR EACH ROW
  EXECUTE FUNCTION public.update_subscription_reminder_state_updated_at();

COMMIT;
