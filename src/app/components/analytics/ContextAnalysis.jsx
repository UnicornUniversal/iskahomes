'use client'

import React from 'react'
import { Bar, Doughnut } from 'react-chartjs-2'
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
import { Building2, Home, User, TrendingUp } from 'lucide-react'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

const contextIcons = {
  listing: Home,
  development: Building2,
  profile: User
}

const contextLabels = {
  listing: 'Listing',
  development: 'Development',
  profile: 'Profile'
}

export default function ContextAnalysis({ data }) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="default_bg rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Context-Based Analysis</h3>
        <div className="text-center text-gray-500 py-8">No context data available</div>
      </div>
    )
  }

  const contexts = Object.keys(data).filter(key => data[key].total > 0)
  
  if (contexts.length === 0) {
    return (
      <div className="default_bg rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Context-Based Analysis</h3>
        <div className="text-center text-gray-500 py-8">No context data available</div>
      </div>
    )
  }

  // Conversion rate chart
  const conversionChartData = {
    labels: contexts.map(ctx => contextLabels[ctx] || ctx),
    datasets: [{
      label: 'Conversion Rate (%)',
      data: contexts.map(ctx => data[ctx].conversionRate),
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(139, 92, 246, 0.8)'
      ],
      borderColor: [
        'rgb(59, 130, 246)',
        'rgb(16, 185, 129)',
        'rgb(139, 92, 246)'
      ],
      borderWidth: 1
    }]
  }

  // Distribution chart
  const totalByContext = contexts.reduce((sum, ctx) => sum + data[ctx].total, 0)
  const distributionChartData = {
    labels: contexts.map(ctx => contextLabels[ctx] || ctx),
    datasets: [{
      data: contexts.map(ctx => data[ctx].total),
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(139, 92, 246, 0.8)'
      ],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  }

  // Sort by conversion rate
  const sortedContexts = [...contexts].sort((a, b) => 
    data[b].conversionRate - data[a].conversionRate
  )

  return (
    <div className="default_bg rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Context-Based Intelligence</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Conversion Rates */}
        <div>
          <h4 className="text-md font-semibold mb-3">Conversion Rate by Context</h4>
          <div className="h-64">
            <Bar
              data={conversionChartData}
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

        {/* Distribution */}
        <div>
          <h4 className="text-md font-semibold mb-3">Lead Distribution by Context</h4>
          <div className="h-64">
            <Doughnut
              data={distributionChartData}
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
      </div>

      {/* Context Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        {sortedContexts.map(context => {
          const Icon = contextIcons[context] || Building2
          const stats = data[context]
          const percentage = totalByContext > 0 
            ? ((stats.total / totalByContext) * 100).toFixed(1)
            : 0
          
          return (
            <div key={context} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {contextLabels[context]}
                  </h4>
                  <p className="text-sm text-gray-500">{percentage}% of total</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Leads</span>
                  <span className="font-semibold text-gray-900">{stats.total}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Closed</span>
                  <span className="font-semibold text-green-600">{stats.closed}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Conversion Rate</span>
                  <span className="font-semibold text-blue-600">
                    {stats.conversionRate.toFixed(1)}%
                  </span>
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <span className="text-sm text-gray-600">Avg Lead Score</span>
                  <span className="font-semibold text-purple-600">
                    {stats.avgLeadScore.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

