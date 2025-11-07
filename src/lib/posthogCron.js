// PostHog API helpers for cron job - fetches actual events from PostHog Events API
import { POSTHOG_PERSONAL_API_KEY, POSTHOG_PROJECT_ID, POSTHOG_HOST } from './posthog'

// Check if PostHog is configured
function isPostHogConfigured() {
  return !!(POSTHOG_PERSONAL_API_KEY && POSTHOG_PROJECT_ID && POSTHOG_HOST)
}

/**
 * Fetch events from PostHog Events API within a time range
 * @param {Date} startTime - Start timestamp
 * @param {Date} endTime - End timestamp
 * @param {string[]} eventNames - Array of event names to fetch (optional, fetches all if not provided)
 * @param {string} after - Cursor for pagination (optional)
 * @returns {Promise<{events: Array, next: string|null}>}
 */
export async function fetchPostHogEventsByTimeRange(startTime, endTime, eventNames = [], after = null) {
  try {
    if (!isPostHogConfigured()) {
      console.warn('⚠️ PostHog not configured')
      console.warn('   POSTHOG_PERSONAL_API_KEY:', !!POSTHOG_PERSONAL_API_KEY)
      console.warn('   POSTHOG_PROJECT_ID:', POSTHOG_PROJECT_ID)
      console.warn('   POSTHOG_HOST:', POSTHOG_HOST)
      return { events: [], next: null }
    }

    // Build query parameters
    // Try both timestamp and created_at fields (PostHog might use either)
    const params = new URLSearchParams({
      // Try timestamp first (event timestamp)
      timestamp__gte: startTime.toISOString(),
      timestamp__lt: endTime.toISOString(),
      // Also try created_at (when PostHog received the event)
      // Note: PostHog API might use one or the other
      limit: '1000' // PostHog default limit
    })

    // Add event filter if provided
    if (eventNames.length > 0) {
      params.append('event', eventNames.join(','))
    }
    
    // Log the exact time range being queried
    console.log('🕐 Time range details:', {
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      startTimeUnix: Math.floor(startTime.getTime() / 1000),
      endTimeUnix: Math.floor(endTime.getTime() / 1000),
      rangeMinutes: (endTime - startTime) / (1000 * 60)
    })

    // Add cursor for pagination
    if (after) {
      params.append('after', after)
    }

    const url = `${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/events/?${params.toString()}`
    
    console.log('🌐 PostHog API Request:', {
      url: url.replace(POSTHOG_PERSONAL_API_KEY, '***'),
      method: 'GET',
      timestamp__gte: startTime.toISOString(),
      timestamp__lt: endTime.toISOString(),
      eventFilter: eventNames.length > 0 ? eventNames.join(',') : 'all events',
      hasCursor: !!after
    })

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${POSTHOG_PERSONAL_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    console.log('📥 PostHog API Response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ PostHog API error: ${response.status} - ${response.statusText}`, errorText)
      
      // Handle rate limiting
      if (response.status === 429) {
        throw new Error('PostHog rate limit exceeded')
      }
      
      throw new Error(`PostHog API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    
    console.log('📊 PostHog API Data:', {
      resultsCount: data.results?.length || 0,
      hasNext: !!data.next,
      sampleEvents: data.results?.slice(0, 2).map(e => ({
        event: e.event,
        timestamp: e.timestamp,
        created_at: e.created_at,
        distinct_id: e.distinct_id,
        properties: e.properties ? {
          listing_id: e.properties.listing_id,
          lister_id: e.properties.lister_id
        } : null
      })) || [],
      // Log full response structure for debugging
      responseKeys: Object.keys(data),
      hasResults: !!data.results,
      resultsType: Array.isArray(data.results) ? 'array' : typeof data.results
    })
    
    // If no results, try to understand why
    if (!data.results || data.results.length === 0) {
      console.warn('⚠️ No events returned. Response structure:', {
        keys: Object.keys(data),
        fullResponse: JSON.stringify(data).substring(0, 500)
      })
    }
    
    return {
      events: data.results || [],
      next: data.next || null // Cursor for next page
    }
  } catch (error) {
    console.error('❌ Error fetching PostHog events:', error)
    throw error
  }
}

/**
 * Fetch all events from PostHog with pagination
 * @param {Date} startTime - Start timestamp
 * @param {Date} endTime - End timestamp
 * @param {string[]} eventNames - Array of event names to fetch
 * @returns {Promise<Array>} - Array of all events
 */
export async function fetchAllPostHogEvents(startTime, endTime, eventNames = []) {
  const allEvents = []
  let after = null
  let apiCalls = 0
  const maxApiCalls = 100 // Safety limit to prevent infinite loops

  try {
    while (apiCalls < maxApiCalls) {
      apiCalls++
      
      const { events, next } = await fetchPostHogEventsByTimeRange(startTime, endTime, eventNames, after)
      
      allEvents.push(...events)
      
      if (!next) {
        break // No more pages
      }
      
      after = next
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    return { events: allEvents, apiCalls }
  } catch (error) {
    console.error('Error fetching all PostHog events:', error)
    throw error
  }
}

/**
 * Fetch events with retry logic
 * @param {Date} startTime - Start timestamp
 * @param {Date} endTime - End timestamp
 * @param {string[]} eventNames - Array of event names
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise<{success: boolean, events?: Array, apiCalls?: number, error?: Error}>}
 */
export async function fetchEventsWithRetry(startTime, endTime, eventNames = [], maxRetries = 3) {
  let attempts = 0
  let lastError = null

  while (attempts < maxRetries) {
    try {
      const { events, apiCalls } = await fetchAllPostHogEvents(startTime, endTime, eventNames)
      return { success: true, events, apiCalls }
    } catch (error) {
      lastError = error
      attempts++

      // Don't retry on rate limit - wait longer
      if (error.message?.includes('rate limit')) {
        const delay = Math.pow(2, attempts) * 2000 // 2s, 4s, 8s
        console.log(`Rate limited, waiting ${delay}ms before retry ${attempts}/${maxRetries}`)
        await new Promise(resolve => setTimeout(resolve, delay))
      } else {
        // Exponential backoff for other errors
        const delay = Math.pow(2, attempts) * 1000 // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  return { success: false, error: lastError }
}

