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
    const period = searchParams.get('period') || 'week' // 'week', 'month', 'year'

    if (!listerId) {
      return NextResponse.json(
        { error: 'Lister ID is required' },
        { status: 400 }
      )
    }

    // Fetch developer data to get leads_breakdown, conversion_rate, total_appointments
    let developerData = null
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
          developerData = developer
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
          developerData = developer
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
    }

    // Calculate date range based on period
    const now = new Date()
    let startDate, endDate, groupBy

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

    // Fetch leads for this lister
    let query = supabase
      .from('leads')
      .select('id, seeker_id, lead_actions, first_action_date, last_action_date, total_actions')
      .eq('lister_id', finalListerId)
      .eq('lister_type', listerType)
      .not('seeker_id', 'is', null)
      .gte('first_action_date', startDate.toISOString().split('T')[0])
      .lte('last_action_date', endDate.toISOString().split('T')[0])

    if (listingId) {
      query = query.eq('listing_id', listingId)
    } else {
      query = query.not('listing_id', 'is', null)
    }

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
    const emailActions = allActions.filter(a => 
      a.action_type === 'lead_message' && 
      a.action_metadata?.message_type === 'email'
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
    let emailLeads = emailActions.length
    let appointmentLeads = appointmentActions.length
    let websiteLeads = websiteActions.length
    let conversionRate = 0

    // Use developer data if available (more accurate aggregated data)
    if (developerData) {
      // Parse leads_breakdown JSON
      let leadsBreakdown = null
      if (developerData.leads_breakdown) {
        try {
          leadsBreakdown = typeof developerData.leads_breakdown === 'string' 
            ? JSON.parse(developerData.leads_breakdown)
            : developerData.leads_breakdown
        } catch (e) {
          console.error('Error parsing leads_breakdown:', e)
        }
      }

      // Use breakdown data if available (more accurate)
      if (leadsBreakdown) {
        totalLeads = leadsBreakdown.total_leads || totalLeads
        phoneLeads = leadsBreakdown.phone_leads?.total || phoneLeads
        messageLeads = leadsBreakdown.message_leads?.total || messageLeads
        emailLeads = leadsBreakdown.email_leads?.total || emailLeads
        appointmentLeads = leadsBreakdown.appointment_leads?.total || (developerData.total_appointments || appointmentLeads)
        websiteLeads = leadsBreakdown.website_leads?.total || websiteLeads
      } else {
        // Fallback to developer totals
        totalLeads = developerData.total_leads || totalLeads
        appointmentLeads = developerData.total_appointments || appointmentLeads
      }

      // Use conversion_rate from developer data
      console.log('🔍 Parsing conversion_rate:', {
        raw: developerData.conversion_rate,
        type: typeof developerData.conversion_rate,
        isNull: developerData.conversion_rate === null,
        isUndefined: developerData.conversion_rate === undefined,
        isEmpty: developerData.conversion_rate === ''
      })
      
      if (developerData.conversion_rate !== null && developerData.conversion_rate !== undefined && developerData.conversion_rate !== '') {
        // Handle both string and number types
        if (typeof developerData.conversion_rate === 'string') {
          const parsed = parseFloat(developerData.conversion_rate)
          conversionRate = isNaN(parsed) ? 0 : parsed
          console.log('✅ Parsed string conversion_rate:', parsed)
        } else if (typeof developerData.conversion_rate === 'number') {
          conversionRate = developerData.conversion_rate
          console.log('✅ Using number conversion_rate:', conversionRate)
        }
      }
      
      // If still 0, try to calculate from total_views and total_leads
      if (conversionRate === 0 && developerData.total_views && developerData.total_views > 0 && developerData.total_leads) {
        conversionRate = (developerData.total_leads / developerData.total_views) * 100
        console.log('📈 Calculated conversion_rate from views/leads:', conversionRate)
      }
      
      console.log('🎯 Final conversionRate:', conversionRate)
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

