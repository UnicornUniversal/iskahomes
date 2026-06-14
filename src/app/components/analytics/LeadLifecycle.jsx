'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
import { Doughnut, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { TrendingUp, Clock, Target, Settings2 } from 'lucide-react'
import { analyticsClasses, analyticsPalette, baseChartOptions, formatNumber, formatPercent } from './analyticsTheme'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

const statusColors = {
  new: analyticsPalette.secondary,
  contacted: analyticsPalette.primary,
  scheduled: analyticsPalette.amber,
  responded: analyticsPalette.violet,
  closed: analyticsPalette.emerald,
  cold_lead: analyticsPalette.slate,
  abandoned: analyticsPalette.rose,
  unspecified: analyticsPalette.slate,
}

const paletteFallback = [
  analyticsPalette.primary,
  analyticsPalette.secondary,
  analyticsPalette.emerald,
  analyticsPalette.violet,
  analyticsPalette.amber,
  analyticsPalette.rose,
  '#14b8a6',
  '#64748b',
]

export default function LeadLifecycle({ data, configurePipelineHref = null }) {
  if (!data || !data.statusDistribution) {
    return (
      <div className={analyticsClasses.section}>
        <div className={analyticsClasses.empty}>No lifecycle data available yet.</div>
      </div>
    )
  }

  const {
    statusDistribution,
    funnelSteps = [],
    funnelConversionRates = {},
    statusLabels = {},
    pipelineStages = [],
    pipelineSummary = {},
    avgTimeToConversion,
  } = data

  const orderedBreakdown = useMemo(() => {
    const order = pipelineStages.map((s) => s.status)
    const seen = new Set()
    const rows = []

    order.forEach((key) => {
      const count = statusDistribution[key] || 0
      if (count > 0) {
        rows.push({ key, label: statusLabels[key] || key.replace(/_/g, ' '), count })
        seen.add(key)
      }
    })

    Object.entries(statusDistribution).forEach(([key, count]) => {
      if (count > 0 && !seen.has(key)) {
        rows.push({ key, label: statusLabels[key] || key.replace(/_/g, ' '), count })
      }
    })

    return rows
  }, [pipelineStages, statusDistribution, statusLabels])

  const statusChartEntries = orderedBreakdown.length > 0 ? orderedBreakdown : []

  const statusChartData = {
    labels: statusChartEntries.map((e) => e.label),
    datasets: [{
      data: statusChartEntries.map((e) => e.count),
      backgroundColor: statusChartEntries.map((e, i) =>
        statusColors[e.key] || paletteFallback[i % paletteFallback.length]
      ),
      borderWidth: 2,
      borderColor: '#fff',
    }],
  }

  const funnelLabels =
    funnelSteps.length > 0
      ? funnelSteps.map((s) => s.label)
      : ['New → Contacted', 'Contacted → Scheduled', 'Scheduled → Closed']

  const funnelValues =
    funnelSteps.length > 0
      ? funnelSteps.map((s) => s.rate)
      : [
          funnelConversionRates.newToContacted || 0,
          funnelConversionRates.contactedToScheduled || 0,
          funnelConversionRates.scheduledToClosed || 0,
        ]

  const funnelChartData = {
    labels: funnelLabels,
    datasets: [{
      label: 'Conversion Rate (%)',
      data: funnelValues,
      backgroundColor: funnelLabels.map((_, i) => paletteFallback[i % paletteFallback.length]),
      borderColor: funnelLabels.map((_, i) => paletteFallback[i % paletteFallback.length]),
      borderWidth: 1,
    }],
  }

  const totalLeads = Object.values(statusDistribution).reduce((a, b) => a + b, 0)
  const inProgress = pipelineSummary.inProgress ?? 0
  const closed = pipelineSummary.closed ?? 0
  const lost = pipelineSummary.lost ?? 0
  const unspecified = pipelineSummary.unspecified ?? 0

  return (
    <div className={analyticsClasses.section}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <span className={analyticsClasses.eyebrow}>Lifecycle Health</span>
          <div>
            <h3 className={analyticsClasses.title}>Lead Lifecycle & Pipeline</h3>
            <p className={analyticsClasses.subtitle}>
              Status counts follow your configured pipeline stages (New, custom stages, Unspecified).
            </p>
          </div>
        </div>
        {configurePipelineHref && (
          <Link
            href={configurePipelineHref}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-primary_color/20 px-3 py-2 text-sm font-medium text-primary_color hover:bg-primary_color/5"
          >
            <Settings2 className="h-4 w-4" />
            Configure pipeline
          </Link>
        )}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: 'New', value: pipelineSummary.new ?? 0 },
          { label: 'In progress', value: inProgress },
          { label: 'Closed', value: closed },
          { label: 'Lost', value: lost },
          { label: 'Unspecified', value: unspecified },
        ].map((item) => (
          <div key={item.label} className={analyticsClasses.compactCard}>
            <p className="text-xs font-medium text-primary_color/70">{item.label}</p>
            <p className="mt-2 text-xl font-semibold text-primary_color">{formatNumber(item.value)}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className={analyticsClasses.subPanel}>
          <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Status Distribution</h4>
          <div className="mt-4 h-72">
            {statusChartEntries.length > 0 ? (
              <Doughnut
                data={statusChartData}
                options={{
                  ...baseChartOptions({ legendPosition: 'bottom' }),
                  plugins: {
                    legend: {
                      ...baseChartOptions({ legendPosition: 'bottom' }).plugins.legend,
                      position: 'bottom',
                    },
                  },
                }}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-primary_color/60">
                No status data in this date range
              </div>
            )}
          </div>
        </div>

        <div className={analyticsClasses.subPanel}>
          <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Funnel Conversion</h4>
          <div className="mt-4 h-72">
            {funnelLabels.length > 0 ? (
              <Bar
                data={funnelChartData}
                options={{
                  ...baseChartOptions({ showLegend: false, yMax: 100, yTitle: 'Conversion Rate (%)' }),
                  scales: {
                    ...baseChartOptions({ showLegend: false, yMax: 100, yTitle: 'Conversion Rate (%)' }).scales,
                    y: {
                      ...baseChartOptions({ showLegend: false, yMax: 100, yTitle: 'Conversion Rate (%)' }).scales.y,
                      ticks: {
                        color: analyticsPalette.slate,
                        callback(value) {
                          return `${value}%`
                        },
                      },
                    },
                  },
                }}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-primary_color/60">
                Add pipeline stages to see funnel steps
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className={analyticsClasses.compactCard}>
          <div className="mb-3 flex items-center gap-2 text-slate-500">
            <Target className="h-4 w-4 text-teal-600" />
            <span className="text-sm font-medium">Total Leads</span>
          </div>
          <p className="text-3xl font-semibold tracking-tight text-primary_color">{formatNumber(totalLeads)}</p>
        </div>

        <div className={analyticsClasses.compactCard}>
          <div className="mb-3 flex items-center gap-2 text-slate-500">
            <TrendingUp className="h-4 w-4 text-sky-600" />
            <span className="text-sm font-medium">In Progress</span>
          </div>
          <p className="text-3xl font-semibold tracking-tight text-primary_color">{formatNumber(inProgress)}</p>
        </div>

        <div className={analyticsClasses.compactCard}>
          <div className="mb-3 flex items-center gap-2 text-slate-500">
            <Target className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-medium">Closed</span>
          </div>
          <p className="text-3xl font-semibold tracking-tight text-primary_color">{formatNumber(closed)}</p>
        </div>

        <div className={analyticsClasses.compactCard}>
          <div className="mb-3 flex items-center gap-2 text-slate-500">
            <Clock className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-medium">Avg Time to Close</span>
          </div>
          <p className="text-3xl font-semibold tracking-tight text-primary_color">
            {avgTimeToConversion ? `${avgTimeToConversion.toFixed(1)} days` : 'N/A'}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Pipeline stage breakdown</h4>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {(orderedBreakdown.length > 0 ? orderedBreakdown : pipelineStages.map((s) => ({
            key: s.status,
            label: s.label,
            count: statusDistribution[s.status] || 0,
          }))).map(({ key, label, count }) => {
            const percentage = totalLeads > 0 ? ((count / totalLeads) * 100).toFixed(1) : 0
            return (
              <div key={key} className={analyticsClasses.compactCard}>
                <p className="text-sm font-medium text-primary_color/70">{label}</p>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-primary_color">{formatNumber(count)}</p>
                <p className="mt-1 text-xs text-primary_color/70">{formatPercent(percentage)}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
