'use client'
import React, { useState, useEffect, useRef, useMemo } from 'react'
import DevelopmentCard from '@/app/components/developers/DevelopmentCard'
import DeveloperHeader from '@/app/components/developers/DeveloperHeader'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { CustomSelect } from '@/app/components/ui/custom-select'
import { 
  usePropertyPurposes, 
  usePropertyTypes, 
  usePropertyCategories, 
  usePropertySubtypes 
} from '@/hooks/useCachedData'

const page = () => {
  const { user } = useAuth()
  const params = useParams()
  const [developments, setDevelopments] = useState([])
  const [filteredDevelopments, setFilteredDevelopments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  
  // Location filter - single search field
  const [locationSearch, setLocationSearch] = useState('')
  const [locationSearchResults, setLocationSearchResults] = useState([])
  const [selectedLocation, setSelectedLocation] = useState(null) // { type: 'country'|'state'|'city'|'town', value: string }
  const [showLocationResults, setShowLocationResults] = useState(false)
  const locationSearchRef = useRef(null)
  const locationResultsRef = useRef(null)
  
  // Category filters
  const [selectedPurpose, setSelectedPurpose] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedSubType, setSelectedSubType] = useState('')
  
  // Use cached categorization data
  const { data: purposesData = [], loading: purposesLoading } = usePropertyPurposes()
  const { data: typesData = [], loading: typesLoading } = usePropertyTypes()
  const { data: categoriesData = [], loading: categoriesLoading } = usePropertyCategories()
  const { data: subtypesData = [], loading: subtypesLoading } = usePropertySubtypes()
  
  // Convert to options format for CustomSelect - using IDs as values
  const purposeOptions = useMemo(() => [
    { value: '', label: 'All Purposes' },
    ...purposesData.map(p => ({ value: p.id, label: p.name }))
  ], [purposesData])
  
  const typeOptions = useMemo(() => [
    { value: '', label: 'All Types' },
    ...typesData.map(t => ({ value: t.id, label: t.name }))
  ], [typesData])
  
  const categoryOptions = useMemo(() => [
    { value: '', label: 'All Categories' },
    ...categoriesData.map(c => ({ value: c.id, label: c.name }))
  ], [categoriesData])
  
  const subtypeOptions = useMemo(() => [
    { value: '', label: 'All Sub Types' },
    ...subtypesData.map(s => ({ value: s.id, label: s.name }))
  ], [subtypesData])
  
  // View mode state
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  
  // Filter visibility for mobile/tablet
  const [showFilters, setShowFilters] = useState(false)

  // Debug user object
  useEffect(() => {
    console.log('Page - User state changed:', {
      user: user ? {
        id: user.id,
        email: user.email,
        user_type: user.user_type,
        profile: user.profile ? {
          id: user.profile.id,
          developer_id: user.profile.developer_id,
          name: user.profile.name
        } : null
      } : null
    });
  }, [user]);

  useEffect(() => {
    const fetchDevelopments = async () => {
      try {
        setLoading(true)
        
        // Wait for user to be loaded
        if (!user) {
          console.log('User not loaded yet, waiting...')
          return
        }
        
        if (!user.profile?.developer_id) {
          console.log('No developer_id found in user profile:', user)
          setError('Developer profile not found')
          return
        }

        const token = localStorage.getItem('developer_token')
        if (!token) {
          console.log('No token found')
          setError('Authentication required')
          return
        }

        console.log('Fetching developments for developer_id:', user.profile.developer_id)
        
        const response = await fetch(`/api/developments?developer_id=${user.profile.developer_id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          console.log('Developments fetched:', data)
          // Handle the response structure - data is wrapped in a "data" property
          const devs = data.data || data || []
          setDevelopments(devs)
          setFilteredDevelopments(devs)
        } else {
          const errorData = await response.json()
          console.error('Error fetching developments:', errorData)
          setError(errorData.error || 'Failed to fetch developments')
        }
      } catch (err) {
        console.error('Error fetching developments:', err)
        setError('Network error')
      } finally {
        setLoading(false)
      }
    }

    fetchDevelopments()
  }, [user])

  // Close location results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        locationResultsRef.current &&
        !locationResultsRef.current.contains(event.target) &&
        locationSearchRef.current &&
        !locationSearchRef.current.contains(event.target)
      ) {
        setShowLocationResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Search locations using API
  useEffect(() => {
    if (!locationSearch.trim() || locationSearch.trim().length < 1) {
      setLocationSearchResults([])
      setShowLocationResults(false)
      return
    }

    // Debounce the search
    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(`/api/locations/search?q=${encodeURIComponent(locationSearch.trim())}&limit=10`)
        if (response.ok) {
          const result = await response.json()
          const results = result.data || []
          setLocationSearchResults(results)
          setShowLocationResults(results.length > 0)
        } else {
          setLocationSearchResults([])
          setShowLocationResults(false)
        }
      } catch (error) {
        console.error('Error searching locations:', error)
        setLocationSearchResults([])
        setShowLocationResults(false)
      }
    }, 200) // 200ms debounce

    return () => clearTimeout(timeoutId)
  }, [locationSearch])

  // Handle location selection from dropdown
  const handleLocationSelect = (location) => {
    setSelectedLocation(location)
    setLocationSearch(location.label)
    setShowLocationResults(false)
  }

  // Fetch filtered developments from server
  useEffect(() => {
    const fetchFilteredDevelopments = async () => {
      if (!user?.profile?.developer_id) return

      try {
        const token = localStorage.getItem('developer_token')
        if (!token) return

        // Build query parameters
        const params = new URLSearchParams({
          developer_id: user.profile.developer_id
        })

        if (searchQuery) params.append('search', searchQuery)
        if (selectedLocation) {
          params.append('location_type', selectedLocation.type)
          params.append('location_value', selectedLocation.value)
        }
        if (selectedPurpose) params.append('purpose', selectedPurpose)
        if (selectedType) params.append('type', selectedType)
        if (selectedCategory) params.append('category', selectedCategory)
        if (selectedSubType) params.append('sub_type', selectedSubType)

        const response = await fetch(`/api/developments?${params.toString()}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          const devs = data.data || data || []
          setFilteredDevelopments(devs)
        } else {
          // Fallback to client-side filtering if server-side fails
          filterClientSide()
        }
      } catch (error) {
        console.error('Error fetching filtered developments:', error)
        // Fallback to client-side filtering
        filterClientSide()
      }
    }

    // Client-side filtering fallback
    const filterClientSide = () => {
      let filtered = [...developments]

      if (searchQuery) {
        filtered = filtered.filter(dev => 
          dev.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          dev.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          dev.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          dev.country?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      }

      if (selectedLocation) {
        switch (selectedLocation.type) {
          case 'country':
            filtered = filtered.filter(dev => dev.country === selectedLocation.value)
            break
          case 'state':
            filtered = filtered.filter(dev => dev.state === selectedLocation.value)
            break
          case 'city':
            filtered = filtered.filter(dev => dev.city === selectedLocation.value)
            break
          case 'town':
            filtered = filtered.filter(dev => dev.town === selectedLocation.value)
            break
        }
      }

      // Filter by category IDs (stored as JSON arrays)
      if (selectedPurpose) {
        filtered = filtered.filter(dev => {
          try {
            const purposes = typeof dev.purposes === 'string' 
              ? JSON.parse(dev.purposes) 
              : dev.purposes || []
            return Array.isArray(purposes) && purposes.includes(selectedPurpose)
          } catch (e) {
            return false
          }
        })
      }
      
      if (selectedType) {
        filtered = filtered.filter(dev => {
          try {
            const types = typeof dev.types === 'string' 
              ? JSON.parse(dev.types) 
              : dev.types || []
            return Array.isArray(types) && types.includes(selectedType)
          } catch (e) {
            return false
          }
        })
      }
      
      if (selectedCategory) {
        filtered = filtered.filter(dev => {
          try {
            const categories = typeof dev.categories === 'string' 
              ? JSON.parse(dev.categories) 
              : dev.categories || []
            return Array.isArray(categories) && categories.includes(selectedCategory)
          } catch (e) {
            return false
          }
        })
      }
      
      if (selectedSubType) {
        filtered = filtered.filter(dev => {
          try {
            // Subtypes are stored in unit_types.database array
            const unitTypes = typeof dev.unit_types === 'string' 
              ? JSON.parse(dev.unit_types) 
              : dev.unit_types || {}
            const databaseSubtypes = unitTypes.database || []
            return databaseSubtypes.some(st => st.id === selectedSubType)
          } catch (e) {
            return false
          }
        })
      }

      setFilteredDevelopments(filtered)
    }

    // Debounce server-side filtering
    const timeoutId = setTimeout(() => {
      fetchFilteredDevelopments()
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [user, developments, searchQuery, selectedLocation, selectedPurpose, selectedType, selectedCategory, selectedSubType])

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('')
    setLocationSearch('')
    setSelectedLocation(null)
    setSelectedPurpose('')
    setSelectedType('')
    setSelectedCategory('')
    setSelectedSubType('')
    setShowLocationResults(false)
  }

  if (loading) {
    return (
      <div className='normal_div'>
        <div className='w-full flex flex-col gap-4 p-6'>
          <div className='flex justify-center items-center h-64'>
            <div className='text-lg text-gray-600'>Loading developments...</div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='normal_div'>
        <div className='w-full flex flex-col gap-4 p-6'>
          <div className='flex justify-center items-center h-64'>
            <div className='text-lg text-red-600'>Error: {error}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='normal_div'>
      <div className='w-full flex items-start gap-6 p-6'>
        {/* Main Content Area */}
        <div className='flex-1 flex flex-col gap-4'>
          {/* Header */}
          <div className='flex justify-between items-center flex-wrap gap-4 '>
            <h1 className="">Manage your Developments</h1>
            <div className='flex items-center gap-3'>
              {/* Filter Toggle Button - Only visible on small/medium devices */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className='lg:hidden primary_button flex items-center gap-2'
              >
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z' />
                </svg>
                Filters
              </button>

              {/* View Toggle */}
              <div className='flex items-center bg-gray-100 rounded-lg p-1'>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-white text-primary_color shadow-sm' 
                      : 'text-gray-600 hover:text-primary_color'
                  }`}
                >
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-white text-primary_color shadow-sm' 
                      : 'text-gray-600 hover:text-primary_color'
                  }`}
                >
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 6h16M4 10h16M4 14h16M4 18h16' />
                  </svg>
                </button>
              </div>
              
              <Link href={`/developer/${params.slug}/developments/addNewDevelopment`}>
                <button className='primary_button'>
                  Add Development
                </button>
              </Link>
            </div>
          </div>

          {/* Results Summary */}
          <div className='flex items-center justify-between text-sm px-4 py-2 rounded-lg '>
            <span>
              Showing {filteredDevelopments.length} of {developments.length} developments
            </span>
          </div>

          {/* Developments List */}
          <div className='w-full '>
            {developments.length === 0 ? (
              <div className='flex justify-center items-center h-64'>
                <div className='text-center'>
                  <div className='text-lg mb-2'>No developments found</div>
                  <div className='text-sm'>Create your first development to get started</div>
                </div>
              </div>
            ) : filteredDevelopments.length === 0 ? (
              <div className='flex justify-center items-center h-64'>
                <div className='text-center'>
                  <div className='text-lg mb-2'>No developments match your filters</div>
                  <div className='text-sm mb-4'>Try adjusting your search criteria</div>
                  <button
                    onClick={clearFilters}
                    className='secondary_button'
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            ) : (
              <div className={`${viewMode === 'grid' ? 'flex flex-col gap-6' : 'space-y-4'}`}>
                {filteredDevelopments.map((development) => (
                  <DevelopmentCard 
                    key={development.id}
                    development={{
                      ...development,
                      total_units: development.total_units || 0
                    }}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Filters Sidebar - Hidden on small/medium, visible on large+ */}
        <div className='hidden lg:block w-80 flex-shrink-0 sticky top-20 self-start'>
          <div className='border-l border-white/50 p-4 max-h-[calc(100vh-5rem)] overflow-y-auto'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-lg font-semibold'>Filters</h2>
              {(searchQuery || selectedLocation || selectedPurpose || selectedType || selectedCategory || selectedSubType) && (
                <button
                  onClick={clearFilters}
                  className='secondary_button text-sm'
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Search by Name */}
            <div className='mb-6'>
              <label className='block text-sm font-medium mb-2'>Search by Name</label>
              <div className='relative'>
                <input
                  type='text'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder='Search developments...'
                  className='w-full pl-10'
                />
                <svg className='absolute left-3 top-2.5 h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
                </svg>
              </div>
            </div>

            {/* Location Filter */}
            <div className='mb-6'>
              <label className='block text-sm font-medium mb-2'>Location</label>
              <div className='relative' ref={locationSearchRef}>
                <input
                  type='text'
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  onFocus={() => {
                    if (locationSearchResults.length > 0) setShowLocationResults(true)
                  }}
                  placeholder='Search location...'
                  className='w-full pl-10'
                />
                <svg className='absolute left-3 top-2.5 h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' />
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 11a3 3 0 11-6 0 3 3 0 016 0z' />
                </svg>
                
                {/* Location Results Dropdown */}
                {showLocationResults && locationSearch.trim().length > 0 && locationSearchResults.length > 0 && (
                  <div
                    ref={locationResultsRef}
                    className='absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 max-h-[300px] overflow-y-auto z-50'
                  >
                    <div className='py-2'>
                      {locationSearchResults.map((location) => (
                        <button
                          key={`${location.type}-${location.value}`}
                          type='button'
                          onClick={() => handleLocationSelect(location)}
                          className='w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0'
                        >
                          <div className='flex items-center justify-between'>
                            <div>
                              <p className='text-sm font-medium text-primary_color'>
                                {location.label}
                              </p>
                              <p className='text-xs text-gray-500 capitalize mt-0.5'>
                                {location.type}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {selectedLocation && (
                <div className='mt-2 px-3 py-2 rounded-lg border border-gray-200 flex items-center justify-between'>
                  <span className='text-sm'>{selectedLocation.label}</span>
                  <button
                    onClick={() => {
                      setSelectedLocation(null)
                      setLocationSearch('')
                      setShowLocationResults(false)
                    }}
                    className='text-sm'
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            {/* Category Filters */}
            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium mb-2'>Purpose</label>
                <CustomSelect
                  value={selectedPurpose}
                  onChange={(e) => setSelectedPurpose(e.target.value)}
                  options={purposeOptions}
                  placeholder='All Purposes'
                  disabled={purposesLoading}
                />
              </div>

              <div>
                <label className='block text-sm font-medium mb-2'>Type</label>
                <CustomSelect
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  options={typeOptions}
                  placeholder='All Types'
                  disabled={typesLoading}
                />
              </div>

              <div>
                <label className='block text-sm font-medium mb-2'>Category</label>
                <CustomSelect
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  options={categoryOptions}
                  placeholder='All Categories'
                  disabled={categoriesLoading}
                />
              </div>

              <div>
                <label className='block text-sm font-medium mb-2'>Sub Type</label>
                <CustomSelect
                  value={selectedSubType}
                  onChange={(e) => setSelectedSubType(e.target.value)}
                  options={subtypeOptions}
                  placeholder='All Sub Types'
                  disabled={subtypesLoading}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile/Tablet Filters Overlay */}
        {showFilters && (
          <div className='fixed inset-0 bg-white/70 z-50 lg:hidden overflow-y-auto'>
            <div className='w-full mt-20 p-4'>
              <div className='bg-white rounded-lg shadow-lg p-4 max-w-2xl mx-auto'>
                <div className='flex items-center justify-between mb-4'>
                  <h2 className='text-lg font-semibold'>Filters</h2>
                  <button
                    onClick={() => setShowFilters(false)}
                    className='secondary_button text-sm flex items-center gap-2'
                  >
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                    </svg>
                    Cancel
                  </button>
                </div>
                {(searchQuery || selectedLocation || selectedPurpose || selectedType || selectedCategory || selectedSubType) && (
                  <button
                    onClick={clearFilters}
                    className='secondary_button text-sm mb-4 w-full'
                  >
                    Clear All
                  </button>
                )}

                {/* Search by Name */}
                <div className='mb-6'>
                  <label className='block text-sm font-medium mb-2'>Search by Name</label>
                  <div className='relative'>
                    <input
                      type='text'
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder='Search developments...'
                      className='w-full pl-10'
                    />
                    <svg className='absolute left-3 top-2.5 h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
                    </svg>
                  </div>
                </div>

                {/* Location Filter */}
                <div className='mb-6'>
                  <label className='block text-sm font-medium mb-2'>Location</label>
                  <div className='relative' ref={locationSearchRef}>
                    <input
                      type='text'
                      value={locationSearch}
                      onChange={(e) => setLocationSearch(e.target.value)}
                      onFocus={() => {
                        if (locationSearchResults.length > 0) setShowLocationResults(true)
                      }}
                      placeholder='Search location...'
                      className='w-full pl-10'
                    />
                    <svg className='absolute left-3 top-2.5 h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' />
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 11a3 3 0 11-6 0 3 3 0 016 0z' />
                    </svg>
                    
                    {/* Location Results Dropdown */}
                    {showLocationResults && locationSearch.trim().length > 0 && locationSearchResults.length > 0 && (
                      <div
                        ref={locationResultsRef}
                        className='absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 max-h-[300px] overflow-y-auto z-50'
                      >
                        <div className='py-2'>
                          {locationSearchResults.map((location) => (
                            <button
                              key={`${location.type}-${location.value}`}
                              type='button'
                              onClick={() => handleLocationSelect(location)}
                              className='w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0'
                            >
                              <div className='flex items-center justify-between'>
                                <div>
                                  <p className='text-sm font-medium text-gray-900'>
                                    {location.label}
                                  </p>
                                  <p className='text-xs text-gray-500 capitalize mt-0.5'>
                                    {location.type}
                                  </p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {selectedLocation && (
                    <div className='mt-2 px-3 py-2 rounded-lg border border-gray-200 flex items-center justify-between'>
                      <span className='text-sm'>{selectedLocation.label}</span>
                      <button
                        onClick={() => {
                          setSelectedLocation(null)
                          setLocationSearch('')
                          setShowLocationResults(false)
                        }}
                        className='text-sm'
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>

                {/* Category Filters */}
                <div className='space-y-4'>
                  <div>
                    <label className='block text-sm font-medium mb-2'>Purpose</label>
                    <CustomSelect
                      value={selectedPurpose}
                      onChange={(e) => setSelectedPurpose(e.target.value)}
                      options={purposeOptions}
                      placeholder='All Purposes'
                      disabled={purposesLoading}
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium mb-2'>Type</label>
                    <CustomSelect
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      options={typeOptions}
                      placeholder='All Types'
                      disabled={typesLoading}
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium mb-2'>Category</label>
                    <CustomSelect
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      options={categoryOptions}
                      placeholder='All Categories'
                      disabled={categoriesLoading}
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium mb-2'>Sub Type</label>
                    <CustomSelect
                      value={selectedSubType}
                      onChange={(e) => setSelectedSubType(e.target.value)}
                      options={subtypeOptions}
                      placeholder='All Sub Types'
                      disabled={subtypesLoading}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default page