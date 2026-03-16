import { enqueueNotificationJob, cancelNotificationJob } from './queue'
import { getNotificationRecord, getScheduledAtForRecord, markNotificationCancelled, markNotificationPending } from './records'

export async function scheduleNotificationFromRecord({
  notificationType,
  recordId,
  userId,
  userType
}) {
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

  return scheduledAt
}

export async function cancelNotificationByRecord({
  notificationType,
  recordId
}) {
  await cancelNotificationJob(notificationType, recordId)
  await markNotificationCancelled(notificationType, recordId)
}

export async function rescheduleNotificationFromRecord({
  notificationType,
  recordId,
  userId,
  userType
}) {
  await cancelNotificationJob(notificationType, recordId)
  return scheduleNotificationFromRecord({
    notificationType,
    recordId,
    userId,
    userType
  })
}

