import React from 'react'
import { FiMapPin, FiHeart, FiHome, FiDroplet, FiSquare, FiClock, FiEye, FiCalendar } from 'react-icons/fi'

const SavedListingCard = ({ title, price, location, image, bedrooms, bathrooms, area, savedDate, layout = 'horizontal' }) => {
  const isVertical = layout === 'vertical'
  
  return (
    <div className="default_bg border border-primary_color/10 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01] group">
      <div className={isVertical ? "flex flex-col" : "flex flex-col sm:flex-row"}>
        <div className={`relative ${isVertical ? 'w-full h-64' : 'w-full sm:w-32 h-48 sm:h-32'} flex-shrink-0`}>
          {image ? (
            <img 
              src={image} 
              alt={title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.nextSibling.style.display = 'flex'
              }}
            />
          ) : null}
          <div 
            className={`w-full h-full bg-gradient-to-br from-primary_color to-secondary_color flex items-center justify-center ${image ? 'hidden' : 'flex'}`}
          >
            <div className="text-white text-2xl font-bold">
              {title?.charAt(0) || 'P'}
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <button className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors z-10">
            <FiHeart className="w-4 h-4 text-primary_color fill-primary_color" />
          </button>
        </div>
        
        <div className={`flex-1 p-4 sm:p-5 ${isVertical ? 'p-5' : ''}`}>
          <div className={`flex ${isVertical ? 'flex-col' : 'flex-col sm:flex-row sm:items-start sm:justify-between'} mb-3`}>
            <div className={`flex-1 ${isVertical ? 'mb-3' : 'mb-2 sm:mb-0'}`}>
              <h3 className="font-bold text-primary_color mb-1.5 text-base lg:text-lg group-hover:text-secondary_color transition-colors">{title}</h3>
              <div className="flex items-center text-primary_color/70 text-xs lg:text-sm mb-2">
                <FiMapPin className="w-3 h-3 lg:w-4 lg:h-4 mr-1.5 flex-shrink-0" />
                <span className="truncate">{location}</span>
              </div>
            </div>
            <div className={isVertical ? "text-left mb-3" : "text-left sm:text-right"}>
              <p className="text-lg lg:text-xl font-bold text-secondary_color">{price}</p>
            </div>
          </div>
          
          <div className="flex items-center flex-wrap gap-3 lg:gap-4 text-xs lg:text-sm text-primary_color/70 mb-4 pb-4 border-b border-primary_color/10">
            <div className="flex items-center gap-1.5">
              <div className="p-1.5 bg-primary_color/10 rounded-lg">
                <FiHome className="w-3 h-3 lg:w-4 lg:h-4 text-primary_color" />
              </div>
              <span className="font-medium">{bedrooms} beds</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="p-1.5 bg-primary_color/10 rounded-lg">
                <FiDroplet className="w-3 h-3 lg:w-4 lg:h-4 text-primary_color" />
              </div>
              <span className="font-medium">{bathrooms} baths</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="p-1.5 bg-primary_color/10 rounded-lg">
                <FiSquare className="w-3 h-3 lg:w-4 lg:h-4 text-primary_color" />
              </div>
              <span className="font-medium">{area}</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center text-primary_color/60 text-xs">
              <FiClock className="w-3 h-3 mr-1.5" />
              <span>Saved {savedDate}</span>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium default_bg text-primary_color rounded-lg hover:bg-primary_color/10 transition-colors border border-primary_color/10">
                <FiEye className="w-3 h-3" />
                <span>View</span>
              </button>
              <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-primary_color text-white rounded-lg hover:bg-primary_color/90 transition-colors shadow-lg shadow-primary_color/20">
                <FiCalendar className="w-3 h-3" />
                <span>Schedule</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SavedListingCard 