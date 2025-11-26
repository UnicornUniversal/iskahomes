import { NextResponse } from 'next/server'
import { fetchPostHogEventsByTimeRange, fetchAllPostHogEvents } from '@/lib/posthogCron'
import { POSTHOG_PERSONAL_API_KEY, POSTHOG_PROJECT_ID, POSTHOG_HOST } from '@/lib/posthog'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const testType = searchParams.get('test') || 'both' // 'all', 'filter', 'client-filter', 'both', 'full', 'api-all', 'api-method1', 'api-method2', 'api-method3', 'api-method4', 'api-method5', 'api-method6'
    const startDate = searchParams.get('start') || '2025-11-02'
    const endDate = searchParams.get('end') || '2025-11-02'
    const startTimeParam = searchParams.get('startTime') || null // Optional: 'HH:MM:SS' or 'HH:MM' format
    const endTimeParam = searchParams.get('endTime') || null // Optional: 'HH:MM:SS' or 'HH:MM' format
    
    // Build time range based on start and end dates with optional times
    // If times are provided, use them; otherwise use start/end of day
    let startTime, endTime
    
    if (startTimeParam) {
      // Parse time (supports 'HH:MM:SS' or 'HH:MM')
      const [hours, minutes, seconds = '00'] = startTimeParam.split(':')
      startTime = new Date(`${startDate}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}.000Z`)
    } else {
      // Default to beginning of start date
      startTime = new Date(`${startDate}T00:00:00.000Z`)
    }
    
    if (endTimeParam) {
      // Parse time (supports 'HH:MM:SS' or 'HH:MM')
      const [hours, minutes, seconds = '00'] = endTimeParam.split(':')
      endTime = new Date(`${endDate}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}.999Z`)
    } else {
      // Default to end of end date
      endTime = new Date(`${endDate}T23:59:59.999Z`)
    }
    
    const customEventNames = [
      'property_view',
      'listing_impression',
      'lead', // Unified lead event (with lead_type: 'phone', 'message', 'appointment' in properties)
      'impression_social_media',
      'impression_website_visit',
      'impression_share',
      'impression_saved_listing',
      'profile_view',
      'property_search',
      'development_view',
      'development_share',
      'development_saved',
      'development_social_click',
      'development_interaction',
      'development_lead',
    ]

    const results = {
      testType,
      timeRange: {
        start: startTime.toISOString(),
        end: endTime.toISOString(),
        startDate,
        endDate,
        startTime: startTimeParam || '00:00:00',
        endTime: endTimeParam || '23:59:59',
        durationDays: (endTime - startTime) / (1000 * 60 * 60 * 24),
        durationHours: (endTime - startTime) / (1000 * 60 * 60),
        durationMinutes: (endTime - startTime) / (1000 * 60)
      },
      tests: []
    }

    // Test 1: Fetch WITHOUT filter (all events)
    if (testType === 'all' || testType === 'both') {
      console.log('🧪 Test 1: Fetching ALL events (no filter)...')
      const start1 = Date.now()
      const { events: allEvents, nextCursor: cursor1 } = await fetchPostHogEventsByTimeRange(
        startTime,
        endTime,
        [], // No filter
        null
      )
      const duration1 = Date.now() - start1
      
      // Get event breakdown
      const allEventsBreakdown = {}
      allEvents.forEach(e => {
        allEventsBreakdown[e.event] = (allEventsBreakdown[e.event] || 0) + 1
      })
      
      const customEventsCount = allEvents.filter(e => customEventNames.includes(e.event)).length
      const autoCaptureEvents = allEvents.filter(e => e.event.startsWith('$')).length
      
      results.tests.push({
        name: 'No Filter (All Events)',
        eventNames: [],
        totalEvents: allEvents.length,
        customEvents: customEventsCount,
        autoCaptureEvents: autoCaptureEvents,
        durationMs: duration1,
        hasNextPage: !!cursor1,
        breakdown: allEventsBreakdown,
        sampleEvents: allEvents.slice(0, 5).map(e => ({
          event: e.event,
          timestamp: e.timestamp,
          has_listing_id: !!e.properties?.listing_id,
          has_lister_id: !!e.properties?.lister_id
        }))
      })
    }

    // Test 2: Fetch WITH filter (custom events only) - METHOD 1: Explicit Event Names
    if (testType === 'filter' || testType === 'both') {
      console.log('🧪 Test 2: Fetching with custom event filter (Method 1: Explicit Event Names)...')
      const start2 = Date.now()
      const { events: filteredEvents, nextCursor: cursor2 } = await fetchPostHogEventsByTimeRange(
        startTime,
        endTime,
        customEventNames, // METHOD 1: Only fetch these specific events
        null
      )
      const duration2 = Date.now() - start2
      
      // Get event breakdown
      const filteredBreakdown = {}
      filteredEvents.forEach(e => {
        filteredBreakdown[e.event] = (filteredBreakdown[e.event] || 0) + 1
      })
      
      const matchingCustomEvents = filteredEvents.filter(e => customEventNames.includes(e.event)).length
      const nonMatchingEvents = filteredEvents.filter(e => !customEventNames.includes(e.event)).length
      
      // Check for auto-capture events that slipped through
      const autoCaptureEvents = filteredEvents.filter(e => e.event.startsWith('$')).length
      
      results.tests.push({
        name: 'Method 1: Explicit Event Names Filter',
        method: 'event__in filter (PostHog API)',
        eventNames: customEventNames,
        totalEvents: filteredEvents.length,
        matchingCustomEvents: matchingCustomEvents,
        nonMatchingEvents: nonMatchingEvents,
        autoCaptureEvents: autoCaptureEvents, // Should be 0 if filter works
        durationMs: duration2,
        hasNextPage: !!cursor2,
        breakdown: filteredBreakdown,
        sampleEvents: filteredEvents.slice(0, 10).map(e => ({
          event: e.event,
          timestamp: e.timestamp,
          has_listing_id: !!e.properties?.listing_id,
          has_lister_id: !!e.properties?.lister_id,
          isAutoCapture: e.event.startsWith('$')
        })),
        filterWorking: autoCaptureEvents === 0 && nonMatchingEvents === 0
      })
    }

    // Test 2b: Client-side filter (fallback if API filter doesn't work)
    if (testType === 'client-filter' || testType === 'both') {
      console.log('🧪 Test 2b: Fetching all events then filtering client-side...')
      const start2b = Date.now()
      const { events: allEventsForFilter, nextCursor: cursor2b } = await fetchPostHogEventsByTimeRange(
        startTime,
        endTime,
        [], // No filter - fetch all
        null
      )
      
      // METHOD 2: Client-side filter - exclude auto-capture events
      const clientFilteredEvents = allEventsForFilter.filter(e => {
        // Include only custom events (exclude events starting with '$')
        return customEventNames.includes(e.event) && !e.event.startsWith('$')
      })
      
      const duration2b = Date.now() - start2b
      
      const clientFilteredBreakdown = {}
      clientFilteredEvents.forEach(e => {
        clientFilteredBreakdown[e.event] = (clientFilteredBreakdown[e.event] || 0) + 1
      })
      
      const autoCaptureFilteredOut = allEventsForFilter.filter(e => e.event.startsWith('$')).length
      
      results.tests.push({
        name: 'Method 2: Client-Side Filter (Fallback)',
        method: 'Fetch all, then filter client-side',
        eventNames: customEventNames,
        totalEventsFetched: allEventsForFilter.length,
        totalEventsAfterFilter: clientFilteredEvents.length,
        autoCaptureFilteredOut: autoCaptureFilteredOut,
        durationMs: duration2b,
        hasNextPage: !!cursor2b,
        breakdown: clientFilteredBreakdown,
        sampleEvents: clientFilteredEvents.slice(0, 10).map(e => ({
          event: e.event,
          timestamp: e.timestamp,
          has_listing_id: !!e.properties?.listing_id,
          has_lister_id: !!e.properties?.lister_id
        })),
        filterWorking: true // Always works since we filter client-side
      })
    }

    // Test 3: Method 1 - Direct event parameter (array)
    if (testType === 'api-method1' || testType === 'api-all' || testType === 'both') {
      console.log('🧪 Test 3: Method 1 - Direct event parameter (array)...')
      const start3 = Date.now()
      try {
        const params = new URLSearchParams({
          timestamp__gte: startTime.toISOString(),
          timestamp__lt: endTime.toISOString(),
          limit: '1000'
        })
        
        // Method 1: Direct event parameter (multiple events as array)
        customEventNames.forEach(eventName => {
          params.append('event', eventName)
        })
        
        const url = `${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/events/?${params.toString()}`
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${POSTHOG_PERSONAL_API_KEY}`,
            'Content-Type': 'application/json'
          }
        })
        
        const data = await response.json()
        const method1Events = data.results || []
        const duration3 = Date.now() - start3
        
        const method1Breakdown = {}
        method1Events.forEach(e => {
          method1Breakdown[e.event] = (method1Breakdown[e.event] || 0) + 1
        })
        
        const autoCaptureCount = method1Events.filter(e => e.event.startsWith('$')).length
        const matchingCount = method1Events.filter(e => customEventNames.includes(e.event)).length
        
        results.tests.push({
          name: 'Method 1: Direct event parameter (multiple append)',
          method: 'params.append("event", name) for each event',
          eventNames: customEventNames,
          totalEvents: method1Events.length,
          matchingCustomEvents: matchingCount,
          autoCaptureEvents: autoCaptureCount,
          durationMs: duration3,
          breakdown: method1Breakdown,
          filterWorking: autoCaptureCount === 0,
          apiUrl: url.substring(0, 100) + '...',
          sampleEvents: method1Events.slice(0, 5).map(e => ({
            event: e.event,
            timestamp: e.timestamp,
            isAutoCapture: e.event.startsWith('$')
          }))
        })
      } catch (error) {
        results.tests.push({
          name: 'Method 1: Direct event parameter (ERROR)',
          error: error.message
        })
      }
    }

    // Test 4: Method 2 - event__in with comma-separated string
    if (testType === 'api-method2' || testType === 'api-all' || testType === 'both') {
      console.log('🧪 Test 4: Method 2 - event__in with comma-separated string...')
      const start4 = Date.now()
      try {
        const params = new URLSearchParams({
          timestamp__gte: startTime.toISOString(),
          timestamp__lt: endTime.toISOString(),
          limit: '1000',
          event__in: customEventNames.join(',') // Comma-separated string
        })
        
        const url = `${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/events/?${params.toString()}`
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${POSTHOG_PERSONAL_API_KEY}`,
            'Content-Type': 'application/json'
          }
        })
        
        const data = await response.json()
        const method2Events = data.results || []
        const duration4 = Date.now() - start4
        
        const method2Breakdown = {}
        method2Events.forEach(e => {
          method2Breakdown[e.event] = (method2Breakdown[e.event] || 0) + 1
        })
        
        const autoCaptureCount = method2Events.filter(e => e.event.startsWith('$')).length
        const matchingCount = method2Events.filter(e => customEventNames.includes(e.event)).length
        
        results.tests.push({
          name: 'Method 2: event__in (comma-separated)',
          method: 'event__in=event1,event2,event3',
          eventNames: customEventNames,
          totalEvents: method2Events.length,
          matchingCustomEvents: matchingCount,
          autoCaptureEvents: autoCaptureCount,
          durationMs: duration4,
          breakdown: method2Breakdown,
          filterWorking: autoCaptureCount === 0,
          apiUrl: url.substring(0, 100) + '...',
          sampleEvents: method2Events.slice(0, 5).map(e => ({
            event: e.event,
            timestamp: e.timestamp,
            isAutoCapture: e.event.startsWith('$')
          }))
        })
      } catch (error) {
        results.tests.push({
          name: 'Method 2: event__in (ERROR)',
          error: error.message
        })
      }
    }

    // Test 5: Method 3 - Properties filter (JSON)
    if (testType === 'api-method3' || testType === 'api-all' || testType === 'both') {
      console.log('🧪 Test 5: Method 3 - Properties filter (JSON)...')
      const start5 = Date.now()
      try {
        const params = new URLSearchParams({
          timestamp__gte: startTime.toISOString(),
          timestamp__lt: endTime.toISOString(),
          limit: '1000',
          properties: JSON.stringify([{
            key: 'event',
            operator: 'in',
            value: customEventNames
          }])
        })
        
        const url = `${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/events/?${params.toString()}`
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${POSTHOG_PERSONAL_API_KEY}`,
            'Content-Type': 'application/json'
          }
        })
        
        const data = await response.json()
        const method3Events = data.results || []
        const duration5 = Date.now() - start5
        
        const method3Breakdown = {}
        method3Events.forEach(e => {
          method3Breakdown[e.event] = (method3Breakdown[e.event] || 0) + 1
        })
        
        const autoCaptureCount = method3Events.filter(e => e.event.startsWith('$')).length
        const matchingCount = method3Events.filter(e => customEventNames.includes(e.event)).length
        
        results.tests.push({
          name: 'Method 3: Properties filter (JSON)',
          method: 'properties=[{key:"event", operator:"in", value:[...]}]',
          eventNames: customEventNames,
          totalEvents: method3Events.length,
          matchingCustomEvents: matchingCount,
          autoCaptureEvents: autoCaptureCount,
          durationMs: duration5,
          breakdown: method3Breakdown,
          filterWorking: autoCaptureCount === 0,
          apiUrl: url.substring(0, 100) + '...',
          sampleEvents: method3Events.slice(0, 5).map(e => ({
            event: e.event,
            timestamp: e.timestamp,
            isAutoCapture: e.event.startsWith('$')
          }))
        })
      } catch (error) {
        results.tests.push({
          name: 'Method 3: Properties filter (ERROR)',
          error: error.message
        })
      }
    }

    // Test 6: Method 4 - Single event (test if single event works)
    if (testType === 'api-method4' || testType === 'api-all' || testType === 'both') {
      console.log('🧪 Test 6: Method 4 - Single event filter (test if single works)...')
      const start6 = Date.now()
      try {
        const params = new URLSearchParams({
          timestamp__gte: startTime.toISOString(),
          timestamp__lt: endTime.toISOString(),
          limit: '1000',
          event: 'property_view' // Single event
        })
        
        const url = `${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/events/?${params.toString()}`
        const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${POSTHOG_PERSONAL_API_KEY}`,
          'Content-Type': 'application/json'
        }
      })

        const data = await response.json()
        const method4Events = data.results || []
        const duration6 = Date.now() - start6
        
        const method4Breakdown = {}
        method4Events.forEach(e => {
          method4Breakdown[e.event] = (method4Breakdown[e.event] || 0) + 1
        })
        
        const autoCaptureCount = method4Events.filter(e => e.event.startsWith('$')).length
        const matchingCount = method4Events.filter(e => e.event === 'property_view').length
        
        results.tests.push({
          name: 'Method 4: Single event filter',
          method: 'event=property_view (single event)',
          eventNames: ['property_view'],
          totalEvents: method4Events.length,
          matchingCustomEvents: matchingCount,
          autoCaptureEvents: autoCaptureCount,
          durationMs: duration6,
          breakdown: method4Breakdown,
          filterWorking: autoCaptureCount === 0 && matchingCount === method4Events.length,
          apiUrl: url.substring(0, 100) + '...',
          sampleEvents: method4Events.slice(0, 5).map(e => ({
            event: e.event,
            timestamp: e.timestamp,
            isAutoCapture: e.event.startsWith('$')
          }))
        })
      } catch (error) {
        results.tests.push({
          name: 'Method 4: Single event (ERROR)',
          error: error.message
        })
      }
    }

    // Test 7: Method 5 - PostHog Query API (NEW - Recommended by PostHog)
    if (testType === 'api-method5' || testType === 'api-all' || testType === 'both') {
      console.log('🧪 Test 7: Method 5 - PostHog Query API (where clause)...')
      const start7 = Date.now()
      try {
        // Method 5: Use PostHog's /query endpoint with where clause
        // Try EventsQuery format first with after/before (ISO timestamps)
        const queryBody = {
          kind: 'EventsQuery',
          select: ['*', 'event', 'timestamp', 'properties'],
          orderBy: ['timestamp DESC'],
          // Use ISO timestamps - PostHog Query API format
          after: startTime.toISOString(),
          before: endTime.toISOString(),
          limit: 1000
        }
        
        // Build where clause - PostHog uses HogQL syntax
        const whereClauses = []
        
        // Filter out auto-capture events (events starting with $)
        whereClauses.push("event NOT LIKE '$%'")
        
        // Also filter to only our custom events
        if (customEventNames.length > 0) {
          // Use IN clause for multiple events
          const eventList = customEventNames.map(e => `'${e}'`).join(', ')
          whereClauses.push(`event IN (${eventList})`)
        }
        
        queryBody.where = whereClauses
        
        const url = `${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/query/`
        console.log('🔍 Query API Request:', JSON.stringify({ query: queryBody }, null, 2))
        
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
          console.error('❌ Query API Error Response:', errorText)
          throw new Error(`PostHog Query API error: ${response.status} - ${errorText}`)
        }
        
        const data = await response.json()
        console.log('📊 Query API Response:', {
          keys: Object.keys(data),
          hasResults: !!data.results,
          hasData: !!data.data,
          resultsLength: data.results?.length,
          dataLength: data.data?.length,
          columns: data.columns,
          resultsIsArray: Array.isArray(data.results),
          firstResultType: data.results?.[0] ? (Array.isArray(data.results[0]) ? 'array' : typeof data.results[0]) : 'none',
          error: data.error,
          query_status: data.query_status,
          hogql: data.hogql?.substring(0, 200),
          sampleResponse: JSON.stringify(data).substring(0, 1000)
        })
        
        // Check for errors first
        if (data.error) {
          throw new Error(`PostHog Query API error: ${data.error}`)
        }
        
        // PostHog Query API returns results as array of arrays (rows)
        // Each row is an array matching the columns order
        let method5Events = []
        if (Array.isArray(data.results)) {
          if (data.results.length > 0) {
            const columns = data.columns || []
            
            // Convert array of arrays to array of objects
            method5Events = data.results.map(row => {
              const event = {}
              columns.forEach((col, index) => {
                event[col] = row[index]
              })
              return event
            })
            
            console.log('✅ Parsed Query API results:', {
              totalRows: method5Events.length,
              columns: columns,
              sampleEvent: method5Events[0] ? Object.keys(method5Events[0]) : [],
              sampleEventData: JSON.stringify(method5Events[0]).substring(0, 300)
            })
          } else {
            console.log('⚠️ Query API returned empty results array. This could mean:')
            console.log('  1. No events exist in the specified date range')
            console.log('  2. The date range is incorrect (check start/end dates)')
            console.log('  3. The where clause is too restrictive')
            console.log('  Date range:', {
              after: queryBody.after,
              before: queryBody.before,
              startTime: startTime.toISOString(),
              endTime: endTime.toISOString()
            })
          }
        } else if (Array.isArray(data.data)) {
          method5Events = data.data
        } else if (data.results?.results) {
          method5Events = data.results.results
        } else if (data.query?.results) {
          method5Events = data.query.results
        } else if (Array.isArray(data)) {
          method5Events = data
        }
        
        const duration7 = Date.now() - start7
        
        const method5Breakdown = {}
        method5Events.forEach(e => {
          // Handle both object format and array format
          const eventName = e.event || e.name || (Array.isArray(e) ? e[0] : null) || 'unknown'
          method5Breakdown[eventName] = (method5Breakdown[eventName] || 0) + 1
        })
        
        const autoCaptureCount = method5Events.filter(e => {
          const eventName = e.event || e.name || (Array.isArray(e) ? e[0] : null) || ''
          return eventName.startsWith('$')
        }).length
        const matchingCount = method5Events.filter(e => {
          const eventName = e.event || e.name || (Array.isArray(e) ? e[0] : null) || ''
          return customEventNames.includes(eventName)
        }).length
        
        results.tests.push({
          name: 'Method 5: PostHog Query API (where clause)',
          method: 'POST /query with where: ["event NOT LIKE \'$%\']',
          eventNames: customEventNames,
          totalEvents: method5Events.length,
          matchingCustomEvents: matchingCount,
          autoCaptureEvents: autoCaptureCount,
          durationMs: duration7,
          breakdown: method5Breakdown,
          filterWorking: autoCaptureCount === 0 && method5Events.length > 0,
          apiUrl: url,
          queryBody: queryBody,
          responseStructure: {
            keys: Object.keys(data),
            hasResults: !!data.results,
            hasData: !!data.data,
            resultsType: Array.isArray(data.results) ? 'array' : typeof data.results,
            resultsLength: data.results?.length || 0,
            columns: data.columns,
            error: data.error,
            query_status: data.query_status,
            hogql: data.hogql ? data.hogql.substring(0, 300) : null
          },
          dateRange: {
            after: queryBody.after,
            before: queryBody.before,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString()
          },
          sampleEvents: method5Events.slice(0, 5).map(e => ({
            event: e.event || e.name || (Array.isArray(e) ? e[0] : null) || 'unknown',
            timestamp: e.timestamp || e.time || (Array.isArray(e) ? e[1] : null) || 'unknown',
            isAutoCapture: (e.event || e.name || (Array.isArray(e) ? e[0] : null) || '').startsWith('$'),
            rawSample: JSON.stringify(e).substring(0, 200)
          }))
        })
      } catch (error) {
        results.tests.push({
          name: 'Method 5: PostHog Query API (ERROR)',
          error: error.message,
          stack: error.stack
        })
      }
    }

    // Test 8: Method 6 - PostHog Query API (properties filter)
    if (testType === 'api-method6' || testType === 'api-all' || testType === 'both') {
      console.log('🧪 Test 8: Method 6 - PostHog Query API (properties filter)...')
      const start8 = Date.now()
      try {
        // Method 6: Use properties filter in query
        const queryBody = {
          kind: 'EventsQuery',
          select: ['*', 'event', 'timestamp', 'properties'],
          orderBy: ['timestamp DESC'],
          // Use ISO timestamps
          after: startTime.toISOString(),
          before: endTime.toISOString(),
          limit: 1000,
          where: ["event NOT LIKE '$%'"],
          // Properties filter for specific events
          properties: customEventNames.map(eventName => ({
            key: 'event',
            value: eventName,
            operator: 'exact',
            type: 'event'
          }))
        }
        
        console.log('🔍 Query API Method 6 Request:', JSON.stringify({ query: queryBody }, null, 2))
        
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
          throw new Error(`PostHog Query API error: ${response.status} - ${errorText}`)
        }
        
        const data = await response.json()
        console.log('📊 Query API Method 6 Response:', {
          keys: Object.keys(data),
          hasResults: !!data.results,
          columns: data.columns,
          resultsLength: data.results?.length,
          resultsIsArray: Array.isArray(data.results),
          firstResultType: data.results?.[0] ? (Array.isArray(data.results[0]) ? 'array' : typeof data.results[0]) : 'none',
          error: data.error,
          query_status: data.query_status,
          hogql: data.hogql?.substring(0, 200)
        })
        
        // Check for errors first
        if (data.error) {
          throw new Error(`PostHog Query API error: ${data.error}`)
        }
        
        // PostHog Query API returns results as array of arrays (rows)
        let method6Events = []
        if (Array.isArray(data.results)) {
          if (data.results.length > 0) {
            const columns = data.columns || []
            
            // Convert array of arrays to array of objects
            method6Events = data.results.map(row => {
              const event = {}
              columns.forEach((col, index) => {
                event[col] = row[index]
              })
              return event
            })
            
            console.log('✅ Parsed Query API Method 6 results:', {
              totalRows: method6Events.length,
              columns: columns,
              sampleEvent: method6Events[0] ? Object.keys(method6Events[0]) : []
            })
          } else {
            console.log('⚠️ Query API Method 6 returned empty results array. This could mean:')
            console.log('  1. No events exist in the specified date range')
            console.log('  2. The date range is incorrect (check start/end dates)')
            console.log('  3. The properties filter is not working correctly')
            console.log('  Date range:', {
              after: queryBody.after,
              before: queryBody.before,
              startTime: startTime.toISOString(),
              endTime: endTime.toISOString()
            })
          }
        } else if (Array.isArray(data.data)) {
          method6Events = data.data
        } else if (data.results?.results) {
          method6Events = data.results.results
        } else if (data.query?.results) {
          method6Events = data.query.results
        } else if (Array.isArray(data)) {
          method6Events = data
        }
        
        const duration8 = Date.now() - start8
        
        const method6Breakdown = {}
        method6Events.forEach(e => {
          const eventName = e.event || e.name || (Array.isArray(e) ? e[0] : null) || 'unknown'
          method6Breakdown[eventName] = (method6Breakdown[eventName] || 0) + 1
        })
        
        const autoCaptureCount = method6Events.filter(e => {
          const eventName = e.event || e.name || (Array.isArray(e) ? e[0] : null) || ''
          return eventName.startsWith('$')
        }).length
        const matchingCount = method6Events.filter(e => {
          const eventName = e.event || e.name || (Array.isArray(e) ? e[0] : null) || ''
          return customEventNames.includes(eventName)
        }).length
        
        results.tests.push({
          name: 'Method 6: PostHog Query API (properties filter)',
          method: 'POST /query with properties filter',
          eventNames: customEventNames,
          totalEvents: method6Events.length,
          matchingCustomEvents: matchingCount,
          autoCaptureEvents: autoCaptureCount,
          durationMs: duration8,
          breakdown: method6Breakdown,
          filterWorking: autoCaptureCount === 0 && method6Events.length > 0,
          apiUrl: url,
          queryBody: queryBody,
          responseStructure: {
            keys: Object.keys(data),
            hasResults: !!data.results,
            hasData: !!data.data
          },
          sampleEvents: method6Events.slice(0, 5).map(e => ({
            event: e.event || e.name || e[0]?.event || 'unknown',
            timestamp: e.timestamp || e.time || e[0]?.timestamp || 'unknown',
            isAutoCapture: (e.event || e.name || e[0]?.event || '').startsWith('$'),
            rawSample: JSON.stringify(e).substring(0, 200)
          }))
        })
      } catch (error) {
        results.tests.push({
          name: 'Method 6: PostHog Query API Properties (ERROR)',
          error: error.message,
          stack: error.stack
        })
      }
    }

    // Test 9: Fetch with fetchAllPostHogEvents (what cron uses currently)
    if (testType === 'full' || testType === 'both') {
      console.log('🧪 Test 7: Using fetchAllPostHogEvents (cron method)...')
      const start7 = Date.now()
      const { events: allFetchedEvents, apiCalls } = await fetchAllPostHogEvents(
        startTime,
        endTime,
        customEventNames
      )
      const duration7 = Date.now() - start7
      
      const fullBreakdown = {}
      allFetchedEvents.forEach(e => {
        fullBreakdown[e.event] = (fullBreakdown[e.event] || 0) + 1
      })
      
      const autoCaptureCount = allFetchedEvents.filter(e => e.event.startsWith('$')).length
      const matchingCount = allFetchedEvents.filter(e => customEventNames.includes(e.event)).length
      
      results.tests.push({
        name: 'fetchAllPostHogEvents (Current Cron Method)',
        eventNames: customEventNames,
        totalEvents: allFetchedEvents.length,
        matchingCustomEvents: matchingCount,
        autoCaptureEvents: autoCaptureCount,
        apiCalls: apiCalls,
        durationMs: duration7,
        breakdown: fullBreakdown,
        filterWorking: autoCaptureCount === 0,
        sampleEvents: allFetchedEvents.slice(0, 5).map(e => ({
          event: e.event,
          timestamp: e.timestamp,
          has_listing_id: !!e.properties?.listing_id,
          has_lister_id: !!e.properties?.lister_id,
          isAutoCapture: e.event.startsWith('$')
        }))
      })
    }

    // Calculate efficiency
    if (results.tests.length >= 2) {
      const test1 = results.tests[0]
      const test2 = results.tests[1]
      results.efficiency = {
        eventsReduction: test1.totalEvents > 0 
          ? ((test1.totalEvents - test2.totalEvents) / test1.totalEvents * 100).toFixed(2) + '%'
          : 'N/A',
        timeReduction: test1.durationMs > 0
          ? ((test1.durationMs - test2.durationMs) / test1.durationMs * 100).toFixed(2) + '%'
          : 'N/A',
        customEventsFound: test2.matchingCustomEvents || 0,
        autoCaptureAvoided: test1.autoCaptureEvents || 0
      }
    }

    return NextResponse.json({
      success: true,
      ...results
    })

  } catch (error) {
    console.error('❌ PostHog test error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
        stack: error.stack
    }, { status: 500 })
  }
}
