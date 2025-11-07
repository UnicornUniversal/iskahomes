import { NextResponse } from 'next/server'
import { triggerAnalyticsProcessing } from '@/lib/cronScheduler'

// This API route can be called by external cron services like:
// - Vercel Cron Jobs
// - GitHub Actions
// - External cron services (cron-job.org, etc.)
// - Your own server cron

export async function GET(request) {
  try {
    // Verify the request is authorized (optional but recommended)
    const authHeader = request.headers.get('authorization')
    const expectedSecret = process.env.CRON_SECRET || 'your-secret-key'
    
    if (authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Trigger analytics processing
    const result = await triggerAnalyticsProcessing()
    
    return NextResponse.json({
      success: true,
      message: 'Analytics processing completed',
      timestamp: new Date().toISOString(),
      result
    })
  } catch (error) {
    console.error('Cron trigger error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization')
    const expectedSecret = process.env.CRON_SECRET || 'your-secret-key'
    
    if (authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { date } = await request.json()
    const result = await triggerAnalyticsProcessing(date)
    
    return NextResponse.json({
      success: true,
      message: 'Analytics processing completed',
      timestamp: new Date().toISOString(),
      result
    })
  } catch (error) {
    console.error('Cron trigger error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
