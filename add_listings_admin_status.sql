-- Admin review state for a listing. NULL = Iska has not reviewed it (allowed on the public site).
-- approved = allowed. blocked / pending = held off the public catalog.

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS admin_status text;

COMMENT ON COLUMN public.listings.admin_status IS
  'Admin review: NULL or approved = allowed on public pages. pending or blocked = held.';
