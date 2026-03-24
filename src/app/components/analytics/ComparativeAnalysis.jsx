'use client'

import React, { useState, useEffect } from 'react'
import { Line, Bar } from 'react-chartjs-2'
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
import { TrendingUp, TrendingDown, ArrowUp, ArrowDown } from 'lucide-react'
import { DateRangePicker } from '@/app/components/ui/date-range-picker'
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

export default function ComparativeAnalysis({ listerId, listerType }) {
  const [currentData, setCurrentData] = useState(null)
  const [previousData, setPreviousData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date()
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    return {
      startDate: startOfMonth.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    }
  })

  useEffect(() => {
    async function fetchData() {
      if (!listerId || !dateRange.startDate || !dateRange.endDate) return

      setLoading(true)
      try {
        // Calculate previous period
        const currentStart = new Date(dateRange.startDate)
        const currentEnd = new Date(dateRange.endDate)
        const periodDays = Math.ceil((currentEnd - currentStart) / (1000 * 60 * 60 * 24))
        
        const previousEnd = new Date(currentStart)
        previousEnd.setDate(previousEnd.getDate() - 1)
        const previousStart = new Date(previousEnd)
        previousStart.setDate(previousStart.getDate() - periodDays)

        // Fetch current period
        const currentParams = new URLSearchParams({
          lister_id: listerId,
          lister_type: listerType,
          date_from: dateRange.startDate,
          date_to: dateRange.endDate
        })

        // Fetch previous period
        const previousParams = new URLSearchParams({
          lister_id: listerId,
          lister_type: listerType,
          date_from: previousStart.toISOString().split('T')[0],
          date_to: previousEnd.toISOString().split('T')[0]
        })

        const [currentRes, previousRes] = await Promise.all([
          fetch(`/api/leads/analytics?${currentParams.toString()}`),
          fetch(`/api/leads/analytics?${previousParams.toString()}`)
        ])

        const currentResult = await currentRes.json()
        const previousResult = await previousRes.json()

        if (currentResult.success) {
          setCurrentData(currentResult.data)
        }
        if (previousResult.success) {
          setPreviousData(previousResult.data)
        }
      } catch (error) {
        console.error('Error fetching comparative data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [listerId, listerType, dateRange])

  if (loading) {
    return (
      <div className={analyticsClasses.section}>
        <div className={analyticsClasses.empty}>Loading comparative data...</div>
      </div>
    )
  }

  if (!currentData || !previousData) {
    return (
      <div className={analyticsClasses.section}>
        <div className={analyticsClasses.empty}>No comparative data available yet.</div>
      </div>
    )
  }

  const currentMetrics = currentData.predictiveMetrics
  const previousMetrics = previousData.predictiveMetrics

  // Calculate changes
  const calculateChange = (current, previous) => {
    if (!previous || previous === 0) return { value: current, percentage: current > 0 ? 100 : 0 }
    const change = current - previous
    const percentage = (change / previous) * 100
    return { value: change, percentage }
  }

  const totalLeadsChange = calculateChange(
    currentMetrics?.totalLeads || 0,
    previousMetrics?.totalLeads || 0
  )
  const conversionRateChange = calculateChange(
    currentMetrics?.overallConversionRate || 0,
    previousMetrics?.overallConversionRate || 0
  )
  const avgScoreChange = calculateChange(
    currentMetrics?.avgLeadScore || 0,
    previousMetrics?.avgLeadScore || 0
  )
  const closedChange = calculateChange(
    currentMetrics?.totalClosed || 0,
    previousMetrics?.totalClosed || 0
  )

  // Comparison chart
  const comparisonChartData = {
    labels: ['Total Leads', 'Closed Leads', 'Conversion Rate', 'Avg Lead Score'],
    datasets: [
      {
        label: 'Current Period',
        data: [
          currentMetrics?.totalLeads || 0,
          currentMetrics?.totalClosed || 0,
          currentMetrics?.overallConversionRate || 0,
          currentMetrics?.avgLeadScore || 0
        ],
        backgroundColor: analyticsPalette.secondary,
        borderColor: analyticsPalette.secondary,
        borderWidth: 1
      },
      {
        label: 'Previous Period',
        data: [
          previousMetrics?.totalLeads || 0,
          previousMetrics?.totalClosed || 0,
          previousMetrics?.overallConversionRate || 0,
          previousMetrics?.avgLeadScore || 0
        ],
        backgroundColor: analyticsPalette.slate,
        borderColor: analyticsPalette.slate,
        borderWidth: 1
      }
    ]
  }

  const MetricCard = ({ title, current, previous, change, unit = '', isPercentage = false }) => {
    const isPositive = change.percentage >= 0
    const ChangeIcon = isPositive ? ArrowUp : ArrowDown

    return (
      <div className={analyticsClasses.compactCard}>
        <p className="text-sm text-slate-500 mb-1">{title}</p>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-semibold tracking-tight text-primary_color">
              {isPercentage ? current.toFixed(1) : formatNumber(current)}{unit}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Previous: {isPercentage ? previous.toFixed(1) : formatNumber(previous)}{unit}
            </p>
          </div>
          <div className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            <ChangeIcon className="h-4 w-4" />
            <span className="text-sm font-semibold">
              {isPositive ? '+' : ''}{change.percentage.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={analyticsClasses.section}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <span className={analyticsClasses.eyebrow}>Trend Delta</span>
          <div>
            <h3 className={analyticsClasses.title}>Period-over-Period Comparison</h3>
            <p className={analyticsClasses.subtitle}>
              Compare the selected period with the immediately preceding period using the same dashboard language.
            </p>
          </div>
        </div>
        <DateRangePicker
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onChange={setDateRange}
          className="w-[280px]"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total Leads"
          current={currentMetrics?.totalLeads || 0}
          previous={previousMetrics?.totalLeads || 0}
          change={totalLeadsChange}
        />
        <MetricCard
          title="Closed Leads"
          current={currentMetrics?.totalClosed || 0}
          previous={previousMetrics?.totalClosed || 0}
          change={closedChange}
        />
        <MetricCard
          title="Conversion Rate"
          current={currentMetrics?.overallConversionRate || 0}
          previous={previousMetrics?.overallConversionRate || 0}
          change={conversionRateChange}
          unit="%"
          isPercentage={true}
        />
        <MetricCard
          title="Avg Lead Score"
          current={currentMetrics?.avgLeadScore || 0}
          previous={previousMetrics?.avgLeadScore || 0}
          change={avgScoreChange}
        />
      </div>

      <div className="mt-6 rounded-3xl border border-slate-200/80 bg-slate-50/70 p-5">
        <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Metrics Comparison</h4>
        <div className="mt-4 h-80">
          <Bar
            data={comparisonChartData}
            options={baseChartOptions({ yTitle: 'Metric Value' })}
          />
        </div>
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Channel Performance Changes</h4>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          {Object.keys(currentData.channelPerformance || {}).map(channel => {
            const current = currentData.channelPerformance[channel]
            const previous = previousData.channelPerformance?.[channel] || { conversionRate: 0 }
            const change = calculateChange(current.conversionRate, previous.conversionRate)
            const isPositive = change.percentage >= 0

            return (
              <div key={channel} className={analyticsClasses.compactCard}>
                <p className="text-sm font-semibold text-primary_color mb-2 capitalize">
                  {channel.replace('_', ' ')}
                </p>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Current</span>
                    <span className="text-sm font-semibold text-primary_color">{formatPercent(current.conversionRate)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Previous</span>
                    <span className="text-sm text-slate-500">{formatPercent(previous.conversionRate)}</span>
                  </div>
                  <div className={`flex items-center gap-1 pt-2 border-t border-slate-200 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                    <span className="text-xs font-semibold">
                      {isPositive ? '+' : ''}{change.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

