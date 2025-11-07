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
    case '24h': start.setDate(start.getDate() - 1); break;
    case '30d': start.setDate(start.getDate() - 30); break;
    case '90d': start.setDate(start.getDate() - 90); break;
    case '1y': start.setFullYear(start.getFullYear() - 1); break;
    case '7d':
    default: start.setDate(start.getDate() - 7); break;
  }
  return { start: start.toISOString(), end: end.toISOString() };
}

async function fetchEvents({ host, projectId, apiKey, eventName, developerId, range, maxPages = 20 }) {
  let url = `${host}/api/projects/${projectId}/events/?event=${encodeURIComponent(eventName)}&after=${encodeURIComponent(range.start)}&before=${encodeURIComponent(range.end)}&limit=200&orderBy=%5B%22-timestamp%22%5D`;
  const events = []
  let pages = 0
  while (url && pages < maxPages) {
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' } })
    if (!res.ok) break
    const data = await res.json()
    const results = Array.isArray(data.results) ? data.results : []
    for (const ev of results) {
      if (ev?.properties?.developer_id === developerId) events.push(ev)
    }
    url = data.next || null
    pages += 1
  }
  return events
}

function makeBuckets(timeRange, currentRange) {
  const start = new Date(currentRange.start)
  const end = new Date(currentRange.end)

  const labels = []

  if (timeRange === '90d' || timeRange === '1y') {
    // Weekly buckets
    const cursor = new Date(start)
    cursor.setDate(cursor.getDate() - ((cursor.getDay() + 6) % 7)) // move to Monday of the week
    while (cursor <= end) {
      const y = cursor.getUTCFullYear()
      const week = getISOWeek(cursor)
      labels.push(`${y}-W${String(week).padStart(2, '0')}`)
      cursor.setDate(cursor.getDate() + 7)
    }
    const bucketKey = (ts) => {
      const d = new Date(ts)
      const y = d.getUTCFullYear()
      const w = getISOWeek(d)
      return `${y}-W${String(w).padStart(2, '0')}`
    }
    return { labels, bucketKey }
  }

  // Daily buckets (24h, 7d, 30d)
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()))
  while (cursor <= end) {
    labels.push(formatDay(new Date(cursor)))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  const bucketKey = (ts) => formatDay(new Date(ts))
  return { labels, bucketKey }
}

function formatDay(d) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

function getISOWeek(d) {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7)
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const developerId = searchParams.get('developerId') // This should now be the actual UUID
    const timeRange = searchParams.get('timeRange') || '7d'
    const methodFilterRaw = searchParams.get('method') // e.g., 'phone', 'message', 'email', 'appointment' or comma-separated
    const methodFilter = methodFilterRaw
      ? new Set(methodFilterRaw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean))
      : null

    if (!developerId) {
      return NextResponse.json({ error: 'Developer ID is required' }, { status: 400 })
    }

    // Verify the developer exists
    const { data: developer, error: developerError } = await supabaseAdmin
      .from('developers')
      .select('id, name, slug, developer_id')
      .eq('developer_id', developerId)
      .single()

    if (developerError || !developer) {
      console.error('Error fetching developer:', developerError)
      return NextResponse.json({ error: 'Developer not found' }, { status: 404 })
    }

    // PostHog env
    const PERSONAL_API_KEY = process.env.POSTHOG_PERSONAL_API_KEY || process.env.NEXT_PUBLIC_POSTHOG_PERSONAL_API_KEY
    const PROJECT_ID = process.env.POSTHOG_PROJECT_ID || process.env.NEXT_PUBLIC_POSTHOG_PROJECT_ID
    const RAW_HOST = process.env.POSTHOG_HOST || process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'
    const HOST = normalizeHost(RAW_HOST)
    const range = getDateRange(timeRange)

    // Fetch lead events (phone, message, appointment) and impression website/social (if you still want them)
    const [phoneEvents, messageEvents, appointmentEvents, impressionEvents] = await Promise.all([
      fetchEvents({ host: HOST, projectId: PROJECT_ID, apiKey: PERSONAL_API_KEY, eventName: 'lead_phone', developerId, range }),
      fetchEvents({ host: HOST, projectId: PROJECT_ID, apiKey: PERSONAL_API_KEY, eventName: 'lead_message', developerId, range }),
      fetchEvents({ host: HOST, projectId: PROJECT_ID, apiKey: PERSONAL_API_KEY, eventName: 'lead_appointment', developerId, range }),
      fetchEvents({ host: HOST, projectId: PROJECT_ID, apiKey: PERSONAL_API_KEY, eventName: 'listing_impression', developerId, range }),
    ])

    const leadEventCounts = {
      lead_phone: phoneEvents.length,
      lead_message: messageEvents.length,
      lead_appointment: appointmentEvents.length
    }

    const totalLeads = leadEventCounts.lead_phone + leadEventCounts.lead_message + leadEventCounts.lead_appointment

    // Leads by context (profile | listing | customer_care) based on properties.context_type
    const accumulateContext = (events) => {
      return events.reduce((acc, ev) => {
        const ctx = ev?.properties?.context_type || 'unknown'
        acc[ctx] = (acc[ctx] || 0) + 1
        return acc
      }, {})
    }
    const phoneLeadsByContext = accumulateContext(phoneEvents)
    const messageLeadsByContext = accumulateContext(messageEvents)

    // Get leads by method
    const leadsByMethod = {
      phone: leadEventCounts.lead_phone || 0,
      message: leadEventCounts.lead_message || 0,
      appointment: leadEventCounts.lead_appointment || 0
    }

    // Get leads by context
    const leadsByContext = {
      'Profile': (phoneLeadsByContext.profile || 0) + (messageLeadsByContext.profile || 0),
      'Listing': (phoneLeadsByContext.listing || 0) + (messageLeadsByContext.listing || 0),
      'Customer Care': (phoneLeadsByContext.customer_care || 0) + (messageLeadsByContext.customer_care || 0)
    }

    // Get previous period for comparison
    const prevRange = getDateRange(getPreviousPeriod(timeRange))
    const [prevPhones, prevMsgs, prevAppts] = await Promise.all([
      fetchEvents({ host: HOST, projectId: PROJECT_ID, apiKey: PERSONAL_API_KEY, eventName: 'lead_phone', developerId, range: prevRange }),
      fetchEvents({ host: HOST, projectId: PROJECT_ID, apiKey: PERSONAL_API_KEY, eventName: 'lead_message', developerId, range: prevRange }),
      fetchEvents({ host: HOST, projectId: PROJECT_ID, apiKey: PERSONAL_API_KEY, eventName: 'lead_appointment', developerId, range: prevRange }),
    ])
    const previousLeadCounts = {
      lead_phone: prevPhones.length,
      lead_message: prevMsgs.length,
      lead_appointment: prevAppts.length
    }
    const previousTotalLeads = previousLeadCounts.lead_phone + previousLeadCounts.lead_message + previousLeadCounts.lead_appointment
    const leadsChange = calculateChange(totalLeads, previousTotalLeads)

    // Get recent lead activity (this would need to be implemented based on PostHog data structure)
    const recentActivity = [
      { type: 'Phone Lead', count: leadEventCounts.lead_phone || 0, change: calculateChange(leadEventCounts.lead_phone || 0, previousLeadCounts.lead_phone || 0) },
      { type: 'Message Lead', count: leadEventCounts.lead_message || 0, change: calculateChange(leadEventCounts.lead_message || 0, previousLeadCounts.lead_message || 0) },
      { type: 'Appointment Lead', count: leadEventCounts.lead_appointment || 0, change: calculateChange(leadEventCounts.lead_appointment || 0, previousLeadCounts.lead_appointment || 0) }
    ]

    // Build viewers from impressions (unique seekers who viewed any listing for this developer)
    const seekerToImpression = new Map()
    for (const ev of impressionEvents) {
      const seekerId = ev?.properties?.seeker_id
      if (!seekerId) continue
      const listingId = ev?.properties?.listing_id || null
      const ts = ev?.timestamp || ev?.properties?.timestamp
      const existing = seekerToImpression.get(seekerId) || { seeker_id: seekerId, listings: new Set(), latestSeenAt: null }
      if (listingId) existing.listings.add(listingId)
      if (!existing.latestSeenAt || (ts && new Date(ts) > new Date(existing.latestSeenAt))) {
        existing.latestSeenAt = ts
      }
      seekerToImpression.set(seekerId, existing)
    }

    // Map interaction flags per seeker from lead events
    const markInteractions = (mapRef, events, type) => {
      for (const ev of events) {
        const seekerId = ev?.properties?.seeker_id
        if (!seekerId) continue
        const entry = mapRef.get(seekerId) || { seeker_id: seekerId, listings: new Set(), latestSeenAt: null }
        if (!entry.interactions) entry.interactions = { phone: false, email: false, message: false, appointment: false }
        if (type === 'phone') entry.interactions.phone = true
        if (type === 'appointment') entry.interactions.appointment = true
        if (type === 'message') {
          const msgType = ev?.properties?.message_type
          if (msgType === 'email') entry.interactions.email = true
          else entry.interactions.message = true
        }
        mapRef.set(seekerId, entry)
      }
    }
    markInteractions(seekerToImpression, phoneEvents, 'phone')
    markInteractions(seekerToImpression, appointmentEvents, 'appointment')
    markInteractions(seekerToImpression, messageEvents, 'message')

    // Build normalized leads list for filtering on the client or server
    const mapLead = (ev, baseType) => {
      let type = baseType
      if (baseType === 'message') {
        const mt = (ev?.properties?.message_type || '').toLowerCase()
        type = mt === 'email' ? 'email' : 'message'
      }
      return {
        type, // 'phone' | 'message' | 'email' | 'appointment'
        timestamp: ev?.timestamp || ev?.properties?.timestamp || null,
        seeker_id: ev?.properties?.seeker_id || null,
        listing_id: ev?.properties?.listing_id || null,
        profile_id: ev?.properties?.profile_id || null,
        context_type: ev?.properties?.context_type || null,
        developer_id: ev?.properties?.developer_id || null
      }
    }
    let leads = [
      ...phoneEvents.map(ev => mapLead(ev, 'phone')),
      ...messageEvents.map(ev => mapLead(ev, 'message')),
      ...appointmentEvents.map(ev => mapLead(ev, 'appointment')),
    ]
    // Apply optional method filter
    if (methodFilter && methodFilter.size > 0) {
      leads = leads.filter(l => methodFilter.has(l.type))
    }

    const seekerIds = Array.from(seekerToImpression.keys())
    let seekersInfo = []
    if (seekerIds.length > 0) {
      const { data: seekers, error: seekersError } = await supabaseAdmin
        .from('property_seekers')
        .select('id, name, email, slug')
        .in('id', seekerIds)

      if (!seekersError && Array.isArray(seekers)) seekersInfo = seekers
    }

    const viewers = Array.from(seekerToImpression.values()).map(v => {
      const info = seekersInfo.find(s => s.id === v.seeker_id)
      return {
        seeker_id: v.seeker_id,
        name: info?.name || null,
        email: info?.email || null,
        slug: info?.slug || null,
        latestSeenAt: v.latestSeenAt,
        listingsViewed: Array.from(v.listings),
        interactions: v.interactions || { phone: false, email: false, message: false, appointment: false }
      }
    }).sort((a, b) => new Date(b.latestSeenAt || 0) - new Date(a.latestSeenAt || 0))

    // Build per-type and total time-series
    const { labels, bucketKey } = makeBuckets(timeRange, range)
    const initSeries = () => Object.fromEntries(labels.map(l => [l, 0]))
    const add = (acc, events) => {
      for (const ev of events) {
        const key = bucketKey(ev?.timestamp || ev?.properties?.timestamp)
        if (key in acc) acc[key] += 1
      }
    }
    const phoneSeriesMap = initSeries()
    const messageSeriesMap = initSeries()
    const emailSeriesMap = initSeries()
    const appointmentSeriesMap = initSeries()

    // Split message vs email based on message_type
    const messagesIsEmail = messageEvents.filter(ev => (ev?.properties?.message_type || '').toLowerCase() === 'email')
    const messagesOther = messageEvents.filter(ev => (ev?.properties?.message_type || '').toLowerCase() !== 'email')

    add(phoneSeriesMap, phoneEvents)
    add(appointmentSeriesMap, appointmentEvents)
    add(emailSeriesMap, messagesIsEmail)
    add(messageSeriesMap, messagesOther)

    const totalsMap = initSeries()
    labels.forEach(l => {
      totalsMap[l] = (phoneSeriesMap[l] || 0) + (messageSeriesMap[l] || 0) + (emailSeriesMap[l] || 0) + (appointmentSeriesMap[l] || 0)
    })

    const leadsSeries = {
      labels,
      totals: labels.map(l => totalsMap[l] || 0),
      phone: labels.map(l => phoneSeriesMap[l] || 0),
      message: labels.map(l => messageSeriesMap[l] || 0),
      email: labels.map(l => emailSeriesMap[l] || 0),
      appointment: labels.map(l => appointmentSeriesMap[l] || 0)
    }

    // Compute per-type share percentages (of total leads)
    const shareDenominator = totalLeads || 1
    const leadShares = {
      phone: parseFloat(((leadEventCounts.lead_phone || 0) * 100 / shareDenominator).toFixed(1)),
      message: parseFloat(((messageEvents.filter(ev => (ev?.properties?.message_type || '').toLowerCase() !== 'email').length) * 100 / shareDenominator).toFixed(1)),
      email: parseFloat(((messageEvents.filter(ev => (ev?.properties?.message_type || '').toLowerCase() === 'email').length) * 100 / shareDenominator).toFixed(1)),
      appointment: parseFloat(((leadEventCounts.lead_appointment || 0) * 100 / shareDenominator).toFixed(1)),
    }

    const analyticsData = {
      overview: {
        totalLeads,
        uniqueLeads: totalLeads, // This would need to be calculated based on unique users
        leadsChange: parseFloat(leadsChange),
        conversionRate: 0 // This would need to be calculated based on views vs leads
      },
      leadsByMethod,
      leadsByContext,
      recentActivity,
      leadsSeries,
      leadShares,
      leads,
      viewers,
      timeRange,
      developerId
    }

    return NextResponse.json(analyticsData)
  } catch (error) {
    console.error('Error fetching leads analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch leads analytics' }, { status: 500 })
  }
}

function getPreviousPeriod(timeRange) {
  switch (timeRange) {
    case '24h':
      return '24h'
    case '7d':
      return '7d'
    case '30d':
      return '30d'
    case '90d':
      return '90d'
    default:
      return '7d'
  }
}

function calculateChange(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous * 100).toFixed(1)
}