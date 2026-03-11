import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

// Helper to check if string is UUID
function isUUID(str) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const listerId = searchParams.get('lister_id')
    const listerType = searchParams.get('lister_type') || 'developer'
    const listingId = searchParams.get('listing_id')
    const period = searchParams.get('period') // 'week', 'month', 'year' (for backward compatibility)
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')

    if (!listerId) {
      return NextResponse.json(
        { error: 'Lister ID is required' },
        { status: 400 }
      )
    }

    // Fetch lister metadata (for developers: leads_breakdown, conversion_rate, total_appointments)
    // For agents/agencies: use lister_id directly
    let listerMetadata = null
    let finalListerId = listerId

    if (listerType === 'developer') {
      // Check if listerId is a slug (not UUID)
      if (!isUUID(listerId)) {
        // It's a slug, fetch developer by slug
        const { data: developer, error: devError } = await supabaseAdmin
          .from('developers')
          .select('developer_id, leads_breakdown, conversion_rate, total_appointments, total_leads, total_views')
          .eq('slug', listerId)
          .single()

        if (!devError && developer) {
          listerMetadata = developer
          finalListerId = developer.developer_id
          console.log('📊 Developer data fetched:', {
            conversion_rate: developer.conversion_rate,
            conversion_rate_type: typeof developer.conversion_rate,
            total_leads: developer.total_leads,
            total_views: developer.total_views
          })
        } else {
          console.error('❌ Error fetching developer by slug:', devError)
        }
      } else {
        // It's a UUID, fetch developer by developer_id
        const { data: developer, error: devError } = await supabaseAdmin
          .from('developers')
          .select('developer_id, leads_breakdown, conversion_rate, total_appointments, total_leads, total_views')
          .eq('developer_id', listerId)
          .single()

        if (!devError && developer) {
          listerMetadata = developer
          console.log('📊 Developer data fetched:', {
            conversion_rate: developer.conversion_rate,
            conversion_rate_type: typeof developer.conversion_rate,
            total_leads: developer.total_leads,
            total_views: developer.total_views
          })
        } else {
          console.error('❌ Error fetching developer by ID:', devError)
        }
      }
    } else {
      // For agents and agencies, use lister_id directly
      // They can pass their agent_id or agency_id as lister_id
      finalListerId = listerId
      console.log(`📊 Using ${listerType} lister_id directly:`, finalListerId)
    }

    // Calculate date range based on period or custom date range
    const now = new Date()
    let startDate, endDate, groupBy

    // Use custom date range if provided, otherwise use period
    if (dateFrom && dateTo) {
      startDate = new Date(dateFrom)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(dateTo)
      endDate.setHours(23, 59, 59, 999)
      
      // Determine groupBy based on date range length
      const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
      if (daysDiff <= 90) {
        groupBy = 'day'
      } else if (daysDiff <= 365) {
        groupBy = 'week'
      } else {
        groupBy = 'month'
      }
    } else {
      // Use period for backward compatibility
      switch (period) {
        case 'week':
          // Last 7 days
          startDate = new Date(now)
          startDate.setDate(startDate.getDate() - 6)
          startDate.setHours(0, 0, 0, 0)
          endDate = new Date(now)
          endDate.setHours(23, 59, 59, 999)
          groupBy = 'day'
          break
        case 'month':
          // Last 30 days
          startDate = new Date(now)
          startDate.setDate(startDate.getDate() - 29)
          startDate.setHours(0, 0, 0, 0)
          endDate = new Date(now)
          endDate.setHours(23, 59, 59, 999)
          groupBy = 'day'
          break
        case 'year':
          // Last 12 months
          startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1)
          endDate = new Date(now)
          groupBy = 'month'
          break
        default:
          startDate = new Date(now)
          startDate.setDate(startDate.getDate() - 6)
          startDate.setHours(0, 0, 0, 0)
          endDate = new Date(now)
          endDate.setHours(23, 59, 59, 999)
          groupBy = 'day'
      }
    }

    // Fetch leads for this lister (works for developers, agents, and agencies)
    // Include all leads with seeker_id (both anonymous and non-anonymous if they have seeker_id)
    // Date filtering will be done on action dates, not lead record dates
    let query = supabase
      .from('leads')
      .select('id, seeker_id, lead_actions, first_action_date, last_action_date, total_actions')
      .eq('lister_id', finalListerId)
      .eq('lister_type', listerType)
      .not('seeker_id', 'is', null) // Only leads with seeker_id

    // If listingId is provided, filter by that specific listing
    // If not provided, show ALL leads (aggregate across all listings + profile-level leads)
    // This works for all lister types: developers, agents, and agencies
    if (listingId) {
      query = query.eq('listing_id', listingId)
    }
    // When listingId is not provided, we don't filter by listing_id at all
    // This allows both listing-level leads (listing_id != null) and profile-level leads (listing_id = null)

    const { data: leads, error: leadsError } = await query

    if (leadsError) {
      console.error('Error fetching leads:', leadsError)
      return NextResponse.json(
        { error: 'Failed to fetch leads', details: leadsError.message },
        { status: 500 }
      )
    }

    if (!leads || leads.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          overview: {
            totalLeads: 0,
            phoneLeads: 0,
            messageLeads: 0,
            emailLeads: 0,
            appointmentLeads: 0,
            websiteLeads: 0,
            uniqueLeads: 0,
            conversionRate: 0,
            leadsChange: 0,
            phoneChange: 0,
            messageChange: 0,
            emailChange: 0,
            appointmentChange: 0,
            websiteChange: 0
          },
          performance: {
            labels: [],
            phone: [],
            message: [],
            email: [],
            appointment: [],
            website: []
          }
        }
      })
    }

    // Aggregate all lead actions
    const allActions = []
    const uniqueSeekers = new Set()
    
    leads.forEach(lead => {
      if (lead.seeker_id) uniqueSeekers.add(lead.seeker_id)
      
      if (Array.isArray(lead.lead_actions)) {
        lead.lead_actions.forEach(action => {
          let actionDate = null
          
          // Try to parse from action_timestamp first
          if (action.action_timestamp) {
            actionDate = new Date(action.action_timestamp)
          } else if (action.action_date) {
            // Parse from action_date format "YYYYMMDD" or "YYYY-MM-DD"
            const dateStr = action.action_date.toString()
            if (dateStr.length === 8) {
              // Format: YYYYMMDD
              const year = parseInt(dateStr.substring(0, 4))
              const month = parseInt(dateStr.substring(4, 6)) - 1
              const day = parseInt(dateStr.substring(6, 8))
              actionDate = new Date(year, month, day)
              // Add hour if available
              if (action.action_hour !== undefined) {
                actionDate.setHours(action.action_hour, 0, 0, 0)
              }
            } else {
              // Try standard date format
              actionDate = new Date(dateStr)
            }
          }
          
          if (actionDate && !isNaN(actionDate.getTime())) {
            if (actionDate >= startDate && actionDate <= endDate) {
              allActions.push({
                ...action,
                action_date_obj: actionDate
              })
            }
          }
        })
      }
    })

    // Categorize actions by type
    const phoneActions = allActions.filter(a => a.action_type === 'lead_phone')
    const messageActions = allActions.filter(a => a.action_type === 'lead_message')
    const whatsappActions = messageActions.filter(a => 
      String(a.action_metadata?.message_type || a.action_metadata?.messageType || '').toLowerCase() === 'whatsapp'
    )
    const directMessageActions = messageActions.filter(a => {
      const msgType = String(a.action_metadata?.message_type || a.action_metadata?.messageType || '').toLowerCase()
      return msgType !== 'whatsapp' && msgType !== 'email'
    })
    const emailActions = allActions.filter(a => 
      a.action_type === 'lead_message' && 
      String(a.action_metadata?.message_type || a.action_metadata?.messageType || '').toLowerCase() === 'email'
    )
    const appointmentActions = allActions.filter(a => a.action_type === 'lead_appointment')
    const websiteActions = allActions.filter(a => a.action_type === 'lead_website')

    // Group by time period
    const timeSeries = {}
    const formatDate = (date, groupBy) => {
      if (groupBy === 'month') {
        return date.toLocaleDateString('en-US', { month: 'short' })
      } else if (groupBy === 'day') {
        return date.toLocaleDateString('en-US', { weekday: 'short' })
      }
      return date.toISOString().split('T')[0]
    }

    // Initialize time series buckets
    const buckets = {}
    const bucketOrder = []
    
    if (groupBy === 'month') {
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const key = date.toLocaleDateString('en-US', { month: 'short' })
        buckets[key] = { phone: 0, message: 0, email: 0, appointment: 0, website: 0 }
        bucketOrder.push(key)
      }
    } else {
      const days = period === 'week' ? 7 : 30
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        date.setHours(0, 0, 0, 0)
        const key = date.toLocaleDateString('en-US', { weekday: 'short' })
        // Use date as key to avoid duplicates for same weekday
        const dateKey = date.toISOString().split('T')[0]
        buckets[dateKey] = { phone: 0, message: 0, email: 0, appointment: 0, website: 0, label: key }
        if (!bucketOrder.includes(dateKey)) {
          bucketOrder.push(dateKey)
        }
      }
    }

    // Aggregate actions into buckets
    allActions.forEach(action => {
      const date = action.action_date_obj
      let key
      
      if (groupBy === 'month') {
        key = date.toLocaleDateString('en-US', { month: 'short' })
      } else {
        // Use date string for day grouping
        const dateStr = date.toISOString().split('T')[0]
        key = dateStr
      }

      if (buckets[key]) {
        if (action.action_type === 'lead_phone') {
          buckets[key].phone++
        } else if (action.action_type === 'lead_message') {
          buckets[key].message++
          if (action.action_metadata?.message_type === 'email') {
            buckets[key].email++
          }
        } else if (action.action_type === 'lead_appointment') {
          buckets[key].appointment++
        } else if (action.action_type === 'lead_website') {
          buckets[key].website++
        }
      }
    })

    // Convert buckets to arrays using bucketOrder to maintain chronological order
    const labels = bucketOrder.map(key => {
      if (groupBy === 'month') {
        return key
      } else {
        // Use the label (weekday) for display
        return buckets[key]?.label || key
      }
    })
    const phoneSeries = bucketOrder.map(key => buckets[key].phone)
    const messageSeries = bucketOrder.map(key => buckets[key].message)
    const emailSeries = bucketOrder.map(key => buckets[key].email)
    const appointmentSeries = bucketOrder.map(key => buckets[key].appointment)
    const websiteSeries = bucketOrder.map(key => buckets[key].website)

    // Calculate totals from leads data
    let totalLeads = allActions.length
    let phoneLeads = phoneActions.length
    let messageLeads = messageActions.length
    let whatsappLeads = whatsappActions.length
    let directMessageLeads = directMessageActions.length
    let emailLeads = emailActions.length
    let appointmentLeads = appointmentActions.length
    let websiteLeads = websiteActions.length
    let conversionRate = 0

    // Use lister metadata if available (for developers: more accurate aggregated data)
    // For agents/agencies: use calculated totals from leads
    if (listerMetadata) {
      // Parse leads_breakdown JSON (only for developers)
      let leadsBreakdown = null
      if (listerMetadata.leads_breakdown) {
        try {
          leadsBreakdown = typeof listerMetadata.leads_breakdown === 'string' 
            ? JSON.parse(listerMetadata.leads_breakdown)
            : listerMetadata.leads_breakdown
        } catch (e) {
          console.error('Error parsing leads_breakdown:', e)
        }
      }

      // Use breakdown data if available (more accurate - developers only)
      if (leadsBreakdown) {
        totalLeads = leadsBreakdown.total_leads ?? totalLeads
        phoneLeads =
          leadsBreakdown.phone?.total ??
          leadsBreakdown.phone_leads?.total ??
          phoneLeads
        messageLeads =
          leadsBreakdown.messaging?.total ??
          leadsBreakdown.message_leads?.total ??
          messageLeads
        whatsappLeads =
          leadsBreakdown.messaging?.whatsapp?.total ??
          leadsBreakdown.whatsapp?.total ??
          whatsappLeads
        directMessageLeads =
          leadsBreakdown.messaging?.direct_message?.total ??
          leadsBreakdown.direct_message?.total ??
          directMessageLeads
        emailLeads =
          leadsBreakdown.email?.total ??
          leadsBreakdown.email_leads?.total ??
          emailLeads
        appointmentLeads =
          leadsBreakdown.appointment?.total ??
          leadsBreakdown.appointment_leads?.total ??
          listerMetadata.total_appointments ??
          appointmentLeads
        websiteLeads =
          leadsBreakdown.website?.total ??
          leadsBreakdown.website_leads?.total ??
          websiteLeads
      } else {
        // Fallback to developer totals (developers only)
        totalLeads = listerMetadata.total_leads || totalLeads
        appointmentLeads = listerMetadata.total_appointments || appointmentLeads
      }

      // Use conversion_rate from developer data (developers only)
      console.log('🔍 Parsing conversion_rate:', {
        raw: listerMetadata.conversion_rate,
        type: typeof listerMetadata.conversion_rate,
        isNull: listerMetadata.conversion_rate === null,
        isUndefined: listerMetadata.conversion_rate === undefined,
        isEmpty: listerMetadata.conversion_rate === ''
      })
      
      if (listerMetadata.conversion_rate !== null && listerMetadata.conversion_rate !== undefined && listerMetadata.conversion_rate !== '') {
        // Handle both string and number types
        if (typeof listerMetadata.conversion_rate === 'string') {
          const parsed = parseFloat(listerMetadata.conversion_rate)
          conversionRate = isNaN(parsed) ? 0 : parsed
          console.log('✅ Parsed string conversion_rate:', parsed)
        } else if (typeof listerMetadata.conversion_rate === 'number') {
          conversionRate = listerMetadata.conversion_rate
          console.log('✅ Using number conversion_rate:', conversionRate)
        }
      }
      
      // If still 0, try to calculate from total_views and total_leads (developers only)
      if (conversionRate === 0 && listerMetadata.total_views && listerMetadata.total_views > 0 && listerMetadata.total_leads) {
        conversionRate = (listerMetadata.total_leads / listerMetadata.total_views) * 100
        console.log('📈 Calculated conversion_rate from views/leads:', conversionRate)
      }
      
      console.log('🎯 Final conversionRate:', conversionRate)
    }

    // Create nested messaging structure
    const messagingData = {
      total: messageLeads,
      percentage: totalLeads > 0 ? parseFloat(((messageLeads / totalLeads) * 100).toFixed(2)) : 0,
      direct_message: {
        total: directMessageLeads,
        percentage: messageLeads > 0 ? parseFloat(((directMessageLeads / messageLeads) * 100).toFixed(2)) : 0
      },
      whatsapp: {
        total: whatsappLeads,
        percentage: messageLeads > 0 ? parseFloat(((whatsappLeads / messageLeads) * 100).toFixed(2)) : 0
      }
    }

    // For now, we'll set change percentages to 0 (would need previous period data to calculate)
    // In a real implementation, you'd fetch previous period data and compare

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalLeads,
          phoneLeads,
          messageLeads,
          messaging: messagingData, // Nested messaging structure
          emailLeads,
          appointmentLeads,
          websiteLeads,
          uniqueLeads: uniqueSeekers.size,
          conversionRate: Math.round(conversionRate * 100) / 100, // Round to 2 decimal places
          leadsChange: 0,
          phoneChange: 0,
          messageChange: 0,
          emailChange: 0,
          appointmentChange: 0,
          websiteChange: 0
        },
        performance: {
          labels,
          phone: phoneSeries,
          message: messageSeries,
          email: emailSeries,
          appointment: appointmentSeries,
          website: websiteSeries
        }
      }
    })

  } catch (error) {
    console.error('Leads trends error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

