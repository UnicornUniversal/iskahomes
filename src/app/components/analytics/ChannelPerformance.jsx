'use client'

import React from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Phone, MessageCircle, Mail, Calendar, TrendingUp, Award } from 'lucide-react'
import { analyticsClasses, analyticsPalette, baseChartOptions, formatNumber, formatPercent } from './analyticsTheme'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

const channelIcons = {
  phone: Phone,
  whatsapp: MessageCircle,
  direct_message: MessageCircle,
  email: Mail,
  appointment: Calendar
}

const channelLabels = {
  phone: 'Phone',
  whatsapp: 'WhatsApp',
  direct_message: 'Direct Message',
  email: 'Email',
  appointment: 'Appointment'
}

const channelStyles = {
  phone: {
    iconClass: 'bg-teal-50 text-teal-700 ring-teal-100',
    color: analyticsPalette.primary,
    soft: analyticsPalette.primarySoft
  },
  whatsapp: {
    iconClass: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    color: analyticsPalette.emerald,
    soft: analyticsPalette.emeraldSoft
  },
  direct_message: {
    iconClass: 'bg-sky-50 text-sky-700 ring-sky-100',
    color: analyticsPalette.secondary,
    soft: analyticsPalette.secondarySoft
  },
  email: {
    iconClass: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
    color: analyticsPalette.violet,
    soft: analyticsPalette.violetSoft
  },
  appointment: {
    iconClass: 'bg-amber-50 text-amber-700 ring-amber-100',
    color: analyticsPalette.amber,
    soft: analyticsPalette.amberSoft
  }
}

export default function ChannelPerformance({ data }) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className={analyticsClasses.section}>
        <div className={analyticsClasses.empty}>No channel data available yet.</div>
      </div>
    )
  }

  const channels = Object.keys(data).filter(key => data[key].total > 0)
  
  if (channels.length === 0) {
    return (
      <div className={analyticsClasses.section}>
        <div className={analyticsClasses.empty}>No channel data available yet.</div>
      </div>
    )
  }

  const totalTrackedLeads = channels.reduce((sum, channel) => sum + (data[channel]?.total || 0), 0)

  const chartData = {
    labels: channels.map(ch => channelLabels[ch] || ch),
    datasets: [
      {
        label: 'Conversion Rate (%)',
        data: channels.map(ch => data[ch].conversionRate),
        backgroundColor: channels.map(ch => channelStyles[ch]?.soft || analyticsPalette.secondarySoft),
        borderColor: channels.map(ch => channelStyles[ch]?.color || analyticsPalette.secondary),
        borderWidth: 1
      },
      {
        label: 'Avg Lead Score',
        data: channels.map(ch => data[ch].avgLeadScore),
        backgroundColor: channels.map(ch => channelStyles[ch]?.color || analyticsPalette.primary),
        borderColor: channels.map(ch => channelStyles[ch]?.color || analyticsPalette.primary),
        borderWidth: 1,
        yAxisID: 'y1'
      }
    ]
  }

  const chartOptions = baseChartOptions({
    yMax: 100,
    yTitle: 'Conversion Rate (%)',
    secondaryAxis: {
      title: 'Lead Score'
    }
  })

  // Sort channels by conversion rate
  const sortedChannels = [...channels].sort((a, b) => 
    data[b].conversionRate - data[a].conversionRate
  )

  return (
    <div className={analyticsClasses.section}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <span className={analyticsClasses.eyebrow}>Channel Quality</span>
          <div>
            <h3 className={analyticsClasses.title}>Channel Performance</h3>
            <p className={analyticsClasses.subtitle}>
              Performance is now derived from the full action history, so WhatsApp and email stay visible when those channels are used.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className={analyticsClasses.subPanel}>
            <p className={analyticsClasses.metricLabel}>Tracked Channel Touchpoints</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-primary_color">
              {formatNumber(totalTrackedLeads)}
            </p>
          </div>
          <div className={analyticsClasses.subPanel}>
            <p className={analyticsClasses.metricLabel}>Top Converting Channel</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-primary_color">
              {channelLabels[sortedChannels[0]] || sortedChannels[0]}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              {formatPercent(data[sortedChannels[0]]?.conversionRate || 0)} conversion rate
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-slate-200/80 bg-slate-50/70 p-5">
        <div className="h-80">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sortedChannels.map(channel => {
          const Icon = channelIcons[channel] || MessageCircle
          const stats = data[channel]
          const channelShare = totalTrackedLeads > 0 ? (stats.total / totalTrackedLeads) * 100 : 0
          const style = channelStyles[channel] || channelStyles.direct_message
          
          return (
            <div key={channel} className={analyticsClasses.compactCard}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`${analyticsClasses.iconWrap} ${style.iconClass}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-primary_color">{channelLabels[channel]}</h4>
                  <p className="text-sm text-primary_color/70">
                    {formatNumber(stats.total)} tracked leads
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Share</p>
                  <p className="mt-2 text-xl font-semibold text-primary_color">{formatPercent(channelShare)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Conversion</p>
                  <p className="mt-2 text-xl font-semibold text-primary_color">{formatPercent(stats.conversionRate)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Avg Score</p>
                  <p className="mt-2 text-xl font-semibold text-primary_color">{stats.avgLeadScore.toFixed(1)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">High Value</p>
                  <p className="mt-2 text-xl font-semibold text-primary_color">
                    {formatNumber(stats.highValueLeads)}
                  </p>
                  <p className="mt-1 text-xs text-primary_color/70">{formatPercent(stats.highValuePercentage)}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/20 px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-medium text-primary_color/70">
                  <TrendingUp className="h-4 w-4 text-primary_color/70" />
                  Closed leads
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary_color">
                    {formatNumber(stats.closed)} / {formatNumber(stats.total)}
                  </p>
                  <p className="text-xs text-primary_color/70">{formatPercent(stats.conversionRate)}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

