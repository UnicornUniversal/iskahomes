'use client'

import React from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Phone, MessageCircle, Mail, Calendar, TrendingUp, Award } from 'lucide-react'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

const channelIcons = {
  phone: Phone,
  whatsapp: MessageCircle,
  direct_message: MessageCircle,
  email: Mail,
  appointment: Calendar
}

const channelLabels = {
  phone: 'Phone',
  whatsapp: 'WhatsApp',
  direct_message: 'Direct Message',
  email: 'Email',
  appointment: 'Appointment'
}

export default function ChannelPerformance({ data }) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="default_bg rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Channel Performance</h3>
        <div className="text-center text-gray-500 py-8">No channel data available</div>
      </div>
    )
  }

  const channels = Object.keys(data).filter(key => data[key].total > 0)
  
  if (channels.length === 0) {
    return (
      <div className="default_bg rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Channel Performance</h3>
        <div className="text-center text-gray-500 py-8">No channel data available</div>
      </div>
    )
  }

  const chartData = {
    labels: channels.map(ch => channelLabels[ch] || ch),
    datasets: [
      {
        label: 'Conversion Rate (%)',
        data: channels.map(ch => data[ch].conversionRate),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1
      },
      {
        label: 'Avg Lead Score',
        data: channels.map(ch => data[ch].avgLeadScore),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1,
        yAxisID: 'y1'
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top'
      },
      title: {
        display: false
      }
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Conversion Rate (%)'
        },
        beginAtZero: true,
        max: 100
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Lead Score'
        },
        beginAtZero: true,
        grid: {
          drawOnChartArea: false
        }
      }
    }
  }

  // Sort channels by conversion rate
  const sortedChannels = [...channels].sort((a, b) => 
    data[b].conversionRate - data[a].conversionRate
  )

  return (
    <div className="default_bg rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Channel Performance Analysis</h3>
      
      <div className="mb-6">
        <div className="h-80">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {sortedChannels.map(channel => {
          const Icon = channelIcons[channel] || MessageCircle
          const stats = data[channel]
          
          return (
            <div key={channel} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{channelLabels[channel]}</h4>
                  <p className="text-sm text-gray-500">{stats.total} leads</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Conversion Rate</span>
                  <span className="font-semibold text-blue-600">
                    {stats.conversionRate.toFixed(1)}%
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Avg Lead Score</span>
                  <span className="font-semibold text-green-600">
                    {stats.avgLeadScore.toFixed(1)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">High Value Leads</span>
                  <span className="font-semibold text-purple-600">
                    {stats.highValueLeads} ({stats.highValuePercentage.toFixed(1)}%)
                  </span>
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <span className="text-sm text-gray-600">Closed</span>
                  <span className="font-semibold text-gray-900">
                    {stats.closed} / {stats.total}
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

