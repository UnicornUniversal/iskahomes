'use client'
import React, { useState, useEffect } from 'react'
import DevelopmentCard from '@/app/components/developers/DevelopmentCard'
import DeveloperHeader from '@/app/components/developers/DeveloperHeader'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'

// Dynamically import MapComponent to avoid SSR issues
const MapComponent = dynamic(() => import('@/app/components/propertyManagement/modules/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className='w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center'>
      <div className='text-gray-500'>Loading map...</div>
    </div>
  )
})

const page = () => {
  const { user } = useAuth()
  const params = useParams()
  const [developments, setDevelopments] = useState([])
  const [filteredDevelopments, setFilteredDevelopments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  
  // Location filters
  const [selectedCountry, setSelectedCountry] = useState('')
  const [selectedState, setSelectedState] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [selectedTown, setSelectedTown] = useState('')
  
  // Category filters
  const [selectedPurpose, setSelectedPurpose] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedSubType, setSelectedSubType] = useState('')
  
  // Available filter options
  const [countries, setCountries] = useState([])
  const [states, setStates] = useState([])
  const [cities, setCities] = useState([])
  const [towns, setTowns] = useState([])
  const [purposes, setPurposes] = useState([])
  const [types, setTypes] = useState([])
  const [categories, setCategories] = useState([])
  const [subTypes, setSubTypes] = useState([])
  
  
  // View mode state
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  
  // Collapsible filter sections
  const [showLocationFilters, setShowLocationFilters] = useState(false)
  const [showCategoryFilters, setShowCategoryFilters] = useState(false)
  
  // Map state
  const [mapCenter, setMapCenter] = useState([7.9465, -1.0232]) // Ghana coordinates
  const [mapZoom, setMapZoom] = useState(6)
  const [selectedDevelopment, setSelectedDevelopment] = useState(null)

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
          
          // Extract unique values for all filters
          const uniqueCountries = [...new Set(devs.map(dev => dev.country).filter(Boolean))]
          const uniqueStates = [...new Set(devs.map(dev => dev.state).filter(Boolean))]
          const uniqueCities = [...new Set(devs.map(dev => dev.city).filter(Boolean))]
          const uniqueTowns = [...new Set(devs.map(dev => dev.town).filter(Boolean))]
          
          const uniquePurposes = [...new Set(devs.map(dev => dev.purpose).filter(Boolean))]
          const uniqueTypes = [...new Set(devs.map(dev => dev.type).filter(Boolean))]
          const uniqueCategories = [...new Set(devs.map(dev => dev.category).filter(Boolean))]
          const uniqueSubTypes = [...new Set(devs.map(dev => dev.sub_type).filter(Boolean))]
          
          setCountries(uniqueCountries)
          setStates(uniqueStates)
          setCities(uniqueCities)
          setTowns(uniqueTowns)
          setPurposes(uniquePurposes)
          setTypes(uniqueTypes)
          setCategories(uniqueCategories)
          setSubTypes(uniqueSubTypes)
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

  // Filter developments based on selected filters
  useEffect(() => {
    let filtered = [...developments]

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(dev => 
        dev.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dev.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dev.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dev.country?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Location filters
    if (selectedCountry) {
      filtered = filtered.filter(dev => dev.country === selectedCountry)
    }
    if (selectedState) {
      filtered = filtered.filter(dev => dev.state === selectedState)
    }
    if (selectedCity) {
      filtered = filtered.filter(dev => dev.city === selectedCity)
    }
    if (selectedTown) {
      filtered = filtered.filter(dev => dev.town === selectedTown)
    }

    // Category filters
    if (selectedPurpose) {
      filtered = filtered.filter(dev => dev.purpose === selectedPurpose)
    }
    if (selectedType) {
      filtered = filtered.filter(dev => dev.type === selectedType)
    }
    if (selectedCategory) {
      filtered = filtered.filter(dev => dev.category === selectedCategory)
    }
    if (selectedSubType) {
      filtered = filtered.filter(dev => dev.sub_type === selectedSubType)
    }

    setFilteredDevelopments(filtered)
  }, [developments, searchQuery, selectedCountry, selectedState, selectedCity, selectedTown, selectedPurpose, selectedType, selectedCategory, selectedSubType])

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCountry('')
    setSelectedState('')
    setSelectedCity('')
    setSelectedTown('')
    setSelectedPurpose('')
    setSelectedType('')
    setSelectedCategory('')
    setSelectedSubType('')
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
      <div className='w-full flex gap-6 p-6'>
        {/* Main Content Area */}
        <div className='flex-1 flex flex-col gap-4'>
          {/* Header */}
          <div className='flex justify-between items-center flex-wrap gap-4'>
            <h2 className="font-bold !text-xl">Manage your Developments</h2>
            <div className='flex items-center gap-3'>
              {/* View Toggle */}
              <div className='flex items-center bg-gray-100 rounded-lg p-1'>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
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
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 6h16M4 10h16M4 14h16M4 18h16' />
                  </svg>
                </button>
              </div>
              
              <Link href={`/developer/${params.slug}/developments/addNewDevelopment`}>
                <button className='bg-primary_color text-white px-4 py-2 rounded-md hover:bg-primary_color/90 transition-colors'>
                  Add Development
                </button>
              </Link>
            </div>
          </div>

          {/* Search Bar */}
          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-4'>
            <div className='relative mb-4'>
              <input
                type='text'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='Search developments by title, description, or location...'
                className='w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm'
              />
              <svg className='absolute left-4 top-3.5 h-5 w-5 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
              </svg>
            </div>
          </div>

          {/* Sticky Filters */}
          <div className='sticky top-20 z-10 bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4'>
            {/* Filter Dropdowns */}
            <div className='space-y-4 grid grid-cols-1 lg:grid-cols-2  gap-3'>
              {/* Location Filter Dropdown */}
              <div className='w-full'>
                <button
                  onClick={() => setShowLocationFilters(!showLocationFilters)}
                  className='w-full px-4 py-2 text-left bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-between'
                >
                  <span className='text-sm font-medium text-gray-700'>
                    {selectedCountry || selectedState || selectedCity || selectedTown ? 'Location Filters Applied' : 'Location'}
                  </span>
                  <svg className={`w-4 h-4 text-gray-500 transition-transform ${showLocationFilters ? 'rotate-180' : ''}`} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                  </svg>
                </button>
                
                {showLocationFilters && (
                  <div className='mt-2 p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3'>
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3'>
                      <div>
                        <label className='block text-xs font-medium text-gray-600 mb-1'>Country</label>
                        <select
                          value={selectedCountry}
                          onChange={(e) => setSelectedCountry(e.target.value)}
                          className='w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent'
                        >
                          <option value=''>All Countries</option>
                          {countries.map((country) => (
                            <option key={country} value={country}>
                              {country}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className='block text-xs font-medium text-gray-600 mb-1'>State/Region</label>
                        <select
                          value={selectedState}
                          onChange={(e) => setSelectedState(e.target.value)}
                          className='w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent'
                        >
                          <option value=''>All States</option>
                          {states.map((state) => (
                            <option key={state} value={state}>
                              {state}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className='block text-xs font-medium text-gray-600 mb-1'>City</label>
                        <select
                          value={selectedCity}
                          onChange={(e) => setSelectedCity(e.target.value)}
                          className='w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent'
                        >
                          <option value=''>All Cities</option>
                          {cities.map((city) => (
                            <option key={city} value={city}>
                              {city}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className='block text-xs font-medium text-gray-600 mb-1'>Town</label>
                        <select
                          value={selectedTown}
                          onChange={(e) => setSelectedTown(e.target.value)}
                          className='w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent'
                        >
                          <option value=''>All Towns</option>
                          {towns.map((town) => (
                            <option key={town} value={town}>
                              {town}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Category Filter Dropdown */}
              <div className='w-full'>
                <button
                  onClick={() => setShowCategoryFilters(!showCategoryFilters)}
                  className='w-full px-4 py-2 text-left bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-between'
                >
                  <span className='text-sm font-medium text-gray-700'>
                    {selectedPurpose || selectedType || selectedCategory || selectedSubType ? 'Category Filters Applied' : 'Categories'}
                  </span>
                  <svg className={`w-4 h-4 text-gray-500 transition-transform ${showCategoryFilters ? 'rotate-180' : ''}`} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                  </svg>
                </button>
                
                {showCategoryFilters && (
                  <div className='mt-2 p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3'>
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3'>
                      <div>
                        <label className='block text-xs font-medium text-gray-600 mb-1'>Purpose</label>
                        <select
                          value={selectedPurpose}
                          onChange={(e) => setSelectedPurpose(e.target.value)}
                          className='w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                        >
                          <option value=''>All Purposes</option>
                          {purposes.map((purpose) => (
                            <option key={purpose} value={purpose}>
                              {purpose}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className='block text-xs font-medium text-gray-600 mb-1'>Type</label>
                        <select
                          value={selectedType}
                          onChange={(e) => setSelectedType(e.target.value)}
                          className='w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                        >
                          <option value=''>All Types</option>
                          {types.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className='block text-xs font-medium text-gray-600 mb-1'>Category</label>
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className='w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                        >
                          <option value=''>All Categories</option>
                          {categories.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className='block text-xs font-medium text-gray-600 mb-1'>Sub Type</label>
                        <select
                          value={selectedSubType}
                          onChange={(e) => setSelectedSubType(e.target.value)}
                          className='w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                        >
                          <option value=''>All Sub Types</option>
                          {subTypes.map((subType) => (
                            <option key={subType} value={subType}>
                              {subType}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className='flex items-center justify-between text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg'>
            <span>
              Showing {filteredDevelopments.length} of {developments.length} developments
            </span>
            {(searchQuery || selectedCountry || selectedState || selectedCity || selectedTown || selectedPurpose || selectedType || selectedCategory || selectedSubType) && (
              <span className='text-blue-600 font-medium'>
                Filters applied
              </span>
            )}
          </div>

          {/* Active Filters */}
          {(searchQuery || selectedCountry || selectedState || selectedCity || selectedTown || selectedPurpose || selectedType || selectedCategory || selectedSubType) && (
            <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-4'>
              <div className='flex flex-wrap gap-2'>
                <span className='text-sm text-gray-600 font-medium'>Active filters:</span>
                {searchQuery && (
                  <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                    Search: "{searchQuery}"
                    <button
                      onClick={() => setSearchQuery('')}
                      className='ml-2 text-blue-600 hover:text-blue-800'
                    >
                      ×
                    </button>
                  </span>
                )}
                {selectedCountry && (
                  <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                    Country: {selectedCountry}
                    <button
                      onClick={() => setSelectedCountry('')}
                      className='ml-2 text-green-600 hover:text-green-800'
                    >
                      ×
                    </button>
                  </span>
                )}
                {selectedState && (
                  <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                    State: {selectedState}
                    <button
                      onClick={() => setSelectedState('')}
                      className='ml-2 text-green-600 hover:text-green-800'
                    >
                      ×
                    </button>
                  </span>
                )}
                {selectedCity && (
                  <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                    City: {selectedCity}
                    <button
                      onClick={() => setSelectedCity('')}
                      className='ml-2 text-green-600 hover:text-green-800'
                    >
                      ×
                    </button>
                  </span>
                )}
                {selectedTown && (
                  <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                    Town: {selectedTown}
                    <button
                      onClick={() => setSelectedTown('')}
                      className='ml-2 text-green-600 hover:text-green-800'
                    >
                      ×
                    </button>
                  </span>
                )}
                {selectedPurpose && (
                  <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800'>
                    Purpose: {selectedPurpose}
                    <button
                      onClick={() => setSelectedPurpose('')}
                      className='ml-2 text-purple-600 hover:text-purple-800'
                    >
                      ×
                    </button>
                  </span>
                )}
                {selectedType && (
                  <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800'>
                    Type: {selectedType}
                    <button
                      onClick={() => setSelectedType('')}
                      className='ml-2 text-purple-600 hover:text-purple-800'
                    >
                      ×
                    </button>
                  </span>
                )}
                {selectedCategory && (
                  <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800'>
                    Category: {selectedCategory}
                    <button
                      onClick={() => setSelectedCategory('')}
                      className='ml-2 text-purple-600 hover:text-purple-800'
                    >
                      ×
                    </button>
                  </span>
                )}
                {selectedSubType && (
                  <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800'>
                    Sub Type: {selectedSubType}
                    <button
                      onClick={() => setSelectedSubType('')}
                      className='ml-2 text-purple-600 hover:text-purple-800'
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        

        {/* Developments and Map Container */}
        <div className='flex gap-2 items-start justify-start'>
          {/* Developments List */}
          <div className='flex-1 w-full xl:w-2/3'>
            {developments.length === 0 ? (
              <div className='flex justify-center items-center h-64'>
                <div className='text-center'>
                  <div className='text-lg text-gray-600 mb-2'>No developments found</div>
                  <div className='text-sm text-gray-500'>Create your first development to get started</div>
                </div>
              </div>
            ) : filteredDevelopments.length === 0 ? (
              <div className='flex justify-center items-center h-64'>
                <div className='text-center'>
                  <div className='text-lg text-gray-600 mb-2'>No developments match your filters</div>
                  <div className='text-sm text-gray-500 mb-4'>Try adjusting your search criteria</div>
                  <button
                    onClick={clearFilters}
                    className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            ) : (
              <div className={`mt-6 ${viewMode === 'grid' ? 'flex flex-col gap-6' : 'space-y-4'}`}>
                {filteredDevelopments.map((development) => (
                  <div
                    key={development.id}
                    className={`${selectedDevelopment?.id === development.id ? 'ring-2 ring-blue-500' : ''}`}
                    onClick={() => {
                      if (development.latitude && development.longitude) {
                        setSelectedDevelopment(development)
                        setMapCenter([parseFloat(development.latitude), parseFloat(development.longitude)])
                        setMapZoom(15)
                      }
                    }}
                  >
                    <DevelopmentCard 
                      development={{
                        ...development,
                        total_units: development.total_units || 0
                      }}
                      viewMode={viewMode}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Map Sidebar - Hidden on medium and small devices */}
          <div className={`w-1/3 bg-white     h-fit sticky top-6 hidden xl:block`}>
        

          {/* Map */}
          <div className='h-screen  overflow-hidden border border-gray-200'>
            <MapComponent
              center={mapCenter}
              zoom={mapZoom}
              coordinates={selectedDevelopment ? [parseFloat(selectedDevelopment.latitude), parseFloat(selectedDevelopment.longitude)] : null}
              onMapClick={(lat, lng) => {
                console.log('Map clicked:', lat, lng)
              }}
            />
          </div>

          {/* Development Info */}
          {selectedDevelopment && (
            <div className='mt-4 p-4 bg-gray-50 rounded-lg'>
              <h4 className='font-semibold text-gray-900 mb-2'>{selectedDevelopment.title}</h4>
              <div className='text-sm text-gray-600 space-y-1'>
                <div className='flex items-center'>
                  <svg className='w-4 h-4 mr-2 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' />
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 11a3 3 0 11-6 0 3 3 0 016 0z' />
                  </svg>
                  <span>
                    {[selectedDevelopment.town, selectedDevelopment.city, selectedDevelopment.state, selectedDevelopment.country]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </div>
                <div className='flex items-center'>
                  <svg className='w-4 h-4 mr-2 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1' />
                  </svg>
                  <span>{selectedDevelopment.price ? `${selectedDevelopment.currency || 'GHS'} ${selectedDevelopment.price}` : 'Price not set'}</span>
                </div>
                <div className='flex items-center'>
                  <svg className='w-4 h-4 mr-2 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' />
                  </svg>
                  <span>{selectedDevelopment.total_units || 0} units</span>
                </div>
              </div>
            </div>
          )}

          {/* Map Instructions */}
          <div className='mt-4 text-xs text-gray-500 text-center'>
            Click on development cards to view their location on the map
          </div>
        </div>

        
        </div>
        </div>
      </div>
    </div>
  )
}

export default page