'use client'

import React from 'react'
import { Doughnut, Bar } from 'react-chartjs-2'
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
import { TrendingUp, Clock, Target } from 'lucide-react'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

export default function LeadLifecycle({ data }) {
  if (!data || !data.statusDistribution) {
    return (
      <div className="default_bg rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Lead Lifecycle Analysis</h3>
        <div className="text-center text-gray-500 py-8">No lifecycle data available</div>
      </div>
    )
  }

  const { statusDistribution, funnelConversionRates, avgTimeToConversion } = data

  // Status distribution chart
  const statusLabels = Object.keys(statusDistribution).map(s => 
    s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')
  )
  const statusValues = Object.values(statusDistribution)
  const statusColors = {
    new: 'rgba(59, 130, 246, 0.8)',
    contacted: 'rgba(16, 185, 129, 0.8)',
    scheduled: 'rgba(245, 158, 11, 0.8)',
    responded: 'rgba(139, 92, 246, 0.8)',
    closed: 'rgba(34, 197, 94, 0.8)',
    cold_lead: 'rgba(156, 163, 175, 0.8)',
    abandoned: 'rgba(239, 68, 68, 0.8)'
  }

  const statusChartData = {
    labels: statusLabels,
    datasets: [{
      data: statusValues,
      backgroundColor: Object.keys(statusDistribution).map(s => statusColors[s] || 'rgba(156, 163, 175, 0.8)'),
      borderWidth: 2,
      borderColor: '#fff'
    }]
  }

  // Funnel conversion rates
  const funnelLabels = [
    'New → Contacted',
    'Contacted → Scheduled',
    'Scheduled → Closed'
  ]
  const funnelValues = [
    funnelConversionRates.newToContacted || 0,
    funnelConversionRates.contactedToScheduled || 0,
    funnelConversionRates.scheduledToClosed || 0
  ]

  const funnelChartData = {
    labels: funnelLabels,
    datasets: [{
      label: 'Conversion Rate (%)',
      data: funnelValues,
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(34, 197, 94, 0.8)'
      ],
      borderColor: [
        'rgb(59, 130, 246)',
        'rgb(16, 185, 129)',
        'rgb(34, 197, 94)'
      ],
      borderWidth: 1
    }]
  }

  const totalLeads = Object.values(statusDistribution).reduce((a, b) => a + b, 0)
  const inProgress = (statusDistribution.contacted || 0) + 
                     (statusDistribution.scheduled || 0) + 
                     (statusDistribution.responded || 0)
  const closed = statusDistribution.closed || 0
  const lost = (statusDistribution.abandoned || 0) + (statusDistribution.cold_lead || 0)

  return (
    <div className="default_bg rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Lead Lifecycle & Funnel Analysis</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Status Distribution */}
        <div>
          <h4 className="text-md font-semibold mb-3">Status Distribution</h4>
          <div className="h-64">
            <Doughnut
              data={statusChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom'
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Funnel Conversion Rates */}
        <div>
          <h4 className="text-md font-semibold mb-3">Funnel Conversion Rates</h4>
          <div className="h-64">
            <Bar
              data={funnelChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                      callback: function(value) {
                        return value + '%'
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-600">Total Leads</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalLeads}</p>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-600">In Progress</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{inProgress}</p>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-purple-600" />
            <span className="text-sm text-gray-600">Closed</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">{closed}</p>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-orange-600" />
            <span className="text-sm text-gray-600">Avg Time to Close</span>
          </div>
          <p className="text-2xl font-bold text-orange-600">
            {avgTimeToConversion ? `${avgTimeToConversion.toFixed(1)} days` : 'N/A'}
          </p>
        </div>
      </div>

      {/* Detailed Status Breakdown */}
      <div className="mt-6">
        <h4 className="text-md font-semibold mb-3">Status Breakdown</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(statusDistribution).map(([status, count]) => {
            const percentage = totalLeads > 0 ? ((count / totalLeads) * 100).toFixed(1) : 0
            return (
              <div key={status} className="border border-gray-200 rounded-lg p-3">
                <p className="text-sm text-gray-600 capitalize">
                  {status.replace('_', ' ')}
                </p>
                <p className="text-xl font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-500">{percentage}%</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

