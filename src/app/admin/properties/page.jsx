'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { FiSearch, FiMapPin, FiEye } from 'react-icons/fi'

export default function AdminPropertiesPage() {
  const [listings, setListings] = useState([])
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({
      page: '1',
      limit: '20',
      ...(debouncedSearch && { search: debouncedSearch }),
      ...(statusFilter !== 'all' && { status: statusFilter })
    })
    fetch(`/api/admin/properties?${params}`)
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setListings(result.data || [])
          setPagination(result.pagination || {})
        }
      })
      .finally(() => setLoading(false))
  }, [debouncedSearch, statusFilter])

  const formatPrice = (p, currency = 'UGX') => {
    if (!p) return '—'
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'UGX', maximumFractionDigits: 0 }).format(p)
  }

  return (
    <div className="w-full flex flex-col gap-4">
      <h1 className="text-primary_color mb-2">Properties</h1>
      <p className="text-primary_color/80 text-sm mb-4">All listings on the platform. Public info only.</p>

      <div className="secondary_bg p-4 rounded-2xl mb-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-primary_color/60 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by title, city, or state..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="sold">Sold</option>
            <option value="rented">Rented</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="secondary_bg p-8 rounded-2xl text-center text-primary_color/70">Loading...</div>
      ) : (
        <div className="secondary_bg rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-primary_color/20">
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary_color uppercase">Property</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary_color uppercase">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary_color uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary_color uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary_color uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary_color uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((listing) => (
                  <tr key={listing.id} className="border-b border-primary_color/10 hover:bg-primary_color/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-primary_color/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {listing.media?.[0] ? (
                            <img src={listing.media[0]} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <FiMapPin className="w-6 h-6 text-primary_color/60" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-primary_color">{listing.title}</div>
                          <div className="text-xs text-primary_color/60">{listing.listing_type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-primary_color/80">
                      {[listing.city, listing.state, listing.country].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-primary_color">{formatPrice(listing.price, listing.currency)}</td>
                    <td className="px-6 py-4 text-sm text-primary_color/80">{listing.listing_type || '—'}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-primary_color/20 text-primary_color">
                        {listing.status || 'active'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/properties/${listing.slug}`}
                        className="primary_button inline-flex items-center gap-1 text-sm px-3 py-2"
                      >
                        <FiEye className="w-4 h-4" /> View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {listings.length === 0 && (
            <div className="p-8 text-center text-primary_color/70">No properties found.</div>
          )}
        </div>
      )}
    </div>
  )
}
