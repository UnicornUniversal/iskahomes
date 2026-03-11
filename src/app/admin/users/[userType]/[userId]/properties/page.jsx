'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { FiMapPin } from 'react-icons/fi'

const URL_TO_TYPE = {
  developers: 'developer',
  agents: 'agent',
  agencies: 'agency',
  'property-seekers': 'property_seeker'
}

export default function UserPropertiesPage() {
  const params = useParams()
  const urlType = params?.userType || 'developers'
  const userType = URL_TO_TYPE[urlType] || 'developer'
  const userId = params?.userId

  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId || userType === 'property_seeker' || userType === 'developer') {
      setLoading(false)
      return
    }
    fetch(`/api/admin/users/${userType}/${encodeURIComponent(userId)}/properties`)
      .then(res => res.json())
      .then(result => {
        if (result.success) setListings(result.data || [])
      })
      .finally(() => setLoading(false))
  }, [userType, userId])

  const formatPrice = (p, currency = 'UGX') => {
    if (!p) return '—'
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'UGX', maximumFractionDigits: 0 }).format(p)
  }

  if (loading) return <div className="text-primary_color/70">Loading properties...</div>
  if (userType === 'property_seeker') return <div className="text-primary_color/70">Property seekers do not have listings.</div>
  if (userType === 'developer') return <div className="text-primary_color/70">Developers have Units and Developments tabs instead.</div>

  return (
    <div className="secondary_bg rounded-2xl shadow-sm overflow-hidden">
      <h2 className="px-6 py-4 font-semibold text-primary_color border-b border-primary_color/20">Properties</h2>
      {listings.length === 0 ? (
        <div className="p-8 text-center text-primary_color/70">No properties found.</div>
      ) : (
        <div className="divide-y divide-primary_color/10">
          {listings.map((listing) => (
            <div key={listing.id} className="px-6 py-4 flex items-center justify-between hover:bg-primary_color/5 transition-colors">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary_color/10 flex items-center justify-center overflow-hidden">
                  {listing.media?.[0] ? (
                    <img src={listing.media[0]} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <FiMapPin className="w-6 h-6 text-primary_color/60" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-primary_color">{listing.title}</p>
                  <p className="text-sm text-primary_color/70">{listing.city}, {listing.country}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-primary_color">{formatPrice(listing.price, listing.currency)}</span>
                <Link href={`/admin/properties/${listing.slug}`} className="primary_button text-sm px-3 py-2">
                  View →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
