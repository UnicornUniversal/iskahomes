'use client'
import React from 'react'
import Link from 'next/link'
import { Building2, DollarSign, TrendingUp, Users } from 'lucide-react'

const DevelopmentsBySale = ({ developerId }) => {
  // Dummy data for developments by sale
  const developmentsBySale = [
    {
      id: 1,
      developmentName: "Premium Apartments East Legon",
      coverImage: "/placeholder.png",
      unitsSold: 28,
      unitsLeft: 12,
      totalUnits: 40,
      revenue: 12600000,
      status: "Under Construction"
    },
    {
      id: 2,
      developmentName: "Karl's Manet Ville",
      coverImage: "/placeholder.png",
      unitsSold: 15,
      unitsLeft: 25,
      totalUnits: 40,
      revenue: 5700000,
      status: "Pre-Construction"
    },
    {
      id: 3,
      developmentName: "Jojo Jones",
      coverImage: "/placeholder.png",
      unitsSold: 4,
      unitsLeft: 6,
      totalUnits: 10,
      revenue: 1280000,
      status: "Ready for Occupancy"
    },
    {
      id: 4,
      developmentName: "Peter's Apartments",
      coverImage: "/placeholder.png",
      unitsSold: 0,
      unitsLeft: 241,
      totalUnits: 241,
      revenue: 0,
      status: "Planning"
    }
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'Ready for Occupancy':
        return 'bg-green-100 text-green-800'
      case 'Under Construction':
        return 'bg-blue-100 text-blue-800'
      case 'Pre-Construction':
        return 'bg-yellow-100 text-yellow-800'
      case 'Planning':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const calculateSoldPercentage = (sold, total) => {
    return total > 0 ? ((sold / total) * 100).toFixed(1) : 0
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Developments by Sale</h3>
        <p className="text-sm text-gray-600">Sales performance across all developments</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Development
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Units Sold
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Units Left
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sold %
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Revenue
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {developmentsBySale.map((development) => (
              <tr key={development.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link 
                    href={`/allDevelopments/${development.id}`}
                    className="flex items-center space-x-3"
                  >
                    <img
                      src={development.coverImage}
                      alt={development.developmentName}
                      className="w-12 h-12 rounded object-cover border"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {development.developmentName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {development.totalUnits} total units
                      </div>
                    </div>
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(development.status)}`}>
                    {development.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center">
                    <Building2 className="w-4 h-4 text-blue-500 mr-1" />
                    {development.unitsSold}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 text-gray-500 mr-1" />
                    {development.unitsLeft}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    {calculateSoldPercentage(development.unitsSold, development.totalUnits)}%
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4 text-green-500 mr-1" />
                    ${development.revenue.toLocaleString()}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default DevelopmentsBySale
