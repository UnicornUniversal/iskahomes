// PostHog API helpers for cron job - fetches actual events from PostHog Events API
import { POSTHOG_PERSONAL_API_KEY, POSTHOG_PROJECT_ID, POSTHOG_HOST } from './posthog'

// Check if PostHog is configured
function isPostHogConfigured() {
  return !!(POSTHOG_PERSONAL_API_KEY && POSTHOG_PROJECT_ID && POSTHOG_HOST)
}

/**
 * Fetch events from PostHog Events API within a time range with pagination support
 * @param {Date} startTime - Start timestamp
 * @param {Date} endTime - End timestamp
 * @param {string[]} eventNames - Array of event names to fetch (optional, fetches all if not provided)
 * @param {string} cursor - Pagination cursor for subsequent pages
 * @returns {Promise<{events: Array, nextCursor: string|null}>}
 */
export async function fetchPostHogEventsByTimeRange(startTime, endTime, eventNames = [], cursor = null) {
  try {
    if (!isPostHogConfigured()) {
      console.warn('⚠️ PostHog not configured')
      console.warn('   POSTHOG_PERSONAL_API_KEY:', !!POSTHOG_PERSONAL_API_KEY)
      console.warn('   POSTHOG_PROJECT_ID:', POSTHOG_PROJECT_ID)
      console.warn('   POSTHOG_HOST:', POSTHOG_HOST)
      return { events: [], nextCursor: null }
    }

    // Build query parameters
    const params = new URLSearchParams({
      timestamp__gte: startTime.toISOString(),
      timestamp__lt: endTime.toISOString(),
      limit: '1000' // Max per page
    })

    // Add event filter if provided - use event__in for multiple events
    if (eventNames.length > 0) {
      if (eventNames.length === 1) {
        // Single event - use 'event' parameter
        params.append('event', eventNames[0])
      } else {
        // Multiple events - use 'event__in' parameter
        params.append('event__in', eventNames.join(','))
      }
    }

    // Add cursor for pagination
    // If cursor is a full URL, we need to use it directly instead of building a new URL
    if (cursor) {
      // Check if cursor is a full URL
      try {
        const cursorUrl = new URL(cursor)
        // If it's a full URL, use it directly and skip building params
        const url = cursor
        console.log('🌐 Using cursor URL directly:', url.substring(0, 100) + '...')
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${POSTHOG_PERSONAL_API_KEY}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error(`❌ PostHog API error: ${response.status} - ${response.statusText}`, errorText)
          
          if (response.status === 429) {
            throw new Error('PostHog rate limit exceeded')
          }
          
          throw new Error(`PostHog API error: ${response.status} - ${errorText}`)
        }

        const data = await response.json()
        
        // Get oldest and newest timestamps for debugging
        const timestamps = data.results?.map(e => e.timestamp).filter(Boolean) || []
        const oldestTimestamp = timestamps.length > 0 ? timestamps[timestamps.length - 1] : null
        const newestTimestamp = timestamps.length > 0 ? timestamps[0] : null
        
        // Extract next cursor
        let nextCursor = null
        if (data.next) {
          try {
            const nextUrl = new URL(data.next)
            nextCursor = nextUrl.searchParams.get('after') || data.next
          } catch {
            nextCursor = data.next
          }
        }
        
        console.log('📊 PostHog API Page Response (cursor URL):', {
          resultsCount: data.results?.length || 0,
          hasNextPage: !!data.next,
          nextRaw: data.next ? `${String(data.next).substring(0, 100)}...` : 'none',
          nextCursor: nextCursor ? `${String(nextCursor).substring(0, 50)}...` : 'none',
          oldestEventTimestamp: oldestTimestamp,
          newestEventTimestamp: newestTimestamp
        })
        
        return {
          events: data.results || [],
          nextCursor: nextCursor
        }
      } catch {
        // Not a URL, use as 'after' parameter
        params.append('after', cursor)
      }
    }
    
    // Log the exact time range being queried
    console.log('🕐 Time range details:', {
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      startTimeUnix: Math.floor(startTime.getTime() / 1000),
      endTimeUnix: Math.floor(endTime.getTime() / 1000),
      rangeMinutes: (endTime - startTime) / (1000 * 60)
    })

    const url = `${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/events/?${params.toString()}`
    
    console.log('🌐 PostHog API Request:', {
      page: cursor ? 'subsequent' : 'first',
      cursor: cursor ? `${cursor.substring(0, 20)}...` : 'none',
      eventFilter: eventNames.length > 0 ? eventNames.join(',') : 'all events',
      timestamp__gte: startTime.toISOString(),
      timestamp__lt: endTime.toISOString()
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
    
    // Get oldest and newest timestamps for debugging
    const timestamps = data.results?.map(e => e.timestamp).filter(Boolean) || []
    const oldestTimestamp = timestamps.length > 0 ? timestamps[timestamps.length - 1] : null
    const newestTimestamp = timestamps.length > 0 ? timestamps[0] : null
    
    // Extract next cursor for pagination
    // PostHog returns 'next' as a full URL - we need to use it directly or extract the 'after' parameter
    let nextCursor = null
    if (data.next) {
      try {
        const url = new URL(data.next)
        // Try to extract 'after' parameter from the URL
        const afterParam = url.searchParams.get('after')
        if (afterParam) {
          nextCursor = afterParam
        } else {
          // If no 'after' param, use the full URL (we'll need to handle this differently)
          nextCursor = data.next
        }
      } catch {
        // If it's not a URL, use it as a cursor string
        nextCursor = data.next
      }
    }
    
    // Log full response structure for debugging
    console.log('📊 PostHog API Page Response:', {
      resultsCount: data.results?.length || 0,
      hasNextPage: !!data.next,
      nextRaw: data.next ? `${String(data.next).substring(0, 100)}...` : 'none',
      nextCursor: nextCursor ? `${String(nextCursor).substring(0, 50)}...` : 'none',
      oldestEventTimestamp: oldestTimestamp,
      newestEventTimestamp: newestTimestamp,
      responseKeys: Object.keys(data),
      sampleEventTimestamps: data.results?.slice(0, 5).map(e => ({
        event: e.event,
        timestamp: e.timestamp,
        listing_id: e.properties?.listing_id || e.properties?.listingId || null
      })) || []
    })
    
    // If no results, try to understand why
    if (!data.results || data.results.length === 0) {
      console.warn('⚠️ No events returned. Response structure:', {
        keys: Object.keys(data),
        hasNext: !!data.next,
        nextValue: data.next,
        fullResponse: JSON.stringify(data).substring(0, 1000)
      })
    }
    
    return {
      events: data.results || [],
      nextCursor: nextCursor
    }
  } catch (error) {
    console.error('❌ Error fetching PostHog events:', error)
    throw error
  }
}

/**
 * Fetch ALL events from PostHog with pagination support
 * @param {Date} startTime - Start timestamp
 * @param {Date} endTime - End timestamp
 * @param {string[]} eventNames - Array of event names to fetch
 * @returns {Promise<{events: Array, apiCalls: number}>} - Array of all events
 */
export async function fetchAllPostHogEvents(startTime, endTime, eventNames = []) {
  try {
    const eventFilter = eventNames.length > 0 ? eventNames.join(', ') : 'all events'
    console.log(`📡 Fetching ALL events from PostHog with pagination (filter: ${eventFilter})...`)
    
    let allEvents = []
    let apiCalls = 0
    let hasMore = true
    let cursor = null

    // Track how many matching events we've found
    let matchingEventsCount = 0
    const maxPages = 100 // Safety limit
    
    while (hasMore && apiCalls < maxPages) {
      const { events, nextCursor } = await fetchPostHogEventsByTimeRange(
        startTime, 
        endTime, 
        [], // Don't filter on PostHog side - filter client-side instead
        cursor
      )
      
      allEvents = allEvents.concat(events)
      apiCalls++
      cursor = nextCursor
      
      // Count matching events in this page
      if (eventNames.length > 0) {
        const pageMatching = events.filter(e => eventNames.includes(e.event)).length
        matchingEventsCount += pageMatching
        console.log(`📄 Page ${apiCalls}: fetched ${events.length} events (${pageMatching} matching, ${matchingEventsCount} total matching so far), nextCursor: ${nextCursor ? 'yes' : 'no'}`)
      } else {
        console.log(`📄 Page ${apiCalls}: fetched ${events.length} events (total so far: ${allEvents.length}), nextCursor: ${nextCursor ? 'yes' : 'no'}`)
      }
      
      // Continue only if we have a next cursor
      hasMore = !!nextCursor
      
      // Add a small delay to avoid rate limiting before next request
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    // Filter events client-side if eventNames were specified (PostHog's event__in filter may not work correctly)
    let filteredEvents = allEvents
    if (eventNames.length > 0) {
      filteredEvents = allEvents.filter(e => eventNames.includes(e.event))
      console.log(`🔍 Client-side filtering: ${allEvents.length} total events → ${filteredEvents.length} matching events (${eventNames.join(', ')})`)
      
      // Log sample of non-matching events to debug
      const nonMatching = allEvents.filter(e => !eventNames.includes(e.event))
      if (nonMatching.length > 0) {
        const sampleNonMatching = nonMatching.slice(0, 10).map(e => e.event)
        const uniqueNonMatching = [...new Set(sampleNonMatching)]
        console.log(`⚠️ Found ${nonMatching.length} non-matching events. Sample event types:`, uniqueNonMatching)
      }
    }
    
    console.log(`✅ Received ${allEvents.length} total events from PostHog in ${apiCalls} API calls`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`📊 TOTAL RESPONSE FROM POSTHOG IS: ${allEvents.length} EVENTS`)
    console.log(`📊 FILTERED TO: ${filteredEvents.length} EVENTS (${eventNames.length > 0 ? eventNames.join(', ') : 'all'})`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`   Event breakdown:`, eventNames.length > 0 ? 
      eventNames.reduce((acc, name) => {
        acc[name] = filteredEvents.filter(e => e.event === name).length
        return acc
      }, {}) : 
      'all events'
    )
    console.log(`   Time range: ${startTime.toISOString()} to ${endTime.toISOString()}`)
    console.log(`   API calls made: ${apiCalls}`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)

    return { events: filteredEvents, apiCalls }
  } catch (error) {
    console.error('Error fetching PostHog events:', error)
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

