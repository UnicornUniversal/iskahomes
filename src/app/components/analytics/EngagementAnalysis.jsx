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
import { Activity, Target, TrendingUp } from 'lucide-react'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

export default function EngagementAnalysis({ data }) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="default_bg rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Engagement Analysis</h3>
        <div className="text-center text-gray-500 py-8">No engagement data available</div>
      </div>
    )
  }

  const engagementTypes = Object.keys(data)
  
  if (engagementTypes.length === 0) {
    return (
      <div className="default_bg rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Engagement Analysis</h3>
        <div className="text-center text-gray-500 py-8">No engagement data available</div>
      </div>
    )
  }

  const labels = {
    singleAction: 'Single Action',
    multiAction: 'Multi Action (2)',
    highEngagement: 'High Engagement (3+)'
  }

  // Conversion rate comparison
  const conversionChartData = {
    labels: engagementTypes.map(type => labels[type] || type),
    datasets: [{
      label: 'Conversion Rate (%)',
      data: engagementTypes.map(type => data[type].conversionRate),
      backgroundColor: [
        'rgba(239, 68, 68, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(16, 185, 129, 0.8)'
      ],
      borderColor: [
        'rgb(239, 68, 68)',
        'rgb(245, 158, 11)',
        'rgb(16, 185, 129)'
      ],
      borderWidth: 1
    }]
  }

  // Distribution
  const totalLeads = engagementTypes.reduce((sum, type) => sum + data[type].total, 0)
  const distributionChartData = {
    labels: engagementTypes.map(type => labels[type] || type),
    datasets: [{
      data: engagementTypes.map(type => data[type].total),
      backgroundColor: [
        'rgba(239, 68, 68, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(16, 185, 129, 0.8)'
      ],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  }

  return (
    <div className="default_bg rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Engagement & Behavior Analysis</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Conversion Rate by Engagement */}
        <div>
          <h4 className="text-md font-semibold mb-3">Conversion Rate by Engagement Level</h4>
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
          <h4 className="text-md font-semibold mb-3">Lead Distribution by Engagement</h4>
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

      {/* Engagement Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        {engagementTypes.map(type => {
          const stats = data[type]
          const percentage = totalLeads > 0 
            ? ((stats.total / totalLeads) * 100).toFixed(1)
            : 0
          
          const iconColor = type === 'highEngagement' ? 'text-green-600' 
            : type === 'multiAction' ? 'text-yellow-600' 
            : 'text-red-600'
          
          const bgColor = type === 'highEngagement' ? 'bg-green-50' 
            : type === 'multiAction' ? 'bg-yellow-50' 
            : 'bg-red-50'
          
          return (
            <div key={type} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 ${bgColor} rounded-lg`}>
                  {type === 'highEngagement' ? (
                    <Activity className={`w-5 h-5 ${iconColor}`} />
                  ) : type === 'multiAction' ? (
                    <Target className={`w-5 h-5 ${iconColor}`} />
                  ) : (
                    <TrendingUp className={`w-5 h-5 ${iconColor}`} />
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {labels[type] || type}
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
                
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <span className="text-sm text-gray-600">Conversion Rate</span>
                  <span className="font-semibold text-blue-600">
                    {stats.conversionRate.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Key Insight */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h5 className="font-semibold text-blue-900 mb-2">Key Insight</h5>
        <p className="text-sm text-blue-700">
          {data.highEngagement && data.highEngagement.conversionRate > data.singleAction?.conversionRate ? (
            <>
              High engagement leads (3+ actions) convert at{' '}
              <span className="font-bold">{data.highEngagement.conversionRate.toFixed(1)}%</span>, which is{' '}
              <span className="font-bold">
                {((data.highEngagement.conversionRate / data.singleAction.conversionRate - 1) * 100).toFixed(0)}%
              </span>{' '}
              higher than single-action leads. Focus on nurturing leads to increase engagement.
            </>
          ) : (
            'Engage with leads multiple times to improve conversion rates.'
          )}
        </p>
      </div>
    </div>
  )
}

