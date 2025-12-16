'use client'
import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Building2, Search, Filter, ArrowRight, X } from 'lucide-react'
import Nav from '@/app/components/Nav'
import FeaturedDevelopments from '@/app/components/general/FeaturedDevelopments'

const AllDevelopmentsPage = () => {
  const [developments, setDevelopments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showMobileFilters, setShowMobileFilters] = useState(false)
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

  const hasActiveFilters = Object.values(filters).some(val => val !== '') || searchTerm !== ''

  // Filter Component
  const FiltersPanel = ({ isMobile = false }) => (
    <div className={isMobile ? 'w-full' : 'w-full'}>
      <div className={`bg-white rounded-xl shadow-lg border border-slate-200 p-6 ${isMobile ? '' : 'sticky top-24'}`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">Filters</h3>
          {isMobile && (
            <button
              onClick={() => setShowMobileFilters(false)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="Planning">Planning</option>
              <option value="Pre-Construction">Pre-Construction</option>
              <option value="Under Construction">Under Construction</option>
              <option value="Ready for Occupancy">Ready for Occupancy</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
            <input
              type="text"
              placeholder="Enter city"
              value={filters.city}
              onChange={(e) => handleFilterChange('city', e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Country</label>
            <input
              type="text"
              placeholder="Enter country"
              value={filters.country}
              onChange={(e) => handleFilterChange('country', e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Purpose</label>
            <select
              value={filters.purpose}
              onChange={(e) => handleFilterChange('purpose', e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
            >
              <option value="">All Purposes</option>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="mixed-use">Mixed Use</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
            >
              Clear All Filters
            </button>
          )}
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary_color"></div>
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
    <>
      <Nav />
      <div className="min-h-screen ">
        {/* Hero Section */}
        <div className="p-6 md:p-10">
          <div className="text-center text-left flex flex-col md:flex-row items-start">
            <div>
              <h1 className="text-5xl md:text-6xl font-light tracking-tight mb-6">
                Discover 
              </h1>
              <h1 className="text-5xl md:text-[7em] font-light tracking-tight mb-6">
                Developments
              </h1>
            </div>
            <p className="text-sm max-w-3xl leading-relaxed">
              Explore premium residential and commercial developments across Ghana and all around the world. 
            </p>
          </div>
        </div>

        <FeaturedDevelopments />

        {/* Main Content Area */}
        <div className="px-4 md:px-6 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Side - Search and Results */}
            <div className="flex-1">
              {/* Search Bar */}
              <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4 md:p-6 mb-6">
                <form onSubmit={handleSearch} className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search developments..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
                    />
                  </div>
                  {/* Mobile Filter Button */}
                  <button
                    type="button"
                    onClick={() => setShowMobileFilters(true)}
                    className="lg:hidden px-4 py-3 bg-primary_color text-white rounded-lg hover:bg-primary_color/90 transition-colors flex items-center gap-2"
                  >
                    <Filter className="w-5 h-5" />
                    {hasActiveFilters && (
                      <span className="w-2 h-2 bg-white rounded-full"></span>
                    )}
                  </button>
                </form>
              </div>

              {/* Results Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl md:text-2xl font-semibold text-slate-900">
                  {pagination.total} Development{pagination.total !== 1 ? 's' : ''} Found
                </h2>
                <div className="text-sm text-slate-500">
                  Page {pagination.page} of {pagination.pages}
                </div>
              </div>

              {/* Developments Grid */}
              {developments.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
                  <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No Developments Found</h3>
                  <p className="text-slate-500">Try adjusting your search criteria or filters.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {developments.map((development) => {
                    // Parse banner image
                    let bannerUrl = null
                    if (development.banner) {
                      try {
                        if (typeof development.banner === 'string') {
                          const parsed = JSON.parse(development.banner)
                          bannerUrl = parsed?.url || parsed || null
                        } else if (typeof development.banner === 'object') {
                          bannerUrl = development.banner?.url || development.banner || null
                        }
                        if (bannerUrl && !bannerUrl.startsWith('http')) {
                          bannerUrl = null
                        }
                      } catch (e) {
                        if (development.banner.startsWith('http')) {
                          bannerUrl = development.banner
                        }
                      }
                    }

                    // Parse developer profile image
                    let developerImageUrl = null
                    if (development.developers?.profile_image) {
                      try {
                        if (typeof development.developers.profile_image === 'string') {
                          const parsed = JSON.parse(development.developers.profile_image)
                          developerImageUrl = parsed?.url || parsed || null
                        } else if (typeof development.developers.profile_image === 'object') {
                          developerImageUrl = development.developers.profile_image?.url || development.developers.profile_image || null
                        }
                        if (developerImageUrl && !developerImageUrl.startsWith('http')) {
                          developerImageUrl = null
                        }
                      } catch (e) {
                        if (development.developers.profile_image.startsWith('http')) {
                          developerImageUrl = development.developers.profile_image
                        }
                      }
                    }

                    return (
                      <Link key={development.id} href={`/home/allDevelopments/${development.slug}`}>
                        <div className="group cursor-pointer h-full">
                          <div className="relative overflow-hidden rounded-xl border border-slate-200 hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                            {/* Image */}
                            {bannerUrl ? (
                              <div className="relative h-56 overflow-hidden">
                                <Image
                                  src={bannerUrl}
                                  alt={development.title}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute top-4 right-4">
                                  <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-slate-700 rounded-full text-xs font-semibold">
                                    {development.status}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="h-56 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                                <Building2 className="w-16 h-16 text-slate-400" />
                              </div>
                            )}
                            
                            {/* Content */}
                            <div className="p-5 flex-1 flex flex-col">
                              <h3 className="text-lg font-semibold text-slate-900 mb-3 group-hover:text-primary_color transition-colors line-clamp-2">
                                {development.title}
                              </h3>
                              
                              {/* Location */}
                              <div className="flex items-center text-sm text-slate-600 mb-4">
                                <MapPin className="w-4 h-4 mr-1.5 flex-shrink-0" />
                                <span className="truncate">{development.city}, {development.country}</span>
                              </div>

                              {/* Developer */}
                              <div className="flex items-center gap-2 mb-4">
                                {developerImageUrl ? (
                                  <Image
                                    src={developerImageUrl}
                                    alt={development.developers?.name || 'Developer'}
                                    width={28}
                                    height={28}
                                    className="rounded-full object-cover flex-shrink-0"
                                  />
                                ) : (
                                  <div className="w-7 h-7 bg-primary_color/10 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Building2 className="w-4 h-4 text-primary_color" />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-slate-900 truncate">
                                    {development.developers?.name || 'Developer'}
                                  </p>
                                  {development.developers?.verified && (
                                    <span className="text-xs text-green-600">Verified</span>
                                  )}
                                </div>
                              </div>

                              {/* Development Stats */}
                              <div className="grid grid-cols-3 gap-2 mb-4">
                                <div className="text-center py-1.5">
                                  <div className="text-sm font-semibold text-slate-900">{development.total_units || 0}</div>
                                  <div className="text-xs text-slate-500 mt-0.5">Total Units</div>
                                </div>
                                <div className="text-center py-1.5">
                                  <div className="text-sm font-semibold text-slate-900">{development.units_sold || 0}</div>
                                  <div className="text-xs text-slate-500 mt-0.5">Sold</div>
                                </div>
                                <div className="text-center py-1.5">
                                  <div className="text-sm font-semibold text-slate-900">{development.total_views || development.views || 0}</div>
                                  <div className="text-xs text-slate-500 mt-0.5">Views</div>
                                </div>
                              </div>

                              {/* Purposes */}
                              {development.purposes && development.purposes.length > 0 && (
                                <div className="mb-4 flex-1">
                                  <div className="flex flex-wrap gap-2">
                                    {development.purposes.slice(0, 3).map((purpose, index) => (
                                      <span key={index} className="px-2.5 py-1 bg-primary_color/10 text-primary_color rounded-full text-xs font-medium">
                                        {typeof purpose === 'string' ? purpose : purpose.name}
                                      </span>
                                    ))}
                                    {development.purposes.length > 3 && (
                                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                                        +{development.purposes.length - 3}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Action Button */}
                              <div className="flex items-center justify-center gap-2 text-primary_color group-hover:text-primary_color/80 transition-colors pt-2 border-t border-slate-100">
                                <span className="text-sm font-semibold">View Details</span>
                                <ArrowRight className="w-4 h-4" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex justify-center mt-12">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                      disabled={pagination.page === 1}
                      className="px-4 py-2 border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                    >
                      Previous
                    </button>
                    
                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      const page = i + 1
                      return (
                        <button
                          key={page}
                          onClick={() => setPagination(prev => ({ ...prev, page }))}
                          className={`px-4 py-2 rounded-lg transition-colors ${
                            pagination.page === page
                              ? 'bg-primary_color text-white'
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
                      className="px-4 py-2 border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Side - Filters (Desktop) */}
            <div className="hidden lg:block w-80 flex-shrink-0">
              <FiltersPanel />
            </div>
          </div>
        </div>

        {/* Mobile Filters Overlay */}
        {showMobileFilters && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileFilters(false)}></div>
            <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-2xl overflow-y-auto">
              <div className="p-6">
                <FiltersPanel isMobile={true} />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default AllDevelopmentsPage
