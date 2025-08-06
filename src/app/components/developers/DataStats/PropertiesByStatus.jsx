"use client"
import React from 'react'
import { units } from '../../Data/Data'
import { Pie } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend, Title)

const statusColors = [
  '#36A2EB', // Available
  '#FF9800', // Unavailable
  '#7E57C2', // Sold Out
  '#26A69A', // Under Construction
  '#FF6384', // Other
]

const statusLabelMap = {
  available: 'Available',
  unavailable: 'Unavailable',
  'sold out': 'Sold Out',
  'under construction': 'Under Construction',
}

const PropertiesByStatus = () => {
  // Count units by status (normalize to lower case)
  const statusCounts = units.reduce((acc, unit) => {
    let status = (unit.status || 'Other').toLowerCase()
    if (status === 'soldout' || status === 'sold-out') status = 'sold out'
    if (status === 'underconstruction' || status === 'under-construction') status = 'under construction'
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {})
  const pieLabels = Object.keys(statusCounts)
  const pieData = Object.values(statusCounts)
  const total = pieData.reduce((a, b) => a + b, 0)
  const percentages = pieData.map(v => ((v / total) * 100).toFixed(1))

  const chartData = {
    labels: pieLabels,
    datasets: [
      {
        label: 'Number of Listings',
        data: pieData,
        backgroundColor: statusColors.slice(0, pieLabels.length),
        borderWidth: 0,
        hoverOffset: 12,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    cutout: '70%', // donut style
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Listings by Status',
        font: { size: 18, family: 'Poppins, sans-serif' },
        color: '#222',
        padding: { bottom: 20 },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const label = ctx.label || ''
            const value = ctx.parsed || 0
            const percent = ((value / total) * 100).toFixed(1)
            return ` ${label}: ${value} listings (${percent}%)`
          },
        },
        bodyFont: { family: 'Poppins, sans-serif' },
        titleFont: { family: 'Poppins, sans-serif' },
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
            <span className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.85rem' }}>{total}</span>
            <span className="text-xs text-gray-500 font-medium" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.7rem' }}>Total</span>
          </div>
        </div>
        {/* Summary/Legend */}
        <div className="mt-8 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
          {pieLabels.map((label, i) => (
            <div key={label} className="flex items-center gap-3">
              <span
                className="inline-block rounded-full"
                style={{ width: 12, height: 12, background: statusColors[i], boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}
              ></span>
              <span className="text-xs font-semibold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>{statusLabelMap[label] || (label.charAt(0).toUpperCase() + label.slice(1))}</span>
              <span className="ml-auto text-xs font-bold" style={{ color: statusColors[i], fontFamily: 'Poppins, sans-serif' }}>{percentages[i]}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PropertiesByStatus
