'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import ListingAnalytics from '@/app/components/analytics/ListingAnalytics'

const PropertyAnalyticsPage = () => {
  const params = useParams()
  const [propertySlug, setPropertySlug] = useState(null)
  const [listingId, setListingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [metadataError, setMetadataError] = useState(null)

  useEffect(() => {
    let isMounted = true

    const resolveParams = async () => {
      const resolvedParams = params instanceof Promise ? await params : params
      const slug = resolvedParams.propertySlug

      if (!isMounted) return

      setPropertySlug(slug)

      if (!slug || slug === 'addNewProperty' || slug.endsWith('/edit')) {
        setMetadataError('Invalid listing')
        setLoading(false)
        return
      }

      try {
        const response = await fetch(
          `/api/listings/slug/${slug}?listing_type=property`,
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

  if (loading || !propertySlug) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary_color"></div>
      </div>
    )
  }

  if (metadataError) {
    return (
      <div className="p-6">
        <div className="border border-yellow-200 text-yellow-800 p-4 rounded-lg">
          <p className="font-medium">Listing unavailable</p>
          <p className="text-sm">{metadataError}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <ListingAnalytics listingId={listingId} />
    </div>
  )
}

export default PropertyAnalyticsPage

