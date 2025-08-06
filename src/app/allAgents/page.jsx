'use client'
import React, { useState } from 'react'
import Layout1 from '@/app/layout/Layout1'
import { FiSearch, FiFilter, FiStar, FiMapPin, FiHome, FiCheckCircle, FiX } from 'react-icons/fi'

const AllAgents = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('')
  const [selectedSpecialization, setSelectedSpecialization] = useState('')
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false)
  const [sortBy, setSortBy] = useState('name')

  // Dummy data for agents
  const agents = [
    {
      id: 1,
      slug: 'kwame-asante',
      name: 'Kwame Asante',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face',
      location: 'Accra, Greater Accra',
      specializations: ['Residential', 'Commercial', 'Luxury'],
      listings: 24,
      rating: 4.8,
      reviews: 156,
      verified: true,
      experience: '8+ years',
      languages: ['English', 'Twi', 'Ga'],
      bio: 'Experienced real estate agent specializing in luxury properties and investment opportunities.'
    },
    {
      id: 2,
      slug: 'sarah-johnson',
      name: 'Sarah Johnson',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300&h=300&fit=crop&crop=face',
      location: 'Kumasi, Ashanti',
      specializations: ['Residential', 'Rental'],
      listings: 18,
      rating: 4.6,
      reviews: 89,
      verified: true,
      experience: '5+ years',
      languages: ['English', 'Twi'],
      bio: 'Dedicated agent helping families find their perfect homes in Kumasi and surrounding areas.'
    },
    {
      id: 3,
      slug: 'michael-osei',
      name: 'Michael Osei',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face',
      location: 'Tema, Greater Accra',
      specializations: ['Commercial', 'Industrial'],
      listings: 32,
      rating: 4.9,
      reviews: 203,
      verified: true,
      experience: '12+ years',
      languages: ['English', 'Twi', 'Ewe'],
      bio: 'Commercial real estate expert with extensive experience in industrial and office properties.'
    },
    {
      id: 4,
      slug: 'ama-kufuor',
      name: 'Ama Kufuor',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&crop=face',
      location: 'Cape Coast, Central',
      specializations: ['Residential', 'Vacation Homes'],
      listings: 15,
      rating: 4.4,
      reviews: 67,
      verified: false,
      experience: '3+ years',
      languages: ['English', 'Fante'],
      bio: 'Specializing in residential properties and vacation homes along the beautiful Cape Coast.'
    },
    {
      id: 5,
      slug: 'david-mensah',
      name: 'David Mensah',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=face',
      location: 'Accra, Greater Accra',
      specializations: ['Luxury', 'Investment'],
      listings: 28,
      rating: 4.7,
      reviews: 134,
      verified: true,
      experience: '10+ years',
      languages: ['English', 'Twi', 'Ga'],
      bio: 'Luxury property specialist helping high-net-worth clients find exceptional investment opportunities.'
    },
    {
      id: 6,
      slug: 'grace-addo',
      name: 'Grace Addo',
      image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop&crop=face',
      location: 'Tamale, Northern',
      specializations: ['Residential', 'Agricultural'],
      listings: 12,
      rating: 4.3,
      reviews: 45,
      verified: false,
      experience: '4+ years',
      languages: ['English', 'Dagbani'],
      bio: 'Northern region specialist with expertise in residential and agricultural properties.'
    },
    {
      id: 7,
      slug: 'emmanuel-boateng',
      name: 'Emmanuel Boateng',
      image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop&crop=face',
      location: 'Kumasi, Ashanti',
      specializations: ['Commercial', 'Residential'],
      listings: 21,
      rating: 4.5,
      reviews: 78,
      verified: true,
      experience: '6+ years',
      languages: ['English', 'Twi'],
      bio: 'Versatile agent handling both commercial and residential properties in the Ashanti region.'
    },
    {
      id: 8,
      slug: 'fatima-alhassan',
      name: 'Fatima Alhassan',
      image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=300&h=300&fit=crop&crop=face',
      location: 'Accra, Greater Accra',
      specializations: ['Residential', 'Rental'],
      listings: 19,
      rating: 4.6,
      reviews: 92,
      verified: true,
      experience: '7+ years',
      languages: ['English', 'Hausa', 'Twi'],
      bio: 'Multilingual agent specializing in residential properties and rental management.'
    }
  ]

  // Filter and sort agents
  const filteredAgents = agents
    .filter(agent => {
      const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           agent.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           agent.specializations.some(spec => spec.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesLocation = !selectedLocation || agent.location.includes(selectedLocation)
      const matchesSpecialization = !selectedSpecialization || agent.specializations.includes(selectedSpecialization)
      const matchesVerification = !showVerifiedOnly || agent.verified
      
      return matchesSearch && matchesLocation && matchesSpecialization && matchesVerification
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'rating':
          return b.rating - a.rating
        case 'listings':
          return b.listings - a.listings
        case 'experience':
          return parseInt(b.experience) - parseInt(a.experience)
        default:
          return 0
      }
    })

  // Get unique locations and specializations for filters
  const locations = [...new Set(agents.map(agent => agent.location.split(',')[0]))]
  const specializations = [...new Set(agents.flatMap(agent => agent.specializations))]

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedLocation('')
    setSelectedSpecialization('')
    setShowVerifiedOnly(false)
    setSortBy('name')
  }

  return (
    <Layout1>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Your Perfect Agent</h1>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Connect with experienced real estate agents across Ghana. Browse profiles, read reviews, and find the right agent for your property needs.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search agents by name, location, or specialization..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Location Filter */}
              <div className="lg:w-48">
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Locations</option>
                  {locations.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>

              {/* Specialization Filter */}
              <div className="lg:w-48">
                <select
                  value={selectedSpecialization}
                  onChange={(e) => setSelectedSpecialization(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Specializations</option>
                  {specializations.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div className="lg:w-48">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="name">Sort by Name</option>
                  <option value="rating">Sort by Rating</option>
                  <option value="listings">Sort by Listings</option>
                  <option value="experience">Sort by Experience</option>
                </select>
              </div>
            </div>

            {/* Additional Filters */}
            <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-200">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showVerifiedOnly}
                  onChange={(e) => setShowVerifiedOnly(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Verified agents only</span>
              </label>

              {(searchTerm || selectedLocation || selectedSpecialization || showVerifiedOnly) && (
                <button
                  onClick={clearFilters}
                  className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800"
                >
                  <FiX className="w-4 h-4" />
                  <span>Clear filters</span>
                </button>
              )}
            </div>
          </div>

          {/* Results Count */}
          <div className="flex justify-between items-center mb-6">
            <p className="text-gray-600">
              Showing {filteredAgents.length} of {agents.length} agents
            </p>
          </div>

          {/* Agents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAgents.map(agent => (
              <div key={agent.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
                {/* Agent Image and Badge */}
                <div className="relative">
                  <img
                    src={agent.image}
                    alt={agent.name}
                    className="w-full h-48 object-cover"
                  />
                  {agent.verified && (
                    <div className="absolute top-3 right-3 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                      <FiCheckCircle className="w-3 h-3" />
                      <span>Verified</span>
                    </div>
                  )}
                </div>

                {/* Agent Info */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg mb-1">{agent.name}</h3>
                      <div className="flex items-center text-gray-600 text-sm mb-2">
                        <FiMapPin className="w-4 h-4 mr-1" />
                        <span>{agent.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center mb-3">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <FiStar
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(agent.rating)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-gray-600">
                      {agent.rating} ({agent.reviews} reviews)
                    </span>
                  </div>

                  {/* Specializations */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {agent.specializations.map(spec => (
                        <span
                          key={spec}
                          className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <FiHome className="w-4 h-4 mr-1" />
                      <span>{agent.listings} listings</span>
                    </div>
                    <span>{agent.experience}</span>
                  </div>

                  {/* Bio */}
                  {/* <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {agent.bio}
                  </p> */}

                  {/* Languages */}
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-1">Languages:</p>
                    <div className="flex flex-wrap gap-1">
                      {agent.languages.map(lang => (
                        <span
                          key={lang}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* View Profile Button */}
                  <a
                    href={`/allAgents/${agent.slug}`}
                    className="block w-full bg-blue-600 text-white text-center py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors duration-200"
                  >
                    View Profile
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* No Results */}
          {filteredAgents.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <FiSearch className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No agents found</h3>
              <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
            </div>
          )}
        </div>
      </div>
    </Layout1>
  )
}

export default AllAgents
