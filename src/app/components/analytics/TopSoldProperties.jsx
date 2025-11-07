'use client'
import React from 'react'
import Link from 'next/link'
import { Eye, Heart, Calendar, DollarSign } from 'lucide-react'

const TopSoldProperties = ({ listerId }) => {
  // Dummy data for top sold properties
  const topSoldProperties = [
    {
      id: 1,
      propertyName: "Premium Apartments East Legon",
      price: 450000,
      dateListed: "2024-01-15",
      dateSold: "2024-02-28",
      revenue: 450000,
      totalViews: 2847,
      totalLeads: 156
    },
    {
      id: 2,
      propertyName: "Karl's Manet Ville",
      price: 380000,
      dateListed: "2024-01-20",
      dateSold: "2024-03-15",
      revenue: 380000,
      totalViews: 1923,
      totalLeads: 98
    },
    {
      id: 3,
      propertyName: "Jojo Jones",
      price: 320000,
      dateListed: "2024-02-01",
      dateSold: "2024-03-20",
      revenue: 320000,
      totalViews: 1654,
      totalLeads: 87
    },
    {
      id: 4,
      propertyName: "Peter's Apartments",
      price: 280000,
      dateListed: "2024-02-10",
      dateSold: "2024-04-05",
      revenue: 280000,
      totalViews: 1234,
      totalLeads: 65
    },
    {
      id: 5,
      propertyName: "Luxury Heights",
      price: 520000,
      dateListed: "2024-01-05",
      dateSold: "2024-02-15",
      revenue: 520000,
      totalViews: 987,
      totalLeads: 54
    }
  ]

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const calculateDaysOnMarket = (listed, sold) => {
    const listedDate = new Date(listed)
    const soldDate = new Date(sold)
    const diffTime = Math.abs(soldDate - listedDate)
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Top Sold Properties</h3>
        <p className="text-sm text-gray-600">Best performing properties by revenue</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Property Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date Listed
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date Sold
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Days on Market
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Revenue
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Views
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Leads
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {topSoldProperties.map((property) => (
              <tr key={property.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link 
                    href={`/property/sale/${property.id}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    {property.propertyName}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${property.price.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(property.dateListed)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(property.dateSold)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {calculateDaysOnMarket(property.dateListed, property.dateSold)} days
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4 text-green-500 mr-1" />
                    ${property.revenue.toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center">
                    <Eye className="w-4 h-4 text-blue-500 mr-1" />
                    {property.totalViews.toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center">
                    <Heart className="w-4 h-4 text-red-500 mr-1" />
                    {property.totalLeads}
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

export default TopSoldProperties
