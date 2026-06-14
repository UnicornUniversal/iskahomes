'use client'

import React, { useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import useExtendedAuthProfile from '@/hooks/useExtendedAuthProfile'
import { MapPin, DollarSign, Wallet, Clock } from 'lucide-react'
import DataCard from '@/app/components/developers/DataCard'
import SalesTrendChart from '@/app/components/analytics/SalesTrendChart'
import SalesPropertyBreakdown from '@/app/components/analytics/SalesPropertyBreakdown'
import { DateRangePicker } from '@/app/components/ui/date-range-picker'
import { formatCurrency } from '@/lib/utils'

const getDefaultDateRange = () => {
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  return {
    startDate: startOfMonth.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0]
  }
}

export default function AgentSalesPage() {
  const { user } = useAuth()
  const { extendedProfile } = useExtendedAuthProfile()
  const profile = extendedProfile || user?.profile || {}
  const accountId = profile?.agent_id || user?.id
  const [dateRange, setDateRange] = useState(getDefaultDateRange)
  const [commission, setCommission] = useState(null)
  const [loadingCommission, setLoadingCommission] = useState(true)

  const currency = 'GHS'

  React.useEffect(() => {
    if (!accountId || !dateRange.startDate || !dateRange.endDate) return

    const fetchCommission = async () => {
      setLoadingCommission(true)
      try {
        const params = new URLSearchParams({
          user_id: accountId,
          account_type: 'agent',
          date_from: dateRange.startDate,
          date_to: dateRange.endDate
        })
        const response = await fetch(`/api/sales/summary?${params.toString()}`)
        const result = await response.json()
        if (result.success) {
          setCommission(result.data?.summary?.commission || null)
        }
      } catch (error) {
        console.error('Error fetching agent commission:', error)
      } finally {
        setLoadingCommission(false)
      }
    }

    fetchCommission()
  }, [accountId, dateRange.startDate, dateRange.endDate])

  const totalSales = profile?.properties_sold ?? profile?.total_sales ?? 0
  const totalRevenue = profile?.total_revenue ?? 0

  return (
    <div className="text-primary_color">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-primary_color mb-2">Sales Overview</h1>
          <p className="text-sm text-primary_color/70">Your sales performance and commission</p>
        </div>
        <DateRangePicker
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onChange={setDateRange}
          className="w-[280px]"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <DataCard title="Properties Sold" value={totalSales.toLocaleString()} icon={MapPin} />
        <DataCard title="Total Revenue" value={formatCurrency(totalRevenue, currency)} icon={DollarSign} />
        <DataCard
          title="Commission Paid"
          value={loadingCommission ? '…' : formatCurrency(commission?.totalCommissionPaid || 0, currency)}
          icon={Wallet}
        />
        <DataCard
          title="Commission To Be Paid"
          value={loadingCommission ? '…' : formatCurrency(commission?.totalCommissionToBePaid || 0, currency)}
          icon={Clock}
        />
      </div>

      <div className="mb-6">
        <SalesTrendChart listerId={accountId} currency={currency} accountType="agent" />
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-4">Property Sales Breakdown</h2>
        <SalesPropertyBreakdown
          accountId={accountId}
          accountType="agent"
          dateFrom={dateRange.startDate}
          dateTo={dateRange.endDate}
        />
      </div>
    </div>
  )
}
