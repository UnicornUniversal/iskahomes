import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { fetchPostHogEventsByTimeRange } from '@/lib/posthogCron'
import { POSTHOG_PERSONAL_API_KEY, POSTHOG_PROJECT_ID, POSTHOG_HOST } from '@/lib/posthog'

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

    // COMMENTED OUT: Old implementation using user_analytics table
    // let query = supabase
    //   .from('user_analytics')
    //   .select('date, hour, total_views, total_impressions_received')
    //   .eq('user_id', userId)
    //   .eq('user_type', userType)
    //   .gte('date', startDate.toISOString().split('T')[0])
    //   .lte('date', endDate.toISOString().split('T')[0])
    //   .order('date', { ascending: true })
    //   .order('hour', { ascending: true })

    // const { data: analyticsData, error } = await query

    // if (error) {
    //   console.error('Error fetching statistics:', error)
    //   return NextResponse.json(
    //     { error: 'Failed to fetch statistics', details: error.message },
    //     { status: 500 }
    //   )
    // }

    // Fetch directly from PostHog
    // Views: Only property_view events
    // Impressions: ALL impression-related events (listing_impression + engagement events)
    const eventNames = metric === 'views' 
      ? ['property_view'] 
      : [
          'listing_impression',        // Basic impression when viewing
          'impression_social_media',   // Social media clicks
          'impression_website_visit',  // Website link clicks
          'impression_share',          // Share actions
          'impression_saved_listing'   // Save/unsave actions
        ]
    
    console.log(`📊 Fetching ${metric} data from PostHog (events: ${eventNames.join(', ')}) for user ${userId}`)
    
    let allEvents = []
    let cursor = null
    let pageCount = 0
    const maxPages = 50 // Limit to prevent excessive API calls

    // Fetch all events with pagination
    do {
      const result = await fetchPostHogEventsByTimeRange(startDate, endDate, eventNames, cursor)
      const events = result.events || []
      
      // Filter events where lister_id matches userId
      // This ensures we only get events for listings owned by this developer/agent
      const filteredEvents = events.filter(event => {
        const props = event.properties || {}
        // Check both lister_id and developer_id/agent_id for compatibility
        return props.lister_id === userId || 
               props.developer_id === userId || 
               props.agent_id === userId
      })
      
      allEvents = allEvents.concat(filteredEvents)
      cursor = result.nextCursor
      pageCount++
      
      // Safety check to prevent infinite loops
      if (pageCount >= maxPages) {
        console.warn(`⚠️ Reached max pages (${maxPages}) for PostHog events fetch`)
        break
      }
    } while (cursor)

    // Log breakdown by event type for debugging
    const eventBreakdown = allEvents.reduce((acc, event) => {
      acc[event.event] = (acc[event.event] || 0) + 1
      return acc
    }, {})
    
    console.log(`✅ Fetched ${allEvents.length} ${metric} events from PostHog for user ${userId}`)
    console.log(`   Event breakdown:`, eventBreakdown)

    // Aggregate events by time period
    const aggregated = {}

    allEvents.forEach(event => {
      const eventDate = new Date(event.timestamp)
      let key, label, dateStr

      if (groupBy === 'hour') {
        // Group by hour for today
        const hour = eventDate.getHours()
        dateStr = eventDate.toISOString().split('T')[0]
        key = `${dateStr}_${hour}`
        label = `${String(hour).padStart(2, '0')}:00`
      } else if (groupBy === 'date') {
        // Group by date for week/month
        dateStr = eventDate.toISOString().split('T')[0]
        key = dateStr
        label = eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      } else if (groupBy === 'month') {
        // Group by month for year
        const year = eventDate.getFullYear()
        const month = String(eventDate.getMonth() + 1).padStart(2, '0')
        key = `${year}-${month}`
        dateStr = `${year}-${month}-01`
        const firstDayOfMonth = new Date(year, eventDate.getMonth(), 1)
        label = firstDayOfMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      }

      if (!aggregated[key]) {
        aggregated[key] = {
          key,
          label,
          date: dateStr || key,
          value: 0
        }
      }

      aggregated[key].value += 1
    })

    // Convert to array and sort
    const timeSeriesData = Object.values(aggregated)
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

