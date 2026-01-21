'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { TrendingUp, Loader2 } from 'lucide-react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { formatCurrency } from '@/lib/utils'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
)

const RecentSales = () => {
  const { user } = useAuth()
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    let isMounted = true

    const fetchSales = async () => {
      try {
        // For team members, get the developer's user_id from organization
        let userId = user.id
        
        if (user?.user_type === 'team_member' && user?.profile?.organization_type === 'developer') {
          // Fetch developer's user_id from developers table
          const { data: developer } = await supabase
            .from('developers')
            .select('developer_id')
            .eq('id', user.profile.organization_id)
            .single()
          
          if (developer?.developer_id) {
            userId = developer.developer_id
          }
        }
        
        const response = await fetch(`/api/sales/recent?user_id=${userId}&limit=7`)
        if (response.ok) {
          const result = await response.json()
          if (isMounted) {
            setSales(result.data || [])
          }
        }
      } catch (error) {
        console.error('Error fetching recent sales:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchSales()

    return () => {
      isMounted = false
    }
  }, [user?.id, user?.user_type, user?.profile?.organization_id])


  const totalRevenue = useMemo(() => {
    return sales.reduce((sum, sale) => sum + (sale.salePrice || 0), 0)
  }, [sales])

  const totalTransactions = sales.length

  const chartData = useMemo(() => {
    const labels = sales.map((sale, index) => {
      const date = sale.saleDate ? new Date(sale.saleDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : `Sale ${index + 1}`
      return date
    })
    const dataPoints = sales.map((sale) => sale.salePrice || 0)
    const cumulative = dataPoints.reduce((arr, value, idx) => {
      const prev = idx > 0 ? arr[idx - 1] : 0
      arr.push(prev + value)
      return arr
    }, [])

    return {
      labels,
      datasets: [
        {
          label: 'Sale Value',
          data: dataPoints,
          borderColor: '#17637C',
          backgroundColor: 'rgba(23, 99, 124, 0.15)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#F68B1F',
          pointBorderColor: '#fff',
          pointHoverRadius: 6,
          pointRadius: 4,
        },
        {
          label: 'Cumulative Revenue',
          data: cumulative,
          borderColor: '#F68B1F',
          backgroundColor: 'rgba(246, 139, 31, 0.15)',
          tension: 0.4,
          fill: false,
          pointBackgroundColor: '#17637C',
          pointBorderColor: '#fff',
          pointRadius: 3,
          borderDash: [6, 6],
        },
      ],
    }
  }, [sales])

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          padding: 8,
          font: {
            size: 11,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const value = ctx.parsed.y
            const currency = sales[ctx.dataIndex]?.currency || 'GHS'
            return ` ${ctx.dataset.label}: ${formatCurrency(value, currency)}`
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
          maxRotation: 45,
          minRotation: 0,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(23, 99, 124, 0.1)',
        },
        ticks: {
          callback: (value) => formatCurrency(value, 'GHS'),
          font: {
            size: 11,
          },
        },
      },
    },
  }), [sales])

  if (loading) {
    return (
      <div className="border border-gray-200 rounded-lg p-4 sm:p-6 flex-1 w-full overflow-hidden">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      </div>
    )
  }

  const profileTotalRevenue = user?.profile?.total_revenue ?? totalRevenue
  const estimatedRevenue = user?.profile?.estimated_revenue ?? profileTotalRevenue
  const incomingRevenue = Math.max(estimatedRevenue - profileTotalRevenue, 0)

  return (
    <div className="border border-gray-200 rounded-lg p-4 sm:p-6 flex-1 w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary_color/10 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm uppercase tracking-wide">Recent Sales</p>
            <p className="text-xl sm:text-2xl lg:text-[2.5em] leading-tight truncate">
              {formatCurrency(profileTotalRevenue, sales[0]?.currency || 'GHS')}
            </p>
          </div>
        </div>
        <div className="text-left sm:text-right flex-shrink-0">
          <p className="text-xs sm:text-sm uppercase tracking-wide">Units Sold</p>
          <p className="text-xl sm:text-2xl lg:text-[2.5em] leading-tight">{totalTransactions}</p>
        </div>
      </div>

      {sales.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <p className="text-xs sm:text-sm">No recent sales</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-2 h-64 sm:h-72 min-h-0 w-full overflow-hidden">
            <Line data={chartData} options={chartOptions} />
          </div>
          <div className="border border-gray-200 rounded-2xl p-3 sm:p-4 flex flex-col gap-3 sm:gap-4 w-full overflow-hidden">
            <div>
              <p className="text-xs uppercase tracking-widest opacity-70">Summary</p>
              <p className="text-base sm:text-lg font-semibold">Revenue Overview</p>
            </div>
            <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="flex-shrink-0">Total Revenue</span>
                <h2 className="text-sm sm:text-base font-semibold truncate min-w-0 text-right">
                  {formatCurrency(profileTotalRevenue, sales[0]?.currency || 'GHS')}
                </h2>
              </div>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="flex-shrink-0">Estimated Revenue</span>
                <h2 className="text-sm sm:text-base font-semibold truncate min-w-0 text-right">
                  {formatCurrency(estimatedRevenue, sales[0]?.currency || 'GHS')}
                </h2>
              </div>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="flex-shrink-0">Incoming Revenue</span>
                <h2 className="text-sm sm:text-base font-semibold text-primary_color truncate min-w-0 text-right">
                  {formatCurrency(incomingRevenue, sales[0]?.currency || 'GHS')}
                </h2>
              </div>
            </div>
            <div className="h-[2px] bg-gray-200 relative">
              <div
                className="absolute top-0 left-0 h-full bg-primary_color/70 transition-all"
                style={{
                  width: `${Math.min(
                    (profileTotalRevenue / (estimatedRevenue || 1)) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
            <p className="text-xs opacity-70 leading-relaxed">
              Based on projections synced from your account profile. Incoming revenue reflects open opportunities.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default RecentSales
