'use client'

import React, { useMemo, useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FiChevronDown, FiSearch, FiX, FiUser, FiLogOut } from 'react-icons/fi'
import { handleAuthFailure } from '@/lib/authFailureHandler'

const DeveloperTopNav = ({ onSearch }) => {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [searchResults, setSearchResults] = useState(null)
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const searchRef = useRef(null)
  const resultsRef = useRef(null)

  const profileImage = useMemo(() => {
    const image =
      user?.profile?.profile_image &&
      (typeof user.profile.profile_image === 'string'
        ? user.profile.profile_image
        : user.profile.profile_image.url)
    return image || '/avatar.jpg'
  }, [user])

  const developerName = user?.profile?.name || user?.profile?.company_name || 'Developer'
  const accountStatus = user?.profile?.account_status || 'active'
  const email = user?.profile?.email || user?.email || 'N/A'
  const developerSlug = user?.profile?.slug || user?.id || 'developer'
  const subscription = user?.subscription
  const packageName = subscription?.subscriptions_package?.name || 'No Package'
  
  // Format next billing date
  const formatNextBillingDate = (endDate) => {
    if (!endDate) return 'No billing date'
    try {
      const date = new Date(endDate)
      const day = date.getDate()
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ]
      const month = monthNames[date.getMonth()]
      const year = date.getFullYear()
      return `${day} ${month} ${year}`
    } catch (e) {
      return 'Invalid date'
    }
  }
  
  const nextBillingDate = subscription?.end_date ? formatNextBillingDate(subscription.end_date) : 'No subscription'

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target) &&
        searchRef.current &&
        !searchRef.current.contains(event.target)
      ) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Perform search as user types (debounced)
  useEffect(() => {
    const searchTerm = query.trim()
    
    if (!searchTerm) {
      setSearchResults(null)
      setShowResults(false)
      if (typeof onSearch === 'function') {
        onSearch('')
      }
      return
    }

    const timeoutId = setTimeout(() => {
      performSearch(searchTerm)
    }, 300) // Debounce 300ms

    return () => clearTimeout(timeoutId)
  }, [query])

  const performSearch = async (searchTerm) => {
    if (!searchTerm || !user?.id || !user?.user_type) {
      return
    }

    setIsSearching(true)
    setShowResults(true)

    try {
      // Get token from localStorage
      const token = localStorage.getItem('developer_token') || localStorage.getItem('property_seeker_token') || localStorage.getItem('agent_token')
      
      if (!token) {
        console.error('Missing authentication token')
        setIsSearching(false)
        return
      }

      // Call search API
      const response = await fetch(`/api/search?query=${encodeURIComponent(searchTerm)}&limit=10`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-user-id': user.id,
          'x-user-type': user.user_type,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setSearchResults(data.data)
          // Pass search results to parent component
          if (typeof onSearch === 'function') {
            onSearch(searchTerm, data.data)
          }
        }
      } else {
        // Handle auth failure
        if (response.status === 401) {
          const errorData = await response.json()
          if (errorData?.auth_failed) {
            handleAuthFailure('/home/signin')
            return
          }
        }
        console.error('Search failed:', response.statusText)
        setSearchResults(null)
      }
    } catch (error) {
      console.error('Error performing search:', error)
      setSearchResults(null)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const searchTerm = query.trim()
    
    if (!searchTerm) {
      setSearchResults(null)
      setShowResults(false)
      if (typeof onSearch === 'function') {
        onSearch('')
      }
      return
    }

    await performSearch(searchTerm)
  }

  // Get image URL from media field (for listings) or development data
  const getImageUrl = (item, isDevelopment = false) => {
    // For developments, media might not exist, so return placeholder
    if (isDevelopment) {
      // Check if development has any media field (might be stored differently)
      if (item.media) {
        try {
          const mediaArray = typeof item.media === 'string' ? JSON.parse(item.media) : item.media
          if (Array.isArray(mediaArray) && mediaArray.length > 0) {
            const firstMedia = mediaArray[0]
            return typeof firstMedia === 'string' ? firstMedia : firstMedia.url || firstMedia.path || '/placeholder.png'
          }
        } catch (e) {
          if (typeof item.media === 'string' && item.media.startsWith('http')) {
            return item.media
          }
        }
      }
      return '/placeholder.png'
    }
    
    // For listings
    if (!item.media) return '/placeholder.png'
    try {
      const mediaArray = typeof item.media === 'string' ? JSON.parse(item.media) : item.media
      if (Array.isArray(mediaArray) && mediaArray.length > 0) {
        const firstMedia = mediaArray[0]
        return typeof firstMedia === 'string' ? firstMedia : firstMedia.url || firstMedia.path || '/placeholder.png'
      }
    } catch (e) {
      // If it's already a string URL
      if (typeof item.media === 'string' && item.media.startsWith('http')) {
        return item.media
      }
    }
    return '/placeholder.png'
  }

  // Format price
  const formatPrice = (price, currency = 'NGN') => {
    if (!price) return 'Price on request'
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency || 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  // Get location string
  const getLocation = (item) => {
    const parts = [item.town, item.city, item.state, item.country].filter(Boolean)
    return parts.length > 0 ? parts.join(', ') : 'Location not specified'
  }

  const hasResults = searchResults && (
    (searchResults.listings && searchResults.listings.length > 0) ||
    (searchResults.developments && searchResults.developments.length > 0)
  )

  const totalResults = (searchResults?.listings?.length || 0) + (searchResults?.developments?.length || 0)

  const handleLogout = async () => {
    if (isLoggingOut) return
    
    setIsLoggingOut(true)
    setOpen(false)
    
    try {
      const result = await logout()
      if (result.success) {
        router.push('/')
      } else {
        console.error('Logout failed:', result.error)
        router.push('/')
      }
    } catch (error) {
      console.error('Logout error:', error)
      router.push('/')
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="fixed top-0   w-full  left-1/2 -translate-x-1/2    overflow-y z-100 backdrop-blur-mdw-full shadow-sm bg-white/20 backdrop-blur-sm">
      <div className="">
        <div className="mx-auto flex  items-center justify-between px-4 py-4 text-primary_color">
          {/* Logo / Branding */}
          <div className="flex items-center gap-3">
    <Link href="/">
    <img src="/iska-dark.png" alt="logo" className='w-[60px]'></img>
     </Link>
            <div>
            
            </div>
          </div>

          {/* Search */}
          <div className="hidden w-full max-w-md md:block relative" ref={searchRef}>
            <form
              onSubmit={handleSubmit}
              className="flex items-center"
            >
              <div className="flex w-full items-center rounded-full bg-primary_color px-3 py-1.5 focus-within:ring-1 focus-within:ring-white/50">
                <FiSearch className="mr-2 text-white" />
                <input
                  type="text"
                  placeholder="Search units or developments..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => {
                    if (hasResults) setShowResults(true)
                  }}
                  className="flex-1 bg-transparent !border-none text-sm text-white placeholder:text-white/70 focus:outline-none"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('')
                      setSearchResults(null)
                      setShowResults(false)
                    }}
                    className="ml-2 text-white/70 hover:text-white"
                  >
                    <FiX size={18} />
                  </button>
                )}
              </div>
            </form>

            {/* Search Results Dropdown */}
            {showResults && query.trim() && (
              <div
                ref={resultsRef}
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 max-h-[500px] overflow-y-auto z-50"
              >
                {isSearching ? (
                  <div className="p-4 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary_color mx-auto"></div>
                    <p className="mt-2 text-sm">Searching...</p>
                  </div>
                ) : hasResults ? (
                  <div className="py-2">
                    {/* Results Header */}
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-semibold text-gray-700">
                        Found {totalResults} result{totalResults !== 1 ? 's' : ''}
                      </p>
                    </div>

                    {/* Developments Section */}
                    {searchResults.developments && searchResults.developments.length > 0 && (
                      <div className="border-b border-gray-200">
                        <div className="px-4 py-2 bg-gray-50">
                          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                            Developments ({searchResults.developments.length})
                          </p>
                        </div>
                        {searchResults.developments.map((development) => (
                          <Link
                            key={development.id}
                            href={`/developer/${user?.profile?.slug}/developments/${development.slug}`}
                            onClick={() => {
                              setShowResults(false)
                              setQuery('')
                            }}
                            className="block px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                                <img
                                  src={getImageUrl(development, true)}
                                  alt={development.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.src = '/placeholder.png'
                                  }}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">
                                  {development.title}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                  {getLocation(development)}
                                </p>
                                <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                                  Development
                                </span>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Listings Section */}
                    {searchResults.listings && searchResults.listings.length > 0 && (
                      <div>
                        <div className="px-4 py-2 bg-gray-50">
                          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                            Listings ({searchResults.listings.length})
                          </p>
                        </div>
                        {searchResults.listings.map((listing) => (
                          <Link
                            key={listing.id}
                            href={`/developer/${user?.profile?.slug}/units/${listing.slug}`}
                            onClick={() => {
                              setShowResults(false)
                              setQuery('')
                            }}
                            className="block px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                                <img
                                  src={getImageUrl(listing, false)}
                                  alt={listing.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.src = '/placeholder.png'
                                  }}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">
                                  {listing.title}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                  {getLocation(listing)}
                                </p>
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-xs font-medium text-primary_color">
                                    {formatPrice(listing.price, listing.currency)}
                                  </span>
                                  <span className="inline-block px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded capitalize">
                                    {listing.listing_type}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : query.trim() ? (
                  <div className="p-4 text-center text-gray-500">
                    <p className="text-sm">No results found for "{query}"</p>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setOpen((prev) => !prev)}
              className="flex items-center gap-3 rounded-md border border-white/50 bg-white/40 px-3 py-1.5 transition hover:bg-white/20"
            >
              <div className="relative h-10 w-10 overflow-hidden rounded-full md:rounded-md border border-white/20">
                <Image
                  src={profileImage}
                  alt={developerName}
                  fill
                  sizes="40px"
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="hidden text-left text-sm md:block">
                
                <p className=" leading-tight text-sm">{developerName}</p>
                <p className='text-[0.8em] italic'>Developer </p>
                {/* <p className="text-xs uppercase tracking-wide text-white/70">{accountStatus}</p> */}
              </div>
              <FiChevronDown className={`transition ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
              <div className="absolute right-0 mt-3 w-64 rounded-2xl border border-gray-100 bg-white p-4 text-gray-800 shadow-lg z-50">
                {/* User Name */}
                <div className="mb-3">
                  <p className="text-sm font-">{developerName}</p>
                  <p className="text-xs text-gray-600 capitalize">
                    {user?.user_type || 'Developer'}, {accountStatus}
                  </p>
                </div>

                {/* Separator */}
                <div className="border-t border-gray-200 my-3"></div>

                {/* Next Billing Date and Package */}
                <div className="mb-3 flex flex-col gap-2">
          <span>
          <p className="text-xs font-bold ">Package:</p>
          <p className="text-sm ">{packageName}</p>
          </span>
                
                <span>
                <p className="text-xs font-bold ">Next Billing Date:</p>
                  <p className="text-sm ">{nextBillingDate}</p>
                 
                </span>
               
                </div>

                {/* Separator */}
                <div className="border-t border-gray-200 my-3"></div>

                {/* Profile Link */}
                <Link
                  href={`/developer/${developerSlug}/profile`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors mb-2"
                >
                  <FiUser className="w-4 h-4" />
                  <span className="text-sm">Profile</span>
                </Link>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiLogOut className="w-4 h-4" />
                  <span className="text-sm">{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeveloperTopNav
