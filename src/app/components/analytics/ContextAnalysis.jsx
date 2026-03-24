'use client'

import React from 'react'
import { Bar, Doughnut } from 'react-chartjs-2'
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
import { Building2, Home, User, TrendingUp } from 'lucide-react'
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

const contextIcons = {
  listing: Home,
  development: Building2,
  profile: User
}

const contextLabels = {
  listing: 'Listing',
  development: 'Development',
  profile: 'Profile'
}

export default function ContextAnalysis({ data }) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className={analyticsClasses.section}>
        <div className={analyticsClasses.empty}>No context data available yet.</div>
      </div>
    )
  }

  const contexts = Object.keys(data).filter(key => data[key].total > 0)
  
  if (contexts.length === 0) {
    return (
      <div className={analyticsClasses.section}>
        <div className={analyticsClasses.empty}>No context data available yet.</div>
      </div>
    )
  }

  // Conversion rate chart
  const conversionChartData = {
    labels: contexts.map(ctx => contextLabels[ctx] || ctx),
    datasets: [{
      label: 'Conversion Rate (%)',
      data: contexts.map(ctx => data[ctx].conversionRate),
      backgroundColor: [
        analyticsPalette.secondary,
        analyticsPalette.primary,
        analyticsPalette.violet
      ],
      borderColor: [
        analyticsPalette.secondary,
        analyticsPalette.primary,
        analyticsPalette.violet
      ],
      borderWidth: 1
    }]
  }

  // Distribution chart
  const totalByContext = contexts.reduce((sum, ctx) => sum + data[ctx].total, 0)
  const distributionChartData = {
    labels: contexts.map(ctx => contextLabels[ctx] || ctx),
    datasets: [{
      data: contexts.map(ctx => data[ctx].total),
      backgroundColor: [
        analyticsPalette.secondary,
        analyticsPalette.primary,
        analyticsPalette.violet
      ],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  }

  // Sort by conversion rate
  const sortedContexts = [...contexts].sort((a, b) => 
    data[b].conversionRate - data[a].conversionRate
  )

  return (
    <div className={analyticsClasses.section}>
      <div className="space-y-3">
        <span className={analyticsClasses.eyebrow}>Source Quality</span>
        <div>
          <h3 className={analyticsClasses.title}>Context-Based Intelligence</h3>
          <p className={analyticsClasses.subtitle}>
            Compare how listings, developments, and the profile itself contribute to lead quality and close rate.
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className={analyticsClasses.subPanel}>
          <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Conversion by Context</h4>
          <div className="mt-4 h-72">
            <Bar
              data={conversionChartData}
              options={baseChartOptions({ showLegend: false, yMax: 100, yTitle: 'Conversion Rate (%)' })}
            />
          </div>
        </div>

        <div className={analyticsClasses.subPanel}>
          <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Lead Distribution by Context</h4>
          <div className="mt-4 h-72">
            <Doughnut
              data={distributionChartData}
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
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {sortedContexts.map(context => {
          const Icon = contextIcons[context] || Building2
          const stats = data[context]
          const percentage = totalByContext > 0 
            ? ((stats.total / totalByContext) * 100).toFixed(1)
            : 0
          
          return (
            <div key={context} className={analyticsClasses.compactCard}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`${analyticsClasses.iconWrap} ${context === 'listing' ? 'bg-sky-50 text-sky-700 ring-sky-100' : context === 'development' ? 'bg-teal-50 text-teal-700 ring-teal-100' : 'bg-indigo-50 text-indigo-700 ring-indigo-100'}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-primary_color">
                    {contextLabels[context]}
                  </h4>
                  <p className="text-sm text-primary_color/70">{formatPercent(percentage)} of total leads</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total Leads</p>
                  <p className="mt-2 text-xl font-semibold text-primary_color">{formatNumber(stats.total)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Closed</p>
                  <p className="mt-2 text-xl font-semibold text-primary_color">{formatNumber(stats.closed)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Conversion</p>
                  <p className="mt-2 text-xl font-semibold text-primary_color">
                    {formatPercent(stats.conversionRate)}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Avg Score</p>
                  <p className="mt-2 text-xl font-semibold text-primary_color">
                    {stats.avgLeadScore.toFixed(1)}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

