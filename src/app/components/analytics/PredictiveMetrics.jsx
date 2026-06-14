'use client'

import React from 'react'
import { Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { TrendingUp, Target, AlertCircle, CheckCircle } from 'lucide-react'
import { analyticsClasses, analyticsPalette, baseChartOptions, formatNumber, formatPercent } from './analyticsTheme'

ChartJS.register(
  ArcElement,
  Title,
  Tooltip,
  Legend
)

export default function PredictiveMetrics({ data }) {
  if (!data) {
    return (
      <div className={analyticsClasses.section}>
        <div className={analyticsClasses.empty}>No predictive metrics available yet.</div>
      </div>
    )
  }

  const {
    totalLeads = 0,
    totalClosed = 0,
    overallConversionRate = 0,
    avgLeadScore = 0,
    pipelineHealth = {}
  } = data

  const pipelineSegments = [
    { label: 'New', value: pipelineHealth?.new || 0, color: analyticsPalette.secondary },
    { label: 'In Progress', value: pipelineHealth?.inProgress || 0, color: analyticsPalette.amber },
    { label: 'Closed', value: pipelineHealth?.closed || 0, color: analyticsPalette.emerald },
    { label: 'Lost', value: pipelineHealth?.lost || 0, color: analyticsPalette.rose },
  ]
  if ((pipelineHealth?.unspecified || 0) > 0) {
    pipelineSegments.push({
      label: 'Unspecified',
      value: pipelineHealth.unspecified,
      color: analyticsPalette.slate,
    })
  }

  const pipelineChartData = {
    labels: pipelineSegments.map((s) => s.label),
    datasets: [{
      data: pipelineSegments.map((s) => s.value),
      backgroundColor: pipelineSegments.map((s) => s.color),
      borderWidth: 2,
      borderColor: '#fff',
    }],
  }

  const totalPipeline = pipelineSegments.reduce((a, s) => a + s.value, 0)
  const pipelinePercentages = pipelineSegments.map((s) =>
    totalPipeline > 0 ? ((s.value / totalPipeline) * 100).toFixed(1) : 0
  )

  // Calculate health score
  const closedPercentage = totalPipeline > 0 
    ? ((pipelineHealth?.closed || 0) / totalPipeline) * 100 
    : 0
  const lostPercentage = totalPipeline > 0 
    ? ((pipelineHealth?.lost || 0) / totalPipeline) * 100 
    : 0
  
  let healthStatus = 'healthy'
  let healthStatusClass = 'border-emerald-100 bg-emerald-50/70'
  let healthTextClass = 'text-green-600'
  let healthMessage = 'Pipeline is healthy with good conversion rates'
  
  if (lostPercentage > 30) {
    healthStatus = 'critical'
    healthStatusClass = 'border-rose-100 bg-rose-50/70'
    healthTextClass = 'text-red-600'
    healthMessage = 'High percentage of lost leads - review follow-up process'
  } else if (lostPercentage > 20) {
    healthStatus = 'warning'
    healthStatusClass = 'border-amber-100 bg-amber-50/70'
    healthTextClass = 'text-yellow-600'
    healthMessage = 'Moderate percentage of lost leads - improve engagement'
  }

  return (
    <div className={analyticsClasses.section}>
      <div className="space-y-3">
        <span className={analyticsClasses.eyebrow}>Forecast View</span>
        <div>
          <h3 className={analyticsClasses.title}>Predictive & Actionable Metrics</h3>
          <p className={analyticsClasses.subtitle}>
            A tighter look at pipeline balance, lead quality, and whether your current mix points to healthy outcomes.
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_0.95fr]">
        <div className={analyticsClasses.subPanel}>
          <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Pipeline Health</h4>
          <div className="mt-4 h-72">
            <Doughnut
              data={pipelineChartData}
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

        <div className="space-y-4">
          <div className={analyticsClasses.compactCard}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">Overall Conversion Rate</span>
              <TrendingUp className="h-5 w-5 text-sky-600" />
            </div>
            <p className="text-3xl font-semibold tracking-tight text-primary_color">
              {formatPercent(overallConversionRate)}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              {formatNumber(totalClosed)} closed out of {formatNumber(totalLeads)} total leads
            </p>
          </div>

          <div className={analyticsClasses.compactCard}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">Average Lead Score</span>
              <Target className="h-5 w-5 text-indigo-600" />
            </div>
            <p className="text-3xl font-semibold tracking-tight text-primary_color">
              {avgLeadScore.toFixed(1)}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Higher scores indicate better quality leads
            </p>
          </div>

          <div className={`border ${healthStatusClass} rounded-lg p-4`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">Pipeline Status</span>
              {healthStatus === 'healthy' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className={`h-5 w-5 ${healthTextClass}`} />
              )}
            </div>
            <p className={`text-lg font-semibold ${healthTextClass} capitalize`}>
              {healthStatus}
            </p>
            <p className="mt-2 text-xs text-primary_color/70">
              {healthMessage}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Pipeline Breakdown</h4>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {pipelineSegments.map((segment, index) => (
            <div
              key={segment.label}
              className={`rounded-3xl border p-4 ${
                index === 0
                  ? 'border-sky-100 bg-sky-50/70'
                  : index === 1
                    ? 'border-amber-100 bg-amber-50/70'
                    : index === 2
                      ? 'border-emerald-100 bg-emerald-50/70'
                      : index === 3
                        ? 'border-rose-100 bg-rose-50/70'
                        : 'border-slate-200 bg-slate-50/70'
              }`}
            >
              <p className="text-sm text-primary_color/70">{segment.label}</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-primary_color">
                {formatNumber(segment.value)}
              </p>
              <p className="mt-1 text-xs text-primary_color/70">
                {formatPercent(pipelinePercentages[index])} of pipeline
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

