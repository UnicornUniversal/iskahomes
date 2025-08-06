"use client"
import React, { useState, useMemo } from 'react'
import ListingCard from './Listing/ListingCard'
import properties from './Data/Data'
import Filter from './Filters/Filter'

const HomeProperties = () => {
  const [filters, setFilters] = useState({
    purpose: '',
    sector: '',
    category: '',
    location: ''
  });

  // Filter properties based on selected filters
  const filteredProperties = useMemo(() => {
    return properties.filter(property => {
      // Purpose filter
      if (filters.purpose && property.categorization.purpose !== filters.purpose) {
        return false;
      }

      // Sector filter
      if (filters.sector && property.categorization.sector !== filters.sector) {
        return false;
      }

      // Category filter
      if (filters.category && property.categorization.category !== filters.category) {
        return false;
      }

      // Location filter
      if (filters.location && property.address.city !== filters.location) {
        return false;
      }

      return true;
    });
  }, [filters]);

  return (
    <div className='w-full h-full'>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between w-full">
          <h2 className=" font-bold md:text-[3em] w-full text-left text-primary_color">Discover our main properties</h2>
        </div>
      </div>

      {/* Sticky Filter */}
      <div className="mb-6 sticky top-20 z-10 flex flex-col items-start">
        <div className="rounded-md  p-4 inline-block">
          <Filter filters={filters} setFilters={setFilters} totalProperties={properties.length} />
        </div>
      </div>

      {/* Properties Grid */}
      <div className="w-full">
        {filteredProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProperties.map((property, index) => (
              <ListingCard key={property.slug || index} property={property} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
              <p className="text-gray-600">Try adjusting your filters to see more results.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default HomeProperties
