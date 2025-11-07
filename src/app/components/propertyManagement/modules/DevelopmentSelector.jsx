'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { FaBuilding, FaMapMarkerAlt, FaSearch, FaTimes } from 'react-icons/fa'

const DevelopmentSelector = ({ 
  developments: initialDevelopments = [], 
  loading, 
  selectedDevelopmentId, 
  onSelect, 
  required = false,
  developerId
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const searchTimeoutRef = useRef(null)
  const dropdownRef = useRef(null)
  const searchInputRef = useRef(null)

  const getBannerUrl = (development) => {
    // Handle different banner structures
    if (development.banner?.url) {
      return development.banner.url
    }
    if (typeof development.banner === 'string') {
      return development.banner
    }
    return null
  }

  const getLocationString = (development) => {
    const parts = []
    if (development.town) parts.push(development.town)
    if (development.city) parts.push(development.city)
    if (development.state) parts.push(development.state)
    if (development.country) parts.push(development.country)
    return parts.join(', ') || 'Location not specified'
  }

  // Search developments
  const searchDevelopments = useCallback(async (query) => {
    if (!developerId || !query.trim()) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    try {
      const token = localStorage.getItem('developer_token')
      const response = await fetch(
        `/api/developments/searchDevelopments?developer_id=${developerId}&query=${encodeURIComponent(query.trim())}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.data || [])
      } else {
        setSearchResults([])
      }
    } catch (error) {
      console.error('Error searching developments:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [developerId])

  // Handle search input with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (searchQuery.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        searchDevelopments(searchQuery)
        setShowDropdown(true)
      }, 300)
    } else {
      setSearchResults([])
      setShowDropdown(false)
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery, searchDevelopments])

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target)
      ) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Get displayed developments
  const getDisplayedDevelopments = () => {
    // If a development is selected, only show that one
    if (selectedDevelopmentId) {
      const selected = [...initialDevelopments, ...searchResults].find(
        dev => dev.id === selectedDevelopmentId
      )
      return selected ? [selected] : []
    }

    // If searching, show search results
    if (searchQuery.trim() && searchResults.length > 0) {
      return searchResults
    }

    // Otherwise, show first 5 from initial developments
    return initialDevelopments.slice(0, 5)
  }

  const handleSelect = (developmentId) => {
    onSelect(developmentId)
    setSearchQuery('')
    setShowDropdown(false)
    setSearchResults([])
  }

  const handleClearSelection = (e) => {
    e.stopPropagation()
    onSelect('')
    setSearchQuery('')
    setShowDropdown(false)
    setSearchResults([])
  }

  const displayedDevelopments = getDisplayedDevelopments()

  if (loading) {
    return (
      <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-sm sm:text-base">
        <p className="text-gray-500">Loading developments...</p>
      </div>
    )
  }

  if (initialDevelopments.length === 0 && !searchQuery.trim()) {
    return (
      <div>
        <p className="text-xs sm:text-sm text-gray-500">
          No developments found. Please create a development first.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="relative">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search developments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (searchQuery.trim() && searchResults.length > 0) {
                setShowDropdown(true)
              }
            }}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setSearchResults([])
                setShowDropdown(false)
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showDropdown && searchQuery.trim() && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-96 overflow-y-auto"
          >
            {isSearching ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                Searching...
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((dev) => {
                const bannerUrl = getBannerUrl(dev)
                const location = getLocationString(dev)
                const isSelected = selectedDevelopmentId === dev.id
                
                return (
                  <button
                    key={dev.id}
                    type="button"
                    onClick={() => handleSelect(dev.id)}
                    className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left ${
                      isSelected ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                      {bannerUrl ? (
                        <Image
                          src={bannerUrl}
                          alt={dev.title}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                          <FaBuilding className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">
                        {dev.title}
                      </h3>
                      <div className="flex items-center text-xs text-gray-600 mt-0.5">
                        <FaMapMarkerAlt className="w-3 h-3 mr-1 flex-shrink-0" />
                        <span className="truncate">{location}</span>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="flex-shrink-0">
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </button>
                )
              })
            ) : (
              <div className="p-4 text-center text-gray-500 text-sm">
                No developments found
              </div>
            )}
          </div>
        )}
      </div>

      {/* Development List */}
      {displayedDevelopments.length > 0 && (
        <div className="space-y-2">
          {displayedDevelopments.map((dev) => {
            const isSelected = selectedDevelopmentId === dev.id
            const bannerUrl = getBannerUrl(dev)
            const location = getLocationString(dev)
            
            return (
              <div
                key={dev.id}
                className={`w-full flex items-center gap-4 p-3 border-2 rounded-lg transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleSelect(dev.id)}
                  className="flex-1 flex items-center gap-4 text-left"
                >
                  {/* Banner Image */}
                  <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-gray-100">
                    {bannerUrl ? (
                      <Image
                        src={bannerUrl}
                        alt={dev.title}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <FaBuilding className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Development Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-1 truncate">
                      {dev.title}
                    </h3>
                    <div className="flex items-center text-xs sm:text-sm text-gray-600 mb-1">
                      <FaMapMarkerAlt className="w-3 h-3 mr-1 flex-shrink-0" />
                      <span className="truncate">{location}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      <span className="font-medium">{dev.total_units || 0}</span> unit{dev.total_units !== 1 ? 's' : ''}
                    </div>
                  </div>
                </button>

                {/* Selection Indicator and Clear Button */}
                {isSelected && (
                  <div className="flex-shrink-0 flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearSelection}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title="Clear selection"
                    >
                      <FaTimes className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {!searchQuery.trim() && displayedDevelopments.length === 0 && initialDevelopments.length > 0 && (
        <p className="text-xs sm:text-sm text-gray-500 text-center py-2">
          No developments match your criteria
        </p>
      )}
    </div>
  )
}

export default DevelopmentSelector

