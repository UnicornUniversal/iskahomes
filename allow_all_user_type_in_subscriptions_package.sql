-- Allow subscriptions_package.user_type to include 'all'
-- Existing values remain unchanged.

-- Drop old constraint if it exists
ALTER TABLE public.subscriptions_package
DROP CONSTRAINT IF EXISTS subscriptions_package_user_type_check;

-- Recreate constraint with 'all'
ALTER TABLE public.subscriptions_package
ADD CONSTRAINT subscriptions_package_user_type_check
CHECK (
  user_type IS NULL
  OR user_type IN ('developers', 'agents', 'agencies', 'all')
);

COMMENT ON COLUMN public.subscriptions_package.user_type
IS 'Type of user this package is intended for: developers, agents, agencies, or all (stored in lowercase).';

