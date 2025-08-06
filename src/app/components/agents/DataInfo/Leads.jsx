'use client'

import React, { useState, useEffect } from 'react'
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
import { leadsData, detailedLeads } from '../../Data/Data'
import { FiUsers, FiMessageSquare, FiTrendingUp, FiFilter } from 'react-icons/fi'

// Register Chart.js components
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

const Leads = () => {
    const [selectedDataset, setSelectedDataset] = useState('both') // 'both', 'prospects', 'leads'
    const [timeRange, setTimeRange] = useState('30') // '7', '14', '30'
    const [filteredData, setFilteredData] = useState(leadsData)

    // Filter data based on time range
    useEffect(() => {
        const days = parseInt(timeRange)
        const filtered = leadsData.slice(-days)
        setFilteredData(filtered)
    }, [timeRange])

    // Prepare chart data
    const chartData = {
        labels: filteredData.map(item => {
            const date = new Date(item.date)
            return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
            })
        }),
        datasets: [
            ...(selectedDataset === 'both' || selectedDataset === 'prospects' ? [{
                label: 'Prospects (Profile Views)',
                data: filteredData.map(item => item.prospects),
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: 'rgb(59, 130, 246)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            }] : []),
            ...(selectedDataset === 'both' || selectedDataset === 'leads' ? [{
                label: 'Leads (Messages/Bookings)',
                data: filteredData.map(item => item.leads),
                borderColor: 'rgb(16, 185, 129)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: 'rgb(16, 185, 129)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            }] : [])
        ]
    }

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    usePointStyle: true,
                    padding: 20,
                    font: {
                        size: 12,
                        weight: '600'
                    }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                cornerRadius: 8,
                displayColors: true,
                callbacks: {
                    label: function(context) {
                        return `${context.dataset.label}: ${context.parsed.y}`
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    color: '#6B7280',
                    font: {
                        size: 11
                    }
                }
            },
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(107, 114, 128, 0.1)',
                    drawBorder: false
                },
                ticks: {
                    color: '#6B7280',
                    font: {
                        size: 11
                    }
                }
            }
        },
        interaction: {
            intersect: false,
            mode: 'index'
        }
    }

    // Calculate statistics
    const totalProspects = filteredData.reduce((sum, item) => sum + item.prospects, 0)
    const totalLeads = filteredData.reduce((sum, item) => sum + item.leads, 0)
    const conversionRate = totalProspects > 0 ? ((totalLeads / totalProspects) * 100).toFixed(1) : 0
    const avgDailyProspects = (totalProspects / filteredData.length).toFixed(1)
    const avgDailyLeads = (totalLeads / filteredData.length).toFixed(1)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Leads & Prospects</h2>
                    <p className="text-gray-600">Track your property views and engagement over time</p>
                </div>
                
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex items-center gap-2">
                        <FiFilter className="text-gray-500" />
                        <select
                            value={selectedDataset}
                            onChange={(e) => setSelectedDataset(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary_color focus:border-transparent"
                        >
                            <option value="both">Both Datasets</option>
                            <option value="prospects">Prospects Only</option>
                            <option value="leads">Leads Only</option>
                        </select>
                    </div>
                    
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary_color focus:border-transparent"
                    >
                        <option value="7">Last 7 Days</option>
                        <option value="14">Last 14 Days</option>
                        <option value="30">Last 30 Days</option>
                    </select>
                </div>
            </div>

         

            {/* Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="h-96">
                    <Line data={chartData} options={chartOptions} />
                </div>
            </div>



               {/* Statistics Cards */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Prospects</p>
                            <p className="text-2xl font-bold text-blue-600">{totalProspects.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <FiUsers className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Avg: {avgDailyProspects}/day</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Leads</p>
                            <p className="text-2xl font-bold text-green-600">{totalLeads.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                            <FiMessageSquare className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Avg: {avgDailyLeads}/day</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                            <p className="text-2xl font-bold text-purple-600">{conversionRate}%</p>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <FiTrendingUp className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Prospects to Leads</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Growth Rate</p>
                            <p className="text-2xl font-bold text-orange-600">
                                {filteredData.length > 1 ? 
                                    (((filteredData[filteredData.length - 1].prospects - filteredData[0].prospects) / filteredData[0].prospects) * 100).toFixed(1) : 0
                                }%
                            </p>
                        </div>
                        <div className="p-3 bg-orange-100 rounded-lg">
                            <FiTrendingUp className="w-6 h-6 text-orange-600" />
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Prospects growth</p>
                </div>
            </div>

            {/* Recent Leads Table */}
            {/* <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Lead Activity</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {detailedLeads.slice(0, 5).map((lead) => (
                                <tr key={lead.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">{lead.userName}</div>
                                            <div className="text-sm text-gray-500">{lead.userEmail}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{lead.propertyName}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                            lead.type === 'lead' 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-blue-100 text-blue-800'
                                        }`}>
                                            {lead.action.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {lead.source.replace('_', ' ')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                            lead.status === 'new' 
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : lead.status === 'contacted'
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-green-100 text-green-800'
                                        }`}>
                                            {lead.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(lead.timestamp).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div> */}
        </div>
    )
}

export default Leads
