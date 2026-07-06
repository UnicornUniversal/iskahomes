-- Allow profile / agency bookings without a listing context.
ALTER TABLE public.appointments
  ALTER COLUMN listing_id DROP NOT NULL;
