'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp, MapPin } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const TopSoldProperties = React.memo(({ listerId, currency: propCurrency }) => {
  const [topSoldProperties, setTopSoldProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedRowId, setExpandedRowId] = useState(null)
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
              <th className="px-3 py-3 text-left text-xs font-medium -500 uppercase tracking-wider">
                Details
              </th>
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
            {topSoldProperties.map((property) => {
              const isExpanded = expandedRowId === (property.id || property.listingId)
              const breakdown = Array.isArray(property.asvBreakdown) ? property.asvBreakdown : []
              return (
                <React.Fragment key={property.id || property.listingId}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-3 py-4 align-top">
                      <button
                        type="button"
                        onClick={() => setExpandedRowId(isExpanded ? null : (property.id || property.listingId))}
                        className="p-1 rounded hover:bg-gray-100"
                        aria-label={isExpanded ? 'Collapse sale details' : 'Expand sale details'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </td>
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
                  {isExpanded && (
                    <tr>
                      <td colSpan={9} className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p><span className="font-medium">Sale Type:</span> {property.saleType || 'N/A'}</p>
                            <p><span className="font-medium">Sale Source:</span> {property.saleSource || 'N/A'}</p>
                            <p><span className="font-medium">Buyer / Client:</span> {property.buyerName || 'N/A'}</p>
                            <p><span className="font-medium">ASV:</span> {
                              property.asv !== null && property.asv !== undefined
                                ? formatCurrency(property.asv, property.currency || currency)
                                : 'N/A'
                            }</p>
                          </div>
                          <div>
                            <p className="font-medium">Notes</p>
                            <p className="-600">{property.notes || 'No notes added'}</p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <p className="font-medium text-sm mb-2">ASV Breakdown</p>
                          {breakdown.length > 0 ? (
                            <div className="rounded-md border border-gray-200 overflow-hidden">
                              <div className="grid grid-cols-2 px-4 py-2 bg-white text-xs font-medium -600">
                                <span>Name</span>
                                <span>Amount ({property.currency || currency})</span>
                              </div>
                              {breakdown.map((item, index) => (
                                <div key={`${property.id}-breakdown-${index}`} className="grid grid-cols-2 px-4 py-2 border-t border-gray-100 bg-white text-sm">
                                  <span>{item?.name || '-'}</span>
                                  <span>{formatCurrency(item?.value || 0, property.currency || currency)}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm -500">No ASV breakdown added</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
})

TopSoldProperties.displayName = 'TopSoldProperties'

export default TopSoldProperties
