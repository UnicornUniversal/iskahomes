export const NOTIFICATION_TYPES = {
  REMINDER: 'reminder',
  APPOINTMENT: 'appointment',
  SERVICE_CHARGE: 'service_charge',
  CHARGEABLE: 'chargeable',
  ENGAGEMENT: 'engagement'
}

export const NOTIFICATION_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  PARTIAL: 'partial',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  SKIPPED: 'skipped'
}

export const CHARGEABLE_JOB_KIND = {
  DUE: 'due',
  OVERDUE: 'overdue'
}

export const NOTIFICATION_SETTING_KEYS = {
  [NOTIFICATION_TYPES.REMINDER]: 'reminders',
  [NOTIFICATION_TYPES.APPOINTMENT]: 'appointments',
  [NOTIFICATION_TYPES.SERVICE_CHARGE]: 'chargeables',
  [NOTIFICATION_TYPES.CHARGEABLE]: 'chargeables',
  [NOTIFICATION_TYPES.ENGAGEMENT]: 'engagements'
}

export const NOTIFICATION_QUEUE_NAME = 'notifications'

