'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import ListingAnalytics from '@/app/components/analytics/ListingAnalytics'
import ListingAppointments from '@/app/components/analytics/ListingAppointments'

const ListingAnalyticsPage = () => {
  const params = useParams()
  const [unitSlug, setUnitSlug] = useState(null)
  const [listingId, setListingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [metadataError, setMetadataError] = useState(null)

  useEffect(() => {
    let isMounted = true

    const resolveParams = async () => {
      const resolvedParams = params instanceof Promise ? await params : params
      const slug = resolvedParams.unitSlug

      if (!isMounted) return

      setUnitSlug(slug)

      if (!slug || slug === 'addNewUnit' || slug.endsWith('/edit')) {
        setMetadataError('Invalid listing')
        setLoading(false)
        return
      }

      try {
        const response = await fetch(
          `/api/listings/slug/${slug}?listing_type=unit`,
          { cache: 'no-store' }
        )
        const result = await response.json()

        if (!isMounted) return

        if (response.ok && result.success) {
          setListingId(result.data.id)
          setMetadataError(null)
        } else {
          console.error('Error fetching listing metadata:', result?.error || result)
          setMetadataError(result?.error || 'Unable to fetch listing metadata')
        }
      } catch (error) {
        console.error('Error fetching listing metadata:', error)
        if (isMounted) {
          setMetadataError('Failed to load listing metadata')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    resolveParams()

    return () => {
      isMounted = false
    }
  }, [params])

  if (loading || !unitSlug) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (metadataError) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg">
          <p className="font-medium">Listing unavailable</p>
          <p className="text-sm">{metadataError}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <ListingAnalytics listingId={listingId} />
      <ListingAppointments listingId={listingId} />
    </div>
  )
}

export default ListingAnalyticsPage
