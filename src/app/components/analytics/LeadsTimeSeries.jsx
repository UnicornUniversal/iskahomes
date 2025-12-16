'use client'

import React from 'react'
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

const LeadsTimeSeries = ({ timeSeries }) => {
  if (!timeSeries || timeSeries.length === 0) {
    return (
      <div className="p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-primary_color mb-4">Leads Over Time</h3>
        <div className="text-center py-12 text-gray-500">
          No leads data available
        </div>
      </div>
    )
  }

  const leadsData = timeSeries.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    totalLeads: item.total_leads || 0,
    phoneLeads: item.phone_leads || 0,
    messageLeads: item.message_leads || 0,
    emailLeads: item.email_leads || 0,
    appointmentLeads: item.appointment_leads || 0,
    websiteLeads: item.website_leads || 0,
    uniqueLeads: item.unique_leads || 0
  }))

  const chartData = {
    labels: leadsData.map(d => d.date),
    datasets: [
      {
        label: 'Total Leads',
        data: leadsData.map(d => d.totalLeads),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Phone Leads',
        data: leadsData.map(d => d.phoneLeads),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Message Leads',
        data: leadsData.map(d => d.messageLeads),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Email Leads',
        data: leadsData.map(d => d.emailLeads),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Appointment Leads',
        data: leadsData.map(d => d.appointmentLeads),
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Website Leads',
        data: leadsData.map(d => d.websiteLeads),
        borderColor: '#ec4899',
        backgroundColor: 'rgba(236, 72, 153, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Unique Leads',
        data: leadsData.map(d => d.uniqueLeads),
        borderColor: '#14b8a6',
        backgroundColor: 'rgba(20, 184, 166, 0.1)',
        tension: 0.4,
        fill: true,
        borderDash: [5, 5]
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#374151'
        }
      },
      title: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#6b7280'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        ticks: {
          color: '#6b7280'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      }
    }
  }

  return (
    <div className="p-6 rounded-lg">
      <h3 className="text-lg font-semibold text-primary_color mb-4">Leads Over Time</h3>
      <div style={{ height: '400px' }}>
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  )
}

export default LeadsTimeSeries

