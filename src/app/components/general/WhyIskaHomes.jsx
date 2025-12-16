'use client'

import React from 'react'
import { Home, Search, Shield, TrendingUp, Users, CheckCircle } from 'lucide-react'

const WhyIskaHomes = () => {
  const whyIskaFeatures = [
    {
      icon: Search,
      title: 'Comprehensive Search',
      description: 'Find exactly what you\'re looking for with our advanced filters and search tools'
    },
    {
      icon: Shield,
      title: 'Verified Listings',
      description: 'All properties are verified to ensure authenticity and quality'
    },
    {
      icon: TrendingUp,
      title: 'Market Insights',
      description: 'Get real-time market data and trends to make informed decisions'
    },
    {
      icon: Users,
      title: 'Expert Network',
      description: 'Connect with verified agents and developers you can trust'
    },
    {
      icon: CheckCircle,
      title: 'Easy Process',
      description: 'Streamlined experience from search to closing'
    },
    {
      icon: Home,
      title: 'Wide Selection',
      description: 'Thousands of properties across different categories and locations'
    }
  ]

  const userTypes = [
    {
      type: 'Property Seeker',
      title: 'Find Your Dream Home',
      description: 'Browse thousands of verified properties and find the perfect match for your needs.',
      benefits: [
        'Access to thousands of properties',
        'Advanced search filters',
        'Save favorite listings',
        'Book property viewings',
        'Get notifications for new matches',
        'Connect with verified agents'
      ],
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      color: 'from-blue-500 to-cyan-500'
    },
    {
      type: 'Real Estate Agent',
      title: 'Grow Your Business',
      description: 'Manage property listings, connect with clients, and track your performance all in one place.',
      benefits: [
        'List unlimited properties',
        'Manage client relationships',
        'Track listing performance',
        'Access to marketing tools',
        'Lead management system',
        'Appointment scheduling'
      ],
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: 'from-purple-500 to-pink-500'
    },
    {
      type: 'Real Estate Developer',
      title: 'Showcase Your Projects',
      description: 'Display your developments, manage units, and connect with potential buyers and investors.',
      benefits: [
        'Showcase multiple projects',
        'Detailed project analytics',
        'Lead management system',
        'Unit management tools',
        'Investor connections',
        'Performance tracking'
      ],
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      color: 'from-orange-500 to-red-500'
    }
  ]

  return (
    <div className="w-full py-16 px-4 md:px-8">
      {/* Why Iska Homes Section */}
      <div className="mb-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-primary_color mb-4">
            Why Iska Homes?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Your trusted partner in finding the perfect property. We make real estate simple, transparent, and accessible.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {whyIskaFeatures.map((feature, index) => {
            const IconComponent = feature.icon
            return (
              <div
                key={index}
                className="p-6 rounded-xl bg-white/50 backdrop-blur-sm border border-white/20 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-lg bg-primary_color/10 flex items-center justify-center mb-4">
                  <IconComponent className="w-6 h-6 text-primary_color" />
                </div>
                <h3 className="text-xl font-semibold text-primary_color mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Who is Iska for Section */}
      <div>
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-primary_color mb-4">
            Who is Iska for?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Whether you're looking for a home, managing properties, or building developments, Iska Homes has something for you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {userTypes.map((user, index) => {
            const IconComponent = user.icon
            return (
              <div
                key={index}
                className="group relative overflow-hidden rounded-2xl bg-white/50 backdrop-blur-sm border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
              >
                {/* Gradient Accent */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${user.color}`} />
                
                <div className="p-8">
                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${user.color} flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform duration-300`}>
                    {IconComponent}
                  </div>

                  {/* Content */}
                  <div className="mb-6">
                    <span className="text-sm font-medium text-primary_color/60 uppercase tracking-wide mb-2 block">
                      {user.type}
                    </span>
                    <h3 className="text-2xl font-bold text-primary_color mb-3">
                      {user.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {user.description}
                    </p>
                  </div>

                  {/* Benefits List */}
                  <div className="space-y-3">
                    {user.benefits.map((benefit, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-primary_color/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <CheckCircle className="w-3 h-3 text-primary_color" />
                        </div>
                        <span className="text-sm text-gray-700 leading-relaxed">
                          {benefit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default WhyIskaHomes
