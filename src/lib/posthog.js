// PostHog API configuration (support .env, .env.local, and NEXT_PUBLIC fallbacks)
const POSTHOG_PERSONAL_API_KEY = process.env.POSTHOG_PERSONAL_API_KEY || process.env.NEXT_PUBLIC_POSTHOG_PERSONAL_API_KEY
const POSTHOG_PROJECT_ID = process.env.POSTHOG_PROJECT_ID || process.env.NEXT_PUBLIC_POSTHOG_PROJECT_ID
const POSTHOG_HOST = process.env.POSTHOG_HOST || process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'

console.log('POSTHOG_PERSONAL_API_KEY', POSTHOG_PERSONAL_API_KEY)
console.log('POSTHOG_PROJECT_ID', POSTHOG_PROJECT_ID)
console.log('POSTHOG_HOST', POSTHOG_HOST) 


export { POSTHOG_PERSONAL_API_KEY, POSTHOG_PROJECT_ID, POSTHOG_HOST }

// Check if PostHog is configured
function isPostHogConfigured() {
  return !!(POSTHOG_PERSONAL_API_KEY && POSTHOG_PROJECT_ID && POSTHOG_HOST)
}

// Helper function to fetch events from PostHog using Insights API
export async function fetchPostHogEvents(eventName, filters = {}, timeRange = '7d') {
  try {
    // Check if PostHog is configured
    if (!isPostHogConfigured()) {
      console.log('PostHog not configured, returning empty events')
      return []
    }

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    
    switch (timeRange) {
      case '24h':
        startDate.setDate(startDate.getDate() - 1)
        break
      case '7d':
        startDate.setDate(startDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(startDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(startDate.getDate() - 90)
        break
      default:
        startDate.setDate(startDate.getDate() - 7)
    }

    // Use PostHog Insights API instead of Events API
    const insightsQuery = {
      kind: 'EventsNode',
      events: [
        {
          id: eventName,
          name: eventName,
          type: 'events',
          order: 0,
          math: 'total'
        }
      ],
      dateRange: {
        date_from: startDate.toISOString(),
        date_to: endDate.toISOString()
      },
      filter: {
        events: [
          {
            id: eventName,
            name: eventName,
            type: 'events',
            order: 0,
            math: 'total'
          }
        ]
      }
    }

    // Add filters to the query
    if (filters.developer_id || filters.listing_id || filters.seeker_id) {
      insightsQuery.filter.properties = []
      
      if (filters.developer_id) {
        insightsQuery.filter.properties.push({
          key: 'developer_id',
          value: filters.developer_id,
          operator: 'exact'
        })
      }
      if (filters.listing_id) {
        insightsQuery.filter.properties.push({
          key: 'listing_id',
          value: filters.listing_id,
          operator: 'exact'
        })
      }
      if (filters.seeker_id) {
        insightsQuery.filter.properties.push({
          key: 'seeker_id',
          value: filters.seeker_id,
          operator: 'exact'
        })
      }
    }

    // Make request to PostHog Insights API
    const response = await fetch(`${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/insights/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${POSTHOG_PERSONAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(insightsQuery)
    })

    if (!response.ok) {
      console.error(`PostHog API error: ${response.status} - ${response.statusText}`)
      return []
    }

    const data = await response.json()
    
    // Extract events from the insights response
    if (data.result && data.result.length > 0) {
      // For now, return a mock event for each count
      const count = data.result[0] || 0
      return Array(count).fill(null).map((_, index) => ({
        event: eventName,
        properties: {
          developer_id: filters.developer_id,
          listing_id: filters.listing_id,
          seeker_id: filters.seeker_id,
          timestamp: new Date().toISOString()
        },
        distinct_id: `user_${index}`,
        timestamp: new Date().toISOString()
      }))
    }
    
    return []
  } catch (error) {
    console.error('Error fetching PostHog events:', error)
    return []
  }
}

// Helper function to get event counts
export async function getEventCounts(eventNames, filters = {}, timeRange = '7d') {
  try {
    const counts = {}
    
    for (const eventName of eventNames) {
      const events = await fetchPostHogEvents(eventName, filters, timeRange)
      counts[eventName] = events.length
    }
    
    return counts
  } catch (error) {
    console.error('Error getting event counts:', error)
    return {}
  }
}

// Helper function to get unique users for events
export async function getUniqueUsers(eventNames, filters = {}, timeRange = '7d') {
  try {
    const uniqueUsers = new Set()
    
    for (const eventName of eventNames) {
      const events = await fetchPostHogEvents(eventName, filters, timeRange)
      events.forEach(event => {
        if (event.distinct_id) {
          uniqueUsers.add(event.distinct_id)
        }
      })
    }
    
    return uniqueUsers.size
  } catch (error) {
    console.error('Error getting unique users:', error)
    return 0
  }
}

// Helper function to get events grouped by property
export async function getEventsGroupedBy(eventName, groupBy, filters = {}, timeRange = '7d') {
  try {
    const events = await fetchPostHogEvents(eventName, filters, timeRange)
    const grouped = {}
    
    events.forEach(event => {
      const groupValue = event.properties?.[groupBy] || 'unknown'
      if (!grouped[groupValue]) {
        grouped[groupValue] = 0
      }
      grouped[groupValue]++
    })
    
    return grouped
  } catch (error) {
    console.error('Error getting events grouped by:', error)
    return {}
  }
}
