'use client'

import React from 'react'
import { Bar, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Calendar, Clock } from 'lucide-react'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

export default function TemporalPatterns({ data }) {
  if (!data || !data.dayOfWeekPerformance || !data.hourOfDayPerformance) {
    return (
      <div className="default_bg rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Temporal Patterns</h3>
        <div className="text-center text-gray-500 py-8">No temporal data available</div>
      </div>
    )
  }

  const { dayOfWeekPerformance, hourOfDayPerformance } = data

  // Day of week chart
  const dayChartData = {
    labels: dayOfWeekPerformance.map(d => d.day),
    datasets: [
      {
        label: 'Total Leads',
        data: dayOfWeekPerformance.map(d => d.total),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1
      },
      {
        label: 'Closed Leads',
        data: dayOfWeekPerformance.map(d => d.closed),
        backgroundColor: 'rgba(16, 185, 129, 0.6)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1
      }
    ]
  }

  // Hour of day chart
  const hourLabels = hourOfDayPerformance.map(h => {
    const hour = h.hour
    return hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`
  })
  
  const hourChartData = {
    labels: hourLabels,
    datasets: [
      {
        label: 'Total Leads',
        data: hourOfDayPerformance.map(h => h.total),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Conversion Rate (%)',
        data: hourOfDayPerformance.map(h => h.conversionRate),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
        yAxisID: 'y1'
      }
    ]
  }

  // Find best performing day
  const bestDay = [...dayOfWeekPerformance].sort((a, b) => b.conversionRate - a.conversionRate)[0]
  const bestHour = [...hourOfDayPerformance].sort((a, b) => b.conversionRate - a.conversionRate)[0]

  return (
    <div className="default_bg rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Temporal Patterns & Optimization</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Day of Week */}
        <div>
          <h4 className="text-md font-semibold mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Day of Week Performance
          </h4>
          <div className="h-80">
            <Bar
              data={dayChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top'
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Hour of Day */}
        <div>
          <h4 className="text-md font-semibold mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-green-600" />
            Hour of Day Performance
          </h4>
          <div className="h-80">
            <Line
              data={hourChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top'
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Total Leads'
                    }
                  },
                  y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                      display: true,
                      text: 'Conversion Rate (%)'
                    },
                    beginAtZero: true,
                    max: 100,
                    grid: {
                      drawOnChartArea: false
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
          <h5 className="font-semibold text-blue-900 mb-2">Best Performing Day</h5>
          <p className="text-2xl font-bold text-blue-600">{bestDay?.day}</p>
          <div className="mt-2 space-y-1">
            <p className="text-sm text-blue-700">
              <span className="font-medium">{bestDay?.total}</span> total leads
            </p>
            <p className="text-sm text-blue-700">
              <span className="font-medium">{bestDay?.conversionRate.toFixed(1)}%</span> conversion rate
            </p>
          </div>
        </div>

        <div className="border border-green-200 bg-green-50 rounded-lg p-4">
          <h5 className="font-semibold text-green-900 mb-2">Best Performing Hour</h5>
          <p className="text-2xl font-bold text-green-600">
            {bestHour ? (bestHour.hour === 0 ? '12 AM' : bestHour.hour < 12 ? `${bestHour.hour} AM` : bestHour.hour === 12 ? '12 PM' : `${bestHour.hour - 12} PM`) : 'N/A'}
          </p>
          <div className="mt-2 space-y-1">
            <p className="text-sm text-green-700">
              <span className="font-medium">{bestHour?.total}</span> total leads
            </p>
            <p className="text-sm text-green-700">
              <span className="font-medium">{bestHour?.conversionRate.toFixed(1)}%</span> conversion rate
            </p>
          </div>
        </div>
      </div>

      {/* Day of Week Details */}
      <div className="mt-6">
        <h4 className="text-md font-semibold mb-3">Day of Week Breakdown</h4>
        <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
          {dayOfWeekPerformance.map(day => (
            <div key={day.day} className="border border-gray-200 rounded-lg p-3 text-center">
              <p className="text-sm font-semibold text-gray-900">{day.day.substring(0, 3)}</p>
              <p className="text-lg font-bold text-gray-900">{day.total}</p>
              <p className="text-xs text-gray-500">{day.conversionRate.toFixed(1)}%</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

