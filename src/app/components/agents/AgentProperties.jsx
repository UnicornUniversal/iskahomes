'use client'

import React, { useState, useMemo } from 'react'
import { agentProperties } from '../Data/Data'
import  DataCard  from './DataCard'
import { FiPlus, FiFilter, FiHome, FiMapPin, FiDollarSign, FiEye, FiMessageSquare } from 'react-icons/fi'
import Link from 'next/link'

const AgentProperties = ({ agentSlug }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [purposeFilter, setPurposeFilter] = useState('all')
  const [sectorFilter, setSectorFilter] = useState('all')

  // Filter properties based on search and filters
  const filteredProperties = useMemo(() => {
    return agentProperties.filter(property => {
      const matchesSearch = property.propertyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           property.address.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           property.address.neighborhood.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || property.status === statusFilter
      const matchesPurpose = purposeFilter === 'all' || property.categorization.purpose === purposeFilter
      const matchesSector = sectorFilter === 'all' || property.categorization.sector === sectorFilter
      
      return matchesSearch && matchesStatus && matchesPurpose && matchesSector
    })
  }, [searchTerm, statusFilter, purposeFilter, sectorFilter])

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalProperties = agentProperties.length
    const availableProperties = agentProperties.filter(p => p.status === 'Available').length
    const rentedProperties = agentProperties.filter(p => p.status === 'Rented Out').length
    const totalViews = agentProperties.reduce((sum, p) => sum + p.views, 0)
    const totalInquiries = agentProperties.reduce((sum, p) => sum + p.inquiries, 0)
    const totalValue = agentProperties.reduce((sum, p) => sum + p.price, 0)

    return {
      totalProperties,
      availableProperties,
      rentedProperties,
      totalViews,
      totalInquiries,
      totalValue
    }
  }, [])

  const formatPrice = (price) => {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(1)}M`
    } else if (price >= 1000) {
      return `$${(price / 1000).toFixed(0)}K`
    }
    return `$${price}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
    <div>
          <h3 className=" font-bold ">My Properties</h3>
          <p className="">Manage and track your property listings</p>
        </div>
        <Link href={`/agents/${agentSlug}/properties/addNewProperty`} className="flex items-center gap-2 px-4 py-2 bg-primary_color text-white rounded-lg hover:bg-primary_color/90 transition-colors duration-200">
          <FiPlus className="w-4 h-4" />
          Add New Property
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:flex  gap-4">
        <DataCard
          title="Total Properties"
          value={summaryStats.totalProperties}
          icon={<FiHome className="w-6 h-6" />}
          color="blue"
        />
       
        <DataCard
          title="Rented Out"
          value={summaryStats.rentedProperties}
          icon={<FiHome className="w-6 h-6" />}
          color="orange"
        />
    
        <DataCard
          title="Total Inquiries"
          value={summaryStats.totalInquiries.toLocaleString()}
          icon={<FiMessageSquare className="w-6 h-6" />}
          color="indigo"
        />
        <DataCard
          title="Portfolio Value"
          value={formatPrice(summaryStats.totalValue)}
          icon={<FiDollarSign className="w-6 h-6" />}
          color="emerald"
        />
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex items-center gap-2">
            <FiFilter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search properties by name, city, or neighborhood..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary_color focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary_color focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="Available">Available</option>
            <option value="Rented Out">Rented Out</option>
          </select>

          {/* Purpose Filter */}
          <select
            value={purposeFilter}
            onChange={(e) => setPurposeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary_color focus:border-transparent"
          >
            <option value="all">All Purposes</option>
            <option value="Buy">Buy</option>
            <option value="Rent">Rent</option>
            <option value="Lease">Lease</option>
          </select>

          {/* Sector Filter */}
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary_color focus:border-transparent"
          >
            <option value="all">All Sectors</option>
            <option value="Apartment">Apartment</option>
            <option value="House">House</option>
            <option value="Offices">Offices</option>
            <option value="Land">Land</option>
          </select>
        </div>
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProperties.map((property) => (
          <a
            key={property.id}
            href={`/agents/${agentSlug}/properties/${property.slug}`}
            className="block group"
          >
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group-hover:scale-[1.02]">
              {/* Property Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={property.projectImages[0]}
                  alt={property.propertyName}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    property.status === 'Available' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {property.status}
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-primary_color text-white">
                    {property.categorization.purpose}
                  </span>
                </div>
              </div>

              {/* Property Details */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary_color transition-colors duration-200">
                  {property.propertyName}
                </h3>
                
                <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                  <FiMapPin className="w-4 h-4" />
                  <span>{property.address.neighborhood}, {property.address.city}</span>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <span className="text-xl font-bold text-primary_color">
                    {formatPrice(property.price)}
                  </span>
                  <span className="text-sm text-gray-500">
                    {property.categorization.sector} • {property.categorization.type}
                  </span>
                </div>

                {/* Property Features */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {property.details.bedrooms && (
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      {property.details.bedrooms} Bed
                    </span>
                  )}
                  {property.details.washrooms && (
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      {property.details.washrooms} Bath
                    </span>
                  )}
                  {property.details.kitchen && (
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      {property.details.kitchen} Kitchen
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-500 border-t border-gray-100 pt-3">
                  <div className="flex items-center gap-1">
                    <FiEye className="w-4 h-4" />
                    <span>{property.views} views</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FiMessageSquare className="w-4 h-4" />
                    <span>{property.inquiries} inquiries</span>
                  </div>
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* No Results */}
      {filteredProperties.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <FiHome className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
          <p className="text-gray-600">Try adjusting your search criteria or filters</p>
        </div>
      )}
    </div>
  )
}

export default AgentProperties
