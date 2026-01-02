'use client'
import React, { useState, useEffect } from 'react'
import Layout1 from '@/app/layout/Layout1'
import { FiSearch, FiFilter, FiMapPin, FiCheckCircle, FiX, FiBuilding2 } from 'react-icons/fi'
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
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Your Perfect Agency</h1>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Browse trusted real estate agencies across Ghana. Connect with professional teams and find the right agency for your property needs.
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
                    placeholder="Search agencies by name, description, or location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* City Filter */}
              <div className="lg:w-48">
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Cities</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              {/* Country Filter */}
              <div className="lg:w-48">
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Countries</option>
                  {countries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Additional Filters */}
            <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-200">
              {(searchTerm || selectedCity || selectedCountry) && (
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
              Showing {filteredAgencies.length} of {agencies.length} agencies
            </p>
          </div>

          {/* Agencies Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAgencies.map(agency => (
              <Link
                key={agency.id}
                href={`/home/allAgencies/${agency.slug}`}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                {/* Agency Image */}
                <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600">
                  {agency.cover_image ? (
                    <img
                      src={agency.cover_image}
                      alt={agency.name}
                      className="w-full h-full object-cover"
                    />
                  ) : agency.profile_image ? (
                    <img
                      src={agency.profile_image}
                      alt={agency.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FiBuilding2 className="w-16 h-16 text-white opacity-50" />
                    </div>
                  )}
                  {agency.verified && (
                    <div className="absolute top-3 right-3 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                      <FiCheckCircle className="w-3 h-3" />
                      <span>Verified</span>
                    </div>
                  )}
                </div>

                {/* Agency Info */}
                <div className="p-6">
                  <div className="mb-3">
                    <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-1">{agency.name}</h3>
                    <div className="flex items-center text-gray-600 text-sm mb-2">
                      <FiMapPin className="w-4 h-4 mr-1" />
                      <span className="line-clamp-1">
                        {agency.city && agency.country ? `${agency.city}, ${agency.country}` : agency.country || agency.city || 'Location not specified'}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  {agency.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {agency.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <FiBuilding2 className="w-4 h-4 mr-1" />
                      <span>{agency.total_agents || 0} agents</span>
                    </div>
                    <span>{agency.total_listings || 0} listings</span>
                  </div>

                  {/* View Profile Button */}
                  <div className="w-full bg-blue-600 text-white text-center py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors duration-200">
                    View Profile
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* No Results */}
          {filteredAgencies.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <FiSearch className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No agencies found</h3>
              <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
            </div>
          )}
        </div>
      </div>
    </Layout1>
  )
}

export default AllAgencies
