'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import useExtendedAuthProfile from '@/hooks/useExtendedAuthProfile'
import LeadsManagement from '@/app/components/analytics/LeadsManagement'
import LeadsTrend from '@/app/components/analytics/LeadsTrend'
import LeadSourceBreakdown from '@/app/components/analytics/LeadSourceBreakdown'
import LeadsShare from '@/app/components/analytics/LeadsShare'
import ChannelPerformance from '@/app/components/analytics/ChannelPerformance'
import LeadLifecycle from '@/app/components/analytics/LeadLifecycle'
import TemporalPatterns from '@/app/components/analytics/TemporalPatterns'
import ContextAnalysis from '@/app/components/analytics/ContextAnalysis'
import EngagementAnalysis from '@/app/components/analytics/EngagementAnalysis'
import PredictiveMetrics from '@/app/components/analytics/PredictiveMetrics'
import ComparativeAnalysis from '@/app/components/analytics/ComparativeAnalysis'
import OperationalEfficiency from '@/app/components/analytics/OperationalEfficiency'
import { analyticsClasses } from '@/app/components/analytics/analyticsTheme'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { BarChart3, MessageCircle, Phone, Calendar, TrendingUp, Loader2, UserX, Settings2 } from 'lucide-react'

const formatDateInput = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getThisWeekRange = () => {
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

const LeadAnalytics = () => {
  const params = useParams()
  const { user } = useAuth()
  const { extendedProfile } = useExtendedAuthProfile({ scope: 'analytics' })
  const profile = extendedProfile || user?.profile || {}
  const slug = params.slug || profile?.slug || user?.profile?.slug || ''
  const listerId = profile?.developer_id || params.slug
  const configurePipelineHref = slug ? `/developer/${slug}/leads/leadsPipeline` : null
  const [analyticsData, setAnalyticsData] = useState(null)
  const [loadingAnalytics, setLoadingAnalytics] = useState(true)
  const [temporalDateRange, setTemporalDateRange] = useState(() => getThisWeekRange())

  // Fetch comprehensive analytics data
  useEffect(() => {
    async function fetchAnalytics() {
      if (!listerId) return

      setLoadingAnalytics(true)
      try {
        // For team members, get the developer's developer_id (user_id) from developers table
        let resolvedListerId = listerId
        
        if (user?.user_type === 'team_member' && user?.profile?.organization_type === 'developer') {
          const { data: developer } = await supabase
            .from('developers')
            .select('developer_id')
            .eq('id', user.profile.organization_id)
            .single()
          
          if (developer?.developer_id) {
            resolvedListerId = developer.developer_id
          }
        }
        
        const params = new URLSearchParams({
          lister_id: resolvedListerId,
          lister_type: 'developer',
          date_from: temporalDateRange.dateFrom,
          date_to: temporalDateRange.dateTo
        })

        const response = await fetch(`/api/leads/analytics?${params.toString()}`)
        const result = await response.json()
        
        if (result.success) {
          setAnalyticsData(result.data)
        }
      } catch (error) {
        console.error('Error fetching analytics:', error)
      } finally {
        setLoadingAnalytics(false)
      }
    }

    fetchAnalytics()
  }, [listerId, temporalDateRange.dateFrom, temporalDateRange.dateTo, user])

  // Extract leads data directly from user profile
  const getTotalLeadsData = () => {
    if (!profile) return null

    // Parse leads_breakdown JSON
    let leadsBreakdown = null
    if (profile.leads_breakdown) {
      try {
        leadsBreakdown = typeof profile.leads_breakdown === 'string'
          ? JSON.parse(profile.leads_breakdown)
          : profile.leads_breakdown
      } catch (e) {
        console.error('Error parsing leads_breakdown:', e)
      }
    }

    // Parse conversion_rate (can be string or number)
    let conversionRate = 0
    if (profile.conversion_rate) {
      conversionRate = typeof profile.conversion_rate === 'string'
        ? parseFloat(profile.conversion_rate)
        : profile.conversion_rate
    }

    // Extract messaging data from nested structure
    const messagingData = leadsBreakdown?.messaging || {}
    const whatsappLeads = messagingData?.whatsapp?.total ?? leadsBreakdown?.whatsapp?.total ?? 0
    const directMessageLeads = messagingData?.direct_message?.total ?? leadsBreakdown?.direct_message?.total ?? 0
    const messageTotal = messagingData?.total ?? ((whatsappLeads + directMessageLeads) || leadsBreakdown?.message_leads?.total || 0)

    // HYBRID APPROACH: Use aggregate total_unique_leads + total_anonymous_leads for developer-level display
    // This shows unique individuals across ALL contexts (profile + listings + developments)
    const totalUniqueLeads = profile.total_unique_leads || 0 // Aggregate across all contexts
    const totalAnonymousLeads = profile.total_anonymous_leads || 0 // Aggregate across all contexts
    const totalLeads = totalUniqueLeads + totalAnonymousLeads // Total unique individuals across all contexts
    
    // Fallback to profile-specific if aggregate not available
    const profileUniqueLeads = profile.unique_leads || 0 // Profile-specific only
    const profileAnonymousLeads = profile.anonymous_leads || 0 // Profile-specific only
    const profileTotalLeads = profileUniqueLeads + profileAnonymousLeads
    
    // Use aggregate if available, otherwise fallback to profile-specific, then to total_leads
    const totalLeadsFallback = profileTotalLeads > 0 ? profileTotalLeads : (leadsBreakdown?.total_leads || profile.total_leads || 0)
    const finalTotalLeads = totalLeads > 0 ? totalLeads : totalLeadsFallback
    
    return {
      total_leads: finalTotalLeads, // Aggregate across all contexts (HYBRID APPROACH)
      unique_leads: totalUniqueLeads, // Aggregate unique logged-in leads
      anonymous_leads: totalAnonymousLeads, // Aggregate anonymous leads
      profile_unique_leads: profileUniqueLeads, // Profile-specific only (for reference)
      profile_anonymous_leads: profileAnonymousLeads, // Profile-specific only (for reference)
      // Extract individual lead types from leads_breakdown
      phone_leads: leadsBreakdown?.phone?.total || 0,
      messaging: messagingData, // Nested messaging structure
      whatsapp_leads: whatsappLeads,
      direct_message_leads: directMessageLeads,
      email_leads: leadsBreakdown?.email?.total || 0,
      appointment_leads: profile.total_appointments || leadsBreakdown?.appointment?.total || 0,
      website_leads: leadsBreakdown?.website?.total || 0,
      // Keep message_leads as sum for backward compatibility
      message_leads: messageTotal,
      conversion_rate: conversionRate || 0,
      // Pass the full breakdown for detailed analysis
      leads_breakdown: leadsBreakdown
    }
  }

  const totalLeadsData = getTotalLeadsData()
  const overviewCards = [
    {
      title: 'Total Leads',
      value: (totalLeadsData?.total_leads || 0).toLocaleString(),
      icon: BarChart3,
      iconClass: 'bg-sky-50 text-sky-700 ring-sky-100'
    },
    {
      title: 'Conversion Rate',
      value: `${(totalLeadsData?.conversion_rate || 0).toFixed(2)}%`,
      icon: TrendingUp,
      iconClass: 'bg-teal-50 text-teal-700 ring-teal-100'
    },
    {
      title: 'Phone Leads',
      value: (totalLeadsData?.phone_leads || 0).toLocaleString(),
      icon: Phone,
      iconClass: 'bg-emerald-50 text-emerald-700 ring-emerald-100'
    },
    {
      title: 'Message Leads',
      value: (totalLeadsData?.message_leads || 0).toLocaleString(),
      icon: MessageCircle,
      iconClass: 'bg-indigo-50 text-indigo-700 ring-indigo-100'
    },
    {
      title: 'Appointments',
      value: (totalLeadsData?.appointment_leads || 0).toLocaleString(),
      icon: Calendar,
      iconClass: 'bg-amber-50 text-amber-700 ring-amber-100'
    },
    {
      title: 'Anonymous Leads',
      value: (totalLeadsData?.anonymous_leads || 0).toLocaleString(),
      icon: UserX,
      iconClass: 'bg-rose-50 text-rose-700 ring-rose-100'
    }
  ]

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto  space-y-8 px-4 pb-10 pt-2 sm:px-6 lg:px-8">
        <div className={analyticsClasses.section}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <span className={analyticsClasses.eyebrow}>Leads Dashboard</span>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-primary_color md:text-4xl">
                  Lead Analytics
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-primary_color/70 md:text-base">
                  How leads arrive, how they move through your configured pipeline, and where conversion is strongest.
                </p>
              </div>
            </div>

            {configurePipelineHref && (
              <div className="flex flex-wrap gap-2">
                <Link
                  href={configurePipelineHref}
                  className="inline-flex items-center gap-2 rounded-lg border border-primary_color/25 px-4 py-2 text-sm font-medium text-primary_color hover:bg-primary_color/5"
                >
                  <Settings2 className="h-4 w-4" />
                  Configure pipeline
                </Link>
                <Link
                  href={`/developer/${slug}/leads`}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary_color px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                >
                  Manage leads
                </Link>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="default_bg2 rounded-3xl bg-white/20 p-4">
                <p className="text-sm font-medium text-primary_color/70">Tracked Messaging</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-primary_color">
                  {(totalLeadsData?.message_leads || 0).toLocaleString()}
                </p>
              </div>
              <div className="default_bg2 rounded-3xl bg-white/20 p-4">
                <p className="text-sm font-medium text-primary_color/70">Anonymous Leads</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-primary_color">
                  {(totalLeadsData?.anonymous_leads || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
          {overviewCards.map(card => {
            const Icon = card.icon
            return (
              <div key={card.title} className={analyticsClasses.section}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-primary_color/70">{card.title}</p>
                    <p className="mt-6 text-3xl font-semibold tracking-tight text-primary_color">
                      {card.value}
                    </p>
                  </div>
                  <div className={`${analyticsClasses.iconWrap} ${card.iconClass}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <LeadsTrend listerId={listerId} listerType="developer" />

        <LeadSourceBreakdown listerId={listerId} listerType="developer" />

        <LeadsShare totalLeadsData={totalLeadsData} />

        {loadingAnalytics ? (
          <div className={`${analyticsClasses.section} mt-8 flex items-center justify-center py-12`}>
            <Loader2 className="mr-2 h-6 w-6 animate-spin text-teal-600" />
            <span className="text-primary_color/70">Loading analytics...</span>
          </div>
        ) : analyticsData ? (
          <div className="mt-8 space-y-8">
            <ChannelPerformance
              data={analyticsData.channelPerformance}
              dateRange={temporalDateRange}
              onDateRangeChange={setTemporalDateRange}
              appliedDateRange={analyticsData.appliedDateRange}
              loading={loadingAnalytics}
            />
            <LeadLifecycle
              data={analyticsData.lifecycleAnalysis}
              configurePipelineHref={configurePipelineHref}
            />
            <TemporalPatterns
              data={analyticsData.temporalPatterns}
              dateRange={{
                ...temporalDateRange,
                defaultWeekRange: getThisWeekRange()
              }}
              onDateRangeChange={setTemporalDateRange}
              loading={loadingAnalytics}
              hideDateRangeControl
            />
            <ContextAnalysis data={analyticsData.contextAnalysis} />
            <EngagementAnalysis data={analyticsData.engagementAnalysis} />
            <PredictiveMetrics data={analyticsData.predictiveMetrics} />
            <ComparativeAnalysis listerId={listerId} listerType="developer" />
            <OperationalEfficiency data={analyticsData.operationalEfficiency} />
          </div>
        ) : (
          <div className={`${analyticsClasses.section} mt-8 py-12 text-center text-primary_color/70`}>
            No analytics data available yet. Analytics will appear as leads are generated.
          </div>
        )}

        {/* <div className="mt-10">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Manage Leads</h3>
          <LeadsManagement listerId={listerId} listerType="developer" />
        </div> */}
      </div>
    </div>
  )
}

export default LeadAnalytics
