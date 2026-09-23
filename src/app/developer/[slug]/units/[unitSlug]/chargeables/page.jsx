'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getAuthTokenForUser } from '@/lib/authTokens'
import { listingCover, listingLocation, parseChargeablesList } from '@/lib/chargeables'
import ChargeableEntriesBoard from '@/app/components/chargeables/ChargeableEntriesBoard'

const UnitChargeablesPage = () => {
  const params = useParams()
  const { user, developerToken, agencyToken, agentToken } = useAuth()
  const token = getAuthTokenForUser(user, { developerToken, agencyToken, agentToken })
    || (typeof window !== 'undefined' && (localStorage.getItem('developer_token') || localStorage.getItem('agency_token')))
  const [unitSlug, setUnitSlug] = useState(null)
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [metadataError, setMetadataError] = useState(null)

  useEffect(() => {
    let isMounted = true

    const resolveListing = async () => {
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
        let data = null
        const authHeaders = token ? { Authorization: `Bearer ${token}` } : {}
        const byId = await fetch(`/api/listings/${slug}`, { cache: 'no-store', headers: authHeaders })
        const byIdResult = await byId.json()
        if (byId.ok && (byIdResult.success || byIdResult.data)) {
          data = byIdResult.data || byIdResult
        } else {
          const bySlug = await fetch(`/api/listings/slug/${slug}?listing_type=unit`, { cache: 'no-store' })
          const slugResult = await bySlug.json()
          if (bySlug.ok && slugResult.success) data = slugResult.data
        }

        if (!isMounted) return

        if (data?.id) {
          setListing(data)
          setMetadataError(null)
        } else {
          setMetadataError('Unable to fetch listing metadata')
        }
      } catch (error) {
        console.error('Error fetching listing metadata:', error)
        if (isMounted) setMetadataError('Failed to load listing metadata')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    resolveListing()
    return () => { isMounted = false }
  }, [params, token])

  const lockedUnit = useMemo(() => {
    if (!listing?.id) return null
    return {
      id: listing.id,
      name: listing.title,
      title: listing.title,
      cover: listingCover(listing),
      location: listingLocation(listing),
      chargeables: parseChargeablesList(listing.chargeables)
    }
  }, [listing])

  if (loading || !unitSlug) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary_color"></div>
      </div>
    )
  }

  if (metadataError || !lockedUnit) {
    return (
      <div className="p-6">
        <div className="border border-yellow-200 text-yellow-800 p-4 rounded-lg">
          <p className="font-medium">Listing unavailable</p>
          <p className="text-sm">{metadataError || 'Listing not found'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      <ChargeableEntriesBoard
        lockedUnit={lockedUnit}
        hideFilters
        showEventSeries
        heading="Chargeables"
        description={`All chargeable entries for ${lockedUnit.name || 'this listing'}. Totals are for this unit only.`}
      />
    </div>
  )
}

export default UnitChargeablesPage
