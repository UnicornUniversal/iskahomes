import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const userType = searchParams.get('user_type') || 'developer'
    const period = searchParams.get('period') || 'today' // 'today', 'week', 'month', 'year'
    const metric = searchParams.get('metric') || 'views' // 'views' or 'impressions'

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Calculate date range based on period
    const now = new Date()
    let startDate, endDate, groupBy

    switch (period) {
      case 'today':
        // Today: hourly data
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
        groupBy = 'hour'
        break
      case 'week':
        // Last 7 days: daily data
        startDate = new Date(now)
        startDate.setDate(startDate.getDate() - 6)
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date(now)
        endDate.setHours(23, 59, 59, 999)
        groupBy = 'date'
        break
      case 'month':
        // Last 30 days: daily data
        startDate = new Date(now)
        startDate.setDate(startDate.getDate() - 29)
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date(now)
        endDate.setHours(23, 59, 59, 999)
        groupBy = 'date'
        break
      case 'year':
        // Last 12 months: monthly data
        startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1)
        endDate = new Date(now)
        groupBy = 'month'
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
        groupBy = 'hour'
    }

    // Fetch user_analytics data
    let query = supabase
      .from('user_analytics')
      .select('date, hour, total_views, total_impressions_received')
      .eq('user_id', userId)
      .eq('user_type', userType)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: true })
      .order('hour', { ascending: true })

    const { data: analyticsData, error } = await query

    if (error) {
      console.error('Error fetching statistics:', error)
      return NextResponse.json(
        { error: 'Failed to fetch statistics', details: error.message },
        { status: 500 }
      )
    }

    // Aggregate data based on groupBy
    const aggregated = {}
    const metricField = metric === 'views' ? 'total_views' : 'total_impressions_received'

    analyticsData?.forEach(row => {
      let key
      let label

      if (groupBy === 'hour') {
        // For today: group by hour
        key = `${row.date}_${row.hour}`
        const hour = row.hour || 0
        label = `${String(hour).padStart(2, '0')}:00`
      } else if (groupBy === 'date') {
        // For week/month: group by date
        key = row.date
        const date = new Date(row.date)
        label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      } else if (groupBy === 'month') {
        // For year: group by month
        const date = new Date(row.date)
        const month = String(date.getMonth() + 1).padStart(2, '0')
        key = `${date.getFullYear()}-${month}`
        // Use first day of month for consistent label
        const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
        label = firstDayOfMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      }

      if (!aggregated[key]) {
        aggregated[key] = {
          key,
          label,
          date: row.date,
          value: 0,
          count: 0
        }
      }

      aggregated[key].value += row[metricField] || 0
      aggregated[key].count += 1
    })

    // Convert to array and sort
    const timeSeriesData = Object.values(aggregated)
      .sort((a, b) => {
        if (groupBy === 'hour') {
          return a.date.localeCompare(b.date) || parseInt(a.label.split(':')[0]) - parseInt(b.label.split(':')[0])
        } else if (groupBy === 'date') {
          return a.date.localeCompare(b.date)
        } else {
          return a.key.localeCompare(b.key)
        }
      })
      .map(item => ({
        date: item.date,
        label: item.label,
        value: item.value
      }))

    // Calculate totals and averages
    const total = timeSeriesData.reduce((sum, item) => sum + item.value, 0)
    const average = timeSeriesData.length > 0 ? Math.round(total / timeSeriesData.length) : 0

    return NextResponse.json({
      success: true,
      data: {
        period,
        metric,
        groupBy,
        timeSeries: timeSeriesData,
        summary: {
          total,
          average,
          dataPoints: timeSeriesData.length
        }
      }
    })

  } catch (error) {
    console.error('Statistics fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

