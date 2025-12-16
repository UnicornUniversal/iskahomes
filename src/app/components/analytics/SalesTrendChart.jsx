'use client'
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { DateRangePicker } from '@/app/components/ui/date-range-picker'
import { ExportDropdown } from '@/app/components/ui/export-dropdown'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const SalesTrendChart = React.memo(({ listerId, currency: propCurrency = 'USD' }) => {
  // Initialize with current month as default
  const getDefaultDateRange = () => {
    const today = new Date()
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    return {
      startDate: startOfMonth.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    }
  }

  const defaultRange = getDefaultDateRange()
  const [dateRange, setDateRange] = useState(defaultRange)
  const [chartData, setChartData] = useState({
    labels: [],
    sales: [],
    revenue: []
  })
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const currency = useMemo(() => propCurrency || 'USD', [propCurrency])

  // Memoize fetch function to prevent unnecessary re-renders
  const fetchData = useCallback(async () => {
    if (!listerId || !dateRange.startDate || !dateRange.endDate) return
    
    try {
      setLoading(true)
      const params = new URLSearchParams({
        slug: listerId,
        date_from: dateRange.startDate,
        date_to: dateRange.endDate
      })
      const response = await fetch(`/api/sales/time-series?${params.toString()}`)
      const result = await response.json()
      
      if (result.success && result.data) {
        setChartData(result.data)
      } else {
        setChartData({ labels: [], sales: [], revenue: [] })
      }
    } catch (error) {
      console.error('Error fetching sales time series:', error)
      setChartData({ labels: [], sales: [], revenue: [] })
    } finally {
      setLoading(false)
    }
  }, [listerId, dateRange.startDate, dateRange.endDate])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Export function
  const handleExport = useCallback(async (format = 'csv') => {
    if (!listerId || exporting || !dateRange.startDate || !dateRange.endDate) return
    
    try {
      setExporting(true)
      const params = new URLSearchParams({
        slug: listerId,
        date_from: dateRange.startDate,
        date_to: dateRange.endDate
      })
      const response = await fetch(`/api/sales/time-series?${params.toString()}`)
      const result = await response.json()
      
      if (result.success && result.data) {
        const { labels, sales, revenue } = result.data
        
        if (format === 'csv') {
          // Create CSV content
          const csvRows = [
            ['Period', 'Sales Count', `Revenue (${currency})`],
            ...labels.map((label, index) => [
              label,
              sales[index] || 0,
              revenue[index] || 0
            ])
          ]
          
          const csvContent = csvRows.map(row => row.join(',')).join('\n')
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
          const link = document.createElement('a')
          const url = URL.createObjectURL(blob)
          
          link.setAttribute('href', url)
          link.setAttribute('download', `sales-trend-${dateRange.startDate}-to-${dateRange.endDate}.csv`)
          link.style.visibility = 'hidden'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        } else if (format === 'excel') {
          // Create Excel content (CSV with Excel MIME type)
          const excelRows = [
            ['Period', 'Sales Count', `Revenue (${currency})`],
            ...labels.map((label, index) => [
              label,
              sales[index] || 0,
              revenue[index] || 0
            ])
          ]
          
          // Excel format: tab-separated values with UTF-8 BOM
          const BOM = '\uFEFF'
          const excelContent = BOM + excelRows.map(row => row.join('\t')).join('\n')
          const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' })
          const link = document.createElement('a')
          const url = URL.createObjectURL(blob)
          
          link.setAttribute('href', url)
          link.setAttribute('download', `sales-trend-${dateRange.startDate}-to-${dateRange.endDate}.xls`)
          link.style.visibility = 'hidden'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        }
      }
    } catch (error) {
      console.error('Error exporting data:', error)
      alert('Failed to export data. Please try again.')
    } finally {
      setExporting(false)
    }
  }, [listerId, dateRange, currency, exporting])

  const chartDataConfig = {
    labels: chartData.labels.length > 0 ? chartData.labels : ['No data'],
    datasets: [
      {
        label: 'Sales Count',
        data: chartData.sales.length > 0 ? chartData.sales : [0],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y',
      },
      {
        label: `Revenue (${currency})`,
        data: chartData.revenue.length > 0 ? chartData.revenue : [0],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y1',
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        beginAtZero: true,
        grid: {
          color: 'rgba(0,0,0,0.1)'
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        beginAtZero: true,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  }

  if (loading) {
    return (
      <div className="default_bg rounded-lg shadow p-6">
        <div className="flex items-center flex-wrap justify-between mb-4 gap-4">
          <h3 className="text-lg font-semibold text-gray-900">Sales Trend</h3>
          <div className="flex items-center gap-2">
            <div className="w-[280px] h-10 bg-gray-100 animate-pulse rounded-lg" />
            <div className="w-24 h-10 bg-gray-100 animate-pulse rounded-lg" />
          </div>
        </div>
        <div className="h-80 flex items-center justify-center">
          <div className="text-gray-500">Loading chart data...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="default_bg rounded-lg shadow p-6">
      <div className="flex items-center flex-wrap justify-between mb-4 gap-4">
        <h3 className="text-lg font-semibold text-gray-900">Sales Trend</h3>
        <div className="flex items-center gap-2">
          <DateRangePicker
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            onChange={setDateRange}
            className="w-[280px]"
          />
          <ExportDropdown
            onExport={handleExport}
            disabled={exporting || loading || !dateRange.startDate || !dateRange.endDate}
          />
        </div>
      </div>
      <div className="h-80">
        <Line data={chartDataConfig} options={chartOptions} />
      </div>
    </div>
  )
})

SalesTrendChart.displayName = 'SalesTrendChart'

export default SalesTrendChart

