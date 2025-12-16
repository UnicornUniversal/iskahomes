import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const userType = searchParams.get('user_type') || 'developer'
    const period = searchParams.get('period') // 'today', 'week', 'month', 'year' (for backward compatibility)
    const metric = searchParams.get('metric') || 'views' // 'views' or 'impressions'
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Calculate date range based on period or custom date range
    const now = new Date()
    let startDate, endDate, groupBy

    // Use custom date range if provided, otherwise use period
    if (dateFrom && dateTo) {
      startDate = new Date(dateFrom)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(dateTo)
      endDate.setHours(23, 59, 59, 999)
      
      // Determine groupBy based on date range length
      const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
      if (daysDiff <= 1) {
        groupBy = 'hour'
      } else if (daysDiff <= 90) {
        groupBy = 'date'
      } else if (daysDiff <= 365) {
        groupBy = 'week'
      } else {
        groupBy = 'month'
      }
    } else {
      // Use period for backward compatibility
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
    }

    // Format dates for query
    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]

    // Build query based on metric
    let query = supabaseAdmin
      .from('user_analytics')
      .select('date, hour, total_views, total_listing_views, profile_views, total_impressions_received')
      .eq('user_id', userId)
      .eq('user_type', userType)
      .gte('date', startDateStr)
      .lte('date', endDateStr)
      .order('date', { ascending: true })
      .order('hour', { ascending: true })

    const { data: analyticsData, error } = await query

    if (error) {
      console.error('Error fetching statistics from database:', error)
      return NextResponse.json(
        { error: 'Failed to fetch statistics', details: error.message },
        { status: 500 }
      )
    }

    if (!analyticsData || analyticsData.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          period,
          metric,
          groupBy,
          timeSeries: [],
          summary: {
            total: 0,
            average: 0,
            dataPoints: 0
          }
        }
      })
    }

    // Aggregate data by time period for all three metrics
    const aggregatedTotal = {}
    const aggregatedListing = {}
    const aggregatedProfile = {}

    analyticsData.forEach(row => {
      const totalViews = row.total_views || 0
      const listingViews = row.total_listing_views || 0
      const profileViews = row.profile_views || 0

      let key, label, dateStr

      if (groupBy === 'hour') {
        // Group by hour for today
        dateStr = row.date
        const hour = row.hour !== null ? row.hour : 0
        key = `${dateStr}_${hour}`
        label = `${String(hour).padStart(2, '0')}:00`
      } else if (groupBy === 'date') {
        // Group by date for week/month (sum all hours for the day)
        dateStr = row.date
        key = dateStr
        if (!aggregatedTotal[key]) {
          const date = new Date(dateStr)
          label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }
      } else if (groupBy === 'month') {
        // Group by month for year (sum all days for the month)
        dateStr = row.date
        const [year, month] = dateStr.split('-')
        key = `${year}-${month}`
        if (!aggregatedTotal[key]) {
          const firstDayOfMonth = new Date(year, parseInt(month) - 1, 1)
          label = firstDayOfMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        }
      }

      // Initialize if not exists
      if (!aggregatedTotal[key]) {
        aggregatedTotal[key] = { key, label, date: dateStr || key, value: 0 }
        aggregatedListing[key] = { key, label, date: dateStr || key, value: 0 }
        aggregatedProfile[key] = { key, label, date: dateStr || key, value: 0 }
      }

      // Sum values
      aggregatedTotal[key].value += totalViews
      aggregatedListing[key].value += listingViews
      aggregatedProfile[key].value += profileViews
    })

    // Helper function to convert aggregated object to sorted array
    const convertToTimeSeries = (aggregated) => {
      return Object.values(aggregated)
        .sort((a, b) => {
          if (groupBy === 'hour') {
            const [dateA, hourA] = a.key.split('_')
            const [dateB, hourB] = b.key.split('_')
            return dateA.localeCompare(dateB) || parseInt(hourA) - parseInt(hourB)
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
    }

    const timeSeriesTotal = convertToTimeSeries(aggregatedTotal)
    const timeSeriesListing = convertToTimeSeries(aggregatedListing)
    const timeSeriesProfile = convertToTimeSeries(aggregatedProfile)

    // Calculate totals
    const totalViews = timeSeriesTotal.reduce((sum, item) => sum + item.value, 0)
    const totalListingViews = timeSeriesListing.reduce((sum, item) => sum + item.value, 0)
    const totalProfileViews = timeSeriesProfile.reduce((sum, item) => sum + item.value, 0)

    return NextResponse.json({
      success: true,
      data: {
        period,
        metric,
        groupBy,
        timeSeries: timeSeriesTotal, // Keep for chart (uses total_views)
        timeSeriesTotal,
        timeSeriesListing,
        timeSeriesProfile,
        summary: {
          totalViews,
          totalListingViews,
          totalProfileViews,
          dataPoints: timeSeriesTotal.length
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

