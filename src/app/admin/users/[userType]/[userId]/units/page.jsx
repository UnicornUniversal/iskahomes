'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { FiHome, FiMapPin } from 'react-icons/fi'

const URL_TO_TYPE = {
  developers: 'developer',
  agents: 'agent',
  agencies: 'agency',
  'property-seekers': 'property_seeker'
}

const getUnitImage = (media) => {
  if (!media) return null
  if (Array.isArray(media) && media.length > 0) {
    return typeof media[0] === 'string' ? media[0] : media[0]?.url
  }
  if (media?.albums?.[0]?.images?.[0]?.url) return media.albums[0].images[0].url
  if (media?.mediaFiles?.[0]?.url) return media.mediaFiles[0].url
  if (media?.banner?.url) return media.banner.url
  return null
}

export default function DeveloperUnitsPage() {
  const params = useParams()
  const urlType = params?.userType || 'developers'
  const userType = URL_TO_TYPE[urlType] || 'developer'
  const userId = params?.userId

  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId || userType !== 'developer') {
      setLoading(false)
      return
    }
    fetch(`/api/admin/users/${userType}/${encodeURIComponent(userId)}/units`)
      .then(res => res.json())
      .then(result => {
        if (result.success) setUnits(result.data || [])
      })
      .finally(() => setLoading(false))
  }, [userType, userId])

  const formatPrice = (p, currency = 'UGX') => {
    if (!p) return '—'
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'UGX', maximumFractionDigits: 0 }).format(p)
  }

  if (loading) return <div className="text-primary_color/70">Loading units...</div>
  if (userType !== 'developer') return <div className="text-primary_color/70">Units are only available for developers.</div>

  return (
    <div className="w-full">
      <h2 className="text-primary_color font-semibold mb-6">Units</h2>
      {units.length === 0 ? (
        <div className="bg-gray-50 rounded-2xl p-12 text-center text-primary_color/70">No units found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {units.map((unit) => {
            const img = getUnitImage(unit.media)
            return (
              <Link key={unit.id} href={`/admin/properties/${unit.slug}`}>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg hover:border-primary_color/30 transition-all duration-300 group">
                  <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                    {img ? (
                      <img src={img} alt={unit.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FiHome className="w-16 h-16 text-gray-300" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-1">
                      {unit.is_featured && <span className="bg-yellow-400 text-white text-xs px-2 py-0.5 rounded">Featured</span>}
                      {unit.is_verified && <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded">Verified</span>}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-primary_color line-clamp-2 mb-2 group-hover:text-primary_color/80">{unit.title}</h3>
                    <div className="flex items-center gap-1 text-sm text-primary_color/70 mb-2">
                      <FiMapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="line-clamp-1">{[unit.city, unit.country].filter(Boolean).join(', ') || '—'}</span>
                    </div>
                    <p className="text-lg font-bold text-primary_color">{formatPrice(unit.price, unit.currency)}</p>
                    <span className="inline-block mt-2 text-sm text-primary_color/80 border border-primary_color/30 rounded-lg px-3 py-1 group-hover:bg-primary_color/10 transition-colors">
                      View Details →
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
