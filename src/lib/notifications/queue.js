import { Queue } from 'bullmq'
import { NOTIFICATION_QUEUE_NAME } from './constants'

const globalForNotifications = globalThis

function createBullConnection() {
  if (process.env.REDIS_URL) {
    return {
      url: process.env.REDIS_URL,
      maxRetriesPerRequest: null
    }
  }

  const redisHost = process.env.REDIS_HOST
  const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10)
  const redisPassword = process.env.REDIS_PASSWORD

  return {
    host: redisHost,
    port: redisPort,
    password: redisPassword || undefined,
    maxRetriesPerRequest: null
  }
}

function getQueue() {
  if (!globalForNotifications.notificationQueue) {
    console.log('[notifications][queue] initializing queue', {
      queueName: NOTIFICATION_QUEUE_NAME,
      hasRedisUrl: !!process.env.REDIS_URL,
      redisHost: process.env.REDIS_HOST || null,
      redisPort: process.env.REDIS_PORT || null
    })

    globalForNotifications.notificationQueue = new Queue(NOTIFICATION_QUEUE_NAME, {
      connection: createBullConnection(),
      defaultJobOptions: {
        attempts: 3,
        removeOnComplete: {
          age: 60 * 60 * 24 * 3
        },
        removeOnFail: {
          age: 60 * 60 * 24 * 7
        },
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      }
    })
  }

  return globalForNotifications.notificationQueue
}

export function buildNotificationJobId(notificationType, recordId) {
  // BullMQ custom job ids cannot contain ":".
  return `${notificationType}__${recordId}`
}

export async function enqueueNotificationJob({
  notificationType,
  recordId,
  userId,
  userType,
  scheduledFor
}) {
  const queue = getQueue()
  const delay = Math.max(0, new Date(scheduledFor).getTime() - Date.now())
  const jobId = buildNotificationJobId(notificationType, recordId)

  console.log('[notifications][queue] enqueue job', {
    queueName: NOTIFICATION_QUEUE_NAME,
    jobId,
    notificationType,
    recordId,
    userId,
    userType,
    scheduledFor,
    delayMs: delay
  })

  const job = await queue.add(
    'send-notification',
    {
      notificationType,
      recordId,
      userId,
      userType
    },
    {
      jobId,
      delay
    }
  )

  console.log('[notifications][queue] job enqueued', {
    jobId: job.id,
    notificationType,
    recordId
  })

  return job
}

export async function cancelNotificationJob(notificationType, recordId) {
  const queue = getQueue()
  const jobId = buildNotificationJobId(notificationType, recordId)
  const job = await queue.getJob(jobId)

  if (job) {
    console.log('[notifications][queue] cancelling job', {
      jobId,
      notificationType,
      recordId
    })
    await job.remove()
    return true
  }

  console.log('[notifications][queue] cancel skipped, job not found', {
    jobId,
    notificationType,
    recordId
  })
  return false
}

export async function closeNotificationQueue() {
  if (globalForNotifications.notificationQueue) {
    await globalForNotifications.notificationQueue.close()
    globalForNotifications.notificationQueue = null
  }
}

export { getQueue }

