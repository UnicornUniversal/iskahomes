import { supabaseAdmin } from '@/lib/supabase'
import { addDays, buildChargeableEvent } from '@/lib/chargeables'
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
  [NOTIFICATION_TYPES.CHARGEABLE]: {
    table: 'chargeable_entries',
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

export async function markNotificationPending(notificationType, recordId) {
  const table = getNotificationTable(notificationType)
  if (!table) return

  const update = {
    notification_status: NOTIFICATION_STATUS.PENDING,
    notification_error: null
  }
  if (notificationType === NOTIFICATION_TYPES.CHARGEABLE) {
    update.sms_notification_status = NOTIFICATION_STATUS.PENDING
    update.email_notification_status = NOTIFICATION_STATUS.PENDING
    update.sms_error = null
    update.email_error = null
  }

  await supabaseAdmin
    .from(table)
    .update(update)
    .eq('id', recordId)
}

export async function markNotificationCancelled(notificationType, recordId) {
  const table = getNotificationTable(notificationType)
  if (!table) return

  const update = {
    notification_status: NOTIFICATION_STATUS.CANCELLED
  }
  if (notificationType === NOTIFICATION_TYPES.CHARGEABLE) {
    update.sms_notification_status = NOTIFICATION_STATUS.CANCELLED
    update.email_notification_status = NOTIFICATION_STATUS.CANCELLED
  }

  await supabaseAdmin
    .from(table)
    .update(update)
    .eq('id', recordId)
}

export function getOverdueScheduledAtForRecord(record) {
  if (!record?.next_due_date) return null
  const dueTime = record.next_due_time || '08:00:00'
  const overdueDate = addDays(String(record.next_due_date).slice(0, 10), 1)
  if (!overdueDate) return null
  return new Date(`${overdueDate}T${dueTime}`)
}

function parseEventSeries(value) {
  if (Array.isArray(value)) return value
  return []
}

export async function appendChargeableLifecycle(record, patch, eventName, eventExtra = {}) {
  const series = parseEventSeries(record.event_series)
  const alreadyLogged = series.some((item) => item?.event === eventName)
  const nextSeries = alreadyLogged
    ? series
    : [...series, buildChargeableEvent(eventName, { ...record, ...patch }, eventExtra)]

  const { data, error } = await supabaseAdmin
    .from('chargeable_entries')
    .update({
      ...patch,
      event_series: nextSeries
    })
    .eq('id', record.id)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function markChargeableDue(record) {
  if (String(record.next_due_status || '').toLowerCase() === 'paid') return record
  const current = String(record.next_due_status || '').toLowerCase()
  if (current === 'overdue') {
    return appendChargeableLifecycle(record, {}, 'due', { next_due_status: record.next_due_status })
  }
  return appendChargeableLifecycle(
    record,
    {
      next_due_status: 'due',
      due_marked_at: record.due_marked_at || new Date().toISOString()
    },
    'due',
    { next_due_status: 'due' }
  )
}

export async function markChargeableOverdue(record) {
  if (String(record.next_due_status || '').toLowerCase() === 'paid') return record
  const dueDate = record.next_due_date ? String(record.next_due_date).slice(0, 10) : null
  let overdueDays = record.overdue_time || 0
  if (dueDate) {
    const due = new Date(`${dueDate}T00:00:00`)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    overdueDays = Math.max(0, Math.floor((today - due) / (1000 * 60 * 60 * 24)))
  }

  return appendChargeableLifecycle(
    record,
    {
      next_due_status: 'overdue',
      overdue_marked_at: record.overdue_marked_at || new Date().toISOString(),
      overdue_time: overdueDays
    },
    'overdue',
    { next_due_status: 'overdue', overdue_time: overdueDays }
  )
}

export async function markChargeablePaid(record, extra = {}) {
  return appendChargeableLifecycle(
    record,
    {
      next_due_status: 'paid',
      overdue_time: extra.overdue_time ?? record.overdue_time ?? 0
    },
    'paid',
    {
      next_due_status: 'paid',
      paid_at: extra.paid_at ?? record.paid_at,
      overdue_time: extra.overdue_time ?? record.overdue_time ?? 0
    }
  )
}

export async function saveChargeableChannelResults(record, { sms, email, rollup, rollupError }) {
  const now = new Date().toISOString()
  const patch = {
    notification_status: rollup,
    notification_error: rollupError || null,
    notification_last_attempt_at: now
  }

  if (sms) {
    patch.sms_notification_status = sms.status
    patch.sms_error = sms.error || null
    if (sms.status === NOTIFICATION_STATUS.SENT) patch.sms_sent_at = now
  }
  if (email) {
    patch.email_notification_status = email.status
    patch.email_error = email.error || null
    if (email.status === NOTIFICATION_STATUS.SENT) patch.email_sent_at = now
  }
  if (rollup === NOTIFICATION_STATUS.SENT || rollup === NOTIFICATION_STATUS.PARTIAL) {
    patch.notification_sent_at = now
  }

  return appendChargeableLifecycle(record, patch, 'notified', {
    notification_status: rollup,
    sms_notification_status: sms?.status,
    email_notification_status: email?.status
  })
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

  if (notificationType === NOTIFICATION_TYPES.SERVICE_CHARGE || notificationType === NOTIFICATION_TYPES.CHARGEABLE) {
    if (!record.next_due_date) return null
    const dueTime = record.next_due_time || '08:00:00'
    return new Date(`${record.next_due_date}T${dueTime}`)
  }

  if (notificationType === NOTIFICATION_TYPES.ENGAGEMENT) {
    return record.date_time ? new Date(record.date_time) : null
  }

  return null
}

