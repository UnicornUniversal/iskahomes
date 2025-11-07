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
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 lg:mb-6 gap-4">
                            <h2 className="text-xl lg:text-2xl font-bold text-gray-800">Saved Listings</h2>
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-2 rounded-lg transition-colors ${
                                            viewMode === 'grid' 
                                                ? 'bg-primary_color text-white' 
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        <FiGrid className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-2 rounded-lg transition-colors ${
                                            viewMode === 'list' 
                                                ? 'bg-primary_color text-white' 
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        <FiList className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Search and Filters */}
                        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 lg:p-6 mb-4 lg:mb-6">
                            <div className="flex flex-col lg:flex-row gap-4">
                                {/* Search */}
                                <div className="flex-1">
                                    <div className="relative">
                                        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input
                                            type="text"
                                            placeholder="Search saved listings..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                {/* Filters */}
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                    <div className="flex items-center space-x-2">
                                        <FiFilter className="w-4 h-4 text-gray-600" />
                                        <span className="text-sm font-medium text-gray-700">Filter:</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {['all', 'rent', 'sale'].map((filter) => (
                                            <button
                                                key={filter}
                                                onClick={() => setActiveFilter(filter)}
                                                className={`px-2 lg:px-3 py-1 rounded-lg text-xs lg:text-sm font-medium transition-colors ${
                                                    activeFilter === filter
                                                        ? 'bg-primary_color text-white'
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary_color mx-auto mb-4"></div>
                                <p className="text-gray-600">Loading saved listings...</p>
                            </div>
                        ) : error ? (
                            <div className="text-center py-12">
                                <div className="text-red-400 mb-4">
                                    <FiHeart className="w-16 h-16 mx-auto" />
                                </div>
                                <h3 className="text-lg font-medium text-red-600 mb-2">Error loading listings</h3>
                                <p className="text-gray-500">{error}</p>
                            </div>
                        ) : (
                            <>
                        {/* Results Count */}
                        <div className="mb-4">
                            <p className="text-gray-600">
                                Showing {filteredListings.length} of {savedListings.length} saved listings
                            </p>
                        </div>

                        {/* Listings Grid/List */}
                        {viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                                        {filteredListings.map((savedListing) => {
                                            const listing = savedListing.listings
                                            const mainImage = listing?.media?.mediaFiles?.[0]?.url || listing?.media?.banner?.url
                                            return (
                                                <div key={savedListing.id} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                                        <div className="relative">
                                                        {mainImage ? (
                                            <img
                                                                src={mainImage}
                                                                alt={listing?.title}
                                                className="w-full h-48 object-cover"
                                            />
                                                        ) : (
                                                            <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                                                <div className="text-white text-2xl font-bold">
                                                                    {listing?.title?.charAt(0) || 'P'}
                                                                </div>
                                                            </div>
                                                        )}
                                            <div className="absolute top-3 right-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                                listing?.price_type === 'rent' 
                                                        ? 'bg-blue-100 text-blue-800' 
                                                        : 'bg-green-100 text-green-800'
                                                }`}>
                                                                {listing?.price_type === 'rent' ? 'For Rent' : 'For Sale'}
                                                </span>
                                            </div>
                                            <button className="absolute top-3 left-3 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors">
                                                            <FiHeart className="w-4 h-4 text-red-500 fill-current" />
                                            </button>
                                        </div>
                                        <div className="p-4">
                                                        <h3 className="font-semibold text-gray-800 mb-1">{listing?.title}</h3>
                                                        <p className="text-gray-600 text-sm mb-2">
                                                            {listing?.full_address || `${listing?.city}, ${listing?.state}`}
                                                        </p>
                                                        <p className="text-lg font-bold text-primary_color mb-3">
                                                            {listing?.currency} {parseFloat(listing?.price || 0).toLocaleString()}
                                                            {listing?.price_type === 'rent' && `/${listing?.duration}`}
                                                        </p>
                                            <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                                                            <span>{listing?.specifications?.bedrooms || 0} beds</span>
                                                            <span>{listing?.specifications?.bathrooms || 0} baths</span>
                                                            <span>{listing?.specifications?.property_size || listing?.size || 0} sq ft</span>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                                                    View Details
                                                </button>
                                                <button className="flex-1 px-3 py-2 text-sm bg-primary_color text-white rounded-lg hover:bg-primary_color/90 transition-colors">
                                                    Schedule Visit
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                            )
                                        })}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                        {filteredListings.map((savedListing) => {
                                            const listing = savedListing.listings
                                            return (
                                    <SavedListingCard
                                                    key={savedListing.id}
                                                    title={listing?.title}
                                                    price={`${listing?.currency} ${parseFloat(listing?.price || 0).toLocaleString()}${listing?.price_type === 'rent' ? `/${listing?.duration}` : ''}`}
                                                    location={listing?.full_address || `${listing?.city}, ${listing?.state}`}
                                                    image={listing?.media?.mediaFiles?.[0]?.url || listing?.media?.banner?.url}
                                                    bedrooms={listing?.specifications?.bedrooms || 0}
                                                    bathrooms={listing?.specifications?.bathrooms || 0}
                                                    area={`${listing?.specifications?.property_size || listing?.size || 0} sq ft`}
                                                    savedDate={new Date(savedListing.created_at).toLocaleDateString()}
                                                />
                                            )
                                        })}
                            </div>
                                )}
                            </>
                        )}

                        {!loading && !error && filteredListings.length === 0 && (
                            <div className="text-center py-12">
                                <div className="text-gray-400 mb-4">
                                    <FiHeart className="w-16 h-16 mx-auto" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-600 mb-2">No saved listings found</h3>
                                <p className="text-gray-500">
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