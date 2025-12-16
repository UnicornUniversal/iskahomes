'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import LeadsManagement from '@/app/components/analytics/LeadsManagement'
import ListingLeadsInsights from '@/app/components/analytics/ListingLeadsInsights'
import ListingAppointments from '@/app/components/analytics/ListingAppointments'

const ListingLeadsPage = () => {
  const params = useParams()
  const { user } = useAuth()
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

  // Get lister ID from user or listing
  const listerId = user?.profile?.developer_id || user?.id
  const listerType = 'developer'

  if (loading || !unitSlug || !listingId) {
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

  console.log('🔍 ListingLeadsPage - Rendering with:', {
    listingId,
    listerId,
    listerType
  })

  return (
    <div className="p-6 space-y-6">
      <ListingLeadsInsights listingId={listingId} />
      <ListingAppointments listingId={listingId} />
      <LeadsManagement 
        listerId={listerId} 
        listerType={listerType}
        listingId={listingId}
      />
    </div>
  )
}

export default ListingLeadsPage
