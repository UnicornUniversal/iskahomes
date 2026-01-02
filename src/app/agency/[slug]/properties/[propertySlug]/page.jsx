'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import PropertyView from '@/app/components/propertyManagement/modules/PropertyView'
import { Loader2 } from 'lucide-react'

export default function PropertyDetailsPage() {
  const params = useParams()
  const { user } = useAuth()
  const [propertySlug, setPropertySlug] = useState(null)
  const [listingData, setListingData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = params instanceof Promise ? await params : params
      setPropertySlug(resolvedParams.propertySlug)
    }
    resolveParams()
  }, [params])

  useEffect(() => {
    if (!propertySlug || propertySlug === 'addNewProperty' || propertySlug.endsWith('/edit')) {
      setError('Invalid listing')
      setLoading(false)
      return
    }

    let isMounted = true

    const fetchListing = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(
          `/api/listings/slug/${propertySlug}?listing_type=property`,
          { cache: 'no-store' }
        )

        if (!isMounted) return

        const result = await response.json()

        if (response.ok && result.success) {
          // Parse JSON fields if they come as strings (same as agent's side)
          const listingData = { ...result.data }
          
          // Parse media if it's a string
          if (typeof listingData.media === 'string') {
            try {
              listingData.media = JSON.parse(listingData.media)
            } catch (e) {
              console.error('Error parsing media:', e)
            }
          }
          
          // Parse floor_plan if it's a string
          if (typeof listingData.floor_plan === 'string') {
            try {
              listingData.floor_plan = JSON.parse(listingData.floor_plan)
            } catch (e) {
              console.error('Error parsing floor_plan:', e)
            }
          }
          
          // Parse model_3d if it's a string
          if (typeof listingData.model_3d === 'string') {
            try {
              listingData.model_3d = JSON.parse(listingData.model_3d)
            } catch (e) {
              console.error('Error parsing model_3d:', e)
            }
          }
          
          // Parse pricing if it's a string
          if (typeof listingData.pricing === 'string') {
            try {
              listingData.pricing = JSON.parse(listingData.pricing)
            } catch (e) {
              console.error('Error parsing pricing:', e)
            }
          }
          
          // Parse specifications if it's a string
          if (typeof listingData.specifications === 'string') {
            try {
              listingData.specifications = JSON.parse(listingData.specifications)
            } catch (e) {
              console.error('Error parsing specifications:', e)
            }
          }
          
          // Parse location if it's a string
          if (typeof listingData.location === 'string') {
            try {
              listingData.location = JSON.parse(listingData.location)
            } catch (e) {
              console.error('Error parsing location:', e)
            }
          }
          
          // Parse amenities if it's a string
          if (typeof listingData.amenities === 'string') {
            try {
              listingData.amenities = JSON.parse(listingData.amenities)
            } catch (e) {
              console.error('Error parsing amenities:', e)
            }
          }
          
          // Parse listing_types if it's a string
          if (typeof listingData.listing_types === 'string') {
            try {
              listingData.listing_types = JSON.parse(listingData.listing_types)
            } catch (e) {
              console.error('Error parsing listing_types:', e)
            }
          }
          
          // Parse purposes, types, categories if they're strings
          if (typeof listingData.purposes === 'string') {
            try {
              listingData.purposes = JSON.parse(listingData.purposes)
            } catch (e) {
              console.error('Error parsing purposes:', e)
            }
          }
          
          if (typeof listingData.types === 'string') {
            try {
              listingData.types = JSON.parse(listingData.types)
            } catch (e) {
              console.error('Error parsing types:', e)
            }
          }
          
          if (typeof listingData.categories === 'string') {
            try {
              listingData.categories = JSON.parse(listingData.categories)
            } catch (e) {
              console.error('Error parsing categories:', e)
            }
          }
          
          // Parse availability if it's a string
          if (typeof listingData.availability === 'string') {
            try {
              listingData.availability = JSON.parse(listingData.availability)
            } catch (e) {
              console.error('Error parsing availability:', e)
            }
          }
          
          setListingData(listingData)
        } else {
          setError(result?.error || 'Unable to fetch listing')
        }
      } catch (err) {
        console.error('Error fetching listing:', err)
        if (isMounted) {
          setError('Failed to load listing')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchListing()

    return () => {
      isMounted = false
    }
  }, [propertySlug])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary_color" />
      </div>
    )
  }

  if (error || !listingData) {
    return (
      <div className="p-6">
        <div className="border border-red-200 text-red-800 p-4 rounded-lg">
          <p className="font-medium">Listing unavailable</p>
          <p className="text-sm">{error || 'Listing not found'}</p>
        </div>
      </div>
    )
  }

  // For agencies, show PropertyView in read-only mode
  return (
    <div className="w-full">
      <PropertyView 
        formData={listingData} 
        accountType="agency"
        developments={[]}
      />
    </div>
  )
}
