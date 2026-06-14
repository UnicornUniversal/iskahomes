import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import {
  DEFAULT_PIPELINE_STAGES,
  createEmptyStatusDistribution,
  resolveLeadStatusForPipeline,
  buildAnalyticsStageOrder,
  buildStatusLabelMap,
  computePipelineHealthFromDistribution,
  computePipelineFunnelSteps,
  PIPELINE_CLOSED_STATUS_KEYS,
} from '@/lib/leadsPipelineHelper'

async function loadListerPipelineStages(listerId, listerType) {
  const { data, error } = await supabaseAdmin
    .from('leads_pipeline')
    .select('status, value, sort_order, is_default')
    .eq('user_id', listerId)
    .eq('user_type', listerType)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching leads_pipeline for analytics:', error)
    return [...DEFAULT_PIPELINE_STAGES]
  }
  return data?.length ? data : [...DEFAULT_PIPELINE_STAGES]
}

function buildLifecycleAnalysisPayload({
  pipelineStages,
  statusDistribution,
  statusTransitions,
  funnelSteps,
  avgTimeToConversion,
}) {
  const pipelineSummary = computePipelineHealthFromDistribution(statusDistribution, pipelineStages)
  const funnelConversionRates = {}
  funnelSteps.forEach((step) => {
    funnelConversionRates[step.key] = step.rate
  })

  return {
    statusDistribution,
    statusTransitions,
    funnelConversionRates,
    funnelSteps,
    pipelineStages: buildAnalyticsStageOrder(pipelineStages),
    statusLabels: buildStatusLabelMap(pipelineStages),
    pipelineSummary,
    avgTimeToConversion,
  }
}

function isUUID(str) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

function formatDateInput(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getThisWeekRange() {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek

  const start = new Date(today)
  start.setDate(today.getDate() + diffToMonday)
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(0, 0, 0, 0)

  return {
    dateFrom: formatDateInput(start),
    dateTo: formatDateInput(end)
  }
}

function normalizeDateRange(dateFrom, dateTo) {
  let normalizedFrom = dateFrom || ''
  let normalizedTo = dateTo || ''

  if (!normalizedFrom && !normalizedTo) {
    const thisWeek = getThisWeekRange()
    normalizedFrom = thisWeek.dateFrom
    normalizedTo = thisWeek.dateTo
  } else if (!normalizedFrom) {
    normalizedFrom = normalizedTo
  } else if (!normalizedTo) {
    normalizedTo = normalizedFrom
  }

  if (normalizedFrom > normalizedTo) {
    return {
      dateFrom: normalizedTo,
      dateTo: normalizedFrom
    }
  }

  return {
    dateFrom: normalizedFrom,
    dateTo: normalizedTo
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const listerId = searchParams.get('lister_id')
    const listerType = searchParams.get('lister_type') || 'developer'
    const rawDateFrom = searchParams.get('date_from')
    const rawDateTo = searchParams.get('date_to')
    const { dateFrom, dateTo } = normalizeDateRange(rawDateFrom, rawDateTo)

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
    let dateFilter = supabaseAdmin
      .from('leads')
      .select('*')

    if (listerType === 'agency') {
      dateFilter = dateFilter.eq('agency_id', finalListerId)
    } else {
      dateFilter = dateFilter.eq('lister_id', finalListerId).eq('lister_type', listerType)
    }

    // first_action_date is a DATE column — compare with YYYY-MM-DD only so rows are not
    // dropped by timestamptz vs date coercion quirks in PostgREST.
    if (dateFrom) {
      dateFilter = dateFilter.gte('first_action_date', dateFrom)
    }
    if (dateTo) {
      dateFilter = dateFilter.lte('first_action_date', dateTo)
    }

    const pipelineStages = await loadListerPipelineStages(finalListerId, listerType)

    const { data: allLeads, error: leadsError } = await dateFilter

    if (leadsError) {
      console.error('Error fetching leads:', leadsError)
      return NextResponse.json(
        { error: 'Failed to fetch leads', details: leadsError.message },
        { status: 500 }
      )
    }

    if (!allLeads || allLeads.length === 0) {
      const emptyDistribution = createEmptyStatusDistribution(pipelineStages)
      const emptyFunnel = computePipelineFunnelSteps([], pipelineStages)
      const emptyLifecycle = buildLifecycleAnalysisPayload({
        pipelineStages,
        statusDistribution: emptyDistribution,
        statusTransitions: {},
        funnelSteps: emptyFunnel,
        avgTimeToConversion: 0,
      })
      const emptyPipelineHealth = computePipelineHealthFromDistribution(emptyDistribution, pipelineStages)

      return NextResponse.json({
        success: true,
        data: {
          pipelineStages: buildAnalyticsStageOrder(pipelineStages),
          channelPerformance: {
            phone: { total: 0, closed: 0, conversionRate: 0, avgLeadScore: 0, highValueLeads: 0, highValuePercentage: 0 },
            whatsapp: { total: 0, closed: 0, conversionRate: 0, avgLeadScore: 0, highValueLeads: 0, highValuePercentage: 0 },
            direct_message: { total: 0, closed: 0, conversionRate: 0, avgLeadScore: 0, highValueLeads: 0, highValuePercentage: 0 },
            email: { total: 0, closed: 0, conversionRate: 0, avgLeadScore: 0, highValueLeads: 0, highValuePercentage: 0 },
            appointment: { total: 0, closed: 0, conversionRate: 0, avgLeadScore: 0, highValueLeads: 0, highValuePercentage: 0 }
          },
          lifecycleAnalysis: emptyLifecycle,
          temporalPatterns: {
            dayOfWeekPerformance: [
              { day: 'Sunday', total: 0, closed: 0, conversionRate: 0 },
              { day: 'Monday', total: 0, closed: 0, conversionRate: 0 },
              { day: 'Tuesday', total: 0, closed: 0, conversionRate: 0 },
              { day: 'Wednesday', total: 0, closed: 0, conversionRate: 0 },
              { day: 'Thursday', total: 0, closed: 0, conversionRate: 0 },
              { day: 'Friday', total: 0, closed: 0, conversionRate: 0 },
              { day: 'Saturday', total: 0, closed: 0, conversionRate: 0 }
            ],
            hourOfDayPerformance: Array.from({ length: 24 }, (_, hour) => ({
              hour,
              total: 0,
              closed: 0,
              conversionRate: 0
            }))
          },
          contextAnalysis: {
            listing: { total: 0, closed: 0, conversionRate: 0, avgLeadScore: 0 },
            development: { total: 0, closed: 0, conversionRate: 0, avgLeadScore: 0 },
            profile: { total: 0, closed: 0, conversionRate: 0, avgLeadScore: 0 }
          },
          engagementAnalysis: {
            singleAction: { total: 0, closed: 0, conversionRate: 0 },
            multiAction: { total: 0, closed: 0, conversionRate: 0 },
            highEngagement: { total: 0, closed: 0, conversionRate: 0 }
          },
          predictiveMetrics: {
            totalLeads: 0,
            totalClosed: 0,
            overallConversionRate: 0,
            avgLeadScore: 0,
            pipelineHealth: emptyPipelineHealth,
          },
          comparativeAnalysis: {},
          operationalEfficiency: {
            avgResponseTime: 0,
            avgTimeToConversion: 0,
            abandonmentRate: 0,
            coldLeadRate: 0,
            responseTimeDistribution: {
              under1Hour: 0,
              under24Hours: 0,
              over24Hours: 0
            }
          },
        appliedDateRange: {
          dateFrom,
          dateTo
        }
        }
      })
    }

    // Helper to get channel from action
    const getChannelFromAction = (action) => {
      const actionType = action?.action_type || ''
      const metadata = action?.action_metadata || {}
      
      if (actionType === 'lead_phone') return 'phone'
      if (actionType === 'lead_appointment') return 'appointment'
      if (actionType === 'lead_email') return 'email'
      if (actionType === 'lead_message') {
        const messageType = String(metadata.message_type || metadata.messageType || 'direct_message').toLowerCase()
        if (messageType === 'email') return 'email'
        if (messageType === 'whatsapp') return 'whatsapp'
        return 'direct_message'
      }
      return null
    }

    /** When lead_actions is missing/empty, infer channel from the denormalized last_action_type */
    const getChannelFromLastActionType = (lastType) => {
      const t = String(lastType || '')
      if (t === 'lead_phone') return 'phone'
      if (t === 'lead_appointment') return 'appointment'
      if (t === 'lead_email') return 'email'
      if (t === 'lead_message') return 'direct_message'
      return null
    }

    const parseLeadActions = (raw) => {
      if (Array.isArray(raw)) return raw
      if (raw == null) return []
      if (typeof raw === 'string') {
        try {
          const p = JSON.parse(raw)
          return Array.isArray(p) ? p : []
        } catch {
          return []
        }
      }
      return []
    }

    // Process all leads
    const channelStats = {
      phone: { leads: [], total: 0, closed: 0, scores: [] },
      whatsapp: { leads: [], total: 0, closed: 0, scores: [] },
      direct_message: { leads: [], total: 0, closed: 0, scores: [] },
      email: { leads: [], total: 0, closed: 0, scores: [] },
      appointment: { leads: [], total: 0, closed: 0, scores: [] }
    }

    const statusDistribution = createEmptyStatusDistribution(pipelineStages)

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
      const statusKey = resolveLeadStatusForPipeline(lead.status, pipelineStages)
      statusDistribution[statusKey] = (statusDistribution[statusKey] || 0) + 1

      if (PIPELINE_CLOSED_STATUS_KEYS.has(statusKey)) {
        totalClosed++
      }

      const leadScore = lead.lead_score || 0
      totalScore += leadScore

      // Context analysis
      const context = lead.context_type || 'listing'
      if (contextStats[context]) {
        contextStats[context].total++
        contextStats[context].scores.push(leadScore)
        if (PIPELINE_CLOSED_STATUS_KEYS.has(statusKey)) {
          contextStats[context].closed++
        }
      }

      // Engagement analysis
      const actionCount = lead.total_actions || 0
      if (actionCount === 1) {
        engagementStats.singleAction.total++
        if (PIPELINE_CLOSED_STATUS_KEYS.has(statusKey)) engagementStats.singleAction.closed++
      } else if (actionCount >= 3) {
        engagementStats.highEngagement.total++
        if (PIPELINE_CLOSED_STATUS_KEYS.has(statusKey)) engagementStats.highEngagement.closed++
      } else {
        engagementStats.multiAction.total++
        if (PIPELINE_CLOSED_STATUS_KEYS.has(statusKey)) engagementStats.multiAction.closed++
      }

      // Channel analysis from the full action history. This keeps WhatsApp and
      // email visible even when the first recorded action was a different channel.
      const leadActions = parseLeadActions(lead.lead_actions)
      const channelsUsed = new Set()

      if (leadActions.length > 0) {
        leadActions.forEach(action => {
          const channel = getChannelFromAction(action)
          if (channel && channelStats[channel]) {
            channelsUsed.add(channel)
          }
        })
      }

      if (channelsUsed.size === 0) {
        const fallback = getChannelFromLastActionType(lead.last_action_type)
        if (fallback && channelStats[fallback]) {
          channelsUsed.add(fallback)
        }
      }

      if (channelsUsed.size > 0) {
        channelsUsed.forEach(channel => {
          channelStats[channel].leads.push(lead)
          channelStats[channel].total++
          channelStats[channel].scores.push(leadScore)
          if (PIPELINE_CLOSED_STATUS_KEYS.has(statusKey)) {
            channelStats[channel].closed++
          }
        })

        const firstTimestampedAction = leadActions.find(action => action?.action_timestamp)

        // Response time (if we have timestamps)
        if (firstTimestampedAction?.action_timestamp) {
          const actionTime = new Date(firstTimestampedAction.action_timestamp)
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
          if (PIPELINE_CLOSED_STATUS_KEYS.has(statusKey)) dayOfWeekStats[dayOfWeek].closed++
        }
        
        if (hourOfDayStats[hourOfDay]) {
          hourOfDayStats[hourOfDay].total++
          if (PIPELINE_CLOSED_STATUS_KEYS.has(statusKey)) hourOfDayStats[hourOfDay].closed++
        }
      }

      // Time to conversion
      if (PIPELINE_CLOSED_STATUS_KEYS.has(statusKey) && lead.first_action_date && lead.last_action_date) {
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
          status: statusKey,
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

    const statusTransitions = {}
    lifecycleData.forEach((lead) => {
      const statuses = lead.statuses
      for (let i = 0; i < statuses.length - 1; i++) {
        const from = statuses[i]
        const to = statuses[i + 1]
        const key = `${from}_to_${to}`
        statusTransitions[key] = (statusTransitions[key] || 0) + 1
      }
    })

    const funnelSteps = computePipelineFunnelSteps(lifecycleData, pipelineStages)
    const avgTimeToConversionVal =
      timeToConversion.length > 0
        ? timeToConversion.reduce((a, b) => a + b, 0) / timeToConversion.length
        : 0
    const lifecycleAnalysis = buildLifecycleAnalysisPayload({
      pipelineStages,
      statusDistribution,
      statusTransitions,
      funnelSteps,
      avgTimeToConversion: parseFloat(avgTimeToConversionVal.toFixed(2)),
    })
    const pipelineHealth = computePipelineHealthFromDistribution(statusDistribution, pipelineStages)

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
        pipelineStages: buildAnalyticsStageOrder(pipelineStages),
        channelPerformance,
        lifecycleAnalysis,
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
          pipelineHealth,
        },
        operationalEfficiency: {
          avgResponseTime: parseFloat(avgResponseTime.toFixed(2)),
          avgTimeToConversion: lifecycleAnalysis.avgTimeToConversion,
          abandonmentRate: parseFloat(abandonmentRate.toFixed(2)),
          coldLeadRate: parseFloat(coldLeadRate.toFixed(2)),
          responseTimeDistribution: {
            under1Hour: responseTimes.filter(t => t < 1).length,
            under24Hours: responseTimes.filter(t => t < 24).length,
            over24Hours: responseTimes.filter(t => t >= 24).length
          }
        },
        appliedDateRange: {
          dateFrom,
          dateTo
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

