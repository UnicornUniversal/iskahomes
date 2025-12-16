'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Building2, DollarSign, TrendingUp, Users } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const DevelopmentsBySale = React.memo(({ developerId, currency: propCurrency }) => {
  const [developmentsBySale, setDevelopmentsBySale] = useState([])
  const [loading, setLoading] = useState(true)
  const currency = propCurrency || 'USD'

  useEffect(() => {
    let isMounted = true
    
    const fetchData = async () => {
      if (!developerId) return
      
      try {
        setLoading(true)
        const response = await fetch(`/api/sales/developments?slug=${developerId}`)
        const result = await response.json()
        
        if (!isMounted) return
        
        if (result.success && result.data) {
          setDevelopmentsBySale(result.data)
        } else {
          setDevelopmentsBySale([])
        }
      } catch (error) {
        console.error('Error fetching developments by sale:', error)
        if (isMounted) {
          setDevelopmentsBySale([])
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchData()
    
    return () => {
      isMounted = false
    }
  }, [developerId])

  const getStatusColor = (status) => {
    switch (status) {
      case 'Ready for Occupancy':
      case 'Completed':
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

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Developments by Sale</h3>
          <p className="text-sm text-gray-600">Sales performance across all developments</p>
        </div>
        <div className="p-6 text-center text-gray-500">Loading...</div>
      </div>
    )
  }

  if (developmentsBySale.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Developments by Sale</h3>
          <p className="text-sm text-gray-600">Sales performance across all developments</p>
        </div>
        <div className="p-6 text-center text-gray-500">No developments data available</div>
      </div>
    )
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
                    href={development.slug ? `/allDevelopments/${development.slug}` : '#'}
                    className="flex items-center space-x-3"
                  >
                    <div className="w-12 h-12 rounded overflow-hidden border border-gray-200 flex-shrink-0">
                      {development.coverImage ? (
                        <img
                          src={development.coverImage}
                          alt={development.developmentName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = '/placeholder.png'
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
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
                  {development.unitsSold}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {development.unitsLeft}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {calculateSoldPercentage(development.unitsSold, development.totalUnits)}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(development.revenue, development.currency || currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
})

DevelopmentsBySale.displayName = 'DevelopmentsBySale'

export default DevelopmentsBySale
