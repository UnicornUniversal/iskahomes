'use client'

import React, { useState, useRef, useEffect, memo, useCallback } from 'react'
import { Search, X, MapPin, Filter } from 'lucide-react'

const SearchBar = memo(({ onSearch, loading }) => {
  const renderCount = (SearchBar._renderCount = (SearchBar._renderCount || 0) + 1)
  const onSearchChanged = onSearch !== (SearchBar._lastOnSearch || null)
  console.log(`🔵 SearchBar RENDER #${renderCount} - loading:`, loading, 'onSearch changed:', onSearchChanged, 'Stack:', new Error().stack.split('\n')[2]?.trim())
  SearchBar._lastOnSearch = onSearch

  const [searchTerm, setSearchTerm] = useState('')
  const [locationTerm, setLocationTerm] = useState('')
  const [locationInput, setLocationInput] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [locationSuggestions, setLocationSuggestions] = useState([])
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)
  const locationInputRef = useRef(null)
  const nameInputRef = useRef(null)
  const locationTimeoutRef = useRef(null)
  
  // Use callback ref instead of useEffect for onSearch
  const onSearchRef = useRef(onSearch)
  onSearchRef.current = onSearch

  // Log when component mounts
  useEffect(() => {
    console.log('🟢 SearchBar MOUNTED')
    return () => {
      console.log('🔴 SearchBar UNMOUNTED')
    }
  }, [])

  // Track and restore focus after renders
  const focusedInputRef = useRef(null)
  const cursorPositionRef = useRef(null)

  // Save focus before state changes
  const saveFocus = useCallback((input, cursorPos) => {
    focusedInputRef.current = input
    cursorPositionRef.current = cursorPos
  }, [])

  // Restore focus after render
  useEffect(() => {
    if (focusedInputRef.current) {
      const input = focusedInputRef.current
      const cursorPos = cursorPositionRef.current
      console.log('🔧 Attempting to restore focus to:', input === nameInputRef.current ? 'name' : 'location', 'cursorPos:', cursorPos)
      
      // Use setTimeout to ensure DOM is updated
      setTimeout(() => {
        if (input && document.body.contains(input)) {
          input.focus()
          if (cursorPos !== null && cursorPos !== undefined) {
            input.setSelectionRange(cursorPos, cursorPos)
          }
          console.log('✅ Focus restored:', document.activeElement === input)
        } else {
          console.log('❌ Cannot restore focus - input not in DOM')
        }
      }, 0)
    }
  })

  // Debounced location search
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
    }, 300) // 300ms debounce

    return () => {
      if (locationTimeoutRef.current) {
        clearTimeout(locationTimeoutRef.current)
      }
    }
  }, [locationInput])

  const handleSearch = useCallback((e) => {
    console.log('🔍 handleSearch called - searchTerm:', searchTerm, 'locationTerm:', locationTerm)
    if (e) {
    e.preventDefault()
      e.stopPropagation()
    }
    onSearchRef.current(searchTerm, locationTerm)
    setShowModal(false)
    return false
  }, [searchTerm, locationTerm])

  const handleNameChange = useCallback((e) => {
    const value = e.target.value
    const cursorPos = e.target.selectionStart
    const hadFocus = document.activeElement === e.target
    console.log('📝 Name input changed:', value, 'Had focus:', hadFocus, 'cursorPos:', cursorPos)
    
    // Save focus state before setState
    if (hadFocus) {
      saveFocus(e.target, cursorPos)
    }
    
    setSearchTerm(value)
  }, [saveFocus])

  const handleLocationInputChange = useCallback((e) => {
    const value = e.target.value
    const cursorPos = e.target.selectionStart
    const hadFocus = document.activeElement === e.target
    console.log('📍 Location input changed:', value, 'Had focus:', hadFocus, 'cursorPos:', cursorPos)
    
    // Save focus state before setState
    if (hadFocus) {
      saveFocus(e.target, cursorPos)
    }
    
    setLocationInput(value)
  }, [saveFocus])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      handleSearch(e)
    }
  }, [handleSearch])

  const handleClear = () => {
    setSearchTerm('')
    setLocationTerm('')
    setLocationInput('')
    onSearchRef.current('', '')
  }

  const handleLocationSelect = (location) => {
    setLocationTerm(location.value)
    setLocationInput(location.label)
    setShowLocationDropdown(false)
    setLocationSuggestions([])
  }

  const handleNameClear = () => {
    setSearchTerm('')
    nameInputRef.current?.focus()
  }

  const handleLocationClear = () => {
    setLocationTerm('')
    setLocationInput('')
    setShowLocationDropdown(false)
    setLocationSuggestions([])
    locationInputRef.current?.focus()
  }

  const FilterForm = () => (
    <form onSubmit={handleSearch} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Name Search */}
        <div className="relative w-full col-span-2 flex items-center rounded-lg focus:border-transparent outline-none">
          <Search className="text-gray-400 w-5 h-5 ml-3 absolute z-10" />
          <input
            key="name-input"
            ref={nameInputRef}
            type="text"
            value={searchTerm}
            onChange={handleNameChange}
            onKeyDown={handleKeyDown}
            placeholder="Search by name"
            className="w-full pl-10 pr-10 focus:outline-none focus:ring-0 focus:border-none py-3 transition-all duration-200"
            disabled={loading}
            suppressHydrationWarning
            autoComplete="off"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={handleNameClear}
              className="absolute right-3 text-gray-400 hover:text-gray-600 transition-colors duration-200 z-10"
              disabled={loading}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Location Search with Autocomplete */}
        <div className="relative w-full col-span-2">
          <div className="relative flex items-center rounded-lg focus:border-transparent outline-none">
            <MapPin className="text-gray-400 w-5 h-5 ml-3 absolute z-10" />
            <input
              key="location-input"
              ref={locationInputRef}
              type="text"
              value={locationInput}
              onChange={handleLocationInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (locationSuggestions.length > 0) {
                  setShowLocationDropdown(true)
                }
              }}
              onBlur={() => {
                // Delay to allow clicking on suggestions
                setTimeout(() => {
                  setShowLocationDropdown(false)
                }, 200)
              }}
              placeholder="Search by location"
              className="w-full pl-10 pr-10 focus:outline-none focus:ring-0 focus:border-none py-3 transition-all duration-200"
              disabled={loading}
              suppressHydrationWarning
              autoComplete="off"
            />
            {(locationInput || locationTerm) && (
              <button
                type="button"
                onClick={handleLocationClear}
                className="absolute right-3 text-gray-400 hover:text-gray-600 transition-colors duration-200 z-10"
              disabled={loading}
            >
              <X className="w-5 h-5" />
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
                  <MapPin className="w-4 h-4 text-gray-400" />
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
          suppressHydrationWarning
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
          {(searchTerm || locationTerm) && (
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
  )

  return (
    <>
      <div className="w-full gradient_bg p-4">
        {/* Desktop View - Always Visible */}
        <div className="hidden md:block">
          <FilterForm />
        </div>

        {/* Mobile View - Button to Open Modal */}
        <div className="md:hidden">
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="w-full secondary_button flex items-center justify-center gap-2"
          >
            <Filter className="w-5 h-5" />
            <span>Filters</span>
            {(searchTerm || locationTerm) && (
              <span className="bg-primary_color text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                {(searchTerm ? 1 : 0) + (locationTerm ? 1 : 0)}
              </span>
            )}
          </button>
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
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Filter Form */}
              <FilterForm />
            </div>
          </div>
    </div>
      )}
    </>
  )
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if loading actually changes
  // Return true if props are equal (skip render), false if different (re-render)
  const loadingSame = prevProps.loading === nextProps.loading
  const onSearchSame = prevProps.onSearch === nextProps.onSearch
  const shouldSkip = loadingSame && onSearchSame
  console.log('🔍 Memo comparison called - loadingSame:', loadingSame, 'onSearchSame:', onSearchSame, 'shouldSkip:', shouldSkip)
  return shouldSkip
})

SearchBar.displayName = 'SearchBar'

export default SearchBar