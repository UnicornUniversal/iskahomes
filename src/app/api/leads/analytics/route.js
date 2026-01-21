import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function isUUID(str) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const listerId = searchParams.get('lister_id')
    const listerType = searchParams.get('lister_type') || 'developer'
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')

    if (!listerId) {
      return NextResponse.json(
        { error: 'Lister ID is required' },
        { status: 400 }
      )
    }

    // Convert slug to developer_id if needed
    let finalListerId = listerId
    if (listerType === 'developer' && !isUUID(listerId)) {
      const { data: developer, error: devError } = await supabaseAdmin
        .from('developers')
        .select('developer_id')
        .eq('slug', listerId)
        .single()

      if (!devError && developer) {
        finalListerId = developer.developer_id
      } else {
        return NextResponse.json(
          { error: 'Developer not found' },
          { status: 404 }
        )
      }
    }

    // Build date filter
    // IMPORTANT: Exclude anonymous/unknown seekers - only get leads with user IDs (non-anonymous)
    let dateFilter = supabaseAdmin
      .from('leads')
      .select('*')
      .eq('lister_id', finalListerId)
      .eq('lister_type', listerType)
      .not('seeker_id', 'is', null) // Only leads with seeker_id
      .or('is_anonymous.is.null,is_anonymous.eq.false') // Exclude anonymous leads (only get non-anonymous leads)

    if (dateFrom) {
      dateFilter = dateFilter.gte('first_action_date', dateFrom)
    }
    if (dateTo) {
      dateFilter = dateFilter.lte('first_action_date', dateTo)
    }

    const { data: allLeads, error: leadsError } = await dateFilter

    if (leadsError) {
      console.error('Error fetching leads:', leadsError)
      return NextResponse.json(
        { error: 'Failed to fetch leads', details: leadsError.message },
        { status: 500 }
      )
    }

    if (!allLeads || allLeads.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          channelPerformance: {},
          lifecycleAnalysis: {},
          temporalPatterns: {},
          contextAnalysis: {},
          engagementAnalysis: {},
          predictiveMetrics: {},
          comparativeAnalysis: {},
          operationalEfficiency: {}
        }
      })
    }

    // Helper to get channel from action
    const getChannelFromAction = (action) => {
      const actionType = action?.action_type || ''
      const metadata = action?.action_metadata || {}
      
      if (actionType === 'lead_phone') return 'phone'
      if (actionType === 'lead_appointment') return 'appointment'
      if (actionType === 'lead_message') {
        const messageType = String(metadata.message_type || metadata.messageType || 'direct_message').toLowerCase()
        if (messageType === 'email') return 'email'
        if (messageType === 'whatsapp') return 'whatsapp'
        return 'direct_message'
      }
      return null
    }

    // Process all leads
    const channelStats = {
      phone: { leads: [], total: 0, closed: 0, scores: [] },
      whatsapp: { leads: [], total: 0, closed: 0, scores: [] },
      direct_message: { leads: [], total: 0, closed: 0, scores: [] },
      email: { leads: [], total: 0, closed: 0, scores: [] },
      appointment: { leads: [], total: 0, closed: 0, scores: [] }
    }

    const statusDistribution = {
      new: 0,
      contacted: 0,
      scheduled: 0,
      responded: 0,
      closed: 0,
      cold_lead: 0,
      abandoned: 0
    }

    const contextStats = {
      listing: { total: 0, closed: 0, scores: [] },
      development: { total: 0, closed: 0, scores: [] },
      profile: { total: 0, closed: 0, scores: [] }
    }

    const dayOfWeekStats = {
      0: { total: 0, closed: 0 }, // Sunday
      1: { total: 0, closed: 0 },
      2: { total: 0, closed: 0 },
      3: { total: 0, closed: 0 },
      4: { total: 0, closed: 0 },
      5: { total: 0, closed: 0 },
      6: { total: 0, closed: 0 } // Saturday
    }

    const hourOfDayStats = Array.from({ length: 24 }, () => ({ total: 0, closed: 0 }))

    const lifecycleData = []
    const engagementStats = {
      singleAction: { total: 0, closed: 0 },
      multiAction: { total: 0, closed: 0 },
      highEngagement: { total: 0, closed: 0 } // 3+ actions
    }

    let totalLeads = 0
    let totalClosed = 0
    let totalScore = 0
    const responseTimes = []
    const timeToConversion = []

    allLeads.forEach(lead => {
      totalLeads++
      const status = lead.status || 'new'
      statusDistribution[status] = (statusDistribution[status] || 0) + 1
      
      if (status === 'closed') {
        totalClosed++
      }

      const leadScore = lead.lead_score || 0
      totalScore += leadScore

      // Context analysis
      const context = lead.context_type || 'listing'
      if (contextStats[context]) {
        contextStats[context].total++
        contextStats[context].scores.push(leadScore)
        if (status === 'closed') {
          contextStats[context].closed++
        }
      }

      // Engagement analysis
      const actionCount = lead.total_actions || 0
      if (actionCount === 1) {
        engagementStats.singleAction.total++
        if (status === 'closed') engagementStats.singleAction.closed++
      } else if (actionCount >= 3) {
        engagementStats.highEngagement.total++
        if (status === 'closed') engagementStats.highEngagement.closed++
      } else {
        engagementStats.multiAction.total++
        if (status === 'closed') engagementStats.multiAction.closed++
      }

      // Channel analysis from first action
      const leadActions = Array.isArray(lead.lead_actions) ? lead.lead_actions : []
      if (leadActions.length > 0) {
        const firstAction = leadActions[0]
        const channel = getChannelFromAction(firstAction)
        
        if (channel && channelStats[channel]) {
          channelStats[channel].leads.push(lead)
          channelStats[channel].total++
          channelStats[channel].scores.push(leadScore)
          if (status === 'closed') {
            channelStats[channel].closed++
          }
        }

        // Response time (if we have timestamps)
        if (firstAction?.action_timestamp) {
          const actionTime = new Date(firstAction.action_timestamp)
          const leadCreated = new Date(lead.created_at || lead.first_action_date)
          const responseTime = (actionTime - leadCreated) / (1000 * 60 * 60) // hours
          if (responseTime >= 0 && responseTime < 168) { // Valid response time (0-7 days)
            responseTimes.push(responseTime)
          }
        }
      }

      // Temporal patterns
      if (lead.first_action_date) {
        const actionDate = new Date(lead.first_action_date)
        const dayOfWeek = actionDate.getDay()
        const hourOfDay = actionDate.getHours()
        
        if (dayOfWeekStats[dayOfWeek]) {
          dayOfWeekStats[dayOfWeek].total++
          if (status === 'closed') dayOfWeekStats[dayOfWeek].closed++
        }
        
        if (hourOfDayStats[hourOfDay]) {
          hourOfDayStats[hourOfDay].total++
          if (status === 'closed') hourOfDayStats[hourOfDay].closed++
        }
      }

      // Time to conversion
      if (status === 'closed' && lead.first_action_date && lead.last_action_date) {
        const firstDate = new Date(lead.first_action_date)
        const lastDate = new Date(lead.last_action_date)
        const daysToClose = (lastDate - firstDate) / (1000 * 60 * 60 * 24)
        if (daysToClose >= 0 && daysToClose < 365) { // Valid conversion time
          timeToConversion.push(daysToClose)
        }
      }

      // Lifecycle analysis
      const statusTracker = Array.isArray(lead.status_tracker) ? lead.status_tracker : []
      if (statusTracker.length > 0) {
        lifecycleData.push({
          leadId: lead.id,
          statuses: statusTracker,
          firstActionDate: lead.first_action_date,
          lastActionDate: lead.last_action_date,
          status: status
        })
      }
    })

    // Calculate channel performance metrics
    const channelPerformance = {}
    Object.keys(channelStats).forEach(channel => {
      const stats = channelStats[channel]
      const avgScore = stats.scores.length > 0 
        ? stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length 
        : 0
      const conversionRate = stats.total > 0 ? (stats.closed / stats.total) * 100 : 0
      const highValueLeads = stats.scores.filter(s => s >= 60).length
      const highValuePercentage = stats.total > 0 ? (highValueLeads / stats.total) * 100 : 0

      channelPerformance[channel] = {
        total: stats.total,
        closed: stats.closed,
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        avgLeadScore: parseFloat(avgScore.toFixed(2)),
        highValueLeads,
        highValuePercentage: parseFloat(highValuePercentage.toFixed(2))
      }
    })

    // Calculate lifecycle metrics
    const statusTransitions = {}
    const avgTimeInStatus = {}
    const funnelMetrics = {
      newToContacted: { total: 0, converted: 0 },
      contactedToScheduled: { total: 0, converted: 0 },
      scheduledToClosed: { total: 0, converted: 0 }
    }

    lifecycleData.forEach(lead => {
      const statuses = lead.statuses
      for (let i = 0; i < statuses.length - 1; i++) {
        const from = statuses[i]
        const to = statuses[i + 1]
        const key = `${from}_to_${to}`
        statusTransitions[key] = (statusTransitions[key] || 0) + 1
      }

      // Funnel metrics
      if (statuses.includes('new') && statuses.includes('contacted')) {
        funnelMetrics.newToContacted.total++
        if (lead.status === 'closed') funnelMetrics.newToContacted.converted++
      }
      if (statuses.includes('contacted') && statuses.includes('scheduled')) {
        funnelMetrics.contactedToScheduled.total++
        if (lead.status === 'closed') funnelMetrics.contactedToScheduled.converted++
      }
      if (statuses.includes('scheduled') && statuses.includes('closed')) {
        funnelMetrics.scheduledToClosed.total++
        if (lead.status === 'closed') funnelMetrics.scheduledToClosed.converted++
      }
    })

    // Calculate funnel conversion rates
    const funnelConversionRates = {
      newToContacted: funnelMetrics.newToContacted.total > 0
        ? (funnelMetrics.newToContacted.converted / funnelMetrics.newToContacted.total) * 100
        : 0,
      contactedToScheduled: funnelMetrics.contactedToScheduled.total > 0
        ? (funnelMetrics.contactedToScheduled.converted / funnelMetrics.contactedToScheduled.total) * 100
        : 0,
      scheduledToClosed: funnelMetrics.scheduledToClosed.total > 0
        ? (funnelMetrics.scheduledToClosed.converted / funnelMetrics.scheduledToClosed.total) * 100
        : 0
    }

    // Calculate context performance
    const contextPerformance = {}
    Object.keys(contextStats).forEach(context => {
      const stats = contextStats[context]
      const avgScore = stats.scores.length > 0
        ? stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length
        : 0
      const conversionRate = stats.total > 0 ? (stats.closed / stats.total) * 100 : 0

      contextPerformance[context] = {
        total: stats.total,
        closed: stats.closed,
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        avgLeadScore: parseFloat(avgScore.toFixed(2))
      }
    })

    // Calculate engagement metrics
    const engagementPerformance = {}
    Object.keys(engagementStats).forEach(type => {
      const stats = engagementStats[type]
      const conversionRate = stats.total > 0 ? (stats.closed / stats.total) * 100 : 0
      engagementPerformance[type] = {
        total: stats.total,
        closed: stats.closed,
        conversionRate: parseFloat(conversionRate.toFixed(2))
      }
    })

    // Calculate operational efficiency
    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0
    const avgTimeToConversion = timeToConversion.length > 0
      ? timeToConversion.reduce((a, b) => a + b, 0) / timeToConversion.length
      : 0
    const abandonmentRate = totalLeads > 0
      ? ((statusDistribution.abandoned || 0) / totalLeads) * 100
      : 0
    const coldLeadRate = totalLeads > 0
      ? ((statusDistribution.cold_lead || 0) / totalLeads) * 100
      : 0

    // Calculate overall conversion rate
    const overallConversionRate = totalLeads > 0
      ? (totalClosed / totalLeads) * 100
      : 0

    // Format day of week names
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dayOfWeekPerformance = dayNames.map((name, index) => ({
      day: name,
      total: dayOfWeekStats[index].total,
      closed: dayOfWeekStats[index].closed,
      conversionRate: dayOfWeekStats[index].total > 0
        ? parseFloat(((dayOfWeekStats[index].closed / dayOfWeekStats[index].total) * 100).toFixed(2))
        : 0
    }))

    // Format hour of day
    const hourOfDayPerformance = hourOfDayStats.map((stats, hour) => ({
      hour,
      total: stats.total,
      closed: stats.closed,
      conversionRate: stats.total > 0
        ? parseFloat(((stats.closed / stats.total) * 100).toFixed(2))
        : 0
    }))

    return NextResponse.json({
      success: true,
      data: {
        channelPerformance,
        lifecycleAnalysis: {
          statusDistribution,
          statusTransitions,
          funnelConversionRates,
          avgTimeToConversion: parseFloat(avgTimeToConversion.toFixed(2))
        },
        temporalPatterns: {
          dayOfWeekPerformance,
          hourOfDayPerformance
        },
        contextAnalysis: contextPerformance,
        engagementAnalysis: engagementPerformance,
        predictiveMetrics: {
          totalLeads,
          totalClosed,
          overallConversionRate: parseFloat(overallConversionRate.toFixed(2)),
          avgLeadScore: parseFloat((totalScore / totalLeads).toFixed(2)),
          pipelineHealth: {
            new: statusDistribution.new,
            inProgress: statusDistribution.contacted + statusDistribution.scheduled + statusDistribution.responded,
            closed: statusDistribution.closed,
            lost: statusDistribution.abandoned + statusDistribution.cold_lead
          }
        },
        operationalEfficiency: {
          avgResponseTime: parseFloat(avgResponseTime.toFixed(2)),
          avgTimeToConversion: parseFloat(avgTimeToConversion.toFixed(2)),
          abandonmentRate: parseFloat(abandonmentRate.toFixed(2)),
          coldLeadRate: parseFloat(coldLeadRate.toFixed(2)),
          responseTimeDistribution: {
            under1Hour: responseTimes.filter(t => t < 1).length,
            under24Hours: responseTimes.filter(t => t < 24).length,
            over24Hours: responseTimes.filter(t => t >= 24).length
          }
        }
      }
    })
  } catch (error) {
    console.error('Leads analytics error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

