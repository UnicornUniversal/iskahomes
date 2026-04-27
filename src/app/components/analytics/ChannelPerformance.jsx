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
import { Phone, MessageCircle, Mail, Calendar, TrendingUp } from 'lucide-react'
import { DateRangePicker } from '@/app/components/ui/date-range-picker'
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

const CHANNEL_ORDER = ['phone', 'whatsapp', 'direct_message', 'email', 'appointment']

const emptyChannelStats = () => ({
  total: 0,
  closed: 0,
  conversionRate: 0,
  avgLeadScore: 0,
  highValueLeads: 0,
  highValuePercentage: 0
})

/** Always produce a full channel map so empty weeks still render zeros, not a blank section. */
function normalizeChannelPerformance(raw) {
  const out = {}
  CHANNEL_ORDER.forEach((key) => {
    const v = raw?.[key]
    const base = emptyChannelStats()
    if (v && typeof v === 'object') {
      out[key] = {
        total: Number(v.total) || 0,
        closed: Number(v.closed) || 0,
        conversionRate: Number(v.conversionRate) || 0,
        avgLeadScore: Number(v.avgLeadScore) || 0,
        highValueLeads: Number(v.highValueLeads) || 0,
        highValuePercentage: Number(v.highValuePercentage) || 0
      }
    } else {
      out[key] = { ...base }
    }
  })
  return out
}

function formatRangeLabel(from, to) {
  if (!from && !to) return null
  if (from && to) return `${from} → ${to}`
  return from || to || null
}

export default function ChannelPerformance({
  data,
  dateRange,
  onDateRangeChange,
  appliedDateRange,
  loading = false
}) {
  const channelData = normalizeChannelPerformance(data)
  const channels = CHANNEL_ORDER

  const totalTrackedLeads = channels.reduce((sum, channel) => sum + (channelData[channel]?.total || 0), 0)

  const chartData = {
    labels: channels.map(ch => channelLabels[ch] || ch),
    datasets: [
      {
        label: 'Conversion Rate (%)',
        data: channels.map(ch => channelData[ch].conversionRate),
        backgroundColor: channels.map(ch => channelStyles[ch]?.soft || analyticsPalette.secondarySoft),
        borderColor: channels.map(ch => channelStyles[ch]?.color || analyticsPalette.secondary),
        borderWidth: 1
      },
      {
        label: 'Avg Lead Score',
        data: channels.map(ch => channelData[ch].avgLeadScore),
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

  const sortedChannels = [...channels].sort(
    (a, b) =>
      channelData[b].conversionRate - channelData[a].conversionRate ||
      channelData[b].total - channelData[a].total
  )
  const topChannelKey = sortedChannels.find((ch) => channelData[ch].total > 0)
  const rangeLabel =
    formatRangeLabel(appliedDateRange?.dateFrom, appliedDateRange?.dateTo) ||
    formatRangeLabel(dateRange?.dateFrom, dateRange?.dateTo)

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
            {rangeLabel && (
              <p className="mt-2 text-sm font-medium text-primary_color/80">
                Reporting period: <span className="text-primary_color">{rangeLabel}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex w-full flex-col gap-4 lg:w-auto lg:min-w-[300px]">
          {onDateRangeChange && (
            <div className="flex w-full flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-primary_color/70">
                Date range
              </span>
              <div className="flex w-full flex-wrap items-center gap-2">
                <DateRangePicker
                  startDate={dateRange?.dateFrom || ''}
                  endDate={dateRange?.dateTo || ''}
                  onChange={(nextRange) => {
                    onDateRangeChange({
                      dateFrom: nextRange.startDate,
                      dateTo: nextRange.endDate
                    })
                  }}
                  className="w-full min-w-0 sm:w-[280px]"
                />
                {loading && (
                  <span className="text-xs font-medium text-primary_color/60 whitespace-nowrap">Updating…</span>
                )}
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className={analyticsClasses.subPanel}>
              <p className={analyticsClasses.metricLabel}>Tracked channel touchpoints</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-primary_color">
                {formatNumber(totalTrackedLeads)}
              </p>
            </div>
            <div className={analyticsClasses.subPanel}>
              <p className={analyticsClasses.metricLabel}>Top converting channel</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-primary_color">
                {topChannelKey ? channelLabels[topChannelKey] : '—'}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                {topChannelKey
                  ? `${formatPercent(channelData[topChannelKey].conversionRate)} conversion rate`
                  : 'No leads in this period for any channel'}
              </p>
            </div>
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
          const stats = channelData[channel]
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

