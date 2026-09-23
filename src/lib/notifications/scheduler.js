import { enqueueNotificationJob, cancelNotificationJob } from './queue'
import {
  getNotificationRecord,
  getOverdueScheduledAtForRecord,
  getScheduledAtForRecord,
  markNotificationCancelled,
  markNotificationPending
} from './records'
import { CHARGEABLE_JOB_KIND, NOTIFICATION_TYPES } from './constants'

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

  if (notificationType === NOTIFICATION_TYPES.CHARGEABLE) {
    const overdueAt = getOverdueScheduledAtForRecord(record)
    if (!overdueAt) {
      throw new Error('Could not resolve overdue time for chargeable')
    }

    await enqueueNotificationJob({
      notificationType,
      recordId,
      userId,
      userType,
      scheduledFor: scheduledAt,
      jobKind: CHARGEABLE_JOB_KIND.DUE
    })

    try {
      await enqueueNotificationJob({
        notificationType,
        recordId,
        userId,
        userType,
        scheduledFor: overdueAt,
        jobKind: CHARGEABLE_JOB_KIND.OVERDUE
      })
    } catch (overdueError) {
      await cancelNotificationJob(notificationType, recordId)
      throw overdueError
    }

    console.log('[notifications][scheduler] chargeable jobs scheduled', {
      recordId,
      dueAt: scheduledAt,
      overdueAt
    })
    return scheduledAt
  }

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

