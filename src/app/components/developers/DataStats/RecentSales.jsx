'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { TrendingUp, Calendar, Loader2, Image as ImageIcon, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

const RecentSales = () => {
  const { user } = useAuth()
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    let isMounted = true

    const fetchSales = async () => {
      try {
        const response = await fetch(`/api/sales/recent?user_id=${user.id}&limit=7`)
        if (response.ok) {
          const result = await response.json()
          if (isMounted) {
            setSales(result.data || [])
          }
        }
      } catch (error) {
        console.error('Error fetching recent sales:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchSales()

    return () => {
      isMounted = false
    }
  }, [user?.id])

  const formatCurrency = (amount, currencyCode = 'GHS') => {
    if (amount === null || amount === undefined || amount === 0) return '0'
    return `${currencyCode} ${Number(amount).toLocaleString('en-US')}`
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getSaleTypeLabel = (type) => {
    return type === 'sold' ? 'Sold' : type === 'rented' ? 'Rented' : 'Sale'
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 flex-1">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-primary_color" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 flex-1">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary_color/10 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-primary_color" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">Recent Sales</h3>
        </div>
        {sales.length > 0 && (
          <span className="text-xs text-gray-500">{sales.length}</span>
        )}
      </div>

      <div className="space-y-2">
        {sales.map((sale) => (
          <Link
            key={sale.id}
            href={sale.listing?.slug ? `/property/${sale.listing.slug}/${sale.listingId}` : '#'}
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-primary_color/20 hover:bg-gray-50/50 transition-all group"
          >
            {sale.listing?.image ? (
              <div className="relative w-12 h-12 rounded-md overflow-hidden flex-shrink-0 border border-gray-200">
                <Image
                  src={sale.listing.image}
                  alt={sale.listing.title}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                <ImageIcon className="w-4 h-4 text-gray-400" />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-gray-900 truncate mb-1">
                {sale.listing?.title || 'Unknown Property'}
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-primary_color">
                  {formatCurrency(sale.salePrice, sale.currency)}
                </span>
                <span className="text-gray-300">•</span>
                <span className="px-2 py-0.5 bg-secondary_color/10 text-secondary_color rounded text-xs font-medium border border-secondary_color/20">
                  {getSaleTypeLabel(sale.saleType)}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center text-xs text-gray-400">
                <Calendar className="w-3 h-3 mr-1" />
                <span>{formatDate(sale.saleDate)}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary_color transition-colors" />
            </div>
          </Link>
        ))}
      </div>

      {sales.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-sm text-gray-500">No recent sales</p>
        </div>
      )}

      {sales.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <Link
            href={`/developer/${user?.profile?.slug || user?.profile?.id}/sales`}
            className="flex items-center justify-center gap-1 text-sm font-medium text-primary_color hover:text-primary_color/80 transition-colors"
          >
            View All Sales
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  )
}

export default RecentSales
