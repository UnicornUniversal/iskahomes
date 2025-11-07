'use client'
import React from 'react'
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

const SalesByType = ({ listerId }) => {
  // Dummy data for sales by type
  const salesByTypeData = [
    { name: 'Apartments', count: 18 },
    { name: 'Houses', count: 15 },
    { name: 'Townhouses', count: 8 },
    { name: 'Condos', count: 6 }
  ]

  const total = salesByTypeData.reduce((sum, item) => sum + item.count, 0)
  const pieLabels = salesByTypeData.map(item => item.name)
  const pieData = salesByTypeData.map(item => item.count)
  const percentages = pieData.map(v => ((v / total) * 100).toFixed(1))

  const chartData = {
    labels: pieLabels,
    datasets: [
      {
        label: 'Number of Sales',
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
        text: 'Sales by Type',
        font: { size: 13, family: 'Poppins, sans-serif' },
        color: '#222',
        padding: { bottom: 20 },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const label = ctx.label || ''
            const value = ctx.parsed || 0
            const percent = ((value / total) * 100).toFixed(1)
            return ` ${label}: ${value} sales (${percent}%)`
          },
        },
        bodyFont: { family: 'Poppins, sans-serif', size: 12 },
        titleFont: { family: 'Poppins, sans-serif', size: 12 },
      },
    },
  }

  return (
    <div className="p-4 sm:p-6 bg-white rounded-2xl shadow-xl flex flex-col items-center" style={{ fontFamily: 'Poppins, sans-serif' }}>
      <div className="w-full max-w-sm flex flex-col items-center">
        <div className="relative w-full flex justify-center">
          <Pie data={chartData} options={chartOptions} style={{ maxHeight: '200px', width: '200px' }} />
          {/* Centered total count */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            <span className="text-[3em] font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.85rem' }}>{total}</span>
            <span className="text-xs text-gray-500 font-medium" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.7rem' }}>Total</span>
          </div>
        </div>
        {/* Summary/Legend */}
        <div className="mt-6 sm:mt-8 w-full grid grid-cols-1 gap-3">
          {pieLabels.map((label, i) => (
            <div key={label} className="flex items-center gap-3">
              <span
                className="inline-block rounded-full flex-shrink-0"
                style={{ width: 12, height: 12, background: pieColors[i], boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}
              ></span>
              <span className="text-xs font-semibold text-gray-800 flex-1" style={{ fontFamily: 'Poppins, sans-serif' }}>{label}</span>
              <span className="text-xs font-bold flex-shrink-0" style={{ color: pieColors[i], fontFamily: 'Poppins, sans-serif' }}>{percentages[i]}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SalesByType
