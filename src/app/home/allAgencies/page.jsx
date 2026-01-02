'use client'
import React, { useState, useEffect } from 'react'
import Layout1 from '@/app/layout/Layout1'
import { FiSearch, FiFilter, FiMapPin, FiCheckCircle, FiX, FiBriefcase } from 'react-icons/fi'
import Link from 'next/link'

const AllAgencies = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('')
  const [agencies, setAgencies] = useState([])
  const [filteredAgencies, setFilteredAgencies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchAgencies()
  }, [])

  useEffect(() => {
    filterAgencies()
  }, [searchTerm, selectedCity, selectedCountry, agencies])

  const fetchAgencies = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (selectedCity) params.append('city', selectedCity)
      if (selectedCountry) params.append('country', selectedCountry)

      const response = await fetch(`/api/public/agencies?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch agencies')
      }

      const result = await response.json()
      
      if (result.success) {
        setAgencies(result.data || [])
        setFilteredAgencies(result.data || [])
      } else {
        setError(result.error || 'Failed to fetch agencies')
      }
    } catch (err) {
      console.error('Error fetching agencies:', err)
      setError(err.message || 'Error loading agencies')
    } finally {
      setLoading(false)
    }
  }

  const filterAgencies = () => {
    let filtered = [...agencies]

    if (searchTerm) {
      filtered = filtered.filter(agency =>
        agency.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agency.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agency.city?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedCity) {
      filtered = filtered.filter(agency =>
        agency.city?.toLowerCase().includes(selectedCity.toLowerCase())
      )
    }

    if (selectedCountry) {
      filtered = filtered.filter(agency =>
        agency.country?.toLowerCase().includes(selectedCountry.toLowerCase())
      )
    }

    setFilteredAgencies(filtered)
  }

  // Get unique cities and countries for filters
  const cities = [...new Set(agencies.map(agency => agency.city).filter(Boolean))]
  const countries = [...new Set(agencies.map(agency => agency.country).filter(Boolean))]

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCity('')
    setSelectedCountry('')
  }

  if (loading) {
    return (
      <Layout1>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading agencies...</p>
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
              onClick={fetchAgencies}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </Layout1>
    )
  }

  return (
    <Layout1>
      <div className="min-h-screen relative overflow-hidden">
        {/* Background Element - utilizing the global gradient class if available or a custom one */}
        <div className="fixed inset-0 pointer-events-none z-[-1] ocean-sunset_main_bg opacity-30"></div>
        <div className="fixed inset-0 pointer-events-none z-[-2] bg-white/80"></div>

        {/* Hero Section */}
        <div className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-primary_color mb-6 tracking-tight">
              Premier Real Estate Agencies
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto font-light leading-relaxed">
              Discover trusted partners for your property journey. From luxury estates to commercial investments, connect with Ghana's finest real estate professionals.
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
                    placeholder="Search agencies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-white/40 border border-white/60 rounded-2xl focus:ring-2 focus:ring-secondary_color/20 focus:border-secondary_color text-primary_color placeholder-primary_color/40 transition-all duration-300 shadow-sm hover:shadow-md"
                  />
                </div>
              </div>

              {/* City Filter */}
              <div className="w-full lg:w-56">
                <div className="relative">
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full pl-4 pr-10 py-4 bg-white/40 border border-white/60 rounded-2xl focus:ring-2 focus:ring-secondary_color/20 focus:border-secondary_color text-primary_color appearance-none cursor-pointer hover:bg-white/60 transition-all duration-300 shadow-sm"
                  >
                    <option value="">All Cities</option>
                    {cities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                  <FiMapPin className="absolute right-4 top-1/2 transform -translate-y-1/2 text-primary_color/50 pointer-events-none" />
                </div>
              </div>

              {/* Country Filter */}
              <div className="w-full lg:w-56">
                <div className="relative">
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="w-full pl-4 pr-10 py-4 bg-white/40 border border-white/60 rounded-2xl focus:ring-2 focus:ring-secondary_color/20 focus:border-secondary_color text-primary_color appearance-none cursor-pointer hover:bg-white/60 transition-all duration-300 shadow-sm"
                    style={{ backgroundImage: 'none' }} 
                  >
                    <option value="">All Countries</option>
                    {countries.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                  <FiMapPin className="absolute right-4 top-1/2 transform -translate-y-1/2 text-primary_color/50 pointer-events-none" />
                </div>
              </div>

              {/* Clear Filters */}
              {(searchTerm || selectedCity || selectedCountry) && (
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
              Showing <span className="text-secondary_color font-bold">{filteredAgencies.length}</span> trusted agencies
            </p>
          </div>

          {/* Agencies Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredAgencies.map(agency => (
              <Link
                key={agency.id}
                href={`/home/allAgencies/${agency.slug}`}
                className="group relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-primary_color/10 transition-all duration-500 transform hover:-translate-y-2 border border-gray-100"
              >
                {/* Agency Cover/Image Area */}
                <div className="relative h-56 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10 transition-opacity duration-300 group-hover:opacity-90" />
                  
                  {agency.cover_image ? (
                    <img
                      src={agency.cover_image}
                      alt={agency.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : agency.profile_image ? (
                    <img
                      src={agency.profile_image}
                      alt={agency.name}
                      className="w-full h-full object-cover blur-sm scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary_color to-[#1a4a5a]" />
                  )}

                  {/* Profile Image Overlay */}
                  <div className="absolute -bottom-8 left-6 z-20">
                     <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-white">
                        {agency.profile_image ? (
                          <img 
                            src={agency.profile_image} 
                            alt={agency.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-50 text-primary_color">
                            <span className="text-2xl font-bold">{agency.name?.charAt(0)}</span>
                          </div>
                        )}
                     </div>
                  </div>

                  {agency.verified && (
                    <div className="absolute top-4 right-4 z-20 bg-white/20 backdrop-blur-md border border-white/30 text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-sm">
                      <FiCheckCircle className="w-3.5 h-3.5 text-secondary_color" />
                      <span>Verified</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="pt-10 px-6 pb-6">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-primary_color group-hover:text-secondary_color transition-colors duration-300 line-clamp-1 mb-1">
                      {agency.name}
                    </h3>
                    <div className="flex items-center text-gray-500 text-sm">
                      <FiMapPin className="w-3.5 h-3.5 mr-1.5 text-secondary_color" />
                      <span className="line-clamp-1 font-medium">
                        {agency.city && agency.country ? `${agency.city}, ${agency.country}` : agency.city || 'Ghana'}
                      </span>
                    </div>
                  </div>

                  {/* Description Snippet */}
                  <p className="text-gray-500 text-sm mb-6 line-clamp-2 min-h-[2.5rem]">
                    {agency.description || `Explore properties managed by ${agency.name}. Providing excellent real estate services.`}
                  </p>

                  <div className="w-full h-px bg-gray-100 mb-4"></div>

                  {/* Footer Stats & Action */}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-4">
                        <div className="text-center">
                            <span className="block text-lg font-bold text-primary_color leading-tight">{agency.total_listings || 0}</span>
                            <span className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">Listings</span>
                        </div>
                        <div className="text-center">
                            <span className="block text-lg font-bold text-primary_color leading-tight">{agency.total_agents || 0}</span>
                            <span className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">Agents</span>
                        </div>
                    </div>
                    
                    <div className="w-10 h-10 rounded-full bg-primary_color/5 text-primary_color flex items-center justify-center group-hover:bg-primary_color group-hover:text-white transition-all duration-300">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* No Results State */}
          {filteredAgencies.length === 0 && (
            <div className="text-center py-20 bg-white/50 rounded-3xl border border-white shadow-sm backdrop-blur-sm">
              <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiSearch className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-primary_color mb-2">No agencies found</h3>
              <p className="text-gray-500">We couldn't find any agencies matching your criteria.</p>
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

export default AllAgencies
