"use client"
import React, { useState, useEffect, useMemo, useRef } from 'react'
import UnitCard from '@/app/components/developers/units/UnitCard'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'react-toastify'
import { CustomSelect } from '@/app/components/ui/custom-select'
import { 
  usePropertyPurposes, 
  usePropertyTypes
} from '@/hooks/useCachedData'

const AllUnits = ({ accountType = 'developer' }) => {
  const router = useRouter()
  const { user } = useAuth()
  
  // Determine labels based on account type
  const isAgent = accountType === 'agent'
  const isAgency = accountType === 'agency'
  const itemLabel = isAgent || isAgency ? 'Property' : 'Unit'
  const itemLabelPlural = isAgent || isAgency ? 'Properties' : 'Units'
  const addButtonLabel = isAgent || isAgency ? 'Add New Property' : 'Add New Unit'
  const pageTitle = isAgent || isAgency ? 'All Properties' : 'All Units'
  const emptyStateTitle = isAgent || isAgency ? 'No properties found' : 'No units found'
  const emptyStateMessage = isAgent || isAgency ? 'Get started by creating your first property' : 'Get started by creating your first unit'
  const emptyStateButton = isAgent || isAgency ? 'Create Your First Property' : 'Create Your First Unit'
  const [units, setUnits] = useState([])
  const [filteredUnits, setFilteredUnits] = useState([])
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
  const [selectedStatus, setSelectedStatus] = useState('')
  
  // Filter visibility for mobile/tablet
  const [showFilters, setShowFilters] = useState(false)
  // Filter visibility for desktop
  const [showDesktopFilters, setShowDesktopFilters] = useState(true)

  // Use cached categorization data
  const { data: purposesData = [], loading: purposesLoading } = usePropertyPurposes()
  const { data: typesData = [], loading: typesLoading } = usePropertyTypes()

  // Convert to options format for CustomSelect - using IDs as values
  const purposeOptions = useMemo(() => [
    { value: '', label: 'All Purposes' },
    ...purposesData.map(p => ({ value: p.id, label: p.name }))
  ], [purposesData])
  
  const typeOptions = useMemo(() => [
    { value: '', label: 'All Types' },
    ...typesData.map(t => ({ value: t.id, label: t.name }))
  ], [typesData])

  // Status options
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'Available', label: 'Available' },
    { value: 'Unavailable', label: 'Unavailable' },
    { value: 'Sold', label: 'Sold' },
    { value: 'Rented Out', label: 'Rented Out' },
    { value: 'Taken', label: 'Taken' },
    { value: 'Under Maintenance / Renovation', label: 'Under Maintenance / Renovation' },
    { value: 'Coming Soon', label: 'Coming Soon' }
  ]

  // Get ID from user profile based on account type
  const accountId = isAgent 
    ? (user?.profile?.agent_id || user?.id)
    : isAgency
    ? (user?.profile?.agency_id || user?.id)
    : (user?.profile?.developer_id || user?.id)

  useEffect(() => {
    if (accountId) {
      fetchUnits()
    }
  }, [accountId])

  const fetchUnits = async () => {
    try {
      setLoading(true)
      const token = isAgent 
        ? localStorage.getItem('agent_token')
        : isAgency
        ? localStorage.getItem('agency_token')
        : localStorage.getItem('developer_token')
      
      if (!token) {
        setError('No authentication token found')
        return
      }

      const listingType = isAgent || isAgency ? 'property' : 'unit'
      
      // For agencies, we need to filter by listing_agency_id
      let apiUrl = `/api/user-listings?listing_type=${listingType}`
      if (isAgency && user?.profile?.agency_id) {
        // Use a custom endpoint to filter by listing_agency_id
        apiUrl = `/api/listings/by-agency?agency_id=${user.profile.agency_id}&listing_type=${listingType}`
      }
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log(`📋 Fetched ${itemLabelPlural.toLowerCase()}:`, data)
        const fetchedUnits = data.data || data || []
        setUnits(fetchedUnits)
        setFilteredUnits(fetchedUnits)
      } else {
        const errorData = await response.json()
        setError(errorData.error || `Failed to fetch ${itemLabelPlural.toLowerCase()}`)
        toast.error(`Failed to fetch ${itemLabelPlural.toLowerCase()}`)
      }
    } catch (error) {
      console.error(`Error fetching ${itemLabelPlural.toLowerCase()}:`, error)
      setError(`Error fetching ${itemLabelPlural.toLowerCase()}`)
      toast.error(`Error fetching ${itemLabelPlural.toLowerCase()}`)
    } finally {
      setLoading(false)
    }
  }


  const handleAddUnit = () => {
    if (!user?.profile?.slug) {
      toast.error(`${isAgent ? 'Agent' : 'Developer'} profile not found`)
      return
    }
    if (isAgent) {
      router.push(`/agents/${user.profile.slug}/properties/addNewProperty`)
    } else {
      router.push(`/developer/${user.profile.slug}/units/addNewUnit`)
    }
  }

  const handleRefresh = () => {
    fetchUnits()
  }

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

  // Client-side filtering
  useEffect(() => {
    let filtered = [...units]

    // Filter by name/search query
    if (searchQuery) {
      filtered = filtered.filter(unit => 
        unit.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        unit.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by location
    if (selectedLocation) {
      switch (selectedLocation.type) {
        case 'country':
          filtered = filtered.filter(unit => unit.country === selectedLocation.value)
          break
        case 'state':
          filtered = filtered.filter(unit => unit.state === selectedLocation.value)
          break
        case 'city':
          filtered = filtered.filter(unit => unit.city === selectedLocation.value)
          break
        case 'town':
          filtered = filtered.filter(unit => unit.town === selectedLocation.value)
          break
      }
    }

    // Filter by status
    if (selectedStatus) {
      filtered = filtered.filter(unit => unit.status === selectedStatus)
    }

    // Filter by purpose
    if (selectedPurpose) {
      filtered = filtered.filter(unit => {
        try {
          const purposes = Array.isArray(unit.purposes) 
            ? unit.purposes 
            : (typeof unit.purposes === 'string' ? JSON.parse(unit.purposes || '[]') : [])
          // Check if purposes array contains the selected purpose ID
          return purposes.some(p => {
            const purposeId = typeof p === 'object' ? p.id : p
            return purposeId === selectedPurpose
          })
        } catch (e) {
          return false
        }
      })
    }
    
    // Filter by type
    if (selectedType) {
      filtered = filtered.filter(unit => {
        try {
          const types = Array.isArray(unit.types) 
            ? unit.types 
            : (typeof unit.types === 'string' ? JSON.parse(unit.types || '[]') : [])
          // Check if types array contains the selected type ID
          return types.some(t => {
            const typeId = typeof t === 'object' ? t.id : t
            return typeId === selectedType
          })
        } catch (e) {
          return false
        }
      })
    }

    setFilteredUnits(filtered)
  }, [units, searchQuery, selectedLocation, selectedStatus, selectedPurpose, selectedType])

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('')
    setLocationSearch('')
    setSelectedLocation(null)
    setSelectedPurpose('')
    setSelectedType('')
    setSelectedStatus('')
    setShowLocationResults(false)
  }

  if (loading) {
    return (
      <div className="w-full p-6">
        <div className="w-full flex justify-between items-center mb-6">
          <h1 className=" font-bold ">{pageTitle}</h1>
          {!isAgency && (
            <button 
              onClick={handleAddUnit}
              className="primary_button flex items-center gap-2"
            >
              {addButtonLabel}
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
        
        <div className="flex justify-center items-center py-12">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-gray-600">Loading {itemLabelPlural.toLowerCase()}...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full p-6">
        <div className="w-full flex justify-between items-center mb-6">
          <h1 className="">{pageTitle}</h1>
          {!isAgency && (
            <button 
              onClick={handleAddUnit}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              {addButtonLabel}
            </button>
          )}
        </div>
        
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-lg font-medium">Error loading {itemLabelPlural.toLowerCase()}</p>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full p-6">
      {/* Header - Full Width */}
      <div className="w-full flex justify-between items-center flex-wrap gap-4 mb-6">
        <div>
          <p>Manage all your</p>
          <h1 className="text-[4em]">Listings {itemLabelPlural}</h1>
          <p className="mt-1">
            Showing {filteredUnits.length} of {units.length} {units.length === 1 ? itemLabel.toLowerCase() : itemLabelPlural.toLowerCase()}
          </p>
        </div>
        {/* Conditionally render Add New Property button - only for agents and developers */}
        {!isAgency && (
          <button 
            onClick={handleAddUnit}
            className="primary_button transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {addButtonLabel}
          </button>
        )}
      </div>

      {/* Filters and List Container - Same Div */}
      <div className="w-full flex items-start gap-6 relative">
        {/* Mobile Filter Button - Absolutely positioned at upper right */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="lg:hidden fixed top-20 right-4 z-40 w-12 h-12 rounded-full bg-primary_color text-white shadow-lg hover:bg-primary_color/90 transition-colors flex items-center justify-center"
          title="Show Filters"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </button>

        {/* Main Content Area with Filters and List */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Filter Toggle Button - Desktop only, show when filters are hidden */}
          {!showDesktopFilters && (
            <div className="hidden lg:flex items-center justify-end mb-2">
              <button
                onClick={() => setShowDesktopFilters(true)}
                className="flex items-center justify-center w-10 h-10 !p-2 secondary_button !rounded-md hover:bg-gray-50 transition-colors"
                title="Show Filters"
              >
                <svg className="w-5 h-5 text-primary_color" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </button>
            </div>
          )}
          {/* Units List */}
          {units.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{emptyStateTitle}</h3>
            <p className="text-gray-600 mb-6">{emptyStateMessage}</p>
            {!isAgency && (
              <button 
                onClick={handleAddUnit}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {emptyStateButton}
              </button>
            )}
          </div>
        ) : filteredUnits.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="text-lg mb-2">No {itemLabelPlural.toLowerCase()} match your filters</div>
              <div className="text-sm mb-4">Try adjusting your search criteria</div>
              <button
                onClick={clearFilters}
                className="secondary_button"
              >
                Clear Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="columns-1 md:columns-2 xl:columns-3 gap-6 space-y-6 items-center justify-center">
            {filteredUnits.map((unit) => (
              <div key={unit.id} className="break-inside-avoid">
                <UnitCard 
                  unit={unit}
                  developerSlug={user?.profile?.slug}
                  accountType={accountType}
                />
              </div>
            ))}
          </div>
        )}
        </div>

        {/* Filters Sidebar - Hidden on small/medium, conditionally visible on large+ */}
        {showDesktopFilters && (
        <div className="hidden lg:block w-80 flex-shrink-0 sticky top-20 self-start">
          <div className="border-l border-gray-200 p-4 max-h-[calc(100vh-5rem)] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Filters</h2>
            <div className="flex items-center gap-2">
              {(searchQuery || selectedLocation || selectedStatus || selectedPurpose || selectedType) && (
                <button
                  onClick={clearFilters}
                  className="secondary_button text-sm"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={() => setShowDesktopFilters(false)}
                className="secondary_button text-sm !p-2"
                title="Hide Filters"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Search by Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Search by Name</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${itemLabelPlural.toLowerCase()}...`}
                className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Location Filter */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Location</label>
            <div className="relative" ref={locationSearchRef}>
              <input
                type="text"
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
                onFocus={() => {
                  if (locationSearchResults.length > 0) setShowLocationResults(true)
                }}
                placeholder="Search location..."
                className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              
              {/* Location Results Dropdown */}
              {showLocationResults && locationSearch.trim().length > 0 && locationSearchResults.length > 0 && (
                <div
                  ref={locationResultsRef}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 max-h-[300px] overflow-y-auto z-50"
                >
                  <div className="py-2">
                    {locationSearchResults.map((location) => (
                      <button
                        key={`${location.type}-${location.value}`}
                        type="button"
                        onClick={() => handleLocationSelect(location)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {location.label}
                            </p>
                            <p className="text-xs text-gray-500 capitalize mt-0.5">
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
              <div className="mt-2 px-3 py-2 rounded-lg border border-gray-200 flex items-center justify-between">
                <span className="text-sm">{selectedLocation.label}</span>
                <button
                  onClick={() => {
                    setSelectedLocation(null)
                    setLocationSearch('')
                    setShowLocationResults(false)
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
            )}
          </div>

          {/* Status Filter */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Status</label>
            <CustomSelect
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              options={statusOptions}
              placeholder="All Statuses"
            />
          </div>

          {/* Category Filters */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Purpose</label>
              <CustomSelect
                value={selectedPurpose}
                onChange={(e) => setSelectedPurpose(e.target.value)}
                options={purposeOptions}
                placeholder="All Purposes"
                disabled={purposesLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <CustomSelect
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                options={typeOptions}
                placeholder="All Types"
                disabled={typesLoading}
              />
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Mobile/Tablet Filters Overlay */}
      {showFilters && (
        <div className="fixed inset-0 bg-white/70 z-50 lg:hidden overflow-y-auto">
          <div className="w-full mt-20 p-4">
            <div className="bg-white rounded-lg shadow-lg p-4 max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Filters</h2>
                <button
                  onClick={() => setShowFilters(false)}
                  className="secondary_button text-sm flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </button>
              </div>
              {(searchQuery || selectedLocation || selectedStatus || selectedPurpose || selectedType) && (
                <button
                  onClick={clearFilters}
                  className="secondary_button text-sm mb-4 w-full"
                >
                  Clear All
                </button>
              )}

              {/* Search by Name */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Search by Name</label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search ${itemLabelPlural.toLowerCase()}...`}
                    className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Location Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Location</label>
                <div className="relative" ref={locationSearchRef}>
                  <input
                    type="text"
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    onFocus={() => {
                      if (locationSearchResults.length > 0) setShowLocationResults(true)
                    }}
                    placeholder="Search location..."
                    className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  
                  {/* Location Results Dropdown */}
                  {showLocationResults && locationSearch.trim().length > 0 && locationSearchResults.length > 0 && (
                    <div
                      ref={locationResultsRef}
                      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 max-h-[300px] overflow-y-auto z-50"
                    >
                      <div className="py-2">
                        {locationSearchResults.map((location) => (
                          <button
                            key={`${location.type}-${location.value}`}
                            type="button"
                            onClick={() => handleLocationSelect(location)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {location.label}
                                </p>
                                <p className="text-xs text-gray-500 capitalize mt-0.5">
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
                  <div className="mt-2 px-3 py-2 rounded-lg border border-gray-200 flex items-center justify-between">
                    <span className="text-sm">{selectedLocation.label}</span>
                    <button
                      onClick={() => {
                        setSelectedLocation(null)
                        setLocationSearch('')
                        setShowLocationResults(false)
                      }}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              {/* Status Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Status</label>
                <CustomSelect
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  options={statusOptions}
                  placeholder="All Statuses"
                />
              </div>

              {/* Category Filters */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Purpose</label>
                  <CustomSelect
                    value={selectedPurpose}
                    onChange={(e) => setSelectedPurpose(e.target.value)}
                    options={purposeOptions}
                    placeholder="All Purposes"
                    disabled={purposesLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Type</label>
                  <CustomSelect
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    options={typeOptions}
                    placeholder="All Types"
                    disabled={typesLoading}
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

export default AllUnits
