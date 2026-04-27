import { NextResponse } from 'next/server'
import { runSubscriptionRemindersCron } from '@/lib/runSubscriptionRemindersCron'

/**
 * Daily subscription reminders + grace lifecycle + demotion/expiry.
 * Secured with CRON_SECRET (same pattern as /api/cron/trigger).
 *
 * Configure in Vercel: vercel.json crons → this path once per day.
 */
export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization')
    const expectedSecret = process.env.CRON_SECRET || 'your-secret-key'

    if (authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const summary = await runSubscriptionRemindersCron()

    return NextResponse.json({
      success: true,
      message: 'Subscription reminders cron completed',
      timestamp: new Date().toISOString(),
      summary
    })
  } catch (error) {
    console.error('Subscription reminders cron error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  return GET(request)
}
