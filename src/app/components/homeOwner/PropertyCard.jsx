import React from 'react'
import { FiMapPin, FiCalendar, FiMessageSquare, FiEye } from 'react-icons/fi'

const PropertyCard = ({ title, status, price, image, inquiries, bookings }) => {
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'rented':
        return 'bg-blue-100 text-blue-800'
      case 'sold':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300">
      <div className="relative">
        <img 
          src={image} 
          alt={title}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-3 right-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
            {status}
          </span>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex flex-col items-start justify-between mb-3">
          <div>
            <h5 className="font-semibold text-gray-800 mb-1">{title}</h5>
            <div className="flex items-center text-gray-600 text-sm">
              <FiMapPin className="w-4 h-4 mr-1" />
              <span>East Legon, Accra</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-primary_color">{price}</p>
          </div>
        </div>
        
        <div className="flex items-center flex-wrap gap-2 justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <FiMessageSquare className="w-4 h-4 mr-1" />
              <span>{inquiries} inquiries</span>
            </div>
            <div className="flex items-center">
              <FiCalendar className="w-4 h-4 mr-1" />
              <span>{bookings} bookings</span>
            </div>
          </div>
          <button className="flex items-center text-primary_color hover:text-primary_color/80 transition-colors">
            <FiEye className="w-4 h-4 mr-1" />
            View Details
          </button>
        </div>
      </div>
    </div>
  )
}

export default PropertyCard 