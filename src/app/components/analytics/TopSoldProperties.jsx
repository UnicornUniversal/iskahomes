'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const TopSoldProperties = React.memo(({ listerId, currency: propCurrency }) => {
  const [topSoldProperties, setTopSoldProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const currency = propCurrency || 'USD'

  useEffect(() => {
    let isMounted = true
    
    const fetchData = async () => {
      if (!listerId) return
      
      try {
        const response = await fetch(`/api/sales/top-properties?slug=${listerId}&limit=10`)
        const result = await response.json()
        
        if (!isMounted) return
        
        if (result.success && result.data) {
          setTopSoldProperties(result.data)
        } else {
          setTopSoldProperties([])
        }
      } catch (error) {
        console.error('Error fetching top properties:', error)
        if (isMounted) {
          setTopSoldProperties([])
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
  }, [listerId])

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="secondary_bg rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold -900">Top Sold Properties</h3>
          <p className="text-sm -600">Best performing properties by revenue</p>
        </div>
        <div className="p-6 text-center -500">Loading...</div>
      </div>
    )
  }

  if (topSoldProperties.length === 0) {
    return (
      <div className="secondary_bg rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold -900">Top Sold Properties</h3>
          <p className="text-sm -600">Best performing properties by revenue</p>
        </div>
        <div className="p-6 text-center -500">No sales data available</div>
      </div>
    )
  }

  return (
    <div className="secondary_bg rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold -900">Top Sold Properties</h3>
        <p className="text-sm -600">Best performing properties by revenue</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium -500 uppercase tracking-wider">
                Property
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium -500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium -500 uppercase tracking-wider">
                Date Listed
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium -500 uppercase tracking-wider">
                Date Sold
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium -500 uppercase tracking-wider">
                Days on Market
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium -500 uppercase tracking-wider">
                Revenue
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium -500 uppercase tracking-wider">
                Views
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium -500 uppercase tracking-wider">
                Leads
              </th>
            </tr>
          </thead>
          <tbody className="default_bg divide-y divide-gray-200">
            {topSoldProperties.map((property) => (
              <tr key={property.id || property.listingId} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-16 h-16 rounded overflow-hidden border border-gray-200 flex-shrink-0">
                      {property.image ? (
                        <img
                          src={property.image}
                          alt={property.propertyName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = '/placeholder.png'
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <span className="-400 text-xs">No Image</span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      {property.slug ? (
                        <Link 
                          href={`/property/${property.slug}`}
                          className="text-sm font-medium  block"
                        >
                          {property.propertyName}
                        </Link>
                      ) : (
                        <span className="text-sm font-medium -900 block">{property.propertyName}</span>
                      )}
                      <div className="flex items-center text-xs -500 mt-1">
                        <MapPin className="w-3 h-3 -400 mr-1 flex-shrink-0" />
                        <span className="truncate">{property.location}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm -900">
                  {formatCurrency(property.price, property.currency || currency)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm -600">
                  {formatDate(property.dateListed)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm -600">
                  {formatDate(property.dateSold)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm -600">
                  {property.daysOnMarket !== null ? `${property.daysOnMarket} days` : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium -900">
                  {formatCurrency(property.revenue, property.currency || currency)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm -600">
                  {property.totalViews.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm -600">
                  {property.totalLeads}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
})

TopSoldProperties.displayName = 'TopSoldProperties'

export default TopSoldProperties
