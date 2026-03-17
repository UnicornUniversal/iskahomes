import { Worker } from 'bullmq'
import { NOTIFICATION_QUEUE_NAME } from './constants'
import { dispatchNotificationJob } from './dispatcher'

const globalForNotifications = globalThis

function createBullConnection() {
  if (process.env.REDIS_URL) {
    return {
      url: process.env.REDIS_URL,
      maxRetriesPerRequest: null
    }
  }

  return {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null
  }
}

export function startNotificationWorker() {
  if (globalForNotifications.notificationWorker) {
    console.log('[notifications][worker] reusing existing worker')
    return globalForNotifications.notificationWorker
  }

  console.log('[notifications][worker] starting worker', {
    queueName: NOTIFICATION_QUEUE_NAME,
    hasRedisUrl: !!process.env.REDIS_URL,
    redisHost: process.env.REDIS_HOST || null,
    redisPort: process.env.REDIS_PORT || null
  })

  const worker = new Worker(
    NOTIFICATION_QUEUE_NAME,
    async (job) => {
      console.log('[notifications][worker] processing job', {
        id: job.id,
        name: job.name,
        data: job.data
      })
      return dispatchNotificationJob(job.data)
    },
    {
      connection: createBullConnection(),
      concurrency: 5
    }
  )

  worker.on('ready', () => {
    console.log('[notifications][worker] ready')
  })

  worker.on('error', (error) => {
    console.error('[notifications][worker] worker error', error?.message || error)
  })

  worker.on('failed', (job, error) => {
    console.error(`[notification-worker] job failed: ${job?.id}`, error?.message || error)
  })

  worker.on('completed', (job) => {
    console.log(`[notification-worker] job completed: ${job?.id}`)
  })

  globalForNotifications.notificationWorker = worker
  return worker
}

export async function stopNotificationWorker() {
  if (globalForNotifications.notificationWorker) {
    await globalForNotifications.notificationWorker.close()
    globalForNotifications.notificationWorker = null
  }
}

