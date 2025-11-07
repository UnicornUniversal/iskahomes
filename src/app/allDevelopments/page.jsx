'use client'
import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Building2, Calendar, Search, Filter, ArrowRight } from 'lucide-react'

const AllDevelopmentsPage = () => {
  const [developments, setDevelopments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    status: '',
    city: '',
    country: '',
    purpose: '',
    type: ''
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  })

  useEffect(() => {
    fetchDevelopments()
  }, [pagination.page, searchTerm, filters])

  const fetchDevelopments = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(filters.status && { status: filters.status }),
        ...(filters.city && { city: filters.city }),
        ...(filters.country && { country: filters.country }),
        ...(filters.purpose && { purpose: filters.purpose }),
        ...(filters.type && { type: filters.type })
      })

      const response = await fetch(`/api/public/developments?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch developments')
      }

      if (data.success && data.data) {
        setDevelopments(data.data.developments)
        setPagination(prev => ({
          ...prev,
          total: data.data.pagination.total,
          pages: data.data.pagination.pages
        }))
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err) {
      console.error('Error fetching developments:', err)
      setError(err.message)
      setDevelopments([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const clearFilters = () => {
    setFilters({
      status: '',
      city: '',
      country: '',
      purpose: '',
      type: ''
    })
    setSearchTerm('')
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center text-white">
            <h1 className="text-5xl md:text-6xl font-light tracking-tight mb-6">
              Discover Developments
            </h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              Explore premium residential and commercial developments across Ghana
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-8">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search developments by name, location, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              />
            </div>
          </form>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="Planning">Planning</option>
              <option value="Pre-Construction">Pre-Construction</option>
              <option value="Under Construction">Under Construction</option>
              <option value="Ready for Occupancy">Ready for Occupancy</option>
            </select>

            <input
              type="text"
              placeholder="City"
              value={filters.city}
              onChange={(e) => handleFilterChange('city', e.target.value)}
              className="px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            <input
              type="text"
              placeholder="Country"
              value={filters.country}
              onChange={(e) => handleFilterChange('country', e.target.value)}
              className="px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            <select
              value={filters.purpose}
              onChange={(e) => handleFilterChange('purpose', e.target.value)}
              className="px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Purposes</option>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="mixed-use">Mixed Use</option>
            </select>

            <button
              onClick={clearFilters}
              className="px-4 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-light text-slate-900">
            {pagination.total} Development{pagination.total !== 1 ? 's' : ''} Found
          </h2>
          <div className="text-slate-500">
            Page {pagination.page} of {pagination.pages}
          </div>
        </div>

        {/* Developments Grid */}
        {developments.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No Developments Found</h3>
            <p className="text-slate-500">Try adjusting your search criteria or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {developments.map((development) => (
              <Link key={development.id} href={`/allDevelopments/${development.slug}`}>
                <div className="group cursor-pointer">
                  <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 hover:shadow-xl transition-all duration-300">
                    {development.banner ? (
                      <div className="relative h-64 overflow-hidden">
                        <Image
                          src={development.banner.url}
                          alt={development.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-4 right-4">
                          <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-slate-700 rounded-full text-xs font-medium">
                            {development.status}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="h-64 bg-slate-100 flex items-center justify-center">
                        <Building2 className="w-16 h-16 text-slate-400" />
                      </div>
                    )}
                    
                    <div className="p-6">
                      <h3 className="text-xl font-medium text-slate-900 mb-3 group-hover:text-slate-700 transition-colors">
                        {development.title}
                      </h3>
                      <p className="text-slate-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                        {development.description}
                      </p>
                      
                      {/* Location */}
                      <div className="flex items-center text-sm text-slate-500 mb-4">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>{development.city}, {development.country}</span>
                      </div>

                      {/* Developer */}
                      <div className="flex items-center space-x-3 mb-4">
                        {development.developers?.profile_image ? (
                          <Image
                            src={development.developers.profile_image.url}
                            alt={development.developers.name}
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-slate-500" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-slate-900">{development.developers?.name}</p>
                          {development.developers?.verified && (
                            <span className="text-xs text-green-600">Verified</span>
                          )}
                        </div>
                      </div>

                      {/* Development Stats */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="text-center py-2 bg-slate-50 rounded-lg">
                          <div className="text-lg font-semibold text-slate-900">{development.number_of_buildings}</div>
                          <div className="text-xs text-slate-500 uppercase tracking-wider">Buildings</div>
                        </div>
                        <div className="text-center py-2 bg-slate-50 rounded-lg">
                          <div className="text-lg font-semibold text-slate-900">{development.total_units}</div>
                          <div className="text-xs text-slate-500 uppercase tracking-wider">Units</div>
                        </div>
                      </div>

                      {/* Purposes */}
                      {development.purposes && development.purposes.length > 0 && (
                        <div className="mb-6">
                          <div className="flex flex-wrap gap-2">
                            {development.purposes.slice(0, 2).map((purpose, index) => (
                              <span key={index} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                                {typeof purpose === 'string' ? purpose : purpose.name}
                              </span>
                            ))}
                            {development.purposes.length > 2 && (
                              <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                                +{development.purposes.length - 2} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action Button */}
                      <div className="flex items-center justify-center space-x-2 text-slate-600 group-hover:text-slate-900 transition-colors">
                        <span className="text-sm font-medium">View Details</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center mt-12">
            <div className="flex space-x-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className="px-4 py-2 border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Previous
              </button>
              
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const page = i + 1
                return (
                  <button
                    key={page}
                    onClick={() => setPagination(prev => ({ ...prev, page }))}
                    className={`px-4 py-2 rounded-lg ${
                      pagination.page === page
                        ? 'bg-slate-900 text-white'
                        : 'border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {page}
                  </button>
                )
              })}
              
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                disabled={pagination.page === pagination.pages}
                className="px-4 py-2 border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AllDevelopmentsPage
