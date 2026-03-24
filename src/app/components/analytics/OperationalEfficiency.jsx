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
import { Clock, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react'
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

export default function OperationalEfficiency({ data }) {
  if (!data) {
    return (
      <div className={analyticsClasses.section}>
        <div className={analyticsClasses.empty}>No efficiency data available yet.</div>
      </div>
    )
  }

  const {
    avgResponseTime,
    avgTimeToConversion,
    abandonmentRate,
    coldLeadRate,
    responseTimeDistribution
  } = data

  // Response time distribution
  const responseTimeLabels = ['Under 1 Hour', 'Under 24 Hours', 'Over 24 Hours']
  const responseTimeValues = [
    responseTimeDistribution?.under1Hour || 0,
    responseTimeDistribution?.under24Hours || 0,
    responseTimeDistribution?.over24Hours || 0
  ]

  const responseTimeChartData = {
    labels: responseTimeLabels,
    datasets: [{
      data: responseTimeValues,
      backgroundColor: [
        analyticsPalette.emerald,
        analyticsPalette.amber,
        analyticsPalette.rose
      ],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  }

  const totalResponses = responseTimeValues.reduce((a, b) => a + b, 0)
  const responsePercentages = responseTimeValues.map(v => 
    totalResponses > 0 ? ((v / totalResponses) * 100).toFixed(1) : 0
  )

  // Determine response time status
  let responseStatus = 'excellent'
  let responseStatusClass = 'border-emerald-100 bg-emerald-50/70'
  let responseTextClass = 'text-green-600'
  let responseMessage = 'Excellent response time - keep it up!'
  
  if (avgResponseTime > 24) {
    responseStatus = 'poor'
    responseStatusClass = 'border-rose-100 bg-rose-50/70'
    responseTextClass = 'text-red-600'
    responseMessage = 'Response time is too slow - aim for under 1 hour'
  } else if (avgResponseTime > 12) {
    responseStatus = 'needs improvement'
    responseStatusClass = 'border-amber-100 bg-amber-50/70'
    responseTextClass = 'text-yellow-600'
    responseMessage = 'Response time could be improved - target under 12 hours'
  }

  // Determine abandonment status
  let abandonmentStatus = 'low'
  let abandonmentStatusClass = 'border-emerald-100 bg-emerald-50/70'
  let abandonmentTextClass = 'text-green-600'
  let abandonmentMessage = 'Low abandonment rate - good retention'
  
  if (abandonmentRate > 20) {
    abandonmentStatus = 'high'
    abandonmentStatusClass = 'border-rose-100 bg-rose-50/70'
    abandonmentTextClass = 'text-red-600'
    abandonmentMessage = 'High abandonment rate - review follow-up process'
  } else if (abandonmentRate > 10) {
    abandonmentStatus = 'moderate'
    abandonmentStatusClass = 'border-amber-100 bg-amber-50/70'
    abandonmentTextClass = 'text-yellow-600'
    abandonmentMessage = 'Moderate abandonment - improve engagement'
  }

  return (
    <div className={analyticsClasses.section}>
      <div className="space-y-3">
        <span className={analyticsClasses.eyebrow}>Execution Quality</span>
        <div>
          <h3 className={analyticsClasses.title}>Operational Efficiency</h3>
          <p className={analyticsClasses.subtitle}>
            Measure responsiveness, conversion speed, and whether leads are being kept warm through the process.
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_0.95fr]">
        <div className={analyticsClasses.subPanel}>
          <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Response Time Distribution</h4>
          <div className="mt-4 h-72">
            <Doughnut
              data={responseTimeChartData}
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
              <span className="text-sm text-slate-500">Avg Response Time</span>
              <Clock className="h-5 w-5 text-sky-600" />
            </div>
            <p className="text-3xl font-semibold tracking-tight text-primary_color">
              {avgResponseTime > 0 ? `${avgResponseTime.toFixed(1)} hrs` : 'N/A'}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Time from lead creation to first contact
            </p>
          </div>

          <div className={analyticsClasses.compactCard}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">Avg Time to Conversion</span>
              <TrendingDown className="h-5 w-5 text-indigo-600" />
            </div>
            <p className="text-3xl font-semibold tracking-tight text-primary_color">
              {avgTimeToConversion > 0 ? `${avgTimeToConversion.toFixed(1)} days` : 'N/A'}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Average days from first action to closed
            </p>
          </div>

          <div className={`border ${responseStatusClass} rounded-lg p-4`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">Response Status</span>
              {responseStatus === 'excellent' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className={`h-5 w-5 ${responseTextClass}`} />
              )}
            </div>
            <p className={`text-lg font-semibold ${responseTextClass} capitalize`}>
              {responseStatus}
            </p>
            <p className="mt-2 text-xs text-primary_color/70">
              {responseMessage}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className={analyticsClasses.compactCard}>
          <h5 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Response Time Breakdown</h5>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-primary_color/70">Under 1 Hour</span>
              <span className="font-semibold text-primary_color">
                {formatNumber(responseTimeDistribution?.under1Hour || 0)} ({formatPercent(responsePercentages[0])})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-primary_color/70">Under 24 Hours</span>
              <span className="font-semibold text-primary_color">
                {formatNumber(responseTimeDistribution?.under24Hours || 0)} ({formatPercent(responsePercentages[1])})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-primary_color/70">Over 24 Hours</span>
              <span className="font-semibold text-primary_color">
                {formatNumber(responseTimeDistribution?.over24Hours || 0)} ({formatPercent(responsePercentages[2])})
              </span>
            </div>
          </div>
        </div>

        <div className={analyticsClasses.compactCard}>
          <h5 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Lead Retention</h5>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-primary_color/70">Abandonment Rate</span>
              <span className={`font-semibold ${abandonmentTextClass}`}>
                {formatPercent(abandonmentRate)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-primary_color/70">Cold Lead Rate</span>
              <span className="font-semibold text-primary_color">
                {formatPercent(coldLeadRate)}
              </span>
            </div>
            <div className={`mt-3 p-3 ${abandonmentStatusClass} border rounded`}>
              <p className="text-xs text-primary_color/70">
                {abandonmentMessage}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

