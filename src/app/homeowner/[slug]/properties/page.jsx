'use client'

import React, { useState } from 'react'
import Layout1 from '@/app/layout/Layout1'
import HomeOwnerHeader from '@/app/components/homeOwner/HomeOwnerHeader'
import HomeOwnerNav from '@/app/components/homeOwner/HomeOwnerNav'
import PropertyCard from '@/app/components/homeOwner/PropertyCard'
import { FiFilter, FiSearch, FiPlus } from 'react-icons/fi'

const HomeOwnerProperties = () => {
  const [filter, setFilter] = useState('all')
  
  const properties = [
    {
      id: 1,
      title: "Luxury Villa - East Legon",
      status: "Active",
      price: "$2,500/month",
      image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop",
      inquiries: 8,
      bookings: 3,
      location: "East Legon, Accra",
      agent: "John Agent"
    },
    {
      id: 2,
      title: "Modern Apartment - Airport",
      status: "Rented",
      price: "$1,800/month",
      image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop",
      inquiries: 12,
      bookings: 1,
      location: "Airport Residential, Accra",
      agent: "Sarah Agent"
    },
    {
      id: 3,
      title: "Townhouse - Cantonments",
      status: "Active",
      price: "$3,200/month",
      image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=300&fit=crop",
      inquiries: 5,
      bookings: 2,
      location: "Cantonments, Accra",
      agent: "Mike Agent"
    },
    {
      id: 4,
      title: "Studio Apartment - Osu",
      status: "Sold",
      price: "$1,200/month",
      image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop",
      inquiries: 3,
      bookings: 0,
      location: "Osu, Accra",
      agent: "Lisa Agent"
    }
  ]

  const filteredProperties = filter === 'all' 
    ? properties 
    : properties.filter(property => property.status.toLowerCase() === filter.toLowerCase())

  return (
    <Layout1>
      <div className="flex">
        <HomeOwnerNav active={2} />
        <div className="flex-1 p-8">
          <HomeOwnerHeader />
          
          <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">My Properties</h2>
              {/* <button className="flex items-center px-4 py-2 bg-primary_color text-white rounded-lg hover:bg-primary_color/90 transition-colors">
                <FiPlus className="w-4 h-4 mr-2" />
                Add New Property
              </button> */}
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="flex items-center space-x-2">
                <FiFilter className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Filter:</span>
              </div>
              <button 
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all' 
                    ? 'bg-primary_color text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button 
                onClick={() => setFilter('active')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'active' 
                    ? 'bg-primary_color text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Active
              </button>
              <button 
                onClick={() => setFilter('rented')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'rented' 
                    ? 'bg-primary_color text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Rented
              </button>
              <button 
                onClick={() => setFilter('sold')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'sold' 
                    ? 'bg-primary_color text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Sold
              </button>
            </div>

            {/* Properties Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((property) => (
                <PropertyCard 
                  key={property.id}
                  title={property.title}
                  status={property.status}
                  price={property.price}
                  image={property.image}
                  inquiries={property.inquiries}
                  bookings={property.bookings}
                />
              ))}
            </div>

            {filteredProperties.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiSearch className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">No properties found</h3>
                <p className="text-gray-500">Try adjusting your filters or add a new property.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout1>
  )
}

export default HomeOwnerProperties 