export const NOTIFICATION_TYPES = {
  REMINDER: 'reminder',
  APPOINTMENT: 'appointment',
  SERVICE_CHARGE: 'service_charge',
  ENGAGEMENT: 'engagement'
}

export const NOTIFICATION_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
}

export const NOTIFICATION_SETTING_KEYS = {
  [NOTIFICATION_TYPES.REMINDER]: 'reminders',
  [NOTIFICATION_TYPES.APPOINTMENT]: 'appointments',
  [NOTIFICATION_TYPES.SERVICE_CHARGE]: 'service_charges',
  [NOTIFICATION_TYPES.ENGAGEMENT]: 'engagements'
}

export const NOTIFICATION_QUEUE_NAME = 'notifications'

