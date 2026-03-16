import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiPermissionMiddleware'
import { scheduleNotificationFromRecord } from '@/lib/notifications/scheduler'
import { startNotificationWorker } from '@/lib/notifications/worker'

export async function POST(request) {
  try {
    const { userInfo, error, status } = await authenticateRequest(request)
    if (error) {
      return NextResponse.json({ error }, { status: status || 401 })
    }

    const body = await request.json()
    const {
      notification_type,
      record_id,
      user_id,
      user_type
    } = body || {}

    if (!notification_type || !record_id || !user_id || !user_type) {
      return NextResponse.json(
        { error: 'notification_type, record_id, user_id, and user_type are required' },
        { status: 400 }
      )
    }

    startNotificationWorker()

    const scheduledAt = await scheduleNotificationFromRecord({
      notificationType: notification_type,
      recordId: record_id,
      userId: user_id,
      userType: user_type
    })

    return NextResponse.json({
      success: true,
      scheduled_at: scheduledAt.toISOString(),
      triggered_by: userInfo.user_id
    })
  } catch (err) {
    console.error('Notification scheduling error:', err)
    return NextResponse.json(
      { error: err.message || 'Failed to schedule notification' },
      { status: 500 }
    )
  }
}

