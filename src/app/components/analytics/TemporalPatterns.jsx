'use client'

import React from 'react'
import { Bar, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Calendar, Clock } from 'lucide-react'
import { analyticsClasses, analyticsPalette, baseChartOptions, formatNumber, formatPercent } from './analyticsTheme'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

export default function TemporalPatterns({ data }) {
  if (!data || !data.dayOfWeekPerformance || !data.hourOfDayPerformance) {
    return (
      <div className={analyticsClasses.section}>
        <div className={analyticsClasses.empty}>No temporal data available yet.</div>
      </div>
    )
  }

  const { dayOfWeekPerformance, hourOfDayPerformance } = data

  // Day of week chart
  const dayChartData = {
    labels: dayOfWeekPerformance.map(d => d.day),
    datasets: [
      {
        label: 'Total Leads',
        data: dayOfWeekPerformance.map(d => d.total),
        backgroundColor: analyticsPalette.secondarySoft,
        borderColor: analyticsPalette.secondary,
        borderWidth: 1
      },
      {
        label: 'Closed Leads',
        data: dayOfWeekPerformance.map(d => d.closed),
        backgroundColor: analyticsPalette.emeraldSoft,
        borderColor: analyticsPalette.emerald,
        borderWidth: 1
      }
    ]
  }

  // Hour of day chart
  const hourLabels = hourOfDayPerformance.map(h => {
    const hour = h.hour
    return hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`
  })
  
  const hourChartData = {
    labels: hourLabels,
    datasets: [
      {
        label: 'Total Leads',
        data: hourOfDayPerformance.map(h => h.total),
        borderColor: analyticsPalette.secondary,
        backgroundColor: analyticsPalette.secondarySoft,
        tension: 0.4,
        fill: true
      },
      {
        label: 'Conversion Rate (%)',
        data: hourOfDayPerformance.map(h => h.conversionRate),
        borderColor: analyticsPalette.primary,
        backgroundColor: analyticsPalette.primarySoft,
        tension: 0.4,
        fill: true,
        yAxisID: 'y1'
      }
    ]
  }

  const bestDayCandidates = dayOfWeekPerformance.filter(day => day.total > 0)
  const bestHourCandidates = hourOfDayPerformance.filter(hour => hour.total > 0)
  const bestDay = (bestDayCandidates.length > 0 ? bestDayCandidates : dayOfWeekPerformance)
    .slice()
    .sort((a, b) => b.conversionRate - a.conversionRate || b.total - a.total)[0]
  const bestHour = (bestHourCandidates.length > 0 ? bestHourCandidates : hourOfDayPerformance)
    .slice()
    .sort((a, b) => b.conversionRate - a.conversionRate || b.total - a.total)[0]

  return (
    <div className={analyticsClasses.section}>
      <div className="space-y-3">
        <span className={analyticsClasses.eyebrow}>Timing Insights</span>
        <div>
          <h3 className={analyticsClasses.title}>Temporal Patterns & Timing</h3>
          <p className={analyticsClasses.subtitle}>
            See when leads arrive and when conversion efficiency is strongest so follow-up windows are easier to spot.
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className={analyticsClasses.subPanel}>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
            <Calendar className="h-4 w-4 text-sky-600" />
            Day of Week Performance
          </h4>
          <div className="h-80">
            <Bar
              data={dayChartData}
              options={baseChartOptions({ yTitle: 'Lead Count' })}
            />
          </div>
        </div>

        <div className={analyticsClasses.subPanel}>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
            <Clock className="h-4 w-4 text-teal-600" />
            Hour of Day Performance
          </h4>
          <div className="h-80">
            <Line
              data={hourChartData}
              options={baseChartOptions({
                yTitle: 'Lead Count',
                secondaryAxis: {
                  title: 'Conversion Rate (%)',
                  max: 100
                }
              })}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-sky-100 bg-sky-50/70 p-5">
          <h5 className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-700">Best Performing Day</h5>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-primary_color">{bestDay?.day || 'N/A'}</p>
          <div className="mt-3 space-y-1">
            <p className="text-sm text-primary_color/70">
              <span className="font-medium text-primary_color">{formatNumber(bestDay?.total || 0)}</span> total leads
            </p>
            <p className="text-sm text-primary_color/70">
              <span className="font-medium text-primary_color">
                {formatPercent(bestDay?.conversionRate || 0)}
              </span>{' '}
              conversion rate
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-teal-100 bg-teal-50/70 p-5">
          <h5 className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">Best Performing Hour</h5>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-primary_color">
            {bestHour ? (bestHour.hour === 0 ? '12 AM' : bestHour.hour < 12 ? `${bestHour.hour} AM` : bestHour.hour === 12 ? '12 PM' : `${bestHour.hour - 12} PM`) : 'N/A'}
          </p>
          <div className="mt-3 space-y-1">
            <p className="text-sm text-primary_color/70">
              <span className="font-medium text-primary_color">{formatNumber(bestHour?.total || 0)}</span> total leads
            </p>
            <p className="text-sm text-primary_color/70">
              <span className="font-medium text-primary_color">
                {formatPercent(bestHour?.conversionRate || 0)}
              </span>{' '}
              conversion rate
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Day of Week Breakdown</h4>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
          {dayOfWeekPerformance.map(day => (
            <div key={day.day} className={`${analyticsClasses.compactCard} text-center`}>
              <p className="text-sm font-semibold text-primary_color">{day.day.substring(0, 3)}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-primary_color">{formatNumber(day.total)}</p>
              <p className="mt-1 text-xs text-primary_color/70">{formatPercent(day.conversionRate)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

