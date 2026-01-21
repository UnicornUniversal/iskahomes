'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Building2, Eye, TrendingUp, Loader2, Image as ImageIcon, MapPin } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

const TopDevelopments = () => {
  const { user } = useAuth()
  const [developments, setDevelopments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // For team members, use organization_id; for developers, use developer_id
    const developerId = user?.user_type === 'team_member' 
      ? user?.profile?.organization_id 
      : user?.profile?.developer_id
    
    if (!developerId) {
      setLoading(false)
      return
    }

    let isMounted = true

    const fetchTopDevelopments = async () => {
      try {
        const response = await fetch(`/api/developments/top?developer_id=${developerId}&limit=7`)
        if (response.ok) {
          const result = await response.json()
          if (isMounted) {
            setDevelopments(result.data || [])
          }
        }
      } catch (error) {
        console.error('Error fetching top developments:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchTopDevelopments()

    return () => {
      isMounted = false
    }
  }, [user?.profile?.developer_id])

  const getCurrency = () => {
    if (!user?.profile) return 'GHS'
    
    // Get currency from primary location in company_locations
    if (user.profile.company_locations && Array.isArray(user.profile.company_locations)) {
      const primaryLocation = user.profile.company_locations.find(
        loc => loc.primary_location === true
      )
      if (primaryLocation?.currency) {
        return primaryLocation.currency
      }
    }
    
    // Fallback to default_currency if primary location not found
    if (user.profile.default_currency?.code) {
      return user.profile.default_currency.code
    }
    
    return 'GHS' // Default fallback
  }

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return 'N/A'
    const currency = getCurrency()
    const numAmount = Number(amount) || 0
    return `${currency} ${numAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatLocation = (dev) => {
    const parts = [dev.city, dev.state, dev.country].filter(Boolean)
    return parts.length > 0 ? parts.join(', ') : 'Location not specified'
  }

  const getImageUrl = (banner) => {
    if (!banner) return null
    if (typeof banner === 'string') return banner
    if (banner.url) return banner.url
    return null
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
          <span className="text-gray-600">Loading top developments...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary_color" />
            <h5 className="text-lg font-semibold text-primary_color">Top Developments</h5>
          </div>
          <span className="text-sm text-primary_color">Top 7 by views</span>
        </div>
      </div>

      {/* Developments */}
      <div className="p-6">
        {developments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Building2 className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No developments yet</p>
            <p className="text-sm text-gray-400 mt-1">Developments will appear here as they gain views</p>
          </div>
        ) : (
          <div className="space-y-3">
            {developments.map((dev, index) => {
              const imageUrl = getImageUrl(dev.banner)
              
              return (
                <Link
                  key={dev.id}
                  href={`/home/allDevelopments/${dev.slug}`}
                  className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all group"
                >
                  {/* Rank Badge */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>

                  {/* Image */}
                  {imageUrl ? (
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={imageUrl}
                        alt={dev.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h6 className="font-semibold text-primary_color truncate group-hover:text-blue-600 transition-colors">
                      {dev.title}
                    </h6>
                    <div className="flex items-center gap-2 mt-1 text-sm text-primary_color">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{formatLocation(dev)}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <div className="flex items-center gap-1 text-xs text-primary_color">
                        <Eye className="w-3 h-3" />
                        <span className="font-medium">{dev.total_views?.toLocaleString() || 0} views</span>
                      </div>
                      <span className="text-gray-300">•</span>
                      <div className="flex items-center gap-1 text-xs text-primary_color">
                        <Building2 className="w-3 h-3" />
                        <span className="font-medium">{dev.units_sold || 0} sold</span>
                      </div>
                      <span className="text-gray-300">•</span>
                      <div className="flex items-center gap-1 text-xs text-primary_color">
                        <span className="font-medium">Expected Revenue: {formatCurrency(dev.total_estimated_revenue)}</span>
                      </div>
                      <span className="text-gray-300">•</span>
                      <div className="flex items-center gap-1 text-xs text-primary_color">
                        <span className="font-medium">Total Revenue: {formatCurrency(dev.total_revenue)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex-shrink-0 text-primary_color group-hover:text-blue-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {developments.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="text-center">
            <Link
              href={`/developer/${user?.profile?.organization_slug || user?.profile?.slug || user?.profile?.id}/analytics/properties`}
              className="text-primary_color hover:text-blue-700 font-medium text-sm"
            >
              View All Developments →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default TopDevelopments
