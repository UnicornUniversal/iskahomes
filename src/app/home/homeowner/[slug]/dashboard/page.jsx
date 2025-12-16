'use client'

import React from 'react'
import Layout1 from '@/app/layout/Layout1'
import HomeOwnerHeader from '@/app/components/homeOwner/HomeOwnerHeader'
import HomeOwnerNav from '@/app/components/homeOwner/HomeOwnerNav'
import PropertyCard from '@/app/components/homeOwner/PropertyCard'
import BookingSchedule from '@/app/components/homeOwner/BookingSchedule'
import LeadSummary from '@/app/components/homeOwner/LeadSummary'
import { FiMapPin, FiCalendar, FiMessageSquare, FiBell, FiDollarSign } from 'react-icons/fi'

const HomeOwnerDashboard = () => {
  return (
    <Layout1>
      <div className="flex">
        <HomeOwnerNav active={1} />
        <div className="flex-1 p-8">
          <HomeOwnerHeader />
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Properties</p>
                  <h3 className="text-2xl font-bold text-gray-800">3</h3>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FiMapPin className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Active Bookings</p>
                  <h3 className="text-2xl font-bold text-gray-800">5</h3>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <FiCalendar className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">New Messages</p>
                  <h3 className="text-2xl font-bold text-gray-800">12</h3>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <FiMessageSquare className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Monthly Revenue</p>
                  <h3 className="text-2xl font-bold text-gray-800">$8,500</h3>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <FiDollarSign className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            {/* Properties Section */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6">My Properties</h2>
                <div className="space-y-4">
                  <PropertyCard 
                    title="Luxury Villa - East Legon"
                    status="Active"
                    price="$2,500/month"
                    image="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop"
                    inquiries={8}
                    bookings={3}
                  />
                  <PropertyCard 
                    title="Modern Apartment - Airport"
                    status="Rented"
                    price="$1,800/month"
                    image="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop"
                    inquiries={12}
                    bookings={1}
                  />
                  <PropertyCard 
                    title="Townhouse - Cantonments"
                    status="Active"
                    price="$3,200/month"
                    image="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=300&fit=crop"
                    inquiries={5}
                    bookings={2}
                  />
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Booking Schedule */}
              <BookingSchedule />
              
              {/* Lead Summary */}
              <LeadSummary />
            </div>
          </div>
        </div>
      </div>
    </Layout1>
  )
}

export default HomeOwnerDashboard 