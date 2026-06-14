'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Trophy, Users, BarChart3, Home, Wallet, Clock } from 'lucide-react'
import { DateRangePicker } from '@/app/components/ui/date-range-picker'
import { formatCurrency } from '@/lib/utils'
import DataCard from '@/app/components/developers/DataCard'
import SalesPropertyBreakdown from '@/app/components/analytics/SalesPropertyBreakdown'

const getDefaultDateRange = () => {
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  return {
    startDate: startOfMonth.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0]
  }
}

const formatSaleType = (type) => {
  if (!type) return 'Other'
  return String(type).replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

export default function AgencySalesAnalytics({ agencyId, currency = 'GHS' }) {
  const [dateRange, setDateRange] = useState(getDefaultDateRange)
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState(null)

  const fetchAnalytics = useCallback(async () => {
    if (!agencyId || !dateRange.startDate || !dateRange.endDate) return

    setLoading(true)
    try {
      const params = new URLSearchParams({
        agency_id: agencyId,
        date_from: dateRange.startDate,
        date_to: dateRange.endDate
      })
      const response = await fetch(`/api/sales/agency-analytics?${params.toString()}`)
      const result = await response.json()
      if (result.success) {
        setAnalytics(result.data)
      } else {
        setAnalytics(null)
      }
    } catch (error) {
      console.error('Error fetching agency sales analytics:', error)
      setAnalytics(null)
    } finally {
      setLoading(false)
    }
  }, [agencyId, dateRange.startDate, dateRange.endDate])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const topAgent = analytics?.topAgents?.[0] || null
  const summary = analytics?.summary || { totalSales: 0, totalRevenue: 0, averageSalePrice: 0 }
  const commission = analytics?.commission || {
    totalCommissionPaid: 0,
    totalCommissionToBePaid: 0,
    totalCommissionPendingOnSales: 0,
    totalCommissionExpectedOnActive: 0
  }

  const summaryCards = useMemo(() => [
    {
      title: 'Sales in Range',
      value: (summary.totalSales || 0).toLocaleString(),
      icon: BarChart3
    },
    {
      title: 'Revenue in Range',
      value: formatCurrency(summary.totalRevenue || 0, currency),
      icon: Trophy
    },
    {
      title: 'Commission Paid',
      value: formatCurrency(commission.totalCommissionPaid || 0, currency),
      icon: Wallet
    },
    {
      title: 'Commission To Be Paid',
      value: formatCurrency(commission.totalCommissionToBePaid || 0, currency),
      icon: Clock
    },
    {
      title: 'Avg Sale Price',
      value: formatCurrency(summary.averageSalePrice || 0, currency),
      icon: Home
    },
    {
      title: 'Top Agent',
      value: topAgent?.name || '—',
      icon: Users
    }
  ], [summary, topAgent, commission, currency])

  return (
    <div className="space-y-6 text-primary_color">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Sales Analytics</h2>
          <p className="text-sm text-primary_color/70 mt-1">
            Agent performance and sale breakdown for the selected period
          </p>
        </div>
        <DateRangePicker
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onChange={setDateRange}
          className="w-[280px]"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary_color" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {summaryCards.map((card) => (
              <DataCard
                key={card.title}
                title={card.title}
                value={card.value}
                icon={card.icon}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="secondary_bg rounded-xl border border-gray-100 p-5">
              <h3 className="text-base font-semibold mb-4">Top Agents by Sales</h3>
              {!analytics?.topAgents?.length ? (
                <p className="text-sm text-primary_color/60">No sales in this date range.</p>
              ) : (
                <div className="space-y-3">
                  {analytics.topAgents.map((agent, index) => (
                    <div
                      key={agent.agent_id}
                      className="flex items-center justify-between gap-3 p-3 rounded-lg bg-white/60 border border-gray-100"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary_color/10 text-primary_color text-xs font-semibold flex items-center justify-center">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{agent.name}</p>
                          <p className="text-xs text-primary_color/60">
                            {agent.sales_count} sale{agent.sales_count === 1 ? '' : 's'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold whitespace-nowrap">
                          {formatCurrency(agent.total_revenue, currency)}
                        </p>
                        {agent.total_commission > 0 && (
                          <p className="text-xs text-primary_color/60">
                            Comm: {formatCurrency(agent.total_commission, currency)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="secondary_bg rounded-xl border border-gray-100 p-5">
              <h3 className="text-base font-semibold mb-4">Sales by Type</h3>
              {!analytics?.saleTypeBreakdown?.length ? (
                <p className="text-sm text-primary_color/60">No sales in this date range.</p>
              ) : (
                <div className="space-y-3">
                  {analytics.saleTypeBreakdown.map((item) => (
                    <div
                      key={item.sale_type}
                      className="flex items-center justify-between gap-3 p-3 rounded-lg bg-white/60 border border-gray-100"
                    >
                      <div>
                        <p className="font-medium">{formatSaleType(item.sale_type)}</p>
                        <p className="text-xs text-primary_color/60">
                          {item.count} sale{item.count === 1 ? '' : 's'}
                        </p>
                      </div>
                      <p className="text-sm font-semibold">
                        {formatCurrency(item.revenue, currency)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {analytics?.topProperties?.length > 0 && (
            <div className="secondary_bg rounded-xl border border-gray-100 p-5">
              <h3 className="text-base font-semibold mb-4">Top Properties by Revenue</h3>
              <div className="space-y-3">
                {analytics.topProperties.map((property, index) => (
                  <div
                    key={property.listing_id}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg bg-white/60 border border-gray-100"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary_color/10 text-primary_color text-xs font-semibold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <p className="font-medium truncate">{property.title}</p>
                    </div>
                    <p className="text-sm font-semibold whitespace-nowrap">
                      {formatCurrency(property.total_revenue, currency)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-base font-semibold mb-4">Property Sales Breakdown</h3>
            <SalesPropertyBreakdown
              accountId={agencyId}
              accountType="agency"
              dateFrom={dateRange.startDate}
              dateTo={dateRange.endDate}
            />
          </div>
        </>
      )}
    </div>
  )
}
