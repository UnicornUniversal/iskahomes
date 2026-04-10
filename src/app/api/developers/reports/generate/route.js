import { NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { supabaseAdmin } from '@/lib/supabase'
import { authenticateRequest } from '@/lib/apiPermissionMiddleware'
import { getDeveloperId } from '@/lib/developerIdHelper'

const SECTION_LABELS = {
  leads: 'Leads',
  clients: 'Clients',
  sales: 'Sales',
  service_charges: 'Service Charges',
  appointments: 'Appointments',
  engagements: 'Engagements',
  team: 'Employees / Team'
}

function safeString(value, fallback = 'N/A') {
  if (value === null || value === undefined) return fallback
  const text = String(value).trim()
  return text || fallback
}

function parseImageUrl(value) {
  if (!value) return null
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null
    if (trimmed.startsWith('http')) return trimmed
    try {
      const parsed = JSON.parse(trimmed)
      return parsed?.url || null
    } catch {
      return null
    }
  }
  if (typeof value === 'object') return value?.url || null
  return null
}

function toDateOnly(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString().slice(0, 10)
}

function rangeToDateTime(dateFrom, dateTo) {
  return {
    start: `${dateFrom}T00:00:00.000Z`,
    end: `${dateTo}T23:59:59.999Z`
  }
}

async function loadReportData({ developerId, organizationId, dateFrom, dateTo, sections }) {
  const result = {}
  const { start, end } = rangeToDateTime(dateFrom, dateTo)

  if (sections.includes('leads')) {
    const { count } = await supabaseAdmin
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('lister_id', developerId)
      .eq('lister_type', 'developer')
      .gte('first_action_date', start)
      .lte('first_action_date', end)
    result.leads = { total: count || 0 }
  }

  if (sections.includes('clients') || sections.includes('service_charges')) {
    const { data: clients } = await supabaseAdmin
      .from('clients')
      .select('id, created_at')
      .eq('developer_id', developerId)
    const filteredClients = (clients || []).filter((c) => {
      const d = toDateOnly(c.created_at)
      return d && d >= dateFrom && d <= dateTo
    })
    result.clients = { total: filteredClients.length, ids: (clients || []).map((c) => c.id) }
  }

  if (sections.includes('sales')) {
    const { data: sales } = await supabaseAdmin
      .from('sales_listings')
      .select('id, sale_price, currency, sale_date, created_at')
      .eq('user_id', developerId)
      .gte('sale_date', dateFrom)
      .lte('sale_date', dateTo)

    const rows = sales || []
    const totalValue = rows.reduce((sum, row) => sum + (Number(row.sale_price) || 0), 0)
    const currency = rows[0]?.currency || 'GHS'
    result.sales = { total: rows.length, totalValue, currency }
  }

  if (sections.includes('service_charges')) {
    const clientIds = result.clients?.ids || []
    if (clientIds.length) {
      const { data: charges } = await supabaseAdmin
        .from('client_service_charges')
        .select('id, amount, next_due_status, next_due_date, paid_at, created_at')
        .in('client_id', clientIds)
        .gte('created_at', start)
        .lte('created_at', end)
      const rows = charges || []
      result.service_charges = {
        totalRecords: rows.length,
        totalAmount: rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0),
        paid: rows.filter((r) => String(r.next_due_status || '').toLowerCase() === 'paid').length,
        overdue: rows.filter((r) => String(r.next_due_status || '').toLowerCase() === 'overdue').length
      }
    } else {
      result.service_charges = { totalRecords: 0, totalAmount: 0, paid: 0, overdue: 0 }
    }
  }

  if (sections.includes('appointments')) {
    const { count } = await supabaseAdmin
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('account_type', 'developer')
      .eq('account_id', developerId)
      .gte('appointment_date', dateFrom)
      .lte('appointment_date', dateTo)
    result.appointments = { total: count || 0 }
  }

  if (sections.includes('engagements')) {
    const { data: analyticsRows } = await supabaseAdmin
      .from('user_analytics')
      .select('profile_views, total_impressions_received, date')
      .eq('user_id', developerId)
      .eq('user_type', 'developer')
      .gte('date', dateFrom)
      .lte('date', dateTo)
    const rows = analyticsRows || []
    result.engagements = {
      profileViews: rows.reduce((sum, row) => sum + (Number(row.profile_views) || 0), 0),
      totalImpressions: rows.reduce((sum, row) => sum + (Number(row.total_impressions_received) || 0), 0)
    }
  }

  if (sections.includes('team')) {
    const { count } = await supabaseAdmin
      .from('organization_team_members')
      .select('id', { count: 'exact', head: true })
      .eq('organization_type', 'developer')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
    result.team = { activeMembers: count || 0 }
  }

  return result
}

function drawWrappedText(page, text, options) {
  const {
    font,
    size = 11,
    x = 55,
    y = 700,
    maxWidth = 480,
    lineHeight = 16,
    color = rgb(0.11, 0.11, 0.16)
  } = options
  const words = String(text).split(/\s+/)
  let current = ''
  let cursor = y

  words.forEach((word, index) => {
    const candidate = current ? `${current} ${word}` : word
    const candidateWidth = font.widthOfTextAtSize(candidate, size)
    if (candidateWidth > maxWidth && current) {
      page.drawText(current, { x, y: cursor, size, font, color })
      cursor -= lineHeight
      current = word
    } else {
      current = candidate
    }
    if (index === words.length - 1 && current) {
      page.drawText(current, { x, y: cursor, size, font, color })
      cursor -= lineHeight
    }
  })

  return cursor
}

function addSectionPage(pdfDoc, fonts, title, lines) {
  const page = pdfDoc.addPage([595, 842])
  const { bold, regular } = fonts
  page.drawRectangle({ x: 0, y: 792, width: 595, height: 50, color: rgb(0.11, 0.35, 0.36) })
  page.drawText(title, { x: 40, y: 810, font: bold, size: 18, color: rgb(1, 1, 1) })
  let cursor = 760

  lines.forEach((line) => {
    cursor = drawWrappedText(page, `- ${line}`, {
      font: regular,
      size: 11,
      x: 45,
      y: cursor,
      maxWidth: 505,
      lineHeight: 17
    })
    cursor -= 6
  })
}

async function fetchImageBytes(url) {
  if (!url) return null
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    return new Uint8Array(await response.arrayBuffer())
  } catch {
    return null
  }
}

function buildSectionLines(section, values) {
  switch (section) {
    case 'leads':
      return [`Total leads captured: ${values.total}`]
    case 'clients':
      return [`New clients created: ${values.total}`]
    case 'sales':
      return [
        `Total completed sales: ${values.total}`,
        `Total sales value: ${values.currency} ${values.totalValue.toLocaleString()}`
      ]
    case 'service_charges':
      return [
        `Service charge records: ${values.totalRecords}`,
        `Total service charge amount: ${Number(values.totalAmount || 0).toLocaleString()}`,
        `Paid cycles: ${values.paid}`,
        `Overdue cycles: ${values.overdue}`
      ]
    case 'appointments':
      return [`Appointments scheduled: ${values.total}`]
    case 'engagements':
      return [
        `Profile views: ${values.profileViews}`,
        `Total impressions received: ${values.totalImpressions}`
      ]
    case 'team':
      return [`Active team members: ${values.activeMembers}`]
    default:
      return ['No data available']
  }
}

async function generatePdfReport(payload) {
  const { developerName, dateFrom, dateTo, sections, outputData, logoUrl, bannerUrl } = payload
  const pdfDoc = await PDFDocument.create()
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const coverPage = pdfDoc.addPage([595, 842])
  coverPage.drawRectangle({ x: 0, y: 0, width: 595, height: 842, color: rgb(0.98, 0.98, 0.99) })
  coverPage.drawRectangle({ x: 0, y: 720, width: 595, height: 122, color: rgb(0.11, 0.35, 0.36) })
  coverPage.drawText('Monthly Performance Report', { x: 50, y: 780, font: bold, size: 30, color: rgb(1, 1, 1) })
  coverPage.drawText(`Report for ${developerName}`, { x: 50, y: 730, font: regular, size: 16, color: rgb(0.95, 0.98, 1) })
  coverPage.drawText(`Date Range: ${dateFrom} to ${dateTo}`, { x: 50, y: 690, font: regular, size: 13, color: rgb(0.11, 0.11, 0.16) })
  coverPage.drawText('Prepared by Iska Homes', { x: 50, y: 80, font: regular, size: 12, color: rgb(0.35, 0.36, 0.4) })

  const brandingPage = pdfDoc.addPage([595, 842])
  brandingPage.drawRectangle({ x: 0, y: 0, width: 595, height: 842, color: rgb(1, 1, 1) })
  brandingPage.drawText('Brand Identity', { x: 40, y: 800, size: 24, font: bold, color: rgb(0.11, 0.35, 0.36) })

  const logoBytes = await fetchImageBytes(logoUrl)
  const bannerBytes = await fetchImageBytes(bannerUrl)

  let logoPlaced = false
  if (logoBytes) {
    try {
      const logoImage = await pdfDoc.embedPng(logoBytes).catch(async () => pdfDoc.embedJpg(logoBytes))
      const { width, height } = logoImage.scale(1)
      const maxWidth = 170
      const maxHeight = 85
      const scale = Math.min(maxWidth / width, maxHeight / height, 1)
      brandingPage.drawImage(logoImage, { x: 40, y: 680, width: width * scale, height: height * scale })
      logoPlaced = true
    } catch {
      logoPlaced = false
    }
  }

  if (!logoPlaced) {
    brandingPage.drawRectangle({ x: 40, y: 675, width: 170, height: 90, borderColor: rgb(0.87, 0.88, 0.9), borderWidth: 1 })
    brandingPage.drawText('Client Logo', { x: 90, y: 715, font: regular, size: 12, color: rgb(0.45, 0.45, 0.48) })
  }

  let bannerPlaced = false
  if (bannerBytes) {
    try {
      const bannerImage = await pdfDoc.embedPng(bannerBytes).catch(async () => pdfDoc.embedJpg(bannerBytes))
      const scale = Math.min(515 / bannerImage.width, 280 / bannerImage.height, 1)
      brandingPage.drawImage(bannerImage, { x: 40, y: 370, width: bannerImage.width * scale, height: bannerImage.height * scale })
      bannerPlaced = true
    } catch {
      bannerPlaced = false
    }
  }

  if (!bannerPlaced) {
    brandingPage.drawRectangle({ x: 40, y: 370, width: 515, height: 260, borderColor: rgb(0.9, 0.9, 0.9), borderWidth: 1, color: rgb(0.98, 0.98, 0.99) })
    brandingPage.drawText('Banner / Cover Image', { x: 230, y: 495, font: regular, size: 14, color: rgb(0.45, 0.45, 0.48) })
  }

  const tocPage = pdfDoc.addPage([595, 842])
  tocPage.drawText('Table of Contents', { x: 40, y: 790, size: 24, font: bold, color: rgb(0.11, 0.35, 0.36) })
  let tocY = 740
  sections.forEach((section, index) => {
    tocPage.drawText(`${index + 1}. ${SECTION_LABELS[section] || section}`, {
      x: 50,
      y: tocY,
      font: regular,
      size: 12,
      color: rgb(0.14, 0.14, 0.2)
    })
    tocY -= 24
  })

  sections.forEach((section) => {
    const title = SECTION_LABELS[section] || section
    const lines = buildSectionLines(section, outputData[section] || {})
    addSectionPage(pdfDoc, { regular, bold }, title, lines)
  })

  return Buffer.from(await pdfDoc.save())
}

export async function POST(request) {
  try {
    const { userInfo, error: authError, status } = await authenticateRequest(request)
    if (authError) return NextResponse.json({ error: authError }, { status })
    if (userInfo.organization_type !== 'developer') {
      return NextResponse.json({ error: 'Invalid organization type' }, { status: 403 })
    }

    const developerId = await getDeveloperId(userInfo)
    if (!developerId) return NextResponse.json({ error: 'Developer not found' }, { status: 404 })

    const body = await request.json()
    const requestedSections = Array.isArray(body?.sections) ? body.sections : []
    const sections = requestedSections.filter((s) => SECTION_LABELS[s])
    const format = String(body?.format || 'pdf').toLowerCase()
    const dateFrom = safeString(body?.date_from, '')
    const dateTo = safeString(body?.date_to, '')

    if (!sections.length) return NextResponse.json({ error: 'Select at least one report section' }, { status: 400 })
    if (!dateFrom || !dateTo) return NextResponse.json({ error: 'Date range is required' }, { status: 400 })

    const { data: developer } = await supabaseAdmin
      .from('developers')
      .select('name, profile_image, cover_image')
      .eq('developer_id', developerId)
      .single()

    const developerName = safeString(developer?.name, 'Developer')
    const outputData = await loadReportData({
      developerId,
      organizationId: userInfo.organization_id,
      dateFrom,
      dateTo,
      sections
    })

    if (format === 'json') {
      return NextResponse.json({
        success: true,
        meta: { developerName, dateFrom, dateTo, sections, format: 'json' },
        data: outputData
      })
    }

    if (format === 'csv') {
      const rows = [['section', 'metric', 'value']]
      sections.forEach((section) => {
        const values = outputData[section] || {}
        Object.entries(values).forEach(([key, value]) => {
          rows.push([section, key, String(value ?? '')])
        })
      })
      const csvContent = rows.map((r) => r.map((col) => `"${String(col).replace(/"/g, '""')}"`).join(',')).join('\n')
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="developer-report-${dateFrom}-to-${dateTo}.csv"`
        }
      })
    }

    const pdfBuffer = await generatePdfReport({
      developerName,
      dateFrom,
      dateTo,
      sections,
      outputData,
      logoUrl: parseImageUrl(developer?.profile_image),
      bannerUrl: parseImageUrl(developer?.cover_image)
    })

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="developer-report-${dateFrom}-to-${dateTo}.pdf"`
      }
    })
  } catch (error) {
    console.error('POST /api/developers/reports/generate error:', error)
    return NextResponse.json({ error: 'Failed to generate report', details: error.message }, { status: 500 })
  }
}
