'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Layout1 from '../../../layout/Layout1'
import HomeSeekerHeader from '../../../components/homeSeeker/HomeSeekerHeader'
import SavedListingCard from '../../../components/homeSeeker/SavedListingCard'
import { FiFilter, FiGrid, FiList, FiSearch, FiHeart } from 'react-icons/fi'

const HomeSeekerSavedListings = () => {
    const params = useParams()
    const { user, propertySeekerToken } = useAuth()
    const [activeFilter, setActiveFilter] = useState('all')
    const [viewMode, setViewMode] = useState('grid')
    const [searchQuery, setSearchQuery] = useState('')
    const [savedListings, setSavedListings] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Fetch saved listings
    useEffect(() => {
        const fetchSavedListings = async () => {
            if (!user || !propertySeekerToken || user.user_type !== 'property_seeker') {
                setLoading(false)
                return
            }

            try {
                setLoading(true)
                const response = await fetch('/api/saved-listings', {
                    headers: {
                        'Authorization': `Bearer ${propertySeekerToken}`
                    }
                })

                if (response.ok) {
                    const result = await response.json()
                    setSavedListings(result.data || [])
                } else {
                    const errorData = await response.json()
                    setError(errorData.error || 'Failed to fetch saved listings')
                }
            } catch (err) {
                console.error('Error fetching saved listings:', err)
                setError('Failed to fetch saved listings')
            } finally {
                setLoading(false)
            }
        }

        fetchSavedListings()
    }, [user, propertySeekerToken])

    const filteredListings = savedListings.filter(listing => {
        const matchesFilter = activeFilter === 'all' || listing.listings?.price_type === activeFilter
        const matchesSearch = listing.listings?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            listing.listings?.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            listing.listings?.state?.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesFilter && matchesSearch
    })

    return (
   <>
                    <HomeSeekerHeader />
                    
                    <div className="mt-6 lg:mt-8">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
                    <div>
                        <h2 className="text-2xl lg:text-3xl font-bold text-primary_color mb-2 flex items-center gap-3">
                            <div className="p-2 bg-primary_color/10 rounded-lg">
                                <FiHeart className="w-6 h-6 text-primary_color" />
                            </div>
                            Saved Listings
                        </h2>
                        <p className="text-primary_color/60 text-sm">Your favorite properties in one place</p>
                    </div>
                    <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setViewMode('grid')}
                            className={`p-2.5 rounded-lg transition-all duration-300 ${
                                            viewMode === 'grid' 
                                    ? 'bg-primary_color text-white shadow-lg shadow-primary_color/20' 
                                    : 'default_bg text-primary_color hover:bg-primary_color/10 border border-primary_color/10'
                                        }`}
                                    >
                                        <FiGrid className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                            className={`p-2.5 rounded-lg transition-all duration-300 ${
                                            viewMode === 'list' 
                                    ? 'bg-primary_color text-white shadow-lg shadow-primary_color/20' 
                                    : 'default_bg text-primary_color hover:bg-primary_color/10 border border-primary_color/10'
                                        }`}
                                    >
                                        <FiList className="w-4 h-4" />
                                    </button>
                            </div>
                        </div>

                        {/* Search and Filters */}
                <div className="default_bg rounded-2xl shadow-lg border border-primary_color/10 p-4 lg:p-6 mb-6">
                            <div className="flex flex-col lg:flex-row gap-4">
                                {/* Search */}
                                <div className="flex-1">
                                    <div className="relative">
                                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary_color/50 w-5 h-5" />
                                        <input
                                            type="text"
                                            placeholder="Search saved listings..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-primary_color/20 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-primary_color outline-none default_bg text-primary_color placeholder:text-primary_color/40"
                                        />
                                    </div>
                                </div>

                                {/* Filters */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className="flex items-center gap-2">
                                <FiFilter className="w-4 h-4 text-primary_color" />
                                <span className="text-sm font-medium text-primary_color">Filter:</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {['all', 'rent', 'sale'].map((filter) => (
                                            <button
                                                key={filter}
                                                onClick={() => setActiveFilter(filter)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                                                    activeFilter === filter
                                                ? 'bg-primary_color text-white shadow-lg shadow-primary_color/20'
                                                : 'default_bg text-primary_color hover:bg-primary_color/10 border border-primary_color/10'
                                                }`}
                                            >
                                                {filter.charAt(0).toUpperCase() + filter.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Loading State */}
                        {loading ? (
                    <div className="text-center py-16">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary_color/20 border-t-primary_color mx-auto mb-4"></div>
                        <p className="text-primary_color/70 font-medium">Loading saved listings...</p>
                            </div>
                        ) : error ? (
                    <div className="text-center py-16">
                                <div className="text-red-400 mb-4">
                                    <FiHeart className="w-16 h-16 mx-auto" />
                                </div>
                        <h3 className="text-lg font-bold text-red-600 mb-2">Error loading listings</h3>
                        <p className="text-primary_color/60">{error}</p>
                            </div>
                        ) : (
                            <>
                        {/* Results Count */}
                        <div className="mb-6">
                            <p className="text-primary_color/70 font-medium">
                                Showing <span className="font-bold text-primary_color">{filteredListings.length}</span> of <span className="font-bold text-primary_color">{savedListings.length}</span> saved listings
                            </p>
                        </div>

                        {/* Listings Grid/List */}
                        {viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                                {filteredListings.map((savedListing) => {
                                    const listing = savedListing.listings
                                    
                                    // Extract image from media - handle both string and object formats
                                    const getMainImage = () => {
                                      if (!listing?.media) return null
                                      
                                      try {
                                        // Parse if media is a string
                                        const media = typeof listing.media === 'string' 
                                          ? JSON.parse(listing.media) 
                                          : listing.media
                                        
                                        if (!media || typeof media !== 'object') return null
                                        
                                        // Check for new albums structure: media.albums[0].images[0].url
                                        if (media.albums && Array.isArray(media.albums) && media.albums.length > 0) {
                                          for (const album of media.albums) {
                                            if (album?.images && Array.isArray(album.images) && album.images.length > 0) {
                                              return album.images[0].url
                                            }
                                          }
                                        }
                                        
                                        // Fallback to mediaFiles (backward compatibility)
                                        if (media.mediaFiles && Array.isArray(media.mediaFiles) && media.mediaFiles.length > 0) {
                                          return media.mediaFiles[0].url
                                        }
                                        
                                        // Fallback to banner
                                        if (media.banner?.url) {
                                          return media.banner.url
                                        }
                                        
                                        return null
                                      } catch (err) {
                                        console.error('Error parsing media:', err)
                                        return null
                                      }
                                    }
                                    
                                    const mainImage = getMainImage()
                                    
                                    // Parse specifications if it's a string
                                    const specs = typeof listing?.specifications === 'string' 
                                      ? JSON.parse(listing.specifications || '{}') 
                                      : listing?.specifications || {}
                                    
                                    return (
                                        <SavedListingCard
                                            key={savedListing.id}
                                            title={listing?.title}
                                            price={`${listing?.currency} ${parseFloat(listing?.price || 0).toLocaleString()}${listing?.price_type === 'rent' ? `/${listing?.duration}` : ''}`}
                                            location={listing?.full_address || `${listing?.city}, ${listing?.state}`}
                                            image={mainImage}
                                            bedrooms={specs.bedrooms || 0}
                                            bathrooms={specs.bathrooms || 0}
                                            area={`${specs.property_size || listing?.size || 0} sq ft`}
                                            savedDate={new Date(savedListing.created_at).toLocaleDateString()}
                                            layout="vertical"
                                        />
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredListings.map((savedListing) => {
                                    const listing = savedListing.listings
                                    
                                    // Extract image from media
                                    const getMainImage = () => {
                                      if (!listing?.media) return null
                                      
                                      try {
                                        const media = typeof listing.media === 'string' 
                                          ? JSON.parse(listing.media) 
                                          : listing.media
                                        
                                        if (!media || typeof media !== 'object') return null
                                        
                                        if (media.albums && Array.isArray(media.albums) && media.albums.length > 0) {
                                          for (const album of media.albums) {
                                            if (album?.images && Array.isArray(album.images) && album.images.length > 0) {
                                              return album.images[0].url
                                            }
                                          }
                                        }
                                        
                                        if (media.mediaFiles && Array.isArray(media.mediaFiles) && media.mediaFiles.length > 0) {
                                          return media.mediaFiles[0].url
                                        }
                                        
                                        if (media.banner?.url) {
                                          return media.banner.url
                                        }
                                        
                                        return null
                                      } catch (err) {
                                        return null
                                      }
                                    }
                                    
                                    const mainImage = getMainImage()
                                    
                                    // Parse specifications
                                    const specs = typeof listing?.specifications === 'string' 
                                      ? JSON.parse(listing.specifications || '{}') 
                                      : listing?.specifications || {}
                                    
                                    return (
                                        <SavedListingCard
                                            key={savedListing.id}
                                            title={listing?.title}
                                            price={`${listing?.currency} ${parseFloat(listing?.price || 0).toLocaleString()}${listing?.price_type === 'rent' ? `/${listing?.duration}` : ''}`}
                                            location={listing?.full_address || `${listing?.city}, ${listing?.state}`}
                                            image={mainImage}
                                            bedrooms={specs.bedrooms || 0}
                                            bathrooms={specs.bathrooms || 0}
                                            area={`${specs.property_size || listing?.size || 0} sq ft`}
                                            savedDate={new Date(savedListing.created_at).toLocaleDateString()}
                                            layout="vertical"
                                        />
                                    )
                                })}
                            </div>
                        )}
                            </>
                        )}

                        {!loading && !error && filteredListings.length === 0 && (
                            <div className="text-center py-16 default_bg rounded-2xl border border-primary_color/10">
                                <div className="text-primary_color/30 mb-4">
                                    <FiHeart className="w-20 h-20 mx-auto" />
                                </div>
                                <h3 className="text-xl font-bold text-primary_color mb-2">No saved listings found</h3>
                                <p className="text-primary_color/60 max-w-md mx-auto">
                                    {savedListings.length === 0 
                                        ? "You haven't saved any listings yet. Start exploring properties to save your favorites!"
                                        : "Try adjusting your search or filters to find what you're looking for."
                                    }
                                </p>
                            </div>
                        )}
                    </div>
        </>
    )
}

export default HomeSeekerSavedListings 