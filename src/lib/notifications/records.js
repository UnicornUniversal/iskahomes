import { supabaseAdmin } from '@/lib/supabase'
import { NOTIFICATION_STATUS, NOTIFICATION_TYPES } from './constants'

const RECORD_CONFIG = {
  [NOTIFICATION_TYPES.REMINDER]: {
    table: 'reminders',
    timeField: 'reminder_date',
    statusField: 'status'
  },
  [NOTIFICATION_TYPES.APPOINTMENT]: {
    table: 'appointments',
    timeField: 'appointment_date',
    statusField: 'status'
  },
  [NOTIFICATION_TYPES.SERVICE_CHARGE]: {
    table: 'client_service_charges',
    timeField: 'next_due_date',
    statusField: 'status'
  },
  [NOTIFICATION_TYPES.ENGAGEMENT]: {
    table: 'client_engagement_log',
    timeField: 'date_time',
    statusField: 'status'
  }
}

export function getNotificationTable(notificationType) {
  return RECORD_CONFIG[notificationType]?.table || null
}

export async function getNotificationRecord(notificationType, recordId) {
  const config = RECORD_CONFIG[notificationType]
  if (!config) return null

  const { data } = await supabaseAdmin
    .from(config.table)
    .select('*')
    .eq('id', recordId)
    .maybeSingle()

  return data || null
}

export async function markNotificationAttempt(notificationType, recordId) {
  const table = getNotificationTable(notificationType)
  if (!table) return

  await supabaseAdmin
    .from(table)
    .update({
      notification_last_attempt_at: new Date().toISOString()
    })
    .eq('id', recordId)
}

export async function markNotificationSent(notificationType, recordId) {
  const table = getNotificationTable(notificationType)
  if (!table) return

  await supabaseAdmin
    .from(table)
    .update({
      notification_status: NOTIFICATION_STATUS.SENT,
      notification_sent_at: new Date().toISOString(),
      notification_error: null
    })
    .eq('id', recordId)
}

export async function markNotificationFailed(notificationType, recordId, errorMessage) {
  const table = getNotificationTable(notificationType)
  if (!table) return

  await supabaseAdmin
    .from(table)
    .update({
      notification_status: NOTIFICATION_STATUS.FAILED,
      notification_error: errorMessage
    })
    .eq('id', recordId)
}

export async function markNotificationCancelled(notificationType, recordId) {
  const table = getNotificationTable(notificationType)
  if (!table) return

  await supabaseAdmin
    .from(table)
    .update({
      notification_status: NOTIFICATION_STATUS.CANCELLED
    })
    .eq('id', recordId)
}

export async function markNotificationPending(notificationType, recordId) {
  const table = getNotificationTable(notificationType)
  if (!table) return

  await supabaseAdmin
    .from(table)
    .update({
      notification_status: NOTIFICATION_STATUS.PENDING,
      notification_error: null
    })
    .eq('id', recordId)
}

export function getScheduledAtForRecord(notificationType, record) {
  if (!record) return null

  if (notificationType === NOTIFICATION_TYPES.REMINDER) {
    if (!record.reminder_date) return null
    if (record.reminder_time) {
      return new Date(`${record.reminder_date}T${record.reminder_time}`)
    }
    return new Date(`${record.reminder_date}T09:00:00`)
  }

  if (notificationType === NOTIFICATION_TYPES.APPOINTMENT) {
    if (!record.appointment_date) return null
    if (record.appointment_time) {
      return new Date(`${record.appointment_date}T${record.appointment_time}`)
    }
    return new Date(`${record.appointment_date}T09:00:00`)
  }

  if (notificationType === NOTIFICATION_TYPES.SERVICE_CHARGE) {
    if (!record.next_due_date) return null
    return new Date(`${record.next_due_date}T09:00:00`)
  }

  if (notificationType === NOTIFICATION_TYPES.ENGAGEMENT) {
    return record.date_time ? new Date(record.date_time) : null
  }

  return null
}

