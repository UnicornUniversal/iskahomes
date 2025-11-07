import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function normalizeHost(rawHost) {
  if (!rawHost) return null;
  let host = String(rawHost).trim();
  if (!host.startsWith('http://') && !host.startsWith('https://')) {
    host = `https://${host}`;
  }
  while (host.endsWith('.')) host = host.slice(0, -1);
  while (host.endsWith('/')) host = host.slice(0, -1);
  try {
    const url = new URL(host);
    if (!url.hostname.includes('posthog')) return null;
    return `${url.protocol}//${url.hostname}`;
  } catch {
    return null;
  }
}

function getDateRange(timeRange) {
  const end = new Date();
  const start = new Date();
  switch (timeRange) {
    case '24h':
      start.setDate(start.getDate() - 1); break;
    case '30d':
      start.setDate(start.getDate() - 30); break;
    case '90d':
      start.setDate(start.getDate() - 90); break;
    case '7d':
    default:
      start.setDate(start.getDate() - 7); break;
  }
  return { start: start.toISOString(), end: end.toISOString(), windowMs: (end - start) };
}

function getPreviousRange(range) {
  const end = new Date(range.start);
  const start = new Date(end.getTime() - range.windowMs);
  return { start: start.toISOString(), end: end.toISOString(), windowMs: range.windowMs };
}

async function fetchEventsCount({ host, projectId, apiKey, eventName, developerId, range, maxPages = 10 }) {
  let url = `${host}/api/projects/${projectId}/events/?event=${encodeURIComponent(eventName)}&after=${encodeURIComponent(range.start)}&before=${encodeURIComponent(range.end)}&limit=200&orderBy=%5B%22-timestamp%22%5D`;
  let total = 0; let pages = 0;
  while (url && pages < maxPages) {
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' } });
    if (!res.ok) break;
    const data = await res.json();
    const results = Array.isArray(data.results) ? data.results : [];
    for (const ev of results) {
      if (ev?.properties?.developer_id === developerId) total += 1;
    }
    url = data.next || null;
    pages += 1;
  }
  return total;
}

async function fetchEventsGroupedByListing({ host, projectId, apiKey, developerId, range, maxPages = 10 }) {
  let url = `${host}/api/projects/${projectId}/events/?event=${encodeURIComponent('property_view')}&after=${encodeURIComponent(range.start)}&before=${encodeURIComponent(range.end)}&limit=200&orderBy=%5B%22-timestamp%22%5D`;
  const listingToCount = {};
  let pages = 0;
  while (url && pages < maxPages) {
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' } });
    if (!res.ok) break;
    const data = await res.json();
    const results = Array.isArray(data.results) ? data.results : [];
    for (const ev of results) {
      if (ev?.properties?.developer_id === developerId) {
        const listingId = ev?.properties?.listing_id || 'unknown';
        listingToCount[listingId] = (listingToCount[listingId] || 0) + 1;
      }
    }
    url = data.next || null;
    pages += 1;
  }
  return listingToCount;
}

function makeBuckets(timeRange, currentRange) {
  // Returns { labels: string[], bucketKey(date: Date): string }
  if (timeRange === '24h') {
    // hourly buckets
    const labels = []
    const start = new Date(currentRange.start)
    const end = new Date(currentRange.end)
    const cursor = new Date(start)
    while (cursor <= end) {
      labels.push(`${cursor.getHours()}:00`)
      cursor.setHours(cursor.getHours() + 1)
    }
    const bucketKey = (d) => `${d.getHours()}:00`
    return { labels, bucketKey }
  }
  if (timeRange === '90d') {
    // weekly buckets (ISO week)
    const labels = []
    const start = new Date(currentRange.start)
    const end = new Date(currentRange.end)
    const cursor = new Date(start)
    // move to start of week (Mon)
    cursor.setDate(cursor.getDate() - ((cursor.getDay() + 6) % 7))
    while (cursor <= end) {
      const label = `W${getISOWeek(cursor)}`
      if (!labels.includes(label)) labels.push(label)
      cursor.setDate(cursor.getDate() + 7)
    }
    const bucketKey = (d) => `W${getISOWeek(d)}`
    return { labels, bucketKey }
  }
  // default: daily buckets for 7d/30d
  const labels = []
  const start = new Date(currentRange.start)
  const end = new Date(currentRange.end)
  const cursor = new Date(start)
  while (cursor <= end) {
    labels.push(formatDay(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  const bucketKey = (d) => formatDay(d)
  return { labels, bucketKey }
}

function formatDay(d) {
  const mm = `${d.getMonth() + 1}`.padStart(2, '0')
  const dd = `${d.getDate()}`.padStart(2, '0')
  return `${mm}/${dd}`
}

function getISOWeek(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7)
}

async function fetchEventsForFamilies({ host, projectId, apiKey, eventNames, developerId, range, maxPages = 20 }) {
  // Returns array of timestamps (Date) for matched events
  const timestamps = []
  for (const eventName of eventNames) {
    let url = `${host}/api/projects/${projectId}/events/?event=${encodeURIComponent(eventName)}&after=${encodeURIComponent(range.start)}&before=${encodeURIComponent(range.end)}&limit=200&orderBy=%5B%22-timestamp%22%5D`
    let pages = 0
    while (url && pages < maxPages) {
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' } })
      if (!res.ok) break
      const data = await res.json()
      const results = Array.isArray(data.results) ? data.results : []
      for (const ev of results) {
        if (ev?.properties?.developer_id === developerId) {
          const ts = new Date(ev.timestamp || ev.properties?.timestamp || ev.properties?.$time * 1000)
          if (!isNaN(ts)) timestamps.push(ts)
        }
      }
      url = data.next || null
      pages += 1
    }
  }
  return timestamps
}

// Simple in-memory cache (per server instance)
const overviewCache = new Map() // key -> { value, expires }
const DEFAULT_TTL_MS = 120_000 // 120s

function makeCacheKey(developerId, timeRange) {
  return `${developerId}:${timeRange}`
}

function getFromCache(key) {
  const entry = overviewCache.get(key)
  if (!entry) return null
  if (entry.expires > Date.now()) return entry.value
  overviewCache.delete(key)
  return null
}

function setInCache(key, value, ttlMs = DEFAULT_TTL_MS) {
  overviewCache.set(key, { value, expires: Date.now() + ttlMs })
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const developerId = searchParams.get('developerId')
    const timeRange = searchParams.get('timeRange') || '7d'

    // Serve from cache when available
    const cacheKey = makeCacheKey(developerId || 'none', timeRange)
    const cached = getFromCache(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    if (!developerId) {
      return NextResponse.json({ error: 'Developer ID is required' }, { status: 400 })
    }

    // Verify developer exists
    const { data: developer, error: developerError } = await supabaseAdmin
      .from('developers')
      .select('developer_id')
      .eq('developer_id', developerId)
      .single()

    if (developerError || !developer) {
      return NextResponse.json({ error: 'Developer not found' }, { status: 404 })
    }

    // Read PostHog env locally (same as test route)
    const PERSONAL_API_KEY = process.env.POSTHOG_PERSONAL_API_KEY || process.env.NEXT_PUBLIC_POSTHOG_PERSONAL_API_KEY
    const PROJECT_ID = process.env.POSTHOG_PROJECT_ID || process.env.NEXT_PUBLIC_POSTHOG_PROJECT_ID
    const RAW_HOST = process.env.POSTHOG_HOST || process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'
    const HOST = normalizeHost(RAW_HOST)

    const configured = !!(PERSONAL_API_KEY && PROJECT_ID && HOST)
    if (!configured) {
      console.error('PostHog not configured for overview route', { PERSONAL_API_KEY: !!PERSONAL_API_KEY, PROJECT_ID, RAW_HOST, HOST })
    }

    // Define event names
    const viewEvents = ['profile_view', 'property_view', 'development_view']
    const leadEvents = ['lead_phone', 'lead_message', 'lead_appointment']
    const impressionEvents = ['impression_share', 'impression_saved_listing', 'impression_website_visit', 'impression_social_media']

    // Build ranges
    const currentRange = getDateRange(timeRange)
    const prevRange = getPreviousRange(currentRange)

    // Fetch counts via Events API (sum across event families)
    let totalViews = 0
    let totalLeads = 0
    let totalImpressions = 0
    if (configured) {
      const [viewsCountsArr, leadsCountsArr, impressionsCountsArr] = await Promise.all([
        Promise.all(viewEvents.map(e => fetchEventsCount({ host: HOST, projectId: PROJECT_ID, apiKey: PERSONAL_API_KEY, eventName: e, developerId, range: currentRange }))),
        Promise.all(leadEvents.map(e => fetchEventsCount({ host: HOST, projectId: PROJECT_ID, apiKey: PERSONAL_API_KEY, eventName: e, developerId, range: currentRange }))),
        Promise.all(impressionEvents.map(e => fetchEventsCount({ host: HOST, projectId: PROJECT_ID, apiKey: PERSONAL_API_KEY, eventName: e, developerId, range: currentRange })))
      ])
      totalViews = viewsCountsArr.reduce((a, b) => a + b, 0)
      totalLeads = leadsCountsArr.reduce((a, b) => a + b, 0)
      totalImpressions = impressionsCountsArr.reduce((a, b) => a + b, 0)
    }

    const conversionRate = totalViews > 0 ? (totalLeads / totalViews) * 100 : 0

    // Previous period
    let prevTotalViews = 0
    let prevTotalLeads = 0
    let prevTotalImpressions = 0
    if (configured) {
      const [viewsCountsPrevArr, leadsCountsPrevArr, impressionsCountsPrevArr] = await Promise.all([
        Promise.all(viewEvents.map(e => fetchEventsCount({ host: HOST, projectId: PROJECT_ID, apiKey: PERSONAL_API_KEY, eventName: e, developerId, range: prevRange }))),
        Promise.all(leadEvents.map(e => fetchEventsCount({ host: HOST, projectId: PROJECT_ID, apiKey: PERSONAL_API_KEY, eventName: e, developerId, range: prevRange }))),
        Promise.all(impressionEvents.map(e => fetchEventsCount({ host: HOST, projectId: PROJECT_ID, apiKey: PERSONAL_API_KEY, eventName: e, developerId, range: prevRange })))
      ])
      prevTotalViews = viewsCountsPrevArr.reduce((a, b) => a + b, 0)
      prevTotalLeads = leadsCountsPrevArr.reduce((a, b) => a + b, 0)
      prevTotalImpressions = impressionsCountsPrevArr.reduce((a, b) => a + b, 0)
    }

    // Calculate changes
    const viewsChange = calculateChange(totalViews, prevTotalViews)
    const leadsChange = calculateChange(totalLeads, prevTotalLeads)
    const impressionsChange = calculateChange(totalImpressions, prevTotalImpressions)

    // Top properties by views (PostHog ranking + enrich with listing title/status)
    let topProperties = []
    if (configured) {
      const listingCounts = await fetchEventsGroupedByListing({ host: HOST, projectId: PROJECT_ID, apiKey: PERSONAL_API_KEY, developerId, range: currentRange })
      const ranked = Object.entries(listingCounts)
        .map(([listingId, views]) => ({ listingId, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 5)

      const topIds = ranked.map(r => r.listingId).filter(Boolean)
      if (topIds.length > 0) {
        const { data: listingsData, error: listingsError } = await supabaseAdmin
          .from('listings')
          .select('id, title, listing_status, slug, listing_type, media')
          .in('id', topIds)
        if (listingsError) {
          console.error('Error fetching listing details for top properties:', listingsError)
        }
        const idToListing = Object.fromEntries((listingsData || []).map(l => [l.id, l]))
        topProperties = ranked.map(r => ({
          listingId: r.listingId,
          views: r.views,
          name: idToListing[r.listingId]?.title || 'Property',
          status: idToListing[r.listingId]?.listing_status || undefined,
          slug: idToListing[r.listingId]?.slug || undefined,
          listing_type: idToListing[r.listingId]?.listing_type || undefined,
          imageUrl: Array.isArray(idToListing[r.listingId]?.media?.mediaFiles) && idToListing[r.listingId]?.media?.mediaFiles[0]?.url
            ? idToListing[r.listingId]?.media?.mediaFiles[0]?.url
            : undefined
        }))
      } else {
        topProperties = ranked
      }
    }

    // Get recent activity
    const recentActivity = []

    // Build performance series (views vs leads)
    let performance = { labels: [], views: [], leads: [] }
    if (configured) {
      const [viewTimestamps, leadTimestamps] = await Promise.all([
        fetchEventsForFamilies({ host: HOST, projectId: PROJECT_ID, apiKey: PERSONAL_API_KEY, eventNames: viewEvents, developerId, range: currentRange }),
        fetchEventsForFamilies({ host: HOST, projectId: PROJECT_ID, apiKey: PERSONAL_API_KEY, eventNames: leadEvents, developerId, range: currentRange })
      ])
      const { labels, bucketKey } = makeBuckets(timeRange, currentRange)
      const viewsByBucket = Object.fromEntries(labels.map(l => [l, 0]))
      const leadsByBucket = Object.fromEntries(labels.map(l => [l, 0]))
      viewTimestamps.forEach(ts => { const key = bucketKey(ts); if (key in viewsByBucket) viewsByBucket[key]++ })
      leadTimestamps.forEach(ts => { const key = bucketKey(ts); if (key in leadsByBucket) leadsByBucket[key]++ })
      performance = {
        labels,
        views: labels.map(l => viewsByBucket[l] || 0),
        leads: labels.map(l => leadsByBucket[l] || 0)
      }
    }

    const analyticsData = {
      overview: {
        totalViews,
        totalLeads,
        totalImpressions,
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        viewsChange,
        leadsChange,
        impressionsChange,
        conversionChange: 0 // Could be calculated if needed
      },
      // properties widget removed; developer totals can be read from developers table if needed later
      topProperties,
      performance,
      recentActivity,
      timeRange,
      developerId
    }

    // Cache the assembled response to avoid recomputation on every request
    setInCache(cacheKey, analyticsData)

    return NextResponse.json(analyticsData)

  } catch (error) {
    console.error('Analytics overview error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getPreviousPeriod(timeRange) {
  switch (timeRange) {
    case '24h':
      return '24h' // Previous 24 hours
    case '7d':
      return '7d' // Previous 7 days
    case '30d':
      return '30d' // Previous 30 days
    case '90d':
      return '90d' // Previous 90 days
    default:
      return '7d'
  }
}

function calculateChange(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0
  return parseFloat(((current - previous) / previous * 100).toFixed(1))
}