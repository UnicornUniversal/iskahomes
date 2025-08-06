'use client'

import React from 'react'
import Layout1 from '@/app/layout/Layout1'
import HomeSeekerHeader from '@/app/components/homeseeker/HomeSeekerHeader'
import HomeSeekerNav from '@/app/components/homeseeker/HomeSeekerNav'
import SavedListingCard from '@/app/components/homeseeker/SavedListingCard'
import BookingCard from '@/app/components/homeseeker/BookingCard'
import { FiHeart, FiCalendar, FiMessageSquare, FiCheckCircle, FiMapPin } from 'react-icons/fi'

const HomeSeekerDashboard = () => {
  return (
    <Layout1>
      <div className="flex">
        <HomeSeekerNav active={1} />
        <div className="flex-1 p-4 lg:p-8">
          <HomeSeekerHeader />
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mt-6 lg:mt-8">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl shadow-lg border border-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Saved Listings</p>
                  <h3 className="text-3xl font-bold text-blue-900">12</h3>
                  <p className="text-blue-700 text-xs mt-1">+2 this week</p>
                </div>
                <div className="p-4 bg-blue-100 rounded-xl">
                  <FiHeart className="w-7 h-7 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl shadow-lg border border-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Scheduled Visits</p>
                  <h3 className="text-3xl font-bold text-green-900">3</h3>
                  <p className="text-green-700 text-xs mt-1">Next: Tomorrow</p>
                </div>
                <div className="p-4 bg-green-100 rounded-xl">
                  <FiCalendar className="w-7 h-7 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-6 rounded-2xl shadow-lg border border-purple-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">New Messages</p>
                  <h3 className="text-3xl font-bold text-purple-900">8</h3>
                  <p className="text-purple-700 text-xs mt-1">3 unread</p>
                </div>
                <div className="p-4 bg-purple-100 rounded-xl">
                  <FiMessageSquare className="w-7 h-7 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mt-6 lg:mt-8">
            {/* Saved Listings Section */}
            <div className="lg:col-span-2">
              <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-lg border border-blue-100 p-4 lg:p-6">
                <h2 className="text-xl font-bold text-blue-900 mb-6 flex items-center">
                  <FiHeart className="w-5 h-5 mr-2 text-blue-600" />
                  Recently Saved Listings
                </h2>
                <div className="space-y-4">
                  <SavedListingCard 
                    title="Luxury Villa - East Legon"
                    price="$2,500/month"
                    location="East Legon, Accra"
                    image="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop"
                    bedrooms={4}
                    bathrooms={3}
                    area="450 sq ft"
                    savedDate="2 days ago"
                  />
                  <SavedListingCard 
                    title="Modern Apartment - Airport"
                    price="$1,800/month"
                    location="Airport Residential, Accra"
                    image="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop"
                    bedrooms={3}
                    bathrooms={2}
                    area="350 sq ft"
                    savedDate="1 week ago"
                  />
                  <SavedListingCard 
                    title="Townhouse - Cantonments"
                    price="$3,200/month"
                    location="Cantonments, Accra"
                    image="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=300&fit=crop"
                    bedrooms={5}
                    bathrooms={4}
                    area="600 sq ft"
                    savedDate="2 weeks ago"
                  />
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Upcoming Bookings */}
              <BookingCard />
            </div>
          </div>
        </div>
      </div>
    </Layout1>
  )
}

export default HomeSeekerDashboard 