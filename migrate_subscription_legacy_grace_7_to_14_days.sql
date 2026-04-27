-- Extend grace_period_end_date from ~7 days after end_date to 14 days
-- for rows that still match the old 7-day policy (approximate window).
-- Safe to run once; skips rows that already look like 14+ days of grace.

BEGIN;

UPDATE public.subscriptions s
SET
  grace_period_end_date = (s.end_date::timestamptz + interval '14 days'),
  updated_at = NOW()
WHERE
  s.status IN ('active', 'grace_period', 'pending')
  AND s.grace_period_end_date IS NOT NULL
  AND s.end_date IS NOT NULL
  AND s.grace_period_end_date > s.end_date
  AND s.grace_period_end_date <= s.end_date::timestamptz + interval '9 days';

COMMIT;
