'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const HeaderSearch = () => {
  const router = useRouter()
  const [selectedPurposeId, setSelectedPurposeId] = useState(null) // null means 'all'
  const [propertyPurposes, setPropertyPurposes] = useState([])
  const [loading, setLoading] = useState(true)
  const [locationInput, setLocationInput] = useState("")
  const [locationSearchResults, setLocationSearchResults] = useState([])
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)
  
  // Location state
  const [country, setCountry] = useState("")
  const [state, setState] = useState("")
  const [city, setCity] = useState("")
  const [town, setTown] = useState("")
  
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)
  const searchTimeoutRef = useRef(null)

  // Fetch property purposes
  useEffect(() => {
    const fetchPropertyPurposes = async () => {
      try {
        const response = await fetch('/api/property-purposes')
        if (response.ok) {
          const result = await response.json()
          setPropertyPurposes(result.data || [])
        }
      } catch (error) {
        console.error('Error fetching property purposes:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchPropertyPurposes()
  }, [])

  // Location search function
  const triggerLocationSearch = useCallback(async (searchValue) => {
    if (!searchValue || searchValue.trim().length < 1) {
      return []
    }

    try {
      const response = await fetch(`/api/locations/search?q=${encodeURIComponent(searchValue.trim())}&limit=10`)
      if (response.ok) {
        const result = await response.json()
        return result.data || []
      } else {
        return []
      }
    } catch (error) {
      console.error('Error searching locations:', error)
      return []
    }
  }, [])

  // Handle location input change
  const handleLocationChange = useCallback((e) => {
    const newValue = e.target.value
    setLocationInput(newValue)

    // Debounce location search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (newValue.trim().length > 0) {
      searchTimeoutRef.current = setTimeout(async () => {
        const results = await triggerLocationSearch(newValue)
        setLocationSearchResults(results)
        setShowLocationDropdown(results.length > 0)
      }, 300)
    } else {
      setLocationSearchResults([])
      setShowLocationDropdown(false)
    }
  }, [triggerLocationSearch])

  // Handle location selection
  const handleLocationSelect = useCallback((location) => {
    // Clear all location fields first
    setCountry("")
    setState("")
    setCity("")
    setTown("")

    // Set the appropriate field based on location type
    switch (location.type) {
      case 'country':
        setCountry(location.value)
        setLocationInput(location.label)
        break
      case 'state':
        setState(location.value)
        setLocationInput(location.label)
        break
      case 'city':
        setCity(location.value)
        setLocationInput(location.label)
        break
      case 'town':
        setTown(location.value)
        setLocationInput(location.label)
        break
    }

    setShowLocationDropdown(false)
    if (inputRef.current) {
      inputRef.current.blur()
    }
  }, [])

  const handleBlur = useCallback((e) => {
    setTimeout(() => {
      if (dropdownRef.current?.contains(document.activeElement)) {
        return // Keep dropdown open
      }
      setShowLocationDropdown(false)
    }, 250)
  }, [])

  // Handle search - navigate to exploreProperties with filters
  const handleSearch = useCallback(() => {
    const params = new URLSearchParams()
    
    // Add property purpose ID
    if (selectedPurposeId) {
      params.append('purpose_id', selectedPurposeId)
    }
    
    // Add location
    if (country) params.append('country', country)
    if (state) params.append('state', state)
    if (city) params.append('city', city)
    if (town) params.append('town', town)
    
    // Navigate to explore properties page
    const queryString = params.toString()
    const url = queryString ? `/home/exploreProperties?${queryString}` : '/home/exploreProperties'
    router.push(url)
  }, [selectedPurposeId, country, state, city, town, router])

  return (
    <div className="w-full">
      <div className="bg-white/17 backdrop-blur-sm rounded-lg shadow-lg p-4 flex flex-col gap-4 border border-white/40">
        {/* Property Purpose Tabs */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedPurposeId(null)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedPurposeId === null
                ? 'bg-primary_color text-white'
                : 'bg-white/17 text-primary_color hover:bg-primary_color/20 border border-white/40'
            }`}
          >
            All
          </button>
          {loading ? (
            <div className="text-sm text-primary_color/60">Loading...</div>
          ) : (
            propertyPurposes.map((purpose) => (
              <button
                key={purpose.id}
                onClick={() => setSelectedPurposeId(purpose.id)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedPurposeId === purpose.id
                    ? 'bg-primary_color text-white'
                    : 'bg-white/17 text-primary_color hover:bg-primary_color/20 border border-white/40'
                }`}
              >
                {purpose.name}
              </button>
            ))
          )}
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-3 bg-white/17 rounded-lg border border-white/40">
          <div className="relative flex-1">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg
                className="w-5 h-5 text-primary_color"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={locationInput}
              onChange={handleLocationChange}
              onBlur={handleBlur}
              placeholder="eg: house at east legon"
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-transparent text-primary_color placeholder-primary_color/60 focus:outline-none focus:ring-2 focus:ring-primary_color/20 border-0 text-sm"
              autoComplete="off"
            />
            {showLocationDropdown && locationSearchResults.length > 0 && (
              <div 
                ref={dropdownRef}
                className="absolute z-[100] w-full mt-1 bg-white border border-primary_color/20 rounded-md shadow-lg max-h-60 overflow-y-auto"
                onMouseDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
              >
                {locationSearchResults.map((result, index) => (
                  <button
                    key={`${result.type}-${result.value}-${index}`}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    onClick={() => handleLocationSelect(result)}
                    className="w-full text-left px-4 py-2 hover:bg-primary_color/10 transition-colors flex items-center gap-2"
                  >
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      result.type === 'country' ? 'bg-blue-100 text-blue-700' :
                      result.type === 'state' ? 'bg-green-100 text-green-700' :
                      result.type === 'city' ? 'bg-purple-100 text-purple-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {result.type}
                    </span>
                    <span className="text-sm text-primary_color">{result.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Circular Search Button */}
          <button
            onClick={handleSearch}
            className="w-12 h-12 rounded-full bg-secondary_color hover:bg-secondary_color/90 flex items-center justify-center text-white transition-colors flex-shrink-0 shadow-lg"
            aria-label="Search"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default HeaderSearch

