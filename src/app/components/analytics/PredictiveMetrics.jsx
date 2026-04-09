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

  // Pipeline health chart
  const pipelineLabels = ['New', 'In Progress', 'Closed', 'Lost']
  const pipelineValues = [
    pipelineHealth?.new || 0,
    pipelineHealth?.inProgress || 0,
    pipelineHealth?.closed || 0,
    pipelineHealth?.lost || 0
  ]

  const pipelineChartData = {
    labels: pipelineLabels,
    datasets: [{
      data: pipelineValues,
      backgroundColor: [
        analyticsPalette.secondary,
        analyticsPalette.amber,
        analyticsPalette.emerald,
        analyticsPalette.rose
      ],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  }

  const totalPipeline = pipelineValues.reduce((a, b) => a + b, 0)
  const pipelinePercentages = pipelineValues.map(v => 
    totalPipeline > 0 ? ((v / totalPipeline) * 100).toFixed(1) : 0
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
          <div className="rounded-3xl border border-sky-100 bg-sky-50/70 p-4">
            <p className="text-sm text-primary_color/70">New Leads</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-primary_color">
              {formatNumber(pipelineHealth?.new || 0)}
            </p>
            <p className="mt-1 text-xs text-primary_color/70">
              {formatPercent(pipelinePercentages[0])} of pipeline
            </p>
          </div>

          <div className="rounded-3xl border border-amber-100 bg-amber-50/70 p-4">
            <p className="text-sm text-primary_color/70">In Progress</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-primary_color">
              {formatNumber(pipelineHealth?.inProgress || 0)}
            </p>
            <p className="mt-1 text-xs text-primary_color/70">
              {formatPercent(pipelinePercentages[1])} of pipeline
            </p>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-4">
            <p className="text-sm text-primary_color/70">Closed</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-primary_color">
              {formatNumber(pipelineHealth?.closed || 0)}
            </p>
            <p className="mt-1 text-xs text-primary_color/70">
              {formatPercent(pipelinePercentages[2])} of pipeline
            </p>
          </div>

          <div className="rounded-3xl border border-rose-100 bg-rose-50/70 p-4">
            <p className="text-sm text-primary_color/70">Lost</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-primary_color">
              {formatNumber(pipelineHealth?.lost || 0)}
            </p>
            <p className="mt-1 text-xs text-primary_color/70">
              {formatPercent(pipelinePercentages[3])} of pipeline
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

