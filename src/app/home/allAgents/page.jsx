'use client'
import React, { useState, useEffect } from 'react'
import Layout1 from '@/app/layout/Layout1'
import { FiSearch, FiFilter, FiStar, FiMapPin, FiHome, FiCheckCircle, FiX, FiBriefcase } from 'react-icons/fi'
import Link from 'next/link'

const AllAgents = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('')
  const [agents, setAgents] = useState([])
  const [filteredAgents, setFilteredAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchAgents()
  }, [])

  useEffect(() => {
    filterAgents()
  }, [searchTerm, selectedLocation, agents])

  const fetchAgents = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)

      const response = await fetch(`/api/public/agents?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch agents')
      }

      const result = await response.json()
      
      if (result.success) {
        setAgents(result.data || [])
        setFilteredAgents(result.data || [])
      } else {
        setError(result.error || 'Failed to fetch agents')
      }
    } catch (err) {
      console.error('Error fetching agents:', err)
      setError(err.message || 'Error loading agents')
    } finally {
      setLoading(false)
    }
  }

  const filterAgents = () => {
    let filtered = [...agents]

    if (searchTerm) {
      filtered = filtered.filter(agent =>
        agent.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedLocation) {
      filtered = filtered.filter(agent =>
        agent.location_id?.toLowerCase().includes(selectedLocation.toLowerCase())
      )
    }

    setFilteredAgents(filtered)
  }

  // Get unique locations for filters
  const locations = [...new Set(agents.map(agent => agent.location_id).filter(Boolean))]

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedLocation('')
  }

  if (loading) {
    return (
      <Layout1>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading agents...</p>
          </div>
        </div>
      </Layout1>
    )
  }

  if (error) {
    return (
      <Layout1>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchAgents}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </Layout1>
    )
  }

  // Dummy data for agents (fallback if no data)
  const dummyAgents = [
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

  return (
    <Layout1>
      <div className="min-h-screen relative overflow-hidden">
         {/* Background Element */}
        <div className="fixed inset-0 pointer-events-none z-[-1] ocean-sunset_main_bg opacity-30"></div>
        <div className="fixed inset-0 pointer-events-none z-[-2] bg-white/80"></div>

        {/* Hero Section */}
        <div className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-primary_color mb-6 tracking-tight">
              Elite Real Estate Agents
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto font-light leading-relaxed">
              Connect with top-tier real estate professionals. Experienced, verified, and ready to help you navigate the Ghanaian property market.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          {/* Filters Section - Glassmorphic Design */}
          <div className="design1 backdrop-blur-md p-6 mb-12 rounded-3xl border border-white/50 shadow-xl">
            <div className="flex flex-col lg:flex-row gap-6 items-center">
              {/* Search */}
              <div className="flex-1 w-full">
                <div className="relative group">
                  <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-primary_color/50 group-focus-within:text-secondary_color transition-colors duration-300 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search agents by name or specialization..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-white/40 border border-white/60 rounded-2xl focus:ring-2 focus:ring-secondary_color/20 focus:border-secondary_color text-primary_color placeholder-primary_color/40 transition-all duration-300 shadow-sm hover:shadow-md"
                  />
                </div>
              </div>

              {/* Location Filter */}
               {locations.length > 0 && (
                <div className="w-full lg:w-64">
                    <div className="relative">
                    <select
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                        className="w-full pl-4 pr-10 py-4 bg-white/40 border border-white/60 rounded-2xl focus:ring-2 focus:ring-secondary_color/20 focus:border-secondary_color text-primary_color appearance-none cursor-pointer hover:bg-white/60 transition-all duration-300 shadow-sm"
                        style={{ backgroundImage: 'none' }}
                    >
                        <option value="">All Locations</option>
                        {locations.map(location => (
                        <option key={location} value={location}>{location}</option>
                        ))}
                    </select>
                    <FiMapPin className="absolute right-4 top-1/2 transform -translate-y-1/2 text-primary_color/50 pointer-events-none" />
                    </div>
                </div>
               )}

              {/* Clear Filters */}
              {(searchTerm || selectedLocation) && (
                <button
                  onClick={clearFilters}
                  className="p-4 text-red-500 hover:bg-red-50 rounded-2xl transition-colors duration-300 group"
                  title="Clear Filters"
                >
                  <FiX className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                </button>
              )}
            </div>
          </div>

          {/* Results Count */}
          <div className="flex justify-between items-center mb-8 px-2">
            <p className="text-primary_color/70 font-medium">
              Showing <span className="text-secondary_color font-bold">{filteredAgents.length}</span> professionals
            </p>
          </div>

          {/* Agents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredAgents.map(agent => (
              <Link
                key={agent.id}
                href={`/home/allAgents/${agent.slug}`}
                className="group relative bg-white rounded-3xl p-6 shadow-lg hover:shadow-2xl hover:shadow-primary_color/10 transition-all duration-500 border border-gray-100 flex flex-col items-center text-center transform hover:-translate-y-2"
              >
                {/* Agent Image */}
                <div className="relative mb-6">
                    <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-primary_color to-secondary_color shadow-lg group-hover:shadow-secondary_color/30 transition-shadow duration-300">
                         <div className="w-full h-full rounded-full overflow-hidden border-4 border-white bg-white">
                            {agent.profile_image ? (
                                <img
                                src={agent.profile_image}
                                alt={agent.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-50 text-primary_color">
                                    <span className="text-4xl font-bold">{agent.name?.charAt(0)}</span>
                                </div>
                            )}
                         </div>
                    </div>
                     {/* Badge Overlay */}
                     <div className="absolute bottom-1 right-1 bg-white rounded-full p-1.5 shadow-md border border-gray-100">
                         <FiCheckCircle className="w-5 h-5 text-secondary_color" />
                     </div>
                </div>

                {/* Agent Info */}
                <div className="w-full mb-6">
                  <h3 className="text-xl font-bold text-primary_color group-hover:text-secondary_color transition-colors duration-300 mb-1">
                    {agent.name}
                  </h3>
                  
                   {agent.agency && (
                    <div className="flex items-center justify-center text-gray-500 text-sm mb-3">
                         <FiBriefcase className="w-3.5 h-3.5 mr-1.5" />
                        <span className="line-clamp-1 font-medium">{agent.agency.name}</span>
                    </div>
                  )}

                  {agent.bio && (
                    <p className="text-gray-500 text-sm line-clamp-2 min-h-[2.5rem] px-2">
                       {agent.bio}
                    </p>
                  )}
                </div>

                {/* Footer / Stats */}
                <div className="w-full mt-auto pt-4 border-t border-gray-100 flex justify-between items-center text-sm font-medium">
                     <div className="flex items-center text-primary_color/80 bg-primary_color/5 px-3 py-1.5 rounded-lg">
                        <FiHome className="w-4 h-4 mr-1.5" />
                        <span>{agent.total_listings || 0} Properties</span>
                    </div>
                    <span className="text-primary_color group-hover:translate-x-1 transition-transform duration-300">
                        →
                    </span>
                </div>
              </Link>
            ))}
          </div>

          {/* No Results State */}
          {filteredAgents.length === 0 && !loading && (
             <div className="text-center py-20 bg-white/50 rounded-3xl border border-white shadow-sm backdrop-blur-sm">
              <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiSearch className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-primary_color mb-2">No agents found</h3>
              <p className="text-gray-500">We couldn't find any agents matching your criteria.</p>
              <button 
                onClick={clearFilters}
                className="mt-6 px-8 py-3 bg-primary_color text-white rounded-full font-medium shadow-lg shadow-primary_color/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout1>
  )
}

export default AllAgents
