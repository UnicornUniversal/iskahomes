'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
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

// Register Chart.js components
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

export default function LeadsTrend({ listerId, listerType = 'developer', listingId = null }) {
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
  const [leadsData, setLeadsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    async function fetchLeadsTrend() {
      if (!listerId || !dateRange.startDate || !dateRange.endDate) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          lister_id: listerId,
          lister_type: listerType,
          date_from: dateRange.startDate,
          date_to: dateRange.endDate
        })

        if (listingId) {
          params.append('listing_id', listingId)
        }

        const response = await fetch(`/api/leads/trends?${params.toString()}`)
        const result = await response.json()

        if (response.ok && result.success) {
          setLeadsData(result.data)
        } else {
          setError(result.error || 'Failed to load leads data')
        }
      } catch (err) {
        console.error('Error fetching leads trend:', err)
        setError('Failed to load leads data')
      } finally {
        setLoading(false)
      }
    }

    fetchLeadsTrend()
  }, [listerId, listerType, listingId, dateRange.startDate, dateRange.endDate])

  // Export function
  const handleExport = useCallback(async (format = 'csv') => {
    if (!listerId || exporting || !dateRange.startDate || !dateRange.endDate) return
    
    try {
      setExporting(true)
      const params = new URLSearchParams({
        lister_id: listerId,
        lister_type: listerType,
        date_from: dateRange.startDate,
        date_to: dateRange.endDate
      })

      if (listingId) {
        params.append('listing_id', listingId)
      }

      const response = await fetch(`/api/leads/trends?${params.toString()}`)
      const result = await response.json()
      
      if (response.ok && result.success && result.data) {
        const { performance } = result.data
        const { labels, phone, message, email, appointment, website } = performance || {}
        
        if (format === 'csv') {
          const csvRows = [
            ['Period', 'Total', 'Phone', 'Message', 'Email', 'Appointment', 'Website'],
            ...(labels || []).map((label, index) => [
              label,
              (phone?.[index] || 0) + (message?.[index] || 0) + (email?.[index] || 0) + (appointment?.[index] || 0) + (website?.[index] || 0),
              phone?.[index] || 0,
              message?.[index] || 0,
              email?.[index] || 0,
              appointment?.[index] || 0,
              website?.[index] || 0
            ])
          ]
          
          const csvContent = csvRows.map(row => row.join(',')).join('\n')
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
          const link = document.createElement('a')
          const url = URL.createObjectURL(blob)
          
          link.setAttribute('href', url)
          link.setAttribute('download', `leads-trend-${dateRange.startDate}-to-${dateRange.endDate}.csv`)
          link.style.visibility = 'hidden'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        } else if (format === 'excel') {
          const excelRows = [
            ['Period', 'Total', 'Phone', 'Message', 'Email', 'Appointment', 'Website'],
            ...(labels || []).map((label, index) => [
              label,
              (phone?.[index] || 0) + (message?.[index] || 0) + (email?.[index] || 0) + (appointment?.[index] || 0) + (website?.[index] || 0),
              phone?.[index] || 0,
              message?.[index] || 0,
              email?.[index] || 0,
              appointment?.[index] || 0,
              website?.[index] || 0
            ])
          ]
          
          const BOM = '\uFEFF'
          const excelContent = BOM + excelRows.map(row => row.join('\t')).join('\n')
          const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' })
          const link = document.createElement('a')
          const url = URL.createObjectURL(blob)
          
          link.setAttribute('href', url)
          link.setAttribute('download', `leads-trend-${dateRange.startDate}-to-${dateRange.endDate}.xls`)
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
  }, [listerId, listerType, listingId, dateRange, exporting])

  // Default empty data structure
  const defaultData = {
    overview: {
      totalLeads: 0,
      phoneLeads: 0,
      messageLeads: 0,
      emailLeads: 0,
      appointmentLeads: 0,
      websiteLeads: 0,
      uniqueLeads: 0,
      conversionRate: 0,
      leadsChange: 0,
      phoneChange: 0,
      messageChange: 0,
      emailChange: 0,
      appointmentChange: 0,
      websiteChange: 0
    },
    performance: {
      labels: [],
      phone: [],
      message: [],
      email: [],
      appointment: [],
      website: []
    }
  }

  // Get current data from API response
  const currentData = leadsData || defaultData

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="default_bg rounded-lg shadow p-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
            <span className="text-gray-600">Loading leads trend data...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="default_bg rounded-lg shadow p-6">
          <div className="flex items-center justify-center py-12">
            <span className="text-red-600">{error}</span>
          </div>
        </div>
      </div>
    )
  }

  // Chart configuration
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
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
    elements: {
      line: {
        tension: 0.4, // Smooth curves
      },
    },
  }

  // Deterministic chart data (no new Date / Math.random in render)
  const chartLabels = currentData?.performance?.labels || []
  const phoneSeries = currentData?.performance?.phone || []
  const messageSeries = currentData?.performance?.message || []
  const emailSeries = currentData?.performance?.email || []
  const appointmentSeries = currentData?.performance?.appointment || []
  const totalSeries = chartLabels.map((_, i) =>
    (phoneSeries[i] || 0) + (messageSeries[i] || 0) + (emailSeries[i] || 0) + (appointmentSeries[i] || 0)
  )

  return (
    <div className="space-y-6">
      {/* Leads chart with per-type series */}
      <div className="default_bg rounded-lg shadow p-6">
        <div className="flex items-center flex-wrap justify-between mb-4 gap-4">
          <h3 className="text-lg font-semibold text-gray-900">Leads Trend</h3>
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
          <Line
            data={{
              labels: chartLabels,
              datasets: [
                {
                  label: 'Total',
                  data: totalSeries,
                  borderColor: 'rgb(59, 130, 246)',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  fill: true,
                  tension: 0.4,
                },
                {
                  label: 'Phone',
                  data: phoneSeries,
                  borderColor: 'rgb(16, 185, 129)',
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  fill: true,
                  tension: 0.4,
                },
                {
                  label: 'Message',
                  data: messageSeries,
                  borderColor: 'rgb(168, 85, 247)',
                  backgroundColor: 'rgba(168, 85, 247, 0.08)',
                  fill: true,
                  tension: 0.4,
                },
                {
                  label: 'Email',
                  data: emailSeries,
                  borderColor: 'rgb(99, 102, 241)',
                  backgroundColor: 'rgba(99, 102, 241, 0.08)',
                  fill: true,
                  tension: 0.4,
                },
                {
                  label: 'Appointment',
                  data: appointmentSeries,
                  borderColor: 'rgb(245, 158, 11)',
                  backgroundColor: 'rgba(245, 158, 11, 0.08)',
                  fill: true,
                  tension: 0.4,
                }
              ]
            }}
            options={chartOptions}
          />
        </div>
      </div>

    </div>
  )
}
