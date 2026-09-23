-- Public catalog visibility. Independent of listing_status (active, sold, rented, draft).
-- true = Visible, false = Non-Visible.
-- Existing rows default to visible.

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS visibility boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.listings.visibility IS
  'Whether the listing appears on public pages and the partner properties API. true = Visible, false = Non-Visible.';
