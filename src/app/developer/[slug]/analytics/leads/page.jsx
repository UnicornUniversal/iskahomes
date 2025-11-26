'use client'
import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import LeadsManagement from '@/app/components/analytics/LeadsManagement'
import LeadsTrend from '@/app/components/analytics/LeadsTrend'
import LeadsShare from '@/app/components/analytics/LeadsShare'
import DataCard from '@/app/components/developers/DataCard'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BarChart3, MessageCircle, Phone, Calendar, TrendingUp } from 'lucide-react'

const LeadAnalytics = () => {
  const params = useParams()
  const { user } = useAuth()
  const listerId = user?.profile?.developer_id || params.slug

  // Extract leads data directly from user profile
  const getTotalLeadsData = () => {
    if (!user?.profile) return null

    // Parse leads_breakdown JSON
    let leadsBreakdown = null
    if (user.profile.leads_breakdown) {
      try {
        leadsBreakdown = typeof user.profile.leads_breakdown === 'string'
          ? JSON.parse(user.profile.leads_breakdown)
          : user.profile.leads_breakdown
      } catch (e) {
        console.error('Error parsing leads_breakdown:', e)
      }
    }

    // Parse conversion_rate (can be string or number)
    let conversionRate = 0
    if (user.profile.conversion_rate) {
      conversionRate = typeof user.profile.conversion_rate === 'string'
        ? parseFloat(user.profile.conversion_rate)
        : user.profile.conversion_rate
    }

    // Extract messaging data from nested structure
    const messagingData = leadsBreakdown?.messaging || {}
    const whatsappLeads = messagingData?.whatsapp?.total ?? leadsBreakdown?.whatsapp?.total ?? 0
    const directMessageLeads = messagingData?.direct_message?.total ?? leadsBreakdown?.direct_message?.total ?? 0
    const messageTotal = messagingData?.total ?? ((whatsappLeads + directMessageLeads) || leadsBreakdown?.message_leads?.total || 0)

    return {
      total_leads: leadsBreakdown?.total_leads || user.profile.total_leads || 0,
      // Extract individual lead types from leads_breakdown
      phone_leads: leadsBreakdown?.phone?.total || 0,
      messaging: messagingData, // Nested messaging structure
      whatsapp_leads: whatsappLeads,
      direct_message_leads: directMessageLeads,
      email_leads: leadsBreakdown?.email?.total || 0,
      appointment_leads: user.profile.total_appointments || leadsBreakdown?.appointment?.total || 0,
      website_leads: leadsBreakdown?.website?.total || 0,
      // Keep message_leads as sum for backward compatibility
      message_leads: messageTotal,
      conversion_rate: conversionRate || 0,
      // Pass the full breakdown for detailed analysis
      leads_breakdown: leadsBreakdown
    }
  }

  const totalLeadsData = getTotalLeadsData()

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen ">
      <div className="max-w-7xl mx-auto ">
        {/* Header */}
        <div className="mb-8">
          {/* <Link 
            href={`/developer/${params.slug}/analytics`}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Analytics
          </Link> */}
          <h1 className=" mb-2">Lead Analytics</h1>
          <p className="">Track phone calls, messages, emails, and appointment bookings</p>
        </div>

        {/* Total Leads Overview Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <DataCard
            title="Total Leads"
            value={(totalLeadsData?.total_leads || 0).toLocaleString()}
            icon={BarChart3}
          />
          <DataCard
            title="Conversion Rate"
            value={`${(totalLeadsData?.conversion_rate || 0).toFixed(2)}%`}
            icon={TrendingUp}
          />
          <DataCard
            title="Phone Leads"
            value={(totalLeadsData?.phone_leads || 0).toLocaleString()}
            icon={Phone}
          />
          <DataCard
            title="Message Leads"
            value={(totalLeadsData?.message_leads || 0).toLocaleString()}
            icon={MessageCircle}
          />
          <DataCard
            title="Appointments"
            value={(totalLeadsData?.appointment_leads || 0).toLocaleString()}
            icon={Calendar}
          />
        </div>

        {/* Leads Trend Component */}
        <LeadsTrend listerId={listerId} listerType="developer" />

        {/* Leads Share Component */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold  mb-4">Lead Distribution</h3>
          <LeadsShare totalLeadsData={totalLeadsData} />
        </div>

        {/* Leads Management */}
        {/* <div className="mt-10">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Manage Leads</h3>
          <LeadsManagement listerId={listerId} listerType="developer" />
        </div> */}
      </div>
    </div>
  )
}

export default LeadAnalytics
