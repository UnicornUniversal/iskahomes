import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiPermissionMiddleware'
import { POSTHOG_PERSONAL_API_KEY, POSTHOG_PROJECT_ID, POSTHOG_HOST } from '@/lib/posthog'
import { supabaseAdmin } from '@/lib/supabase'

const AUDIT_EVENT_NAMES = [
  'auth_signup', 'auth_signin', 'auth_signout', 'auth_email_verified', 'auth_password_reset',
  'auth_password_changed', 'auth_password_reset_requested', 'auth_admin_created',
  'agent_invitation_sent', 'agent_invitation_accepted', 'team_invitation_sent', 'team_invitation_accepted',
  'developer_profile_updated', 'agency_profile_updated', 'agent_profile_updated', 'seeker_profile_updated',
  'listing_updated', 'listing_deleted', 'development_created', 'lead_created',
  'saved_listing_added', 'saved_listing_removed', 'team_member_updated', 'team_member_removed',
  'agent_updated', 'message_sent', 'conversation_created', 'subscription_created',
  'lead_listed', 'lead_viewed', 'lead_updated',
  'appointment_created', 'appointment_listed', 'appointment_updated', 'appointment_latest_viewed',
  'reminder_listed', 'reminder_created', 'reminder_updated', 'reminder_deleted',
  'subscription_cancelled', 'subscription_history_viewed', 'invoice_listed',
  'billing_viewed', 'billing_created', 'billing_updated',
  'conversation_viewed', 'conversation_marked_read',
  'analytics_viewed', 'development_stats_viewed',
  'listing_by_user_listed', 'listing_listed', 'listing_created',
  'subscription_listed',
  'message_listed', 'conversation_listed', 'team_listed',
  'unit_listed', 'unit_viewed', 'unit_updated', 'unit_deleted',
  'client_listed', 'client_created', 'client_viewed', 'client_updated', 'client_deleted',
  'transaction_record_listed', 'transaction_record_created', 'transaction_record_viewed', 'transaction_record_updated', 'transaction_record_deleted',
  'subscription_request_listed', 'subscription_request_created', 'subscription_request_updated',
  'search_performed', 'development_searched',
  'upload_completed',
  'listing_step_saved',
  'development_viewed', 'development_updated', 'development_deleted',
  'subscription_request_viewed',
  'client_assignment_listed', 'client_assignment_created', 'client_assignment_updated', 'client_assignment_removed',
  'client_document_listed', 'client_document_uploaded', 'client_document_removed',
  'service_charge_listed', 'service_charge_created', 'service_charge_updated', 'service_charge_deleted',
  'transaction_listed', 'transaction_created', 'transaction_updated', 'transaction_deleted',
  'developer_profile_viewed', 'developer_analytics_viewed', 'developer_public_profile_viewed', 'developer_team_listed',
  'listing_viewed', 'listing_resume_checked',
  'development_listed',
  'message_viewed', 'reminder_viewed',
  'sales_viewed',
  'agency_profile_viewed', 'agency_agents_listed', 'agency_agent_invitation_sent', 'agency_agent_invitation_accepted',
  'agency_agent_viewed', 'agency_agent_updated', 'agency_agent_removed',
  'agency_listings_listed',
  'agent_profile_viewed',
  'user_listings_listed',
  'unit_created'
]

function isPostHogConfigured() {
  return !!(POSTHOG_PERSONAL_API_KEY && POSTHOG_PROJECT_ID && POSTHOG_HOST)
}

/** Get all org member IDs (distinct_id used when capturing audit events) */
async function getOrgMemberIds(userInfo) {
  const orgType = userInfo.organization_type || userInfo.user_type
  const isDeveloper = orgType === 'developer'
  const isAgency = orgType === 'agency'
  const ids = new Set()

  if (isDeveloper) {
    let developerId = userInfo.developer_id || userInfo.user_id
    if (!developerId && userInfo.organization_id) {
      const { data: dev } = await supabaseAdmin
        .from('developers')
        .select('developer_id')
        .eq('id', userInfo.organization_id)
        .single()
      developerId = dev?.developer_id
    }
    if (developerId) ids.add(developerId)
    const { data: teamMembers } = await supabaseAdmin
      .from('organization_team_members')
      .select('user_id')
      .eq('organization_type', 'developer')
      .eq('organization_id', userInfo.organization_id)
      .eq('status', 'active')
    ;(teamMembers || []).forEach(m => { if (m.user_id) ids.add(m.user_id) })
  }

  if (isAgency) {
    let agencyId = userInfo.agency_id || userInfo.user_id
    if (!agencyId && userInfo.organization_id) {
      const { data: ag } = await supabaseAdmin
        .from('agencies')
        .select('agency_id')
        .eq('id', userInfo.organization_id)
        .single()
      agencyId = ag?.agency_id
    }
    if (agencyId) ids.add(agencyId)
    const { data: agents } = await supabaseAdmin
      .from('agents')
      .select('agent_id')
      .eq('agency_id', agencyId)
      .eq('account_status', 'active')
    ;(agents || []).forEach(a => { if (a.agent_id) ids.add(a.agent_id) })
    const { data: teamMembers } = await supabaseAdmin
      .from('organization_team_members')
      .select('user_id')
      .eq('organization_type', 'agency')
      .eq('organization_id', userInfo.organization_id)
      .eq('status', 'active')
    ;(teamMembers || []).forEach(m => { if (m.user_id) ids.add(m.user_id) })
  }

  return Array.from(ids)
}

function parseProperties(props) {
  if (!props) return {}
  if (typeof props === 'object' && !Array.isArray(props)) return props
  if (typeof props === 'string') {
    try { return JSON.parse(props) } catch { return {} }
  }
  return {}
}

function formatDateForExport(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }).replace(/\s/g, '-')
}

function formatTimeForExport(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
}

function escapeCsv(value) {
  const str = String(value ?? '')
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function getExportUsername(event) {
  const username =
    event?.properties?.user_name ||
    event?.properties?.username ||
    event?.properties?.name ||
    event?.metadata?.user_name ||
    event?.metadata?.username ||
    ''
  if (username) return username
  return event?.user_id || event?.distinct_id || ''
}

function buildCsv(events) {
  const header = ['date', 'time', 'event', 'user_id', 'username', 'user_type', 'listing_id', 'context_type']
  const lines = [header.join(',')]
  for (const e of events) {
    const row = [
      formatDateForExport(e.timestamp),
      formatTimeForExport(e.timestamp),
      e.event || '',
      e.user_id || e.distinct_id || '',
      getExportUsername(e),
      e.user_type || '',
      e.metadata?.listing_id || e.properties?.listing_id || '',
      e.properties?.context_type || ''
    ].map(escapeCsv)
    lines.push(row.join(','))
  }
  return lines.join('\n')
}

function buildExcelTsv(events) {
  const header = ['Date', 'Time', 'Event', 'User ID', 'Username', 'User Type', 'Listing ID', 'Context Type']
  const lines = [header.join('\t')]
  for (const e of events) {
    const row = [
      formatDateForExport(e.timestamp),
      formatTimeForExport(e.timestamp),
      e.event || '',
      e.user_id || e.distinct_id || '',
      getExportUsername(e),
      e.user_type || '',
      e.metadata?.listing_id || e.properties?.listing_id || '',
      e.properties?.context_type || ''
    ].map(v => String(v ?? '').replace(/\t/g, ' '))
    lines.push(row.join('\t'))
  }
  return lines.join('\n')
}

function createSimplePdf(lines) {
  const escapePdf = (s) => String(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
  const contentLines = ['BT', '/F1 10 Tf', '50 790 Td']
  const maxLines = 65
  for (let i = 0; i < Math.min(lines.length, maxLines); i += 1) {
    const line = escapePdf(lines[i])
    if (i === 0) contentLines.push(`(${line}) Tj`)
    else contentLines.push(`T* (${line}) Tj`)
  }
  contentLines.push('ET')
  const stream = contentLines.join('\n')
  const streamBytes = Buffer.byteLength(stream, 'utf8')

  const objs = []
  objs.push('1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj')
  objs.push('2 0 obj << /Type /Pages /Count 1 /Kids [3 0 R] >> endobj')
  objs.push('3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj')
  objs.push('4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj')
  objs.push(`5 0 obj << /Length ${streamBytes} >> stream\n${stream}\nendstream endobj`)

  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  for (const obj of objs) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'))
    pdf += `${obj}\n`
  }
  const xrefPos = Buffer.byteLength(pdf, 'utf8')
  pdf += `xref\n0 ${objs.length + 1}\n`
  pdf += '0000000000 65535 f \n'
  for (let i = 1; i <= objs.length; i += 1) {
    const off = String(offsets[i]).padStart(10, '0')
    pdf += `${off} 00000 n \n`
  }
  pdf += `trailer << /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`
  return Buffer.from(pdf, 'utf8')
}

/** Parse PostHog Query API response - handles tuple, object, and column-mapped formats */
function parseEventRow(row, columns) {
  const starIndex = columns?.indexOf('*')
  if (starIndex !== -1 && Array.isArray(row[starIndex])) {
    const tuple = row[starIndex]
    const props = parseProperties(tuple[2]) || {}
    return {
      uuid: tuple[0],
      event: tuple[1] || '',
      properties: props,
      timestamp: tuple[3] || new Date().toISOString(),
      distinct_id: tuple[5] || props.user_id || 'anonymous',
      user_id: props.user_id || tuple[5],
      user_type: props.user_type || '',
      api_route: props.api_route || '',
      metadata: props.metadata || {}
    }
  }
  if (starIndex !== -1 && row[starIndex] && typeof row[starIndex] === 'object' && !Array.isArray(row[starIndex])) {
    const o = row[starIndex]
    const props = parseProperties(o.properties) || {}
    return {
      uuid: o.uuid,
      event: o.event || '',
      properties: props,
      timestamp: o.timestamp || new Date().toISOString(),
      distinct_id: o.distinct_id || props.user_id || 'anonymous',
      user_id: props.user_id || o.distinct_id,
      user_type: props.user_type || '',
      api_route: props.api_route || '',
      metadata: props.metadata || {}
    }
  }
  const eventObj = {}
  columns?.forEach((col, i) => {
    if (col === 'properties') eventObj[col] = parseProperties(row[i])
    else eventObj[col] = row[i]
  })
  const props = eventObj.properties || {}
  return {
    uuid: eventObj.uuid,
    event: eventObj.event || '',
    properties: props,
    timestamp: eventObj.timestamp || new Date().toISOString(),
    distinct_id: eventObj.distinct_id || props.user_id || 'anonymous',
    user_id: props.user_id || eventObj.distinct_id,
    user_type: props.user_type || '',
    api_route: props.api_route || '',
    metadata: props.metadata || {}
  }
}

export async function GET(request) {
  try {
    const { userInfo, error: authError, status } = await authenticateRequest(request)
    if (authError) {
      return NextResponse.json({ error: authError }, { status })
    }

    const orgType = userInfo.organization_type || userInfo.user_type
    const isDeveloper = orgType === 'developer'
    const isAgency = orgType === 'agency'
    const isTeamMember = userInfo.user_type === 'team_member'
    if (!isDeveloper && !isAgency && !isTeamMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (!isPostHogConfigured()) {
      return NextResponse.json({ events: [], message: 'Analytics not configured' })
    }

    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''
    const eventType = (searchParams.get('eventType') || '').trim()
    const page = Math.max(parseInt(searchParams.get('page') || '0', 10), 0)
    const pageSize = Math.max(parseInt(searchParams.get('page_size') || '15', 10), 1)
    let filterUserId = (searchParams.get('userId') || '').trim()
    if (filterUserId && !/^[a-zA-Z0-9_-]+$/.test(filterUserId)) filterUserId = ''

    const now = new Date()
    // Default 3 days - smaller range = faster PostHog query (Query API can be slow)
    const startTime = dateFrom ? new Date(dateFrom + 'T00:00:00') : new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
    const endTime = dateTo ? new Date(dateTo + 'T23:59:59') : new Date(now.getTime() + 24 * 60 * 60 * 1000)

    const orgMemberIds = await getOrgMemberIds(userInfo)
    if (orgMemberIds.length === 0) {
      return NextResponse.json({ events: [], success: true })
    }

    const idsToQuery = filterUserId ? (orgMemberIds.includes(filterUserId) ? [filterUserId] : []) : orgMemberIds
    if (idsToQuery.length === 0) {
      return NextResponse.json({ events: [], success: true })
    }

    const safeIds = idsToQuery.map(id => `'${String(id).replace(/'/g, "\\'")}'`).join(', ')
    // Keep where clause simple - properties.$lib filter can cause PostHog 500 errors
    const whereClauses = [
      "event NOT LIKE '$%'",
      `event IN (${AUDIT_EVENT_NAMES.map(e => `'${e}'`).join(', ')})`,
      `distinct_id IN (${safeIds})`
    ]
    if (eventType && AUDIT_EVENT_NAMES.includes(eventType)) {
      whereClauses.push(`event = '${eventType.replace(/'/g, "\\'")}'`)
    }

    const exportFormat = (searchParams.get('export') || '').toLowerCase()
    const queryBody = {
      kind: 'EventsQuery',
      select: ['*'],
      orderBy: ['timestamp DESC'],
      after: startTime.toISOString(),
      before: endTime.toISOString(),
      // Non-export mode: fetch one extra row to detect has_more
      limit: exportFormat ? 5000 : (pageSize + 1),
      offset: exportFormat ? 0 : (page * pageSize),
      where: whereClauses
    }

    const url = `${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/query/`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

    let response
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${POSTHOG_PERSONAL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: queryBody }),
        signal: controller.signal
      })
    } catch (fetchErr) {
      clearTimeout(timeoutId)
      if (fetchErr?.name === 'AbortError') {
        console.error('PostHog audit fetch timeout after 10s')
        return NextResponse.json({ events: [], error: 'Request timed out' }, { status: 504 })
      }
      throw fetchErr
    }
    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('PostHog audit fetch error:', response.status, errorText)
      // Return empty events instead of 500 - UI can still load
      return NextResponse.json({ events: [], success: true, message: 'Analytics temporarily unavailable' })
    }

    const data = await response.json()
    if (data.error) {
      console.error('PostHog query error:', data.error)
      return NextResponse.json({ events: [], success: true, message: 'Analytics temporarily unavailable' })
    }

    const columns = data.columns || []
    const rawResults = Array.isArray(data.results) ? data.results : []
    const events = rawResults
      .map(row => parseEventRow(row, columns))
      .filter(e => e.event) // Exclude malformed/empty events
    const availableEventTypes = Array.from(new Set(events.map(e => e.event).filter(Boolean)))

    if (exportFormat) {
      const filenameSuffix = `${new Date().toISOString().slice(0, 10)}`
      if (exportFormat === 'csv') {
        const csv = buildCsv(events)
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="audit-trail-${filenameSuffix}.csv"`
          }
        })
      }
      if (exportFormat === 'excel' || exportFormat === 'xlsx') {
        const tsv = buildExcelTsv(events)
        return new NextResponse(tsv, {
          headers: {
            'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
            'Content-Disposition': `attachment; filename="audit-trail-${filenameSuffix}.xls"`
          }
        })
      }
      if (exportFormat === 'pdf') {
        const lines = [
          'Audit Trail Export',
          `Generated: ${new Date().toISOString()}`,
          '',
          ...events.map(
            e =>
              `${formatDateForExport(e.timestamp)} ${formatTimeForExport(e.timestamp)} | ${e.event} | ${e.user_id || e.distinct_id || ''} | ${getExportUsername(e)} | ${e.user_type || ''}`
          )
        ]
        const pdfBuffer = createSimplePdf(lines)
        return new NextResponse(pdfBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="audit-trail-${filenameSuffix}.pdf"`
          }
        })
      }
    }

    const hasMore = !exportFormat && events.length > pageSize
    const pagedEvents = !exportFormat ? events.slice(0, pageSize) : events
    return NextResponse.json({
      events: pagedEvents,
      available_event_types: availableEventTypes,
      pagination: {
        page,
        page_size: pageSize,
        has_more: hasMore
      },
      success: true
    })
  } catch (error) {
    console.error('Audit events API error:', error)
    return NextResponse.json({ events: [], error: error.message }, { status: 500 })
  }
}
