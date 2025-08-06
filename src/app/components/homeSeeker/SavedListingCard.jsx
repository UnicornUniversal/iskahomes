import React from 'react'
import { FiMapPin, FiHeart, FiHome, FiDroplet, FiSquare, FiClock } from 'react-icons/fi'

const SavedListingCard = ({ title, price, location, image, bedrooms, bathrooms, area, savedDate }) => {
  return (
    <div className="bg-gradient-to-r from-white to-blue-50 border border-blue-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
      <div className="flex flex-col sm:flex-row">
        <div className="relative w-full sm:w-32 h-48 sm:h-32 flex-shrink-0">
          <img 
            src={image} 
            alt={title}
            className="w-full h-full object-cover"
          />
          <button className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-blue-50 transition-colors">
            <FiHeart className="w-4 h-4 text-blue-600" />
          </button>
        </div>
        
        <div className="flex-1 p-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2">
            <div className="flex-1 mb-2 sm:mb-0">
              <h3 className="font-semibold text-blue-900 mb-1 text-sm lg:text-base">{title}</h3>
              <div className="flex items-center text-blue-600 text-xs lg:text-sm mb-2">
                <FiMapPin className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                <span>{location}</span>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-base lg:text-lg font-bold text-blue-600">{price}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 lg:space-x-4 text-xs lg:text-sm text-blue-700 mb-3">
            <div className="flex items-center">
              <FiHome className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
              <span>{bedrooms} beds</span>
            </div>
            <div className="flex items-center">
              <FiDroplet className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
              <span>{bathrooms} baths</span>
            </div>
            <div className="flex items-center">
              <FiSquare className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
              <span>{area}</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center text-blue-500 text-xs">
              <FiClock className="w-3 h-3 mr-1" />
              <span>Saved {savedDate}</span>
            </div>
            <div className="flex space-x-2">
              <button className="px-2 lg:px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
                View Details
              </button>
              <button className="px-2 lg:px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Schedule Visit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SavedListingCard 