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
import { Clock, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

export default function OperationalEfficiency({ data }) {
  if (!data) {
    return (
      <div className="default_bg rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Operational Efficiency</h3>
        <div className="text-center text-gray-500 py-8">No efficiency data available</div>
      </div>
    )
  }

  const {
    avgResponseTime,
    avgTimeToConversion,
    abandonmentRate,
    coldLeadRate,
    responseTimeDistribution
  } = data

  // Response time distribution
  const responseTimeLabels = ['Under 1 Hour', 'Under 24 Hours', 'Over 24 Hours']
  const responseTimeValues = [
    responseTimeDistribution?.under1Hour || 0,
    responseTimeDistribution?.under24Hours || 0,
    responseTimeDistribution?.over24Hours || 0
  ]

  const responseTimeChartData = {
    labels: responseTimeLabels,
    datasets: [{
      data: responseTimeValues,
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(239, 68, 68, 0.8)'
      ],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  }

  const totalResponses = responseTimeValues.reduce((a, b) => a + b, 0)
  const responsePercentages = responseTimeValues.map(v => 
    totalResponses > 0 ? ((v / totalResponses) * 100).toFixed(1) : 0
  )

  // Determine response time status
  let responseStatus = 'excellent'
  let responseStatusClass = 'border-green-200 bg-green-50'
  let responseTextClass = 'text-green-600'
  let responseMessage = 'Excellent response time - keep it up!'
  
  if (avgResponseTime > 24) {
    responseStatus = 'poor'
    responseStatusClass = 'border-red-200 bg-red-50'
    responseTextClass = 'text-red-600'
    responseMessage = 'Response time is too slow - aim for under 1 hour'
  } else if (avgResponseTime > 12) {
    responseStatus = 'needs improvement'
    responseStatusClass = 'border-yellow-200 bg-yellow-50'
    responseTextClass = 'text-yellow-600'
    responseMessage = 'Response time could be improved - target under 12 hours'
  }

  // Determine abandonment status
  let abandonmentStatus = 'low'
  let abandonmentStatusClass = 'border-green-200 bg-green-50'
  let abandonmentTextClass = 'text-green-600'
  let abandonmentMessage = 'Low abandonment rate - good retention'
  
  if (abandonmentRate > 20) {
    abandonmentStatus = 'high'
    abandonmentStatusClass = 'border-red-200 bg-red-50'
    abandonmentTextClass = 'text-red-600'
    abandonmentMessage = 'High abandonment rate - review follow-up process'
  } else if (abandonmentRate > 10) {
    abandonmentStatus = 'moderate'
    abandonmentStatusClass = 'border-yellow-200 bg-yellow-50'
    abandonmentTextClass = 'text-yellow-600'
    abandonmentMessage = 'Moderate abandonment - improve engagement'
  }

  return (
    <div className="default_bg rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Operational Efficiency</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Response Time Distribution */}
        <div>
          <h4 className="text-md font-semibold mb-3">Response Time Distribution</h4>
          <div className="h-64">
            <Doughnut
              data={responseTimeChartData}
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
              <span className="text-sm text-gray-600">Avg Response Time</span>
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-blue-600">
              {avgResponseTime > 0 ? `${avgResponseTime.toFixed(1)} hrs` : 'N/A'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Time from lead creation to first contact
            </p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Avg Time to Conversion</span>
              <TrendingDown className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-purple-600">
              {avgTimeToConversion > 0 ? `${avgTimeToConversion.toFixed(1)} days` : 'N/A'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Average days from first action to closed
            </p>
          </div>

          <div className={`border ${responseStatusClass} rounded-lg p-4`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Response Status</span>
              {responseStatus === 'excellent' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className={`w-5 h-5 ${responseTextClass}`} />
              )}
            </div>
            <p className={`text-lg font-bold ${responseTextClass} capitalize`}>
              {responseStatus}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {responseMessage}
            </p>
          </div>
        </div>
      </div>

      {/* Efficiency Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="border border-gray-200 rounded-lg p-4">
          <h5 className="font-semibold text-gray-900 mb-3">Response Time Breakdown</h5>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Under 1 Hour</span>
              <span className="font-semibold text-green-600">
                {responseTimeDistribution?.under1Hour || 0} ({responsePercentages[0]}%)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Under 24 Hours</span>
              <span className="font-semibold text-yellow-600">
                {responseTimeDistribution?.under24Hours || 0} ({responsePercentages[1]}%)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Over 24 Hours</span>
              <span className="font-semibold text-red-600">
                {responseTimeDistribution?.over24Hours || 0} ({responsePercentages[2]}%)
              </span>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h5 className="font-semibold text-gray-900 mb-3">Lead Retention</h5>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Abandonment Rate</span>
              <span className={`font-semibold ${abandonmentTextClass}`}>
                {abandonmentRate.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Cold Lead Rate</span>
              <span className="font-semibold text-orange-600">
                {coldLeadRate.toFixed(1)}%
              </span>
            </div>
            <div className={`mt-3 p-3 ${abandonmentStatusClass} border rounded`}>
              <p className="text-xs text-gray-700">
                {abandonmentMessage}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

