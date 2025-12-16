'use client'

import React from 'react'
import { Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { TrendingUp, Target, AlertCircle, CheckCircle } from 'lucide-react'

ChartJS.register(
  ArcElement,
  Title,
  Tooltip,
  Legend
)

export default function PredictiveMetrics({ data }) {
  if (!data) {
    return (
      <div className="default_bg rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Predictive Metrics</h3>
        <div className="text-center text-gray-500 py-8">No metrics data available</div>
      </div>
    )
  }

  const { totalLeads, totalClosed, overallConversionRate, avgLeadScore, pipelineHealth } = data

  // Pipeline health chart
  const pipelineLabels = ['New', 'In Progress', 'Closed', 'Lost']
  const pipelineValues = [
    pipelineHealth?.new || 0,
    pipelineHealth?.inProgress || 0,
    pipelineHealth?.closed || 0,
    pipelineHealth?.lost || 0
  ]

  const pipelineChartData = {
    labels: pipelineLabels,
    datasets: [{
      data: pipelineValues,
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(239, 68, 68, 0.8)'
      ],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  }

  const totalPipeline = pipelineValues.reduce((a, b) => a + b, 0)
  const pipelinePercentages = pipelineValues.map(v => 
    totalPipeline > 0 ? ((v / totalPipeline) * 100).toFixed(1) : 0
  )

  // Calculate health score
  const closedPercentage = totalPipeline > 0 
    ? ((pipelineHealth?.closed || 0) / totalPipeline) * 100 
    : 0
  const lostPercentage = totalPipeline > 0 
    ? ((pipelineHealth?.lost || 0) / totalPipeline) * 100 
    : 0
  
  let healthStatus = 'healthy'
  let healthStatusClass = 'border-green-200 bg-green-50'
  let healthTextClass = 'text-green-600'
  let healthMessage = 'Pipeline is healthy with good conversion rates'
  
  if (lostPercentage > 30) {
    healthStatus = 'critical'
    healthStatusClass = 'border-red-200 bg-red-50'
    healthTextClass = 'text-red-600'
    healthMessage = 'High percentage of lost leads - review follow-up process'
  } else if (lostPercentage > 20) {
    healthStatus = 'warning'
    healthStatusClass = 'border-yellow-200 bg-yellow-50'
    healthTextClass = 'text-yellow-600'
    healthMessage = 'Moderate percentage of lost leads - improve engagement'
  }

  return (
    <div className="default_bg rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Predictive & Actionable Metrics</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Pipeline Health */}
        <div>
          <h4 className="text-md font-semibold mb-3">Pipeline Health</h4>
          <div className="h-64">
            <Doughnut
              data={pipelineChartData}
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

        {/* Key Metrics */}
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Overall Conversion Rate</span>
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-blue-600">
              {overallConversionRate.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {totalClosed} closed out of {totalLeads} total
            </p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Average Lead Score</span>
              <Target className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-purple-600">
              {avgLeadScore.toFixed(1)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Higher scores indicate better quality leads
            </p>
          </div>

          <div className={`border ${healthStatusClass} rounded-lg p-4`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Pipeline Status</span>
              {healthStatus === 'healthy' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className={`w-5 h-5 ${healthTextClass}`} />
              )}
            </div>
            <p className={`text-lg font-bold ${healthTextClass} capitalize`}>
              {healthStatus}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {healthMessage}
            </p>
          </div>
        </div>
      </div>

      {/* Pipeline Breakdown */}
      <div className="mt-6">
        <h4 className="text-md font-semibold mb-3">Pipeline Breakdown</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">New Leads</p>
            <p className="text-2xl font-bold text-blue-600">
              {pipelineHealth?.new || 0}
            </p>
            <p className="text-xs text-gray-500">
              {pipelinePercentages[0]}% of pipeline
            </p>
          </div>

          <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">In Progress</p>
            <p className="text-2xl font-bold text-yellow-600">
              {pipelineHealth?.inProgress || 0}
            </p>
            <p className="text-xs text-gray-500">
              {pipelinePercentages[1]}% of pipeline
            </p>
          </div>

          <div className="border border-green-200 bg-green-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Closed</p>
            <p className="text-2xl font-bold text-green-600">
              {pipelineHealth?.closed || 0}
            </p>
            <p className="text-xs text-gray-500">
              {pipelinePercentages[2]}% of pipeline
            </p>
          </div>

          <div className="border border-red-200 bg-red-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Lost</p>
            <p className="text-2xl font-bold text-red-600">
              {pipelineHealth?.lost || 0}
            </p>
            <p className="text-xs text-gray-500">
              {pipelinePercentages[3]}% of pipeline
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

