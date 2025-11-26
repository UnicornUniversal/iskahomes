// PostHog API helpers for cron job - fetches actual events from PostHog Events API
import { POSTHOG_PERSONAL_API_KEY, POSTHOG_PROJECT_ID, POSTHOG_HOST } from './posthog'

// Check if PostHog is configured
function isPostHogConfigured() {
  return !!(POSTHOG_PERSONAL_API_KEY && POSTHOG_PROJECT_ID && POSTHOG_HOST)
}

/**
 * Fetch events from PostHog Query API using where clause (Method 5 - Recommended)
 * @param {Date} startTime - Start timestamp
 * @param {Date} endTime - End timestamp
 * @param {string[]} eventNames - Array of event names to fetch (optional, fetches all if not provided)
 * @param {number} offset - Pagination offset
 * @returns {Promise<{events: Array, hasMore: boolean, offset: number}>}
 */
export async function fetchPostHogEventsByQueryAPI(startTime, endTime, eventNames = [], offset = 0) {
  try {
    if (!isPostHogConfigured()) {
      console.warn('⚠️ PostHog not configured')
      return { events: [], hasMore: false, offset: 0 }
    }

    // Build where clause - PostHog uses HogQL syntax
    const whereClauses = []
    
    // Filter out auto-capture events (events starting with $)
    whereClauses.push("event NOT LIKE '$%'")
    
    // Also filter to only our custom events if provided
    if (eventNames.length > 0) {
      // Use IN clause for multiple events
      const eventList = eventNames.map(e => `'${e}'`).join(', ')
      whereClauses.push(`event IN (${eventList})`)
    }

    const queryBody = {
      kind: 'EventsQuery',
      select: ['*'], // Use '*' to get all fields including event, timestamp, properties, distinct_id
      orderBy: ['timestamp DESC'],
      // Use ISO timestamps - PostHog Query API format
      after: startTime.toISOString(),
      before: endTime.toISOString(),
      limit: 1000,
      offset: offset,
      where: whereClauses
    }

    const url = `${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/query/`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${POSTHOG_PERSONAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: queryBody })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ PostHog Query API error: ${response.status} - ${errorText}`)
      
      if (response.status === 429) {
        throw new Error('PostHog rate limit exceeded')
      }
      
      throw new Error(`PostHog Query API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    
    // Check for errors
    if (data.error) {
      throw new Error(`PostHog Query API error: ${data.error}`)
    }

    // PostHog Query API returns results as array of arrays (rows)
    // Each row is an array matching the columns order
    // When selecting '*', the result is a tuple: [uuid, event, properties, timestamp, team_id, distinct_id, elements_chain, created_at, person_mode]
    let events = []
    if (Array.isArray(data.results) && data.results.length > 0) {
      const columns = data.columns || []
      const starIndex = columns.indexOf('*')
      
      // Helper function to safely parse properties
      const parseProperties = (props) => {
        if (!props) return {}
        if (typeof props === 'object' && !Array.isArray(props)) {
          return props // Already an object
        }
        if (typeof props === 'string') {
          try {
            return JSON.parse(props) // JSON string
          } catch (e) {
            console.warn('⚠️ Failed to parse properties JSON:', e.message)
            return {}
          }
        }
        if (Array.isArray(props)) {
          // If it's an array, it's likely a parsing error - return empty object
          console.warn('⚠️ Properties is an array (unexpected), returning empty object')
          return {}
        }
        return {}
      }
      
      // Convert array of arrays to array of objects
      events = data.results.map((row, rowIndex) => {
        // When selecting '*', row[0] is the tuple
        if (starIndex !== -1 && Array.isArray(row[starIndex])) {
          const tuple = row[starIndex]
          // Tuple structure: [uuid, event, properties, timestamp, team_id, distinct_id, elements_chain, created_at, person_mode]
          return {
            uuid: tuple[0],
            event: tuple[1] || '',
            properties: parseProperties(tuple[2]) || {},
            timestamp: tuple[3] || new Date().toISOString(),
            team_id: tuple[4],
            distinct_id: tuple[5] || 'anonymous',
            elements_chain: tuple[6],
            created_at: tuple[7],
            person_mode: tuple[8]
          }
        } else if (starIndex !== -1 && row[starIndex]) {
          // Fallback: if '*' is not an array, try to use it directly
          const starValue = row[starIndex]
          return {
            event: starValue.event || '',
            properties: parseProperties(starValue.properties) || {},
            timestamp: starValue.timestamp || new Date().toISOString(),
            distinct_id: starValue.distinct_id || 'anonymous',
            uuid: starValue.uuid,
            team_id: starValue.team_id,
            elements_chain: starValue.elements_chain,
            created_at: starValue.created_at,
            person_mode: starValue.person_mode
          }
        } else {
          // Last resort: map columns to values
          const eventObj = {}
          columns.forEach((col, index) => {
            if (col === 'properties') {
              eventObj[col] = parseProperties(row[index])
            } else {
              eventObj[col] = row[index]
            }
          })
          
          return {
            event: eventObj.event || '',
            properties: eventObj.properties || {},
            timestamp: eventObj.timestamp || new Date().toISOString(),
            distinct_id: eventObj.distinct_id || 'anonymous',
            uuid: eventObj.uuid,
            team_id: eventObj.team_id,
            elements_chain: eventObj.elements_chain,
            created_at: eventObj.created_at,
            person_mode: eventObj.person_mode
          }
        }
      })
    }

    // Check if there are more results
    const hasMore = data.hasMore === true || (events.length === 1000 && data.results?.length === 1000)
    const nextOffset = hasMore ? offset + events.length : offset

    return {
      events: events,
      hasMore: hasMore,
      offset: nextOffset
    }
  } catch (error) {
    console.error('❌ Error fetching PostHog events via Query API:', error)
    throw error
  }
}

/**
 * Fetch events from PostHog Events API within a time range with pagination support
 * @deprecated Use fetchPostHogEventsByQueryAPI instead (Method 5 - Query API with where clause)
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
 * Fetch ALL events from PostHog using Query API with where clause (Method 5)
 * @param {Date} startTime - Start timestamp
 * @param {Date} endTime - End timestamp
 * @param {string[]} eventNames - Array of event names to fetch
 * @returns {Promise<{events: Array, apiCalls: number}>} - Array of all events
 */
export async function fetchAllPostHogEvents(startTime, endTime, eventNames = []) {
  try {
    const eventFilter = eventNames.length > 0 ? eventNames.join(', ') : 'all events'
    console.log(`📡 Fetching ALL events from PostHog Query API (Method 5 - where clause) (filter: ${eventFilter})...`)
    
    let allEvents = []
    let apiCalls = 0
    let hasMore = true
    let offset = 0

    const maxPages = 100 // Safety limit
    
    // Use Query API with where clause (Method 5) - filters out auto-capture events and custom events at API level
    while (hasMore && apiCalls < maxPages) {
      const { events, hasMore: moreResults, offset: nextOffset } = await fetchPostHogEventsByQueryAPI(
        startTime, 
        endTime, 
        eventNames, // Filter custom events at API level
        offset
      )
      
      allEvents = allEvents.concat(events)
      apiCalls++
      offset = nextOffset
      hasMore = moreResults
      
      // Log progress
      if (eventNames.length > 0) {
        console.log(`📄 Page ${apiCalls}: fetched ${events.length} custom events (${eventNames.join(', ')}), hasMore: ${hasMore}`)
      } else {
        console.log(`📄 Page ${apiCalls}: fetched ${events.length} events (total so far: ${allEvents.length}), hasMore: ${hasMore}`)
      }
      
      // Add a small delay to avoid rate limiting before next request
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    // Double-check that all events match (safety check)
    if (eventNames.length > 0) {
      const nonMatching = allEvents.filter(e => !eventNames.includes(e.event))
      if (nonMatching.length > 0) {
        console.warn(`⚠️ WARNING: PostHog returned ${nonMatching.length} non-matching events despite filtering. This shouldn't happen.`)
        const uniqueNonMatching = [...new Set(nonMatching.map(e => e.event))]
        console.warn(`   Non-matching event types:`, uniqueNonMatching)
      }
    }
    
    console.log(`✅ Received ${allEvents.length} custom events from PostHog in ${apiCalls} API calls`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`📊 TOTAL CUSTOM EVENTS FROM POSTHOG: ${allEvents.length} EVENTS`)
    console.log(`📊 Event filter applied: ${eventNames.length > 0 ? eventNames.join(', ') : 'all events'}`)
    console.log(`📊 Method: PostHog Query API (where clause) - filters out auto-capture events`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    if (eventNames.length > 0) {
      console.log(`   Event breakdown:`, eventNames.reduce((acc, name) => {
        acc[name] = allEvents.filter(e => e.event === name).length
        return acc
      }, {}))
    }
    console.log(`   Time range: ${startTime.toISOString()} to ${endTime.toISOString()}`)
    console.log(`   API calls made: ${apiCalls}`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)

    return { events: allEvents, apiCalls }
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

