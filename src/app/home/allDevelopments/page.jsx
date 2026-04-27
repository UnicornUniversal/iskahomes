'use client'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Building2, Check, Filter, MapPin, X } from 'lucide-react'
import Nav from '@/app/components/Nav'
import { withWebsiteLeadAttribution } from '@/lib/leadAttributionUrl'
import FeaturedDevelopments from '@/app/components/general/FeaturedDevelopments'
import GeneralHeader from '@/app/components/general/GeneralHeader'

const INITIAL_FILTERS = {
  developerId: '',
  developerName: '',
  location: '',
  locationType: '',
  status: '',
  propertyType: '',
  propertySubtype: ''
}

const formatDevelopmentLocation = (development) => {
  const parts = [development.town, development.city, development.state, development.country].filter(Boolean)
  return development.full_address || parts.join(', ') || 'Location unavailable'
}

const getImageUrl = (value) => {
  if (!value) return null

  try {
    if (typeof value === 'string') {
      const parsed = JSON.parse(value)
      const resolved = parsed?.url || parsed || null
      return typeof resolved === 'string' && resolved.startsWith('http') ? resolved : null
    }

    if (typeof value === 'object') {
      const resolved = value?.url || value || null
      return typeof resolved === 'string' && resolved.startsWith('http') ? resolved : null
    }
  } catch {
    if (typeof value === 'string' && value.startsWith('http')) {
      return value
    }
  }

  return null
}

const AllDevelopmentsPage = () => {
  const [developments, setDevelopments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [draftFilters, setDraftFilters] = useState(INITIAL_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState(INITIAL_FILTERS)
  const [propertyTypeOptions, setPropertyTypeOptions] = useState([])
  const [propertySubtypeOptions, setPropertySubtypeOptions] = useState([])
  const [developerSuggestions, setDeveloperSuggestions] = useState([])
  const [locationSuggestions, setLocationSuggestions] = useState([])
  const [showDeveloperDropdown, setShowDeveloperDropdown] = useState(false)
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  })

  const developerSearchTimeoutRef = useRef(null)
  const locationSearchTimeoutRef = useRef(null)
  const developerDropdownRef = useRef(null)
  const locationDropdownRef = useRef(null)

  const filteredSubtypeOptions = useMemo(() => {
    if (!draftFilters.propertyType) {
      return propertySubtypeOptions
    }

    return propertySubtypeOptions.filter(
      subtype => subtype.property_type === draftFilters.propertyType
    )
  }, [draftFilters.propertyType, propertySubtypeOptions])

  useEffect(() => {
    fetchFilterOptions()
  }, [])

  useEffect(() => {
    fetchDevelopments()
  }, [pagination.page, appliedFilters])

  useEffect(() => {
    const query = draftFilters.developerName.trim()

    if (developerSearchTimeoutRef.current) {
      clearTimeout(developerSearchTimeoutRef.current)
    }

    if (!query || query.length < 2 || draftFilters.developerId) {
      setDeveloperSuggestions([])
      setShowDeveloperDropdown(false)
      return
    }

    developerSearchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/developers?search=${encodeURIComponent(query)}&page=1&limit=8`)
        const result = await response.json()

        if (response.ok && result.success) {
          setDeveloperSuggestions(result.data || [])
          setShowDeveloperDropdown((result.data || []).length > 0)
        } else {
          setDeveloperSuggestions([])
          setShowDeveloperDropdown(false)
        }
      } catch (autocompleteError) {
        console.error('Error fetching developer suggestions:', autocompleteError)
        setDeveloperSuggestions([])
        setShowDeveloperDropdown(false)
      }
    }, 300)

    return () => {
      if (developerSearchTimeoutRef.current) {
        clearTimeout(developerSearchTimeoutRef.current)
      }
    }
  }, [draftFilters.developerName, draftFilters.developerId])

  useEffect(() => {
    const query = draftFilters.location.trim()

    if (locationSearchTimeoutRef.current) {
      clearTimeout(locationSearchTimeoutRef.current)
    }

    if (!query || query.length < 2 || draftFilters.locationType) {
      setLocationSuggestions([])
      setShowLocationDropdown(false)
      return
    }

    locationSearchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/locations/search?q=${encodeURIComponent(query)}&limit=10&scope=developments`)
        const result = await response.json()

        if (response.ok && result.success) {
          setLocationSuggestions(result.data || [])
          setShowLocationDropdown((result.data || []).length > 0)
        } else {
          setLocationSuggestions([])
          setShowLocationDropdown(false)
        }
      } catch (autocompleteError) {
        console.error('Error fetching location suggestions:', autocompleteError)
        setLocationSuggestions([])
        setShowLocationDropdown(false)
      }
    }, 300)

    return () => {
      if (locationSearchTimeoutRef.current) {
        clearTimeout(locationSearchTimeoutRef.current)
      }
    }
  }, [draftFilters.location, draftFilters.locationType])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (developerDropdownRef.current && !developerDropdownRef.current.contains(event.target)) {
        setShowDeveloperDropdown(false)
      }

      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target)) {
        setShowLocationDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    if (
      draftFilters.propertySubtype &&
      !filteredSubtypeOptions.some(subtype => subtype.id === draftFilters.propertySubtype)
    ) {
      setDraftFilters(prev => ({ ...prev, propertySubtype: '' }))
    }
  }, [draftFilters.propertySubtype, filteredSubtypeOptions])

  const fetchFilterOptions = async () => {
    try {
      const response = await fetch('/api/property-taxonomy?include_subtypes=true')
      const result = await response.json()

      if (response.ok && result.success) {
        setPropertyTypeOptions(result.data?.propertyTypes || [])
        setPropertySubtypeOptions(result.data?.subtypes || [])
      }
    } catch (lookupError) {
      console.error('Error fetching development filter options:', lookupError)
    }
  }

  const fetchDevelopments = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(appliedFilters.status && { status: appliedFilters.status }),
        ...(appliedFilters.location && { location: appliedFilters.location }),
        ...(appliedFilters.locationType && { location_type: appliedFilters.locationType }),
        ...(appliedFilters.developerId && { developer_id: appliedFilters.developerId }),
        ...(appliedFilters.developerName && { developer_name: appliedFilters.developerName }),
        ...(appliedFilters.propertyType && { type: appliedFilters.propertyType }),
        ...(appliedFilters.propertySubtype && { subtype: appliedFilters.propertySubtype })
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

  const applyFilters = (closeMobile = false) => {
    setAppliedFilters({
      ...draftFilters,
      developerName: draftFilters.developerName.trim(),
      location: draftFilters.location.trim()
    })
    setPagination(prev => ({ ...prev, page: 1 }))

    if (closeMobile) {
      setShowMobileFilters(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setDraftFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleDeveloperInputChange = (value) => {
    setDraftFilters(prev => ({
      ...prev,
      developerId: '',
      developerName: value
    }))
  }

  const handleDeveloperSelect = (developer) => {
    setDraftFilters(prev => ({
      ...prev,
      developerId: developer.developer_id,
      developerName: developer.name
    }))
    setDeveloperSuggestions([])
    setShowDeveloperDropdown(false)
  }

  const clearDeveloperSelection = () => {
    setDraftFilters(prev => ({
      ...prev,
      developerId: '',
      developerName: ''
    }))
    setDeveloperSuggestions([])
    setShowDeveloperDropdown(false)
  }

  const handleLocationInputChange = (value) => {
    setDraftFilters(prev => ({
      ...prev,
      location: value,
      locationType: ''
    }))
  }

  const handleLocationSelect = (location) => {
    setDraftFilters(prev => ({
      ...prev,
      location: location.label,
      locationType: location.type
    }))
    setLocationSuggestions([])
    setShowLocationDropdown(false)
  }

  const clearLocationSelection = () => {
    setDraftFilters(prev => ({
      ...prev,
      location: '',
      locationType: ''
    }))
    setLocationSuggestions([])
    setShowLocationDropdown(false)
  }

  const clearFilters = () => {
    setDraftFilters(INITIAL_FILTERS)
    setAppliedFilters(INITIAL_FILTERS)
    setDeveloperSuggestions([])
    setLocationSuggestions([])
    setShowDeveloperDropdown(false)
    setShowLocationDropdown(false)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const hasActiveDraftFilters =
    draftFilters.developerName.trim() !== '' ||
    draftFilters.location.trim() !== '' ||
    draftFilters.status !== '' ||
    draftFilters.propertyType !== '' ||
    draftFilters.propertySubtype !== ''

  const hasAppliedFilters =
    appliedFilters.developerName.trim() !== '' ||
    appliedFilters.location.trim() !== '' ||
    appliedFilters.status !== '' ||
    appliedFilters.propertyType !== '' ||
    appliedFilters.propertySubtype !== ''

  const headerImages = [
    {
      src: 'https://images.unsplash.com/photo-1479839672679-a46483c0e7c8?auto=format&fit=crop&w=900&q=80',
      alt: 'Modern skyline with mixed-use developments'
    },
    {
      src: 'https://images.unsplash.com/photo-1464146072230-91cabc968266?auto=format&fit=crop&w=900&q=80',
      alt: 'Luxury housing community'
    },
    {
      src: 'https://images.unsplash.com/photo-1519999482648-25049ddd37b1?auto=format&fit=crop&w=900&q=80',
      alt: 'Contemporary city development project'
    }
  ]

  const renderFiltersPanel = (isMobile = false) => (
    <div className="w-full">
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
          <div ref={developerDropdownRef} className="relative">
            <label className="block text-sm font-medium text-slate-700 mb-2">Developer Name</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search developer name"
                value={draftFilters.developerName}
                onChange={(e) => handleDeveloperInputChange(e.target.value)}
                onFocus={() => {
                  if (developerSuggestions.length > 0) {
                    setShowDeveloperDropdown(true)
                  }
                }}
                className="w-full px-4 py-2.5 pr-10 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
              />
              {draftFilters.developerName && (
                <button
                  type="button"
                  onClick={clearDeveloperSelection}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {showDeveloperDropdown && developerSuggestions.length > 0 && (
              <div className="absolute z-30 mt-2 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
                {developerSuggestions.map((developer) => (
                  <button
                    key={developer.developer_id || developer.slug}
                    type="button"
                    onClick={() => handleDeveloperSelect(developer)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{developer.name}</p>
                      <p className="text-xs text-slate-500">{developer.country || 'Developer'}</p>
                    </div>
                    {draftFilters.developerId === developer.developer_id && (
                      <Check className="w-4 h-4 text-primary_color" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div ref={locationDropdownRef} className="relative">
            <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search country, state, city, or town"
                value={draftFilters.location}
                onChange={(e) => handleLocationInputChange(e.target.value)}
                onFocus={() => {
                  if (locationSuggestions.length > 0) {
                    setShowLocationDropdown(true)
                  }
                }}
                className="w-full px-4 py-2.5 pr-10 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
              />
              {draftFilters.location && (
                <button
                  type="button"
                  onClick={clearLocationSelection}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {showLocationDropdown && locationSuggestions.length > 0 && (
              <div className="absolute z-30 mt-2 w-full rounded-lg border border-slate-200 bg-white shadow-lg max-h-72 overflow-y-auto">
                {locationSuggestions.map((location, index) => (
                  <button
                    key={`${location.type}-${location.value}-${index}`}
                    type="button"
                    onClick={() => handleLocationSelect(location)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                  >
                    <span className="rounded-full bg-primary_color/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary_color">
                      {location.type}
                    </span>
                    <span className="text-sm text-slate-800">{location.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
            <select
              value={draftFilters.status}
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
            <label className="block text-sm font-medium text-slate-700 mb-2">Property Type</label>
            <select
              value={draftFilters.propertyType}
              onChange={(e) => {
                handleFilterChange('propertyType', e.target.value)
                handleFilterChange('propertySubtype', '')
              }}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
            >
              <option value="">All Property Types</option>
              {propertyTypeOptions.map((typeOption) => (
                <option key={typeOption.id} value={typeOption.id}>
                  {typeOption.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Property Subtype</label>
            <select
              value={draftFilters.propertySubtype}
              onChange={(e) => handleFilterChange('propertySubtype', e.target.value)}
              disabled={!draftFilters.propertyType}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent disabled:bg-slate-100 disabled:text-slate-400"
            >
              <option value="">All Property Subtypes</option>
              {filteredSubtypeOptions.map((subtypeOption) => (
                <option key={subtypeOption.id} value={subtypeOption.id}>
                  {subtypeOption.name}
                </option>
              ))}
            </select>
            {!draftFilters.propertyType && (
              <p className="mt-2 text-xs text-slate-500">Select a property type first.</p>
            )}
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button
              type="button"
              onClick={() => applyFilters(isMobile)}
              className="w-full px-4 py-2.5 bg-primary_color text-white rounded-lg hover:bg-primary_color/90 transition-colors font-medium"
            >
              Apply Filters
            </button>

            {hasActiveDraftFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="w-full px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
              >
                Clear All Filters
              </button>
            )}
          </div>
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
      <div className="min-h-screen">
        <GeneralHeader
          headingOne="Discover"
          headingTwo="Developments"
          description="Explore premium residential and commercial developments across Ghana and all around the world."
          stats={[{ label: 'Total Developments', value: pagination.total }]}
          images={headerImages}
          className="pb-10"
        />

        <FeaturedDevelopments />

        <div className="px-4 md:px-6 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-semibold text-slate-900">
                    {pagination.total} Development{pagination.total !== 1 ? 's' : ''} Found
                  </h2>
                  <div className="text-sm text-slate-500 mt-1">
                    Page {pagination.page} of {pagination.pages || 1}
                    {hasAppliedFilters && <span className="ml-2">Filtered results</span>}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowMobileFilters(true)}
                  className="lg:hidden px-4 py-3 bg-primary_color text-white rounded-lg hover:bg-primary_color/90 transition-colors flex items-center gap-2"
                >
                  <Filter className="w-5 h-5" />
                  Filters
                  {hasActiveDraftFilters && <span className="w-2 h-2 bg-white rounded-full"></span>}
                </button>
              </div>

              {developments.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
                  <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No Developments Found</h3>
                  <p className="text-slate-500">Try adjusting your filters.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {developments.map((development) => {
                    const bannerUrl = getImageUrl(development.banner)
                    const developerImageUrl = getImageUrl(development.developers?.profile_image)

                    return (
                      <Link key={development.id} href={withWebsiteLeadAttribution(`/home/allDevelopments/${development.slug}`, 'development')}>
                        <div className="group cursor-pointer h-full">
                          <div className="relative overflow-hidden rounded-xl border border-slate-200 hover:shadow-xl transition-all duration-300 h-full flex flex-col">
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

                            <div className="p-5 flex-1 flex flex-col">
                              <h3 className="text-lg font-semibold text-slate-900 mb-3 group-hover:text-primary_color transition-colors line-clamp-2">
                                {development.title}
                              </h3>

                              <div className="flex items-center text-sm text-slate-600 mb-4">
                                <MapPin className="w-4 h-4 mr-1.5 flex-shrink-0" />
                                <span className="truncate">{formatDevelopmentLocation(development)}</span>
                              </div>

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

            <div className="hidden lg:block w-80 flex-shrink-0">
              {renderFiltersPanel()}
            </div>
          </div>
        </div>

        {showMobileFilters && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileFilters(false)}></div>
            <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-2xl overflow-y-auto">
              <div className="p-6">
                {renderFiltersPanel(true)}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default AllDevelopmentsPage
