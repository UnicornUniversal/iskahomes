'use client'

import React, { useState } from 'react'
import Layout1 from '../../../layout/Layout1'
import HomeSeekerHeader from '../../../components/homeseeker/HomeSeekerHeader'
import HomeSeekerNav from '../../../components/homeseeker/HomeSeekerNav'
import SavedListingCard from '../../../components/homeseeker/SavedListingCard'
import { FiFilter, FiGrid, FiList, FiSearch, FiHeart } from 'react-icons/fi'

const HomeSeekerSavedListings = () => {
    const [activeFilter, setActiveFilter] = useState('all')
    const [viewMode, setViewMode] = useState('grid')
    const [searchQuery, setSearchQuery] = useState('')

    // Dummy data for saved listings
    const savedListings = [
        {
            id: 1,
            title: "Luxury Villa - East Legon",
            price: "$2,500/month",
            location: "East Legon, Accra",
            image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop",
            bedrooms: 4,
            bathrooms: 3,
            area: "450 sq ft",
            savedDate: "2 days ago",
            type: "rent",
            status: "available"
        },
        {
            id: 2,
            title: "Modern Apartment - Airport",
            price: "$1,800/month",
            location: "Airport Residential, Accra",
            image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop",
            bedrooms: 3,
            bathrooms: 2,
            area: "350 sq ft",
            savedDate: "1 week ago",
            type: "rent",
            status: "available"
        },
        {
            id: 3,
            title: "Townhouse - Cantonments",
            price: "$3,200/month",
            location: "Cantonments, Accra",
            image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=300&fit=crop",
            bedrooms: 5,
            bathrooms: 4,
            area: "600 sq ft",
            savedDate: "2 weeks ago",
            type: "rent",
            status: "available"
        },
        {
            id: 4,
            title: "Penthouse - Trasacco Valley",
            price: "$850,000",
            location: "Trasacco Valley, Accra",
            image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop",
            bedrooms: 4,
            bathrooms: 3,
            area: "800 sq ft",
            savedDate: "3 weeks ago",
            type: "sale",
            status: "available"
        },
        {
            id: 5,
            title: "Studio Apartment - Osu",
            price: "$1,200/month",
            location: "Osu, Accra",
            image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop",
            bedrooms: 1,
            bathrooms: 1,
            area: "250 sq ft",
            savedDate: "1 month ago",
            type: "rent",
            status: "available"
        },
        {
            id: 6,
            title: "Family Home - Dzorwulu",
            price: "$1,200,000",
            location: "Dzorwulu, Accra",
            image: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&h=300&fit=crop",
            bedrooms: 6,
            bathrooms: 5,
            area: "1200 sq ft",
            savedDate: "1 month ago",
            type: "sale",
            status: "available"
        }
    ]

    const filteredListings = savedListings.filter(listing => {
        const matchesFilter = activeFilter === 'all' || listing.type === activeFilter
        const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            listing.location.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesFilter && matchesSearch
    })

    return (
        <Layout1>
            <div className="flex">
                <HomeSeekerNav active={2} />
                <div className="flex-1 p-4 lg:p-8">
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

                        {/* Results Count */}
                        <div className="mb-4">
                            <p className="text-gray-600">
                                Showing {filteredListings.length} of {savedListings.length} saved listings
                            </p>
                        </div>

                        {/* Listings Grid/List */}
                        {viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                                {filteredListings.map((listing) => (
                                    <div key={listing.id} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                                        <div className="relative">
                                            <img
                                                src={listing.image}
                                                alt={listing.title}
                                                className="w-full h-48 object-cover"
                                            />
                                            <div className="absolute top-3 right-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    listing.type === 'rent' 
                                                        ? 'bg-blue-100 text-blue-800' 
                                                        : 'bg-green-100 text-green-800'
                                                }`}>
                                                    {listing.type === 'rent' ? 'For Rent' : 'For Sale'}
                                                </span>
                                            </div>
                                            <button className="absolute top-3 left-3 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors">
                                                <FiHeart className="w-4 h-4 text-red-500" />
                                            </button>
                                        </div>
                                        <div className="p-4">
                                            <h3 className="font-semibold text-gray-800 mb-1">{listing.title}</h3>
                                            <p className="text-gray-600 text-sm mb-2">{listing.location}</p>
                                            <p className="text-lg font-bold text-primary_color mb-3">{listing.price}</p>
                                            <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                                                <span>{listing.bedrooms} beds</span>
                                                <span>{listing.bathrooms} baths</span>
                                                <span>{listing.area}</span>
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
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredListings.map((listing) => (
                                    <SavedListingCard
                                        key={listing.id}
                                        title={listing.title}
                                        price={listing.price}
                                        location={listing.location}
                                        image={listing.image}
                                        bedrooms={listing.bedrooms}
                                        bathrooms={listing.bathrooms}
                                        area={listing.area}
                                        savedDate={listing.savedDate}
                                    />
                                ))}
                            </div>
                        )}

                        {filteredListings.length === 0 && (
                            <div className="text-center py-12">
                                <div className="text-gray-400 mb-4">
                                    <FiHeart className="w-16 h-16 mx-auto" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-600 mb-2">No saved listings found</h3>
                                <p className="text-gray-500">Try adjusting your search or filters to find what you're looking for.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout1>
    )
}

export default HomeSeekerSavedListings 