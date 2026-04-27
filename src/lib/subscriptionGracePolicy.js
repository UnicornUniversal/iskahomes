/**
 * Central subscription grace policy (days after end_date before access ends).
 * Used when creating/updating subscriptions and by the subscription reminders cron.
 */
export const GRACE_PERIOD_DAYS = 14
export const GRACE_REMINDER_CADENCE_DAYS = 4
export const PRE_EXPIRY_REMINDER_DAYS_BEFORE_END = 7

/**
 * @param {Date | string} endDate
 * @returns {Date}
 */
export function gracePeriodEndFromEndDate(endDate) {
  const d = new Date(endDate)
  d.setDate(d.getDate() + GRACE_PERIOD_DAYS)
  return d
}
