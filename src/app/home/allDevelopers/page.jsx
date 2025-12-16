'use client'

import React, { useEffect, useRef, useState, useMemo } from 'react'
import DevelopmentHeaders from '@/app/components/developers/DevelopmentHeaders'
import DeveloperCard from '@/app/components/developers/DeveloperCard'
import LoadingSpinner from '@/app/components/ui/LoadingSpinner'
import useInfiniteScroll from '@/hooks/useInfiniteScroll'
import Layout1 from '@/app/layout/Layout1'
import Nav from '@/app/components/Nav'
const AllDevelopersPage = () => {
  // Search states
  const [nameInput, setNameInput] = useState('')
  const [locationInput, setLocationInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [locationTerm, setLocationTerm] = useState('')
  
  // Location autocomplete
  const [locationSuggestions, setLocationSuggestions] = useState([])
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)
  const locationTimeoutRef = useRef(null)
  
  // Modal state
  const [showModal, setShowModal] = useState(false)
  
  // Refs
  const nameInputRef = useRef(null)
  const locationInputRef = useRef(null)
  const loadingRef = useRef()
  
  const { developers, loading, hasMore, error, loadMore, search } = useInfiniteScroll([], searchTerm, locationTerm)

  // Location autocomplete debounce
  useEffect(() => {
    if (locationTimeoutRef.current) {
      clearTimeout(locationTimeoutRef.current)
    }

    if (!locationInput.trim() || locationInput.trim().length < 2) {
      setLocationSuggestions([])
      setShowLocationDropdown(false)
      return
    }

    locationTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/locations/search?q=${encodeURIComponent(locationInput.trim())}&limit=10`)
        if (response.ok) {
          const result = await response.json()
          setLocationSuggestions(result.data || [])
          setShowLocationDropdown((result.data || []).length > 0)
        } else {
          setLocationSuggestions([])
          setShowLocationDropdown(false)
        }
      } catch (error) {
        console.error('Error searching locations:', error)
        setLocationSuggestions([])
        setShowLocationDropdown(false)
      }
    }, 300)

    return () => {
      if (locationTimeoutRef.current) {
        clearTimeout(locationTimeoutRef.current)
      }
    }
  }, [locationInput])

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (loadingRef.current) {
      observer.observe(loadingRef.current)
    }

    return () => {
      if (loadingRef.current) {
        observer.unobserve(loadingRef.current)
      }
    }
  }, [hasMore, loading, loadMore])

  // Handle search submission
  const handleSearch = (e) => {
    if (e) {
      e.preventDefault()
    }
    const name = nameInput.trim()
    const location = locationTerm || locationInput.trim()
    setSearchTerm(name)
    if (location) {
      setLocationTerm(location)
    }
    search(name, location)
    setShowModal(false)
  }

  // Handle location selection from dropdown
  const handleLocationSelect = (location) => {
    setLocationInput(location.label)
    setLocationTerm(location.value)
    setShowLocationDropdown(false)
    setLocationSuggestions([])
    // Auto-search when location is selected
    const name = nameInput.trim()
    setSearchTerm(name)
    search(name, location.value)
  }

  // Handle clear
  const handleClear = () => {
    setNameInput('')
    setLocationInput('')
    setLocationTerm('')
    setSearchTerm('')
    setLocationSuggestions([])
    setShowLocationDropdown(false)
    setShowModal(false)
    // Trigger search with empty params to refetch all developers
    search('', '')
  }

  // Memoize developer cards
  const developerCards = useMemo(() => (
    developers.map((developer, index) => (
      <DeveloperCard key={`${developer.id}-${index}`} developer={developer} index={index} />
    ))
  ), [developers])

  return (
    <>
    <Nav />
    <Layout1>
        <div className="min-h-screen">
      <div className=" mx-auto md:px-4 ">
        {/* Header */}
        <div className=" md:p-4 grid grid-cols-3 gap-4 text-left mb-12">
     <div className="">
     <h4 className="">
            Discover 
          </h4>
          <h1 className="md:text-[5em]">
             Developers
          </h1>
     </div>

          <p className="max-w-2xl">
            Explore top developers and their amazing projects. Find your next dream home with trusted developers.
          </p>

          <div>
            <p>Total Developers</p>
            <h1 className="text-primary_color text-[5em] ">24k</h1>
          </div>
        </div>
      </div>

      {/* Featured Developers Header - Full Width */}
      <DevelopmentHeaders />

      <div className="mx-auto md:px-4">
        {/* Search Bar */}
        <div className="sticky top-0 backdrop-blur-sm z-100 bg-white/10">
          <div className="w-full gradient_bg p-4">
            {/* Desktop View - Always Visible */}
            <div className="hidden md:block">
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {/* Name Search */}
                  <div className="relative w-full col-span-2 flex items-center rounded-lg border border-gray-300">
                    <input
                      ref={nameInputRef}
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="Search by name"
                      className="w-full pl-4 pr-4 py-3 focus:outline-none focus:ring-0 focus:border-none"
                      disabled={loading}
                      autoComplete="off"
                    />
                    {nameInput && (
                      <button
                        type="button"
                        onClick={() => setNameInput('')}
                        className="absolute right-3 text-gray-400 hover:text-gray-600"
                        disabled={loading}
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Location Search with Autocomplete */}
                  <div className="relative w-full col-span-2">
                    <div className="relative flex items-center rounded-lg  border-gray-300 ">
                      <input
                        ref={locationInputRef}
                        type="text"
                        value={locationInput}
                        onChange={(e) => setLocationInput(e.target.value)}
                        onFocus={() => {
                          if (locationSuggestions.length > 0) {
                            setShowLocationDropdown(true)
                          }
                        }}
                        onBlur={() => {
                          setTimeout(() => {
                            setShowLocationDropdown(false)
                          }, 200)
                        }}
                        placeholder="Search by location"
                        className="w-full pl-4 pr-4 py-3 focus:outline-none focus:ring-0 focus:border-none"
                        disabled={loading}
                        autoComplete="off"
                      />
                      {(locationInput || locationTerm) && (
                        <button
                          type="button"
                          onClick={() => {
                            setLocationInput('')
                            setLocationTerm('')
                            setShowLocationDropdown(false)
                            setLocationSuggestions([])
                          }}
                          className="absolute right-3 text-gray-400 hover:text-gray-600"
                          disabled={loading}
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Location Dropdown */}
                    {showLocationDropdown && locationSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {locationSuggestions.map((location, index) => (
                          <button
                            key={`${location.type}-${location.value}-${index}`}
                            type="button"
                            onClick={() => handleLocationSelect(location)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center gap-2"
                          >
                            <span className="text-sm">{location.label}</span>
                            <span className="ml-auto text-xs text-gray-500 capitalize">{location.type}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="relative flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="secondary_button !text-sm !rounded-md"
                    >
                      {loading ? 'Searching...' : 'Search'}
                    </button>
                    {(nameInput || locationTerm) && (
                      <button
                        type="button"
                        onClick={handleClear}
                        disabled={loading}
                        className="secondary_button"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>

            {/* Mobile View - Button to Open Modal */}
            <div className="md:hidden">
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="w-full secondary_button flex items-center justify-center gap-2"
              >
                <span>Filters</span>
                {(nameInput || locationTerm) && (
                  <span className="bg-primary_color text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {(nameInput ? 1 : 0) + (locationTerm ? 1 : 0)}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="text-center py-8">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mx-auto">
                <p className="text-red-600">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
          
        
          <div className="p-4">
            <p>Developers Fetched</p>
            <h1 className="text-primary_color border-b-4 border-primary_color pb-2 md:text-[3em]">
              {developers.length}
            </h1>
          </div>
        </div>

        {/* Mobile Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 md:hidden">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowModal(false)}
            />
            
            {/* Modal Content */}
            <div className="fixed inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-primary_color">Filters</h2>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    ✕
                  </button>
                </div>

                {/* Filter Form */}
                <form onSubmit={handleSearch} className="space-y-4">
                  {/* Name Search */}
                  <div className="relative w-full flex items-center rounded-lg border border-gray-300 bg-white">
                    <input
                      ref={nameInputRef}
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="Search by name"
                      className="w-full pl-4 pr-4 py-3 focus:outline-none focus:ring-0 focus:border-none"
                      disabled={loading}
                      autoComplete="off"
                    />
                    {nameInput && (
                      <button
                        type="button"
                        onClick={() => setNameInput('')}
                        className="absolute right-3 text-gray-400 hover:text-gray-600"
                        disabled={loading}
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Location Search with Autocomplete */}
                  <div className="relative w-full">
                    <div className="relative flex items-center rounded-lg border border-gray-300 bg-white">
                      <input
                        ref={locationInputRef}
                        type="text"
                        value={locationInput}
                        onChange={(e) => setLocationInput(e.target.value)}
                        onFocus={() => {
                          if (locationSuggestions.length > 0) {
                            setShowLocationDropdown(true)
                          }
                        }}
                        onBlur={() => {
                          setTimeout(() => {
                            setShowLocationDropdown(false)
                          }, 200)
                        }}
                        placeholder="Search by location"
                        className="w-full pl-4 pr-4 py-3 focus:outline-none focus:ring-0 focus:border-none"
                        disabled={loading}
                        autoComplete="off"
                      />
                      {(locationInput || locationTerm) && (
                        <button
                          type="button"
                          onClick={() => {
                            setLocationInput('')
                            setLocationTerm('')
                            setShowLocationDropdown(false)
                            setLocationSuggestions([])
                          }}
                          className="absolute right-3 text-gray-400 hover:text-gray-600"
                          disabled={loading}
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Location Dropdown */}
                    {showLocationDropdown && locationSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {locationSuggestions.map((location, index) => (
                          <button
                            key={`${location.type}-${location.value}-${index}`}
                            type="button"
                            onClick={() => handleLocationSelect(location)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center gap-2"
                          >
                            <span className="text-sm">{location.label}</span>
                            <span className="ml-auto text-xs text-gray-500 capitalize">{location.type}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="secondary_button flex-1"
                    >
                      {loading ? 'Searching...' : 'Search'}
                    </button>
                    {(nameInput || locationTerm) && (
                      <button
                        type="button"
                        onClick={handleClear}
                        disabled={loading}
                        className="secondary_button"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      
            <br/>
            
        {/* Developers Grid */}
        {developers.length > 0 && (
          <div className="mb-8">
         
            <div className="flex flex-wrap gap-4 justify-center md:justify-between items-center">
              {developerCards}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && developers.length === 0 && (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="large" />
          </div>
        )}

        {/* No Results */}
        {!loading && developers.length === 0 && !error && (
          <div className="text-center py-12">
            <div className="bg-gray-100 rounded-lg p-8 max-w-md mx-auto">
              <div className="text-6xl mb-4">🏗️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Developers Found
              </h3>
              <p className="text-gray-600">
                Try adjusting your search terms or check back later for new developers.
              </p>
            </div>
          </div>
        )}

        {/* Load More Trigger */}
        {hasMore && developers.length > 0 && (
          <div ref={loadingRef} className="flex justify-center py-8">
            {loading ? (
              <LoadingSpinner size="medium" />
            ) : (
              <button
                onClick={loadMore}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
              >
                Load More Developers
              </button>
            )}
          </div>
        )}

        {/* End of Results */}
        {!hasMore && developers.length > 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">
              You've reached the end of the list. No more developers to load.
            </p>
          </div>
        )}
      </div>
    </div>
    </Layout1>
    </>

  )
}

export default AllDevelopersPage