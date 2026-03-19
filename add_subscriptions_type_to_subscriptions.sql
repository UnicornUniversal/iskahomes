-- Add subscriptions_type to subscriptions
-- This allows main plan + addon subscriptions to coexist for one user.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'subscriptions'
      AND column_name = 'subscriptions_type'
  ) THEN
    ALTER TABLE public.subscriptions
      ADD COLUMN subscriptions_type VARCHAR(20);
  END IF;
END $$;

-- Backfill from subscriptions_package where possible
UPDATE public.subscriptions s
SET subscriptions_type = COALESCE(sp.subscriptions_type, 'package')
FROM public.subscriptions_package sp
WHERE s.package_id = sp.id
  AND (
    s.subscriptions_type IS NULL
    OR btrim(s.subscriptions_type) = ''
    OR s.subscriptions_type NOT IN ('package', 'addon')
  );

-- Safety fallback
UPDATE public.subscriptions
SET subscriptions_type = 'package'
WHERE subscriptions_type IS NULL
   OR btrim(subscriptions_type) = ''
   OR subscriptions_type NOT IN ('package', 'addon');

-- Constraint + defaults
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_subscriptions_subscriptions_type'
      AND conrelid = 'public.subscriptions'::regclass
  ) THEN
    ALTER TABLE public.subscriptions
      ADD CONSTRAINT chk_subscriptions_subscriptions_type
      CHECK (subscriptions_type IN ('package', 'addon'));
  END IF;
END $$;

ALTER TABLE public.subscriptions
  ALTER COLUMN subscriptions_type SET DEFAULT 'package',
  ALTER COLUMN subscriptions_type SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_subscriptions_subscriptions_type
  ON public.subscriptions(subscriptions_type);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_type_status_subtype
  ON public.subscriptions(user_id, user_type, status, subscriptions_type);

-- Replace old unique index (one active main package, but allow addon subscriptions)
DROP INDEX IF EXISTS public.idx_subscriptions_unique_active_user;

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_unique_active_main_package
ON public.subscriptions(user_id, user_type)
WHERE status IN ('active', 'grace_period', 'pending')
  AND subscriptions_type = 'package';

COMMENT ON COLUMN public.subscriptions.subscriptions_type
IS 'Subscription kind: package (main subscription) or addon (optional feature subscription).';

