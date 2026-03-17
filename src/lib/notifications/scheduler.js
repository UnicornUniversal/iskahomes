import { enqueueNotificationJob, cancelNotificationJob } from './queue'
import { getNotificationRecord, getScheduledAtForRecord, markNotificationCancelled, markNotificationPending } from './records'

export async function scheduleNotificationFromRecord({
  notificationType,
  recordId,
  userId,
  userType
}) {
  console.log('[notifications][scheduler] schedule requested', {
    notificationType,
    recordId,
    userId,
    userType
  })

  const record = await getNotificationRecord(notificationType, recordId)
  if (!record) {
    throw new Error('Notification record not found')
  }

  const scheduledAt = getScheduledAtForRecord(notificationType, record)
  if (!scheduledAt) {
    throw new Error('Could not resolve scheduled time for notification')
  }

  await markNotificationPending(notificationType, recordId)

  await enqueueNotificationJob({
    notificationType,
    recordId,
    userId,
    userType,
    scheduledFor: scheduledAt
  })

  console.log('[notifications][scheduler] schedule completed', {
    notificationType,
    recordId,
    scheduledAt
  })
  return scheduledAt
}

export async function cancelNotificationByRecord({
  notificationType,
  recordId
}) {
  console.log('[notifications][scheduler] cancel requested', {
    notificationType,
    recordId
  })
  await cancelNotificationJob(notificationType, recordId)
  await markNotificationCancelled(notificationType, recordId)
}

export async function rescheduleNotificationFromRecord({
  notificationType,
  recordId,
  userId,
  userType
}) {
  console.log('[notifications][scheduler] reschedule requested', {
    notificationType,
    recordId,
    userId,
    userType
  })
  await cancelNotificationJob(notificationType, recordId)
  return scheduleNotificationFromRecord({
    notificationType,
    recordId,
    userId,
    userType
  })
}

