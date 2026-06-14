'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Pie } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Title
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Title)

const pieColors = [
  '#1e3a5f',
  '#2d6a9f',
  '#4a90c4',
  '#7eb8da',
  '#f59e0b',
  '#10b981',
  '#8b5cf6',
  '#ec4899'
]

function BreakdownPie({ title, items }) {
  if (!items?.length) {
    return (
      <div className="p-4 sm:p-6 secondary_bg rounded-2xl border border-gray-100 flex items-center justify-center min-h-[300px]">
        <p className="text-sm text-primary_color/60">No {title.toLowerCase()} data</p>
      </div>
    )
  }

  const total = items.reduce((sum, item) => sum + item.count, 0)
  const pieLabels = items.map((item) => item.name)
  const pieData = items.map((item) => item.count)
  const percentages = pieData.map((v) => ((v / total) * 100).toFixed(1))

  const chartData = {
    labels: pieLabels,
    datasets: [
      {
        label: 'Sales',
        data: pieData,
        backgroundColor: pieColors.slice(0, pieLabels.length),
        borderWidth: 0,
        hoverOffset: 12
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    cutout: '70%',
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: title,
        font: { size: 13 },
        color: 'var(--primary-color, #1e3a5f)',
        padding: { bottom: 16 }
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const label = ctx.label || ''
            const value = ctx.parsed || 0
            const percent = ((value / total) * 100).toFixed(1)
            return ` ${label}: ${value} (${percent}%)`
          }
        }
      }
    }
  }

  return (
    <div className="p-4 sm:p-6 secondary_bg rounded-2xl border border-gray-100 flex flex-col items-center">
      <div className="w-full max-w-sm flex flex-col items-center">
        <div className="relative w-full flex justify-center">
          <Pie data={chartData} options={chartOptions} style={{ maxHeight: '200px', width: '200px' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            <span className="text-sm font-bold text-primary_color">{total}</span>
            <span className="text-xs text-primary_color/60">Total</span>
          </div>
        </div>
        <div className="mt-6 w-full grid grid-cols-1 gap-2">
          {pieLabels.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <span
                className="inline-block rounded-full flex-shrink-0"
                style={{ width: 10, height: 10, background: pieColors[i] }}
              />
              <span className="text-xs font-medium text-primary_color flex-1 truncate">{label}</span>
              <span className="text-xs font-semibold text-primary_color/80 flex-shrink-0">
                {pieData[i]} ({percentages[i]}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Reusable sales breakdown by purpose (sale/rent), property types, and subtypes.
 * Works for developer (slug), agency (user_id + account_type=agency), and agent (user_id + account_type=agent).
 */
export default function SalesPropertyBreakdown({
  accountId,
  accountType = 'developer',
  slug = null,
  dateFrom = null,
  dateTo = null,
  className = ''
}) {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState(null)

  const fetchSummary = useCallback(async () => {
    const hasDeveloperSlug = accountType === 'developer' && slug
    const hasAccountId = Boolean(accountId)
    if (!hasDeveloperSlug && !hasAccountId) return

    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (hasAccountId) params.append('user_id', accountId)
      if (slug) params.append('slug', slug)
      if (accountType) params.append('account_type', accountType)
      if (dateFrom) params.append('date_from', dateFrom)
      if (dateTo) params.append('date_to', dateTo)

      const response = await fetch(`/api/sales/summary?${params.toString()}`)
      const result = await response.json()
      if (result.success) {
        setSummary(result.data?.summary || null)
      } else {
        setSummary(null)
      }
    } catch (error) {
      console.error('Error fetching sales property breakdown:', error)
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }, [accountId, accountType, slug, dateFrom, dateTo])

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  const purposeData = useMemo(() => {
    if (!summary?.by_purpose) return []
    return Object.values(summary.by_purpose)
      .map((item) => ({ name: item.name || 'Unknown', count: item.count || 0 }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count)
  }, [summary])

  const typeData = useMemo(() => {
    if (!summary?.by_type_property) return []
    return Object.values(summary.by_type_property)
      .map((item) => ({ name: item.name || 'Unknown', count: item.count || 0 }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count)
  }, [summary])

  const subtypeData = useMemo(() => {
    if (!summary?.by_subtype) return []
    return Object.values(summary.by_subtype)
      .map((item) => ({ name: item.name || 'Unknown', count: item.count || 0 }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count)
  }, [summary])

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary_color" />
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      <BreakdownPie title="Sales by Purpose" items={purposeData} />
      <BreakdownPie title="Sales by Property Type" items={typeData} />
      <BreakdownPie title="Sales by Subtype" items={subtypeData} />
    </div>
  )
}
