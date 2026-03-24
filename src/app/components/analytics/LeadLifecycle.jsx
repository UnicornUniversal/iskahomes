'use client'

import React from 'react'
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
import { TrendingUp, Clock, Target } from 'lucide-react'
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

export default function LeadLifecycle({ data }) {
  if (!data || !data.statusDistribution) {
    return (
      <div className={analyticsClasses.section}>
        <div className={analyticsClasses.empty}>No lifecycle data available yet.</div>
      </div>
    )
  }

  const { statusDistribution, funnelConversionRates, avgTimeToConversion } = data

  // Status distribution chart
  const statusLabels = Object.keys(statusDistribution).map(s => 
    s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')
  )
  const statusValues = Object.values(statusDistribution)
  const statusColors = {
    new: analyticsPalette.secondary,
    contacted: analyticsPalette.primary,
    scheduled: analyticsPalette.amber,
    responded: analyticsPalette.violet,
    closed: analyticsPalette.emerald,
    cold_lead: analyticsPalette.slate,
    abandoned: analyticsPalette.rose
  }

  const statusChartData = {
    labels: statusLabels,
    datasets: [{
      data: statusValues,
      backgroundColor: Object.keys(statusDistribution).map(s => statusColors[s] || analyticsPalette.slate),
      borderWidth: 2,
      borderColor: '#fff'
    }]
  }

  // Funnel conversion rates
  const funnelLabels = [
    'New → Contacted',
    'Contacted → Scheduled',
    'Scheduled → Closed'
  ]
  const funnelValues = [
    funnelConversionRates.newToContacted || 0,
    funnelConversionRates.contactedToScheduled || 0,
    funnelConversionRates.scheduledToClosed || 0
  ]

  const funnelChartData = {
    labels: funnelLabels,
    datasets: [{
      label: 'Conversion Rate (%)',
      data: funnelValues,
      backgroundColor: [
        analyticsPalette.secondary,
        analyticsPalette.primary,
        analyticsPalette.emerald
      ],
      borderColor: [
        analyticsPalette.secondary,
        analyticsPalette.primary,
        analyticsPalette.emerald
      ],
      borderWidth: 1
    }]
  }

  const totalLeads = Object.values(statusDistribution).reduce((a, b) => a + b, 0)
  const inProgress = (statusDistribution.contacted || 0) + 
                     (statusDistribution.scheduled || 0) + 
                     (statusDistribution.responded || 0)
  const closed = statusDistribution.closed || 0
  const lost = (statusDistribution.abandoned || 0) + (statusDistribution.cold_lead || 0)

  return (
    <div className={analyticsClasses.section}>
      <div className="space-y-3">
        <span className={analyticsClasses.eyebrow}>Lifecycle Health</span>
        <div>
          <h3 className={analyticsClasses.title}>Lead Lifecycle & Funnel</h3>
          <p className={analyticsClasses.subtitle}>
            A cleaner view of where leads sit in the pipeline and how well they move from one stage to the next.
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className={analyticsClasses.subPanel}>
          <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Status Distribution</h4>
          <div className="mt-4 h-72">
            <Doughnut
              data={statusChartData}
              options={{
                ...baseChartOptions({ legendPosition: 'bottom' }),
                plugins: {
                  legend: {
                    ...baseChartOptions({ legendPosition: 'bottom' }).plugins.legend,
                    position: 'bottom'
                  }
                }
              }}
            />
          </div>
        </div>

        <div className={analyticsClasses.subPanel}>
          <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Funnel Conversion</h4>
          <div className="mt-4 h-72">
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
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Key Metrics */}
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
        <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Detailed Status Breakdown</h4>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
          {Object.entries(statusDistribution).map(([status, count]) => {
            const percentage = totalLeads > 0 ? ((count / totalLeads) * 100).toFixed(1) : 0
            return (
              <div key={status} className={analyticsClasses.compactCard}>
                <p className="text-sm font-medium capitalize text-primary_color/70">
                  {status.replace('_', ' ')}
                </p>
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

