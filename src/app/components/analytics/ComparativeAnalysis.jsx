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
      <div className="default_bg rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Comparative Analysis</h3>
        <div className="text-center text-gray-500 py-8">Loading...</div>
      </div>
    )
  }

  if (!currentData || !previousData) {
    return (
      <div className="default_bg rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Comparative Analysis</h3>
        <div className="text-center text-gray-500 py-8">No comparative data available</div>
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
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
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
        backgroundColor: 'rgba(156, 163, 175, 0.8)',
        borderColor: 'rgb(156, 163, 175)',
        borderWidth: 1
      }
    ]
  }

  const MetricCard = ({ title, current, previous, change, unit = '', isPercentage = false }) => {
    const isPositive = change.percentage >= 0
    const ChangeIcon = isPositive ? ArrowUp : ArrowDown

    return (
      <div className="border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {isPercentage ? current.toFixed(1) : current.toLocaleString()}{unit}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Previous: {isPercentage ? previous.toFixed(1) : previous.toLocaleString()}{unit}
            </p>
          </div>
          <div className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            <ChangeIcon className="w-4 h-4" />
            <span className="text-sm font-semibold">
              {isPositive ? '+' : ''}{change.percentage.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="default_bg rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Period-over-Period Comparison</h3>
        <DateRangePicker
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onChange={setDateRange}
          className="w-[280px]"
        />
      </div>

      {/* Key Metrics Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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

      {/* Comparison Chart */}
      <div className="mb-6">
        <h4 className="text-md font-semibold mb-3">Metrics Comparison</h4>
        <div className="h-80">
          <Bar
            data={comparisonChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top'
                }
              },
              scales: {
                y: {
                  beginAtZero: true
                }
              }
            }}
          />
        </div>
      </div>

      {/* Channel Performance Comparison */}
      <div className="mt-6">
        <h4 className="text-md font-semibold mb-3">Channel Performance Changes</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {Object.keys(currentData.channelPerformance || {}).map(channel => {
            const current = currentData.channelPerformance[channel]
            const previous = previousData.channelPerformance?.[channel] || { conversionRate: 0 }
            const change = calculateChange(current.conversionRate, previous.conversionRate)
            const isPositive = change.percentage >= 0

            return (
              <div key={channel} className="border border-gray-200 rounded-lg p-3">
                <p className="text-sm font-semibold text-gray-900 mb-2 capitalize">
                  {channel.replace('_', ' ')}
                </p>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Current</span>
                    <span className="text-sm font-semibold">{current.conversionRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Previous</span>
                    <span className="text-sm text-gray-500">{previous.conversionRate.toFixed(1)}%</span>
                  </div>
                  <div className={`flex items-center gap-1 pt-1 border-t border-gray-200 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {isPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
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

