'use client'
import React, { useState, useEffect } from 'react'
import Layout1 from '@/app/layout/Layout1'
import { FiSearch, FiFilter, FiMapPin, FiCheckCircle, FiX, FiBriefcase, FiPhone, FiMail } from 'react-icons/fi'
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
        agent.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.agency?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedLocation) {
      filtered = filtered.filter(agent =>
        agent.location_id?.toLowerCase().includes(selectedLocation.toLowerCase()) ||
        agent.agency?.city?.toLowerCase().includes(selectedLocation.toLowerCase())
      )
    }

    setFilteredAgents(filtered)
  }

  // Get unique locations for filters (combining agent and agency locations)
  const locations = [...new Set([
    ...agents.map(agent => agent.location_id),
    ...agents.map(agent => agent.agency?.city)
  ].filter(Boolean))]

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedLocation('')
  }

  // Helper to parse profile image JSON if needed, or return string directly
  const getProfileImage = (image) => {
    if (!image) return null;
    try {
        const parsed = JSON.parse(image);
        return parsed.url || parsed.path;
    } catch (e) {
        return image;
    }
  }

  return (
    <Layout1>
      <div className="min-h-screen relative overflow-hidden font-sans">
         {/* Abstract Background Shapes */}
         <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
            <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary_color/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-secondary_color/5 rounded-full blur-3xl"></div>
         </div>

        <div className="relative z-10 pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-8xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-16 space-y-4">
            <h1 className="text-4xl md:text-6xl font-extrabold text-primary_color tracking-tight">
              Meet Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary_color to-secondary_color">Agents</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto font-light">
              Connect with top-tier real estate professionals dedicated to finding your perfect property.
            </p>
          </div>

          {/* Search & Filter Bar */}
          <div className="max-w-5xl mx-auto mb-16">
            <div className="bg-white p-4 rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-100 flex flex-col md:flex-row gap-4 items-center backdrop-blur-sm">
                
                {/* Search Input */}
                <div className="flex-1 relative w-full group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                        <FiSearch className="h-5 w-5 text-gray-400 group-focus-within:text-primary_color transition-colors" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-12 pr-4 py-4 bg-gray-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-primary_color/20 focus:border-primary_color text-primary_color placeholder-gray-400 transition-all duration-300"
                        placeholder="Search by agent, agency, or expertise..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Location Select */}
                {locations.length > 0 && (
                    <div className="relative w-full md:w-64 group">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                            <FiMapPin className="h-5 w-5 text-gray-400 group-focus-within:text-secondary_color transition-colors" />
                        </div>
                        <select
                            value={selectedLocation}
                            onChange={(e) => setSelectedLocation(e.target.value)}
                            className="block w-full pl-12 pr-10 py-4 bg-gray-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-secondary_color/20 focus:border-secondary_color text-primary_color appearance-none cursor-pointer hover:bg-gray-100 transition-all duration-300"
                        >
                            <option value="">All Locations</option>
                            {locations.map(loc => (
                                <option key={loc} value={loc}>{loc}</option>
                            ))}
                        </select>
                         <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                )}
                
                {/* Clear Button */}
                {(searchTerm || selectedLocation) && (
                     <button
                        onClick={clearFilters}
                        className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-colors"
                        title="Clear Filters"
                    >
                        <FiX className="h-5 w-5" />
                    </button>
                )}
            </div>
          </div>

          {/* Content Area */}
          {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="bg-white rounded-3xl p-6 h-96 animate-pulse border border-gray-100">
                        <div className="h-24 w-24 bg-gray-200 rounded-full mx-auto mb-6"></div>
                        <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-8"></div>
                        <div className="h-20 bg-gray-100 rounded-xl"></div>
                    </div>
                ))}
             </div>
          ) : error ? (
            <div className="text-center py-20">
                <p className="text-red-500 mb-4">{error}</p>
                <button
                onClick={fetchAgents}
                className="px-6 py-2 bg-primary_color text-white rounded-full hover:bg-primary_color/90 transition-colors"
                >
                Try Again
                </button>
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="text-center py-20">
               <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                 <FiSearch className="h-8 w-8 text-gray-400" />
               </div>
               <h3 className="text-xl font-bold text-primary_color">No agents found</h3>
               <p className="text-gray-500 mt-2">Try adjusting your filters to find who you're looking for.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredAgents.map(agent => (
                <Link
                  key={agent.id}
                  href={`/home/allAgents/${agent.slug}`}
                  className="group relative bg-white rounded-[2rem] p-6 shadow-sm hover:shadow-2xl hover:shadow-primary_color/5 transition-all duration-500 border border-gray-100 flex flex-col h-full overflow-hidden"
                >
                   {/* Top Agency Branding (if exits) */}
                   {agent.agency && (
                       <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary_color to-secondary_color opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                   )}

                  <div className="flex flex-col items-center text-center flex-1 z-10">
                    {/* Image Container */}
                    <div className="relative mb-6">
                        <div className="w-32 h-32 rounded-full p-[3px] bg-gradient-to-br from-gray-100 to-white shadow-inner group-hover:from-primary_color group-hover:to-secondary_color transition-all duration-500">
                             <div className="w-full h-full rounded-full overflow-hidden bg-gray-50 border-4 border-white relative">
                                {agent.profile_image ? (
                                    <img
                                        src={getProfileImage(agent.profile_image)}
                                        alt={agent.name}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-3xl font-bold">
                                        {agent.name?.charAt(0)}
                                    </div>
                                )}
                             </div>
                        </div>
                        {/* Verified Badge */}
                        <div className="absolute bottom-2 right-1 bg-white rounded-full p-1.5 shadow-md text-secondary_color">
                            <FiCheckCircle className="w-4 h-4" />
                        </div>
                    </div>

                    {/* Name & Role */}
                    <h3 className="text-xl font-bold text-primary_color mb-2 group-hover:text-secondary_color transition-colors duration-300">
                        {agent.name}
                    </h3>
                    
                    {/* Agency Info */}
                    {agent.agency ? (
                         <div className="flex items-center gap-2 mb-4 bg-gray-50 py-1.5 px-4 rounded-full max-w-full">
                            {agent.agency.profile_image ? (
                                <img src={getProfileImage(agent.agency.profile_image) || '/placeholder-company.png'} className="w-5 h-5 rounded-full object-cover" alt="" />
                            ) : (
                                <FiBriefcase className="w-4 h-4 text-gray-400 shrink-0" />
                            )}
                            <span className="text-xs font-semibold text-gray-600 truncate">{agent.agency.name}</span>
                         </div>
                    ) : (
                        <div className="h-8 mb-4"></div> // Spacer
                    )}

                    {/* Stats Grid */}
                    <div className="w-full grid grid-cols-2 gap-3 mb-6">
                        <div className="bg-gray-50 rounded-xl p-3 text-center group-hover:bg-primary_color/5 transition-colors duration-300">
                            <div className="text-lg font-bold text-primary_color">{agent.total_listings || 0}</div>
                            <div className="text-xs text-gray-500">Properties</div>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3 text-center group-hover:bg-primary_color/5 transition-colors duration-300">
                            <div className="text-lg font-bold text-primary_color">4.9</div>
                            <div className="text-xs text-gray-500">Rating</div>
                        </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center w-full">
                      <div className="flex gap-3">
                         <span className="p-2 rounded-full bg-gray-50 text-gray-400 hover:bg-primary_color hover:text-white transition-all duration-300 cursor-default">
                             <FiPhone className="w-4 h-4" />
                         </span>
                         <span className="p-2 rounded-full bg-gray-50 text-gray-400 hover:bg-secondary_color hover:text-white transition-all duration-300 cursor-default">
                             <FiMail className="w-4 h-4" />
                         </span>
                      </div>
                      <span className="text-sm font-medium text-primary_color group-hover:translate-x-1 transition-transform duration-300 flex items-center gap-1">
                          View 
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                      </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout1>
  )
}

export default AllAgents
