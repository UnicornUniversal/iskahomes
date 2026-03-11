'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  MapPin,
  Star,
  CheckCircle
} from 'lucide-react'
import { FiArrowLeft as FiArrowLeftIcon } from 'react-icons/fi'
import GalleryViewer from '@/app/components/property/GalleryViewer'
import NearbyAmenities from '@/app/components/Listing/NearbyAmenities'
import ListingList from '@/app/components/Listing/ListingList'
import { getAmenityName, getAmenityById } from '@/lib/StaticData'
import { getSpecificationDataByTypeId, getSpecificationDataByTypeName } from '@/app/components/Data/StaticData'

export default function AdminPropertyDetailPage() {
  const params = useParams()
  const slug = params?.slug

  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (!slug) return
    fetch(`/api/admin/properties/${encodeURIComponent(slug)}/full`)
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          const data = { ...result.data }
          if (typeof data.media === 'string') {
            try { data.media = JSON.parse(data.media) } catch (e) {}
          }
          if (typeof data.floor_plan === 'string') {
            try { data.floor_plan = JSON.parse(data.floor_plan) } catch (e) {}
          }
          if (typeof data['3d_model'] === 'string') {
            try { data['3d_model'] = JSON.parse(data['3d_model']) } catch (e) {}
          }
          if (typeof data.pricing === 'string') {
            try { data.pricing = JSON.parse(data.pricing) } catch (e) {}
          }
          if (typeof data.specifications === 'string') {
            try { data.specifications = JSON.parse(data.specifications) } catch (e) {}
          }
          if (typeof data.types === 'string') {
            try { data.types = JSON.parse(data.types) } catch (e) {}
          }
          setListing(data)
        } else {
          setError(result.error || 'Not found')
        }
      })
      .catch(() => setError('Failed to fetch'))
      .finally(() => setLoading(false))
  }, [slug])

  const formatPrice = (p, currency = 'GHS') => {
    if (!p) return '—'
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'GHS', maximumFractionDigits: 0 }).format(p)
  }

  if (loading) return <div className="text-primary_color/70">Loading...</div>
  if (error || !listing) return (
    <div className="text-red-600">
      {error || 'Property not found'}
      <Link href="/admin/properties" className="block mt-2 text-primary_color hover:underline">Back to properties</Link>
    </div>
  )

  const {
    title,
    description,
    price,
    currency,
    price_type,
    duration,
    media,
    specifications,
    city,
    state,
    country,
    town,
    full_address,
    latitude,
    longitude,
    location_additional_information,
    amenities,
    available_from,
    available_until,
    is_featured,
    is_verified,
    is_premium,
    developers,
    agent,
    agency,
    relatedListings,
    propertySubtypes,
    listing_types,
    types,
    socialAmenities,
    cancellation_policy,
    is_negotiable,
    security_requirements,
    flexible_terms,
    acquisition_rules,
    additional_information,
    size,
    pricing
  } = listing

  const pricingData = pricing ? (typeof pricing === 'string' ? JSON.parse(pricing) : pricing) : null

  const getSpecifications = () => {
    if (!specifications) return {}
    return {
      bedrooms: specifications.bedrooms ?? 0,
      bathrooms: specifications.bathrooms ?? 0,
      living_rooms: specifications.living_rooms ?? 0,
      kitchen: specifications.kitchen ?? 0,
      toilets: specifications.toilets ?? 0,
      size: specifications.property_size ?? specifications.size ?? size ?? 0,
      floor_level: specifications.floor_level ?? 0,
      furnishing: specifications.furnishing ?? null,
      property_age: specifications.property_age ?? null,
      property_condition: specifications.property_condition ?? specifications.condition ?? null,
      building_style: specifications.building_style ?? null,
      compound_type: specifications.compound_type ?? null,
      kitchen_type: specifications.kitchen_type ?? null,
      number_of_balconies: specifications.number_of_balconies ?? 0,
      shared_electricity_meter: specifications.shared_electricity_meter ?? null,
      guest_room: specifications.guest_room ?? null,
      guest_washroom: specifications.guest_washroom ?? null,
      ...specifications
    }
  }

  const specs = getSpecifications()
  const propertyTypeId = types?.[0] ?? propertySubtypes?.[0]?.id ?? null
  const specData = propertyTypeId
    ? getSpecificationDataByTypeId(propertyTypeId)
    : getSpecificationDataByTypeName(listing.listing_type || '')

  const getSpecIcon = (key) => {
    if (!specData) return null
    const field = specData.fields?.find(f => f.key === key)
    if (field?.icon) {
      const IconComponent = field.icon
      return <IconComponent className="w-5 h-5 text-primary_color" />
    }
    return null
  }

  const formatSpecLabel = (key) => {
    if (!specData) return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    const field = specData.fields?.find(f => f.key === key)
    return field ? field.label : key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const shouldDisplaySpec = (key, value) => {
    if (value === null || value === undefined || value === '') return false
    if (typeof value === 'number' && value === 0 && !['floor_level', 'number_of_balconies'].includes(key)) return false
    return true
  }

  const getListingTypes = () => {
    const out = []
    if (listing_types?.custom?.length) out.push(...listing_types.custom)
    if (listing_types?.inbuilt?.length) out.push(...listing_types.inbuilt)
    if (propertySubtypes?.length) out.push(...propertySubtypes.map(s => s.name))
    return out
  }

  const listingTypes = getListingTypes()
  const video = media?.video || null
  const youtubeUrl = media?.youtubeUrl || null
  const floorPlan = listing.floor_plan || null

  const formatPriceDisplay = () => {
    const curr = pricingData?.currency || currency || 'GHS'
    const base = parseFloat(pricingData?.price || price || 0)
    const formatted = `${curr} ${base.toLocaleString()}`
    const isRent = (pricingData?.price_type || price_type) === 'rent'
    const period = pricingData?.duration || duration || (isRent ? 'month' : '')
    return isRent ? `${formatted} / ${period}` : formatted
  }

  const ownerName = developers?.name || agent?.name || agency?.name || 'Owner'

  const updateListingStatus = async (field, value) => {
    setUpdating(true)
    try {
      const res = await fetch(`/api/admin/properties/${encodeURIComponent(slug)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      })
      const result = await res.json()
      if (result.success) setListing(prev => ({ ...prev, ...result.data }))
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="w-full flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/admin/properties" className="text-primary_color text-sm hover:underline w-fit flex items-center gap-2">
          <FiArrowLeftIcon className="w-4 h-4" /> Back to properties
        </Link>
        <div className="flex items-center gap-3">
          <label className="text-sm text-primary_color font-medium">Status:</label>
          <select
            value={listing.listing_status || 'active'}
            onChange={(e) => updateListingStatus('listing_status', e.target.value)}
            disabled={updating}
            className="px-3 py-2 rounded-lg border border-primary_color/30 text-primary_color bg-white"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
          <label className="text-sm text-primary_color font-medium">Condition:</label>
          <select
            value={listing.listing_condition || 'completed'}
            onChange={(e) => updateListingStatus('listing_condition', e.target.value)}
            disabled={updating}
            className="px-3 py-2 rounded-lg border border-primary_color/30 text-primary_color bg-white"
          >
            <option value="completed">Completed</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Intro */}
      <div>
        <h1 className="text-2xl md:text-4xl font-bold text-primary_color mb-2">{title}</h1>
        <div className="flex flex-wrap items-center gap-4 mb-2">
          <span className="text-xl font-semibold text-primary_color">{formatPriceDisplay()}</span>
          {price_type && (
            <span className={`px-3 py-1 rounded-full text-sm ${price_type === 'rent' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
              {price_type === 'rent' ? 'For Rent' : price_type === 'sale' ? 'For Sale' : price_type}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-primary_color/80 mb-3">
          <MapPin className="w-5 h-5 text-primary_color" />
          {full_address || [town, city, state, country].filter(Boolean).join(', ') || '—'}
        </div>
        <div className="flex flex-wrap gap-2">
          {is_featured && <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1"><Star className="w-3 h-3" /> Featured</span>}
          {is_verified && <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Verified</span>}
          {is_premium && <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs">Premium</span>}
          {is_negotiable && <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs">Negotiable</span>}
          {listingTypes.map((t, i) => <span key={i} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs">{t}</span>)}
        </div>
      </div>

      {/* Gallery */}
      <div>
        <h2 className="text-xl font-semibold text-primary_color mb-4">Gallery</h2>
        <GalleryViewer media={media} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          {/* Description */}
          {description && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
              <div className="whitespace-pre-line text-primary_color/90 leading-relaxed">
                {description.split('\n').map((p, i) => p.trim() && <p key={i} className="mb-2">{p}</p>)}
              </div>
            </div>
          )}

          {/* Floor Plan */}
          {floorPlan && (
            <div>
              <h2 className="text-xl font-semibold text-primary_color mb-4">Floor Plan</h2>
              <div className="bg-gray-50 rounded-lg p-6">
                {Array.isArray(floorPlan) ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {floorPlan.map((plan, i) => (
                      <div key={i} className="relative aspect-square bg-white rounded-lg overflow-hidden border border-gray-200 max-w-[500px]">
                        {plan?.url ? <img src={plan.url} alt={`Floor plan ${i + 1}`} className="w-full h-full object-contain" /> : <div className="w-full h-full flex items-center justify-center text-gray-400">Floor Plan {i + 1}</div>}
                      </div>
                    ))}
                  </div>
                ) : floorPlan?.url ? (
                  <div className="relative aspect-square bg-white rounded-lg overflow-hidden border border-gray-200 max-w-[500px] mx-auto">
                    <img src={floorPlan.url} alt="Floor plan" className="w-full h-full object-contain" />
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* Pricing & Availability */}
          {(pricingData || price) && (
            <div>
              <h2 className="text-xl font-semibold text-primary_color mb-4">Pricing & Availability</h2>
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-gray-200">
                  <div>
                    <p className="text-sm uppercase tracking-wide font-medium text-primary_color/70 mb-1">Price</p>
                    <p className="text-3xl font-light text-primary_color">{formatPriceDisplay()}</p>
                  </div>
                  {is_negotiable !== undefined && <p className="text-primary_color/80 italic">{is_negotiable ? 'Negotiable' : 'Non-negotiable'}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {available_from && <div><p className="text-sm font-medium text-primary_color/70 mb-1">Available From</p><p className="text-primary_color">{new Date(available_from).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p></div>}
                  {available_until && <div><p className="text-sm font-medium text-primary_color/70 mb-1">Available Until</p><p className="text-primary_color">{new Date(available_until).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p></div>}
                  {security_requirements && <div><p className="text-sm font-medium text-primary_color/70 mb-1">Security Deposit</p><p className="text-primary_color">{security_requirements}</p></div>}
                  {cancellation_policy && <div><p className="text-sm font-medium text-primary_color/70 mb-1">Cancellation Policy</p><p className="text-primary_color">{cancellation_policy}</p></div>}
                </div>
              </div>
            </div>
          )}

          {/* Specifications */}
          <div>
            <h2 className="text-xl font-semibold text-primary_color mb-4">Specifications</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(specs).map(([key, value]) => {
                if (!shouldDisplaySpec(key, value)) return null
                const icon = getSpecIcon(key)
                const label = formatSpecLabel(key)
                let displayValue = value
                if (typeof value === 'number') {
                  if (key === 'size' || key === 'property_size') displayValue = `${value} ${listing.listing_type === 'unit' ? 'sq ft' : 'sq m'}`
                  else displayValue = value.toString()
                } else if (typeof value === 'string') displayValue = value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                else if (typeof value === 'boolean') displayValue = value ? 'Yes' : 'No'
                if (!icon) return null
                return (
                  <div key={key} className="flex p-4 gap-2 bg-white rounded-lg border border-gray-100">
                    {icon}
                    <div>
                      <p className="text-xs font-medium text-primary_color/70">{label}</p>
                      <p className="font-medium text-primary_color">{displayValue}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Amenities */}
          {amenities && (amenities.general?.length > 0 || amenities.database?.length > 0 || amenities.custom?.length > 0) && (
            <div>
              <h2 className="text-xl font-semibold text-primary_color mb-4">Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {amenities.general?.map((a, i) => {
                  const ad = getAmenityById(a)
                  const Icon = ad?.icon
                  return (
                    <div key={i} className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-100">
                      {Icon && <Icon className="w-5 h-5 text-primary_color" />}
                      <span className="text-primary_color">{getAmenityName(a)}</span>
                    </div>
                  )
                })}
                {amenities.database?.map((a, i) => (
                  <div key={`db-${i}`} className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-100">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-primary_color">Custom Amenity</span>
                  </div>
                ))}
                {amenities.custom?.map((a, i) => (
                  <div key={`c-${i}`} className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-100">
                    <Star className="w-5 h-5 text-primary_color" />
                    <span className="text-primary_color">{a}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Location */}
          {(latitude && longitude) && (
            <div>
              <h2 className="text-xl font-semibold text-primary_color mb-4">Location</h2>
              <div className="bg-gray-100 rounded-xl p-6 h-80 mb-4">
                <iframe
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  scrolling="no"
                  marginHeight="0"
                  marginWidth="0"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(longitude) - 0.01},${parseFloat(latitude) - 0.01},${parseFloat(longitude) + 0.01},${parseFloat(latitude) + 0.01}&layer=mapnik&marker=${latitude},${longitude}`}
                  className="rounded-lg"
                  title="Location map"
                />
              </div>
              <div className="space-y-2">
                {full_address && <div className="flex items-start gap-2"><MapPin className="w-5 h-5 text-primary_color flex-shrink-0 mt-0.5" /><div><p className="font-semibold text-primary_color">Full Address</p><p className="text-primary_color/90">{full_address}</p></div></div>}
                {(town || city || state || country) && <div className="flex items-start gap-2"><MapPin className="w-5 h-5 text-primary_color flex-shrink-0 mt-0.5" /><div><p className="font-semibold text-primary_color">Location</p><p className="text-primary_color/90">{[town, city, state, country].filter(Boolean).join(', ')}</p></div></div>}
                {location_additional_information && <div className="mt-4 bg-primary_color/5 p-4 rounded-xl"><p className="text-primary_color/90">{location_additional_information}</p></div>}
              </div>
            </div>
          )}

          {/* Video / YouTube */}
          {(video?.url || youtubeUrl) && (
            <div>
              <h2 className="text-xl font-semibold text-primary_color mb-4">Property Video</h2>
              <div className="space-y-4">
                {video?.url && <video src={video.url} controls className="w-full max-h-[500px] object-contain rounded-lg" poster={media?.banner?.url} />}
                {youtubeUrl && <iframe src={youtubeUrl.replace('watch?v=', 'embed/').split('&')[0]} className="w-full aspect-video rounded-lg" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title="YouTube" />}
              </div>
            </div>
          )}

          {/* Social Amenities */}
          {socialAmenities && (
            <NearbyAmenities socialAmenities={socialAmenities} city={city} state={state} />
          )}

          {/* Additional Information */}
          {additional_information && (
            <div>
              <h2 className="text-xl font-semibold text-primary_color mb-4">Additional Information</h2>
              <div className="bg-white p-6 rounded-xl border border-gray-100"><p className="text-primary_color/90 leading-relaxed">{additional_information}</p></div>
            </div>
          )}

          {/* Acquisition Rules */}
          {acquisition_rules && acquisition_rules !== 'None' && (
            <div>
              <h2 className="text-xl font-semibold text-primary_color mb-4">Acquisition Rules</h2>
              <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200"><p className="text-primary_color/90 leading-relaxed">{acquisition_rules}</p></div>
            </div>
          )}
        </div>

        {/* Right sidebar - Owner info */}
        <div className="xl:col-span-1">
          <div className="sticky top-4 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-lg font-semibold text-primary_color mb-4">Listing Info</h2>
            <dl className="space-y-2 text-sm">
              <div><dt className="text-primary_color/70">Type</dt><dd className="font-medium text-primary_color">{listing.listing_type}</dd></div>
              <div><dt className="text-primary_color/70">Status</dt><dd className="font-medium text-primary_color">{listing.status}</dd></div>
              <div><dt className="text-primary_color/70">Listing Status</dt><dd className="font-medium text-primary_color">{listing.listing_status}</dd></div>
              <div><dt className="text-primary_color/70">Listing Condition</dt><dd className="font-medium text-primary_color">{listing.listing_condition || '—'}</dd></div>
              <div><dt className="text-primary_color/70">Owner</dt><dd className="font-medium text-primary_color">{ownerName}</dd></div>
            </dl>
          </div>
        </div>
      </div>

      {/* Related Listings */}
      {relatedListings?.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-primary_color mb-4">More from {ownerName}</h2>
          <ListingList listings={relatedListings.slice(0, 6)} />
        </div>
      )}
    </div>
  )
}
