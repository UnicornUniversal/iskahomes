import { Queue } from 'bullmq'
import { CHARGEABLE_JOB_KIND, NOTIFICATION_QUEUE_NAME, NOTIFICATION_TYPES } from './constants'

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

export function buildNotificationJobId(notificationType, recordId, jobKind) {
  // BullMQ custom job ids cannot contain ":".
  if (jobKind) return `${notificationType}__${jobKind}__${recordId}`
  return `${notificationType}__${recordId}`
}

export async function ensureNotificationQueueReady() {
  const queue = getQueue()
  await queue.waitUntilReady()
  const client = await queue.client
  const pong = await client.ping()
  if (String(pong).toUpperCase() !== 'PONG') {
    throw new Error('Redis is not available')
  }
  return true
}

export async function enqueueNotificationJob({
  notificationType,
  recordId,
  userId,
  userType,
  scheduledFor,
  jobKind
}) {
  const queue = getQueue()
  const delay = Math.max(0, new Date(scheduledFor).getTime() - Date.now())
  const jobId = buildNotificationJobId(notificationType, recordId, jobKind)

  console.log('[notifications][queue] enqueue job', {
    queueName: NOTIFICATION_QUEUE_NAME,
    jobId,
    notificationType,
    jobKind: jobKind || null,
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
      userType,
      jobKind: jobKind || null
    },
    {
      jobId,
      delay
    }
  )

  console.log('[notifications][queue] job enqueued', {
    jobId: job.id,
    notificationType,
    jobKind: jobKind || null,
    recordId
  })

  return job
}

async function removeJobById(queue, jobId, notificationType, recordId) {
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
  return false
}

export async function cancelNotificationJob(notificationType, recordId) {
  const queue = getQueue()
  const ids = [buildNotificationJobId(notificationType, recordId)]
  if (notificationType === NOTIFICATION_TYPES.CHARGEABLE) {
    ids.push(
      buildNotificationJobId(notificationType, recordId, CHARGEABLE_JOB_KIND.DUE),
      buildNotificationJobId(notificationType, recordId, CHARGEABLE_JOB_KIND.OVERDUE)
    )
  }

  let removed = false
  for (const jobId of ids) {
    const didRemove = await removeJobById(queue, jobId, notificationType, recordId)
    if (didRemove) removed = true
  }

  if (!removed) {
    console.log('[notifications][queue] cancel skipped, job not found', {
      notificationType,
      recordId
    })
  }

  return removed
}

export async function closeNotificationQueue() {
  if (globalForNotifications.notificationQueue) {
    await globalForNotifications.notificationQueue.close()
    globalForNotifications.notificationQueue = null
  }
}

export { getQueue }

