'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp, MapPin } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const SoldListings = ({ listerId, currency: propCurrency }) => {
  const currency = propCurrency || 'USD'
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [total, setTotal] = useState(0)
  const [expandedId, setExpandedId] = useState(null)
  const limit = 6

  useEffect(() => {
    let mounted = true

    const fetchSold = async () => {
      if (!listerId) return
      setLoading(true)
      try {
        const response = await fetch(`/api/sales/top-properties?slug=${listerId}&sale_type=sold&limit=${limit}&page=${page}`)
        const result = await response.json()
        if (!mounted) return
        if (result?.success) {
          setItems(Array.isArray(result.data) ? result.data : [])
          setHasNextPage(Boolean(result.hasNextPage))
          setTotal(Number(result.total || 0))
        } else {
          setItems([])
          setHasNextPage(false)
          setTotal(0)
        }
      } catch (error) {
        if (mounted) {
          setItems([])
          setHasNextPage(false)
          setTotal(0)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchSold()
    return () => {
      mounted = false
    }
  }, [listerId, page])

  return (
    <div className="secondary_bg rounded-lg shadow overflow-hidden mb-8">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Sold Properties</h3>
          <p className="text-sm text-gray-600">Only sold units/properties</p>
        </div>
        <span className="text-xs text-gray-500">{total} total</span>
      </div>

      {loading ? (
        <div className="p-6 text-sm text-gray-500">Loading sold properties...</div>
      ) : items.length === 0 ? (
        <div className="p-6 text-sm text-gray-500">No sold properties found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Property
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sale Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date Sold
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days on Market
                </th>
              </tr>
            </thead>
            <tbody className="default_bg divide-y divide-gray-200">
              {items.map((item) => {
                const rowId = item.id || item.listingId
                const isExpanded = expandedId === rowId
                const breakdown = Array.isArray(item.asvBreakdown) ? item.asvBreakdown : []
                return (
                  <React.Fragment key={rowId}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-3 py-4 align-top">
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : rowId)}
                          className="p-1 rounded hover:bg-gray-100"
                          aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-16 h-16 rounded overflow-hidden border border-gray-200 flex-shrink-0">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.propertyName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src = '/placeholder.png'
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                <span className="text-gray-400 text-xs">No Image</span>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            {item.slug ? (
                              <Link href={`/property/${item.slug}`} className="text-sm font-medium block">
                                {item.propertyName}
                              </Link>
                            ) : (
                              <span className="text-sm font-medium block">{item.propertyName}</span>
                            )}
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                              <MapPin className="w-3 h-3 text-gray-400 mr-1 flex-shrink-0" />
                              <span className="truncate">{item.location}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                        {formatCurrency(item.revenue || 0, item.currency || currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {item.dateSold || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {item.daysOnMarket !== null && item.daysOnMarket !== undefined ? `${item.daysOnMarket} days` : 'N/A'}
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p><span className="font-medium">Sold By:</span> {item.soldBy || 'N/A'}</p>
                              <p><span className="font-medium">Sale Source:</span> {item.saleSource || 'N/A'}</p>
                              <p><span className="font-medium">Buyer / Client:</span> {item.buyerName || 'N/A'}</p>
                              <p><span className="font-medium">ASV:</span> {
                                item.asv !== null && item.asv !== undefined
                                  ? formatCurrency(item.asv, item.currency || currency)
                                  : 'N/A'
                              }</p>
                              <p><span className="font-medium">Days on Market:</span> {item.daysOnMarket !== null && item.daysOnMarket !== undefined ? `${item.daysOnMarket} days` : 'N/A'}</p>
                            </div>
                            <div>
                              <p className="font-medium">Notes</p>
                              <p className="text-gray-600">{item.notes || 'No notes added'}</p>
                            </div>
                          </div>

                          <div className="mt-4">
                            <p className="font-medium text-sm mb-2">ASV Breakdown</p>
                            {breakdown.length > 0 ? (
                              <div className="rounded-md border border-gray-200 overflow-hidden">
                                <div className="grid grid-cols-2 px-4 py-2 bg-white text-xs font-medium text-gray-600">
                                  <span>Name</span>
                                  <span>Amount ({item.currency || currency})</span>
                                </div>
                                {breakdown.map((entry, index) => (
                                  <div key={`${rowId}-breakdown-${index}`} className="grid grid-cols-2 px-4 py-2 border-t border-gray-100 bg-white text-sm">
                                    <span>{entry?.name || '-'}</span>
                                    <span>{formatCurrency(entry?.value || 0, item.currency || currency)}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">No ASV breakdown added.</p>
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
      )}

      <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1 || loading}
          className="px-3 py-1.5 text-sm rounded border border-gray-300 disabled:opacity-50"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => hasNextPage && setPage((p) => p + 1)}
          disabled={!hasNextPage || loading}
          className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  )
}

export default SoldListings
