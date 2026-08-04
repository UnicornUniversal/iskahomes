'use client'
import React, { useState, useEffect } from 'react'
import Layout1 from '@/app/layout/Layout1'
import GeneralHeader from '@/app/components/general/GeneralHeader'
import { FiSearch, FiMapPin, FiCheckCircle, FiX, FiChevronDown } from 'react-icons/fi'
import Link from 'next/link'
import { withWebsiteLeadAttribution } from '@/lib/leadAttributionUrl'

// Agency images are stored as JSON objects ({ url, ... }) in a text column,
// so resolve the actual URL whether the value is an object, a JSON string, or a plain URL.
const resolveImageUrl = (value) => {
  if (!value) return null
  if (typeof value === 'object') return value.url || null
  if (typeof value === 'string') {
    if (value.startsWith('http')) return value
    try {
      const parsed = JSON.parse(value)
      return parsed?.url || null
    } catch {
      return null
    }
  }
  return null
}

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

  const headerImages = [
    {
      src: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=80',
      alt: 'Modern agency office building'
    },
    {
      src: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=900&q=80',
      alt: 'Contemporary architecture detail'
    },
    {
      src: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80',
      alt: 'Luxury residential area'
    }
  ]

  if (loading) {
    return (
      <Layout1>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            {/* Pre-launch: loading text hidden; spinner only */}
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

        <GeneralHeader
          headingOne="Discover"
          headingTwo="Agencies"
          description="Discover trusted partners for your property journey. From luxury estates to commercial investments, connect with Ghana's finest real estate professionals."
          stats={[]}
          images={headerImages}
          className="pb-10"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          {/* Filters Section */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3 sm:p-4 mb-12">
            <div className="flex flex-col lg:flex-row gap-3">
              {/* Search */}
              <div className="flex-1 relative">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-primary_color/60 w-5 h-5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search agencies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-primary_color placeholder-primary_color/40 focus:outline-none focus:bg-white focus:border-primary_color focus:ring-1 focus:ring-primary_color/20 transition-colors"
                />
              </div>

              {/* City Filter */}
              <div className="relative w-full lg:w-52">
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-lg text-primary_color appearance-none cursor-pointer focus:outline-none focus:bg-white focus:border-primary_color focus:ring-1 focus:ring-primary_color/20 transition-colors"
                  style={{ backgroundImage: 'none' }}
                >
                  <option value="">All Cities</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-primary_color/50 pointer-events-none w-4 h-4" />
              </div>

              {/* Country Filter */}
              <div className="relative w-full lg:w-52">
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-lg text-primary_color appearance-none cursor-pointer focus:outline-none focus:bg-white focus:border-primary_color focus:ring-1 focus:ring-primary_color/20 transition-colors"
                  style={{ backgroundImage: 'none' }}
                >
                  <option value="">All Countries</option>
                  {countries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
                <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-primary_color/50 pointer-events-none w-4 h-4" />
              </div>

              {/* Clear Filters */}
              {(searchTerm || selectedCity || selectedCountry) && (
                <button
                  onClick={clearFilters}
                  className="flex items-center justify-center gap-2 px-4 py-3 text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                  title="Clear Filters"
                >
                  <FiX className="w-5 h-5" />
                  <span className="lg:hidden">Clear filters</span>
                </button>
              )}
            </div>
          </div>

          {/* Results Count — pre-launch: counter hidden so empty inventory isn't exposed */}
          {false && (
            <div className="flex justify-between items-center mb-8 px-2">
              <p className="text-primary_color/70 font-medium">
                Showing <span className="text-secondary_color font-bold">{filteredAgencies.length}</span> trusted agencies
              </p>
            </div>
          )}

          {/* Agencies Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredAgencies.map(agency => {
              const coverImageUrl = resolveImageUrl(agency.cover_image)
              const profileImageUrl = resolveImageUrl(agency.profile_image)
              return (
              <Link
                key={agency.id}
                href={withWebsiteLeadAttribution(`/home/allAgencies/${agency.slug}`, 'directory')}
                className="group relative block rounded-[26px] overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-primary_color/20 transition-all duration-500 transform hover:-translate-y-1.5 ring-1 ring-black/5"
              >
                {/* Full-bleed cover */}
                <div className="relative h-[360px]">
                  {coverImageUrl ? (
                    <img
                      src={coverImageUrl}
                      alt={agency.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-105"
                    />
                  ) : profileImageUrl ? (
                    <img
                      src={profileImageUrl}
                      alt={agency.name}
                      className="absolute inset-0 w-full h-full object-cover blur-md scale-110"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary_color to-[#0f3a48]" />
                  )}

                  {/* Legibility gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/5" />

                  {/* Verified chip */}
                  {agency.verified && (
                    <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 px-3 py-1.5 text-xs font-semibold text-white shadow-sm">
                      <FiCheckCircle className="w-3.5 h-3.5 text-secondary_color" />
                      Verified
                    </div>
                  )}

                  {/* Frosted glass info panel */}
                  <div className="absolute inset-x-3 bottom-3 z-20 rounded-[20px] bg-white/10 backdrop-blur-xl border border-white/20 p-4 shadow-lg transition-colors duration-300 group-hover:bg-white/[0.14]">
                    <div className="flex items-center gap-3">
                      {/* Brand logo tile */}
                      <div className="relative w-14 h-14 rounded-2xl overflow-hidden ring-1 ring-white/40 bg-white flex-shrink-0">
                        <div className="w-full h-full flex items-center justify-center text-primary_color">
                          <span className="text-xl font-bold">{agency.name?.charAt(0)}</span>
                        </div>
                        {profileImageUrl && (
                          <img
                            src={profileImageUrl}
                            alt={agency.name}
                            className="absolute inset-0 w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.style.display = 'none' }}
                          />
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-white font-semibold text-lg leading-tight line-clamp-1">
                          {agency.name}
                        </h3>
                        <div className="flex items-center text-white/75 text-xs mt-1">
                          <FiMapPin className="w-3.5 h-3.5 mr-1 text-secondary_color flex-shrink-0" />
                          <span className="line-clamp-1">
                            {agency.city && agency.country ? `${agency.city}, ${agency.country}` : agency.city || 'Ghana'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Hairline */}
                    <div className="w-full h-px bg-white/15 my-3" />

                    {/* Footer stats & action */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-5 text-white">
                        {agency.total_listings > 0 && (
                          <div className="flex items-baseline gap-1">
                            <span className="text-base font-semibold leading-none">{agency.total_listings}</span>
                            <span className="text-[10px] uppercase tracking-wide text-white/60 font-semibold">Listings</span>
                          </div>
                        )}
                        {agency.total_agents > 0 && (
                          <div className="flex items-baseline gap-1">
                            <span className="text-base font-semibold leading-none">{agency.total_agents}</span>
                            <span className="text-[10px] uppercase tracking-wide text-white/60 font-semibold">Agents</span>
                          </div>
                        )}
                        {!(agency.total_listings > 0) && !(agency.total_agents > 0) && (
                          <span className="text-xs font-medium tracking-wide text-white/70">View agency</span>
                        )}
                      </div>

                      <div className="w-9 h-9 rounded-full bg-white/15 border border-white/25 text-white flex items-center justify-center group-hover:bg-secondary_color group-hover:border-secondary_color transition-all duration-300">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
              )
            })}
          </div>

          {/* No Results State — hidden during pre-launch so empty inventory isn't exposed */}
          {false && filteredAgencies.length === 0 && (
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
