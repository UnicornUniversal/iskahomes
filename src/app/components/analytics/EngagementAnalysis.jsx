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
import { Activity, Target, TrendingUp } from 'lucide-react'
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

export default function EngagementAnalysis({ data }) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className={analyticsClasses.section}>
        <div className={analyticsClasses.empty}>No engagement data available yet.</div>
      </div>
    )
  }

  const engagementTypes = Object.keys(data)
  
  if (engagementTypes.length === 0) {
    return (
      <div className={analyticsClasses.section}>
        <div className={analyticsClasses.empty}>No engagement data available yet.</div>
      </div>
    )
  }

  const labels = {
    singleAction: 'Single Action',
    multiAction: 'Multi Action (2)',
    highEngagement: 'High Engagement (3+)'
  }

  // Conversion rate comparison
  const conversionChartData = {
    labels: engagementTypes.map(type => labels[type] || type),
    datasets: [{
      label: 'Conversion Rate (%)',
      data: engagementTypes.map(type => data[type].conversionRate),
      backgroundColor: [
        analyticsPalette.rose,
        analyticsPalette.amber,
        analyticsPalette.emerald
      ],
      borderColor: [
        analyticsPalette.rose,
        analyticsPalette.amber,
        analyticsPalette.emerald
      ],
      borderWidth: 1
    }]
  }

  // Distribution
  const totalLeads = engagementTypes.reduce((sum, type) => sum + data[type].total, 0)
  const distributionChartData = {
    labels: engagementTypes.map(type => labels[type] || type),
    datasets: [{
      data: engagementTypes.map(type => data[type].total),
      backgroundColor: [
        analyticsPalette.rose,
        analyticsPalette.amber,
        analyticsPalette.emerald
      ],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  }

  const singleActionRate = data.singleAction?.conversionRate || 0
  const highEngagementRate = data.highEngagement?.conversionRate || 0
  const uplift =
    singleActionRate > 0 ? ((highEngagementRate / singleActionRate - 1) * 100).toFixed(0) : null

  return (
    <div className={analyticsClasses.section}>
      <div className="space-y-3">
        <span className={analyticsClasses.eyebrow}>Behavior Signals</span>
        <div>
          <h3 className={analyticsClasses.title}>Engagement & Behavior</h3>
          <p className={analyticsClasses.subtitle}>
            Understand whether single-touch leads or multi-touch conversations are driving stronger outcomes.
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className={analyticsClasses.subPanel}>
          <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Conversion by Engagement</h4>
          <div className="mt-4 h-72">
            <Bar
              data={conversionChartData}
              options={baseChartOptions({ showLegend: false, yMax: 100, yTitle: 'Conversion Rate (%)' })}
            />
          </div>
        </div>

        <div className={analyticsClasses.subPanel}>
          <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Lead Distribution by Engagement</h4>
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
        {engagementTypes.map(type => {
          const stats = data[type]
          const percentage = totalLeads > 0 
            ? ((stats.total / totalLeads) * 100).toFixed(1)
            : 0
          
          const iconColor = type === 'highEngagement' ? 'text-green-600' 
            : type === 'multiAction' ? 'text-yellow-600' 
            : 'text-red-600'
          
          const bgColor = type === 'highEngagement' ? 'bg-green-50' 
            : type === 'multiAction' ? 'bg-yellow-50' 
            : 'bg-red-50'
          
          return (
            <div key={type} className={analyticsClasses.compactCard}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`${analyticsClasses.iconWrap} ${bgColor} ring-1 ring-inset ring-slate-100`}>
                  {type === 'highEngagement' ? (
                    <Activity className={`h-5 w-5 ${iconColor}`} />
                  ) : type === 'multiAction' ? (
                    <Target className={`h-5 w-5 ${iconColor}`} />
                  ) : (
                    <TrendingUp className={`h-5 w-5 ${iconColor}`} />
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-primary_color">
                    {labels[type] || type}
                  </h4>
                  <p className="text-sm text-slate-500">{formatPercent(percentage)} of total leads</p>
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
                <div className="col-span-2 rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Conversion Rate</p>
                  <p className="mt-2 text-xl font-semibold text-primary_color">
                    {formatPercent(stats.conversionRate)}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 rounded-3xl border border-sky-100 bg-sky-50/70 p-5">
        <h5 className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-700">Key Insight</h5>
        <p className="mt-3 text-sm leading-6 text-primary_color/70">
          {data.highEngagement && highEngagementRate > singleActionRate && uplift !== null ? (
            <>
              High engagement leads (3+ actions) convert at{' '}
              <span className="font-semibold text-primary_color">{formatPercent(highEngagementRate)}</span>, which is{' '}
              <span className="font-semibold text-primary_color">{uplift}%</span> higher than single-action leads.
            </>
          ) : (
            'Engage with leads multiple times to improve conversion rates.'
          )}
        </p>
      </div>
    </div>
  )
}

