'use client'
import React, { useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Pie } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend, Title)

const pieColors = [
  '#36A2EB', // Blue
  '#FF9800', // Orange
  '#7E57C2', // Purple
  '#26A69A', // Teal
  '#FF6384', // Pink
  '#4BC0C0', // Cyan
  '#FF9F40', // Light Orange
  '#9966FF', // Light Purple
]

const PropertiesByType = () => {
  const { user } = useAuth()
  
  // Get data from user profile
  const types = useMemo(() => {
    if (!user?.profile?.property_types_stats) return []
    return user.profile.property_types_stats
  }, [user?.profile?.property_types_stats])
  
  const total = useMemo(() => {
    return user?.profile?.total_units || 0
  }, [user?.profile?.total_units])

  if (!types || types.length === 0) {
    return (
      <div className="p-6 bg-white rounded-2xl shadow-xl flex flex-col items-center justify-center">
        <div className="text-gray-400 text-4xl mb-3">🏢</div>
        <p className="text-gray-500 text-center">No property types data available</p>
      </div>
    )
  }

  // Prepare chart data
  const pieLabels = types.map(type => type.name || 'Unknown')
  const pieData = types.map(type => type.total_amount || 0)
  const percentages = pieData.map(v => total > 0 ? ((v / total) * 100).toFixed(1) : '0.0')

  const chartData = {
    labels: pieLabels,
    datasets: [
      {
        label: 'Number of Properties',
        data: pieData,
        backgroundColor: pieColors.slice(0, pieLabels.length),
        borderWidth: 0,
        hoverOffset: 12,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    cutout: '70%',
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Properties by Types',
        font: { size: 13, family: 'Poppins, sans-serif' },
        color: '#222',
        padding: { bottom: 20 },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const label = ctx.label || ''
            const value = ctx.parsed || 0
            const percent = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0'
            return ` ${label}: ${value} properties (${percent}%)`
          },
        },
        bodyFont: { family: 'Poppins, sans-serif', size: 12 },
        titleFont: { family: 'Poppins, sans-serif', size: 12 },
      },
    },
  }

  return (
    <div className="p-6 bg-white rounded-2xl shadow-xl flex flex-col items-center" style={{ fontFamily: 'Poppins, sans-serif' }}>
      <div className="w-full max-w-sm flex flex-col items-center">
        <div className="relative w-full flex justify-center">
          <Pie data={chartData} options={chartOptions} style={{ maxHeight: 260 }} />
          {/* Centered total count */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            <span className="text-[3em] font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.85rem' }}>{total}</span>
            <span className="text-xs text-gray-500 font-medium" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.7rem' }}>Total</span>
          </div>
        </div>
        {/* Summary/Legend */}
        <div className="mt-8 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
          {pieLabels.map((label, i) => (
            <div key={label} className="flex items-center gap-3">
              <span
                className="inline-block rounded-full"
                style={{ width: 12, height: 12, background: pieColors[i], boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}
              ></span>
              <span className="text-xs font-semibold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>{label}</span>
              <span className="ml-auto text-xs font-bold" style={{ color: pieColors[i], fontFamily: 'Poppins, sans-serif' }}>{percentages[i]}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PropertiesByType
