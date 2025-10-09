'use client'

import React from 'react'
import Link from 'next/link'

const DeveloperCard = ({ developer }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="relative h-48 w-full">
        {developer.cover_image ? (
          <img
            src={developer.cover_image.url}
            alt={developer.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <div className="text-white text-4xl font-bold">
              {developer.name?.charAt(0) || 'D'}
            </div>
          </div>
        )}
        
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
          <span className="text-sm font-medium text-gray-700">
            {developer.total_developments || 0} Projects
          </span>
        </div>
        
        <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-lg">
          <span className="text-white text-sm font-medium">
            Professional
          </span>
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-bold text-gray-900">
            {developer.name || 'Developer'}
          </h3>
          <div className="text-right text-sm text-gray-500">
            <div>Professional Developer</div>
          </div>
        </div>
        
        <div className="mb-4">
          <p className="text-gray-600 text-sm line-clamp-3 mb-3">
            Professional developer with {developer.total_developments || 0} active projects and {developer.total_units || 0} total units.
          </p>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
            <span className="flex items-center">
              <span className="mr-1">🏗️</span>
              {developer.total_developments || 0} developments
            </span>
            <span className="flex items-center">
              <span className="mr-1">🏠</span>
              {developer.total_units || 0} units
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Professional Developer
          </div>
          
          <Link
            href={`/allDevelopers/${developer.slug}`}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
          >
            View Profile
          </Link>
        </div>
      </div>
    </div>
  )
}

export default DeveloperCard
