-- Add subscriptions_type to subscriptions_package and packages
-- Allowed values: 'package' | 'addon'
-- Backfill existing rows to 'package'

-- =========================================================
-- 1) subscriptions_package table
-- =========================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'subscriptions_package'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'subscriptions_package'
        AND column_name = 'subscriptions_type'
    ) THEN
      ALTER TABLE public.subscriptions_package
      ADD COLUMN subscriptions_type VARCHAR(20);
    END IF;

    -- Backfill old rows
    UPDATE public.subscriptions_package
    SET subscriptions_type = 'package'
    WHERE subscriptions_type IS NULL
       OR btrim(subscriptions_type) = ''
       OR subscriptions_type NOT IN ('package', 'addon');

    -- Set default + not null
    ALTER TABLE public.subscriptions_package
      ALTER COLUMN subscriptions_type SET DEFAULT 'package',
      ALTER COLUMN subscriptions_type SET NOT NULL;

    -- Add check constraint (idempotent)
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'chk_subscriptions_package_subscriptions_type'
        AND conrelid = 'public.subscriptions_package'::regclass
    ) THEN
      ALTER TABLE public.subscriptions_package
      ADD CONSTRAINT chk_subscriptions_package_subscriptions_type
      CHECK (subscriptions_type IN ('package', 'addon'));
    END IF;

    CREATE INDEX IF NOT EXISTS idx_subscriptions_package_subscriptions_type
      ON public.subscriptions_package(subscriptions_type);
  END IF;
END $$;

-- =========================================================
-- 2) packages table
-- =========================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'packages'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'packages'
        AND column_name = 'subscriptions_type'
    ) THEN
      ALTER TABLE public.packages
      ADD COLUMN subscriptions_type VARCHAR(20);
    END IF;

    -- Backfill old rows
    UPDATE public.packages
    SET subscriptions_type = 'package'
    WHERE subscriptions_type IS NULL
       OR btrim(subscriptions_type) = ''
       OR subscriptions_type NOT IN ('package', 'addon');

    -- Set default + not null
    ALTER TABLE public.packages
      ALTER COLUMN subscriptions_type SET DEFAULT 'package',
      ALTER COLUMN subscriptions_type SET NOT NULL;

    -- Add check constraint (idempotent)
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'chk_packages_subscriptions_type'
        AND conrelid = 'public.packages'::regclass
    ) THEN
      ALTER TABLE public.packages
      ADD CONSTRAINT chk_packages_subscriptions_type
      CHECK (subscriptions_type IN ('package', 'addon'));
    END IF;

    CREATE INDEX IF NOT EXISTS idx_packages_subscriptions_type
      ON public.packages(subscriptions_type);
  END IF;
END $$;

-- Optional comments
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'subscriptions_package'
      AND column_name = 'subscriptions_type'
  ) THEN
    COMMENT ON COLUMN public.subscriptions_package.subscriptions_type
      IS 'Product kind: package (main plan) or addon (optional add-on feature).';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'packages'
      AND column_name = 'subscriptions_type'
  ) THEN
    COMMENT ON COLUMN public.packages.subscriptions_type
      IS 'Product kind: package (main plan) or addon (optional add-on feature).';
  END IF;
END $$;

