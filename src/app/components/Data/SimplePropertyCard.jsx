import React from 'react'
import {FaLocationDot} from 'react-icons/fa6'

const SimplePropertyCard = (props) => {
  // Get specifications array (first 3-4)
  const specifications = props.specifications || []

  return (
    <div className="rounded-xl border border-primary_color backdrop-blur-md shadow-lg p-6 text-white max-w-lg w-full relative">
      {/* Badge */}
      <span className="absolute top-4 left-4 bg-orange-500 text-white text-xs font-bold px-4 py-1 rounded-md">{props.propertyType || 'Property'}</span>
      {/* Property Name */}
      <h2 className="text-2xl text-white font-semibold mb-2 mt-6">{props.propertyName}</h2>
      {/* Price */}
      <div className="text-xl font-bold mb-4">{props.propertyPrice}</div>
      {/* Location */}
      <div className="flex items-center gap-2 mb-3">
        <FaLocationDot className="text-white" />
        <span>{props.propertyLocation}</span>
      </div>
      {/* Specifications */}
      {specifications.length > 0 && (
        <div className="flex items-center gap-4 flex-wrap mb-4">
          {specifications.map((spec, idx) => (
            <span key={idx} className="flex items-center gap-1.5 text-sm">
              <span>{spec.emoji}</span>
              <span>{spec.label}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

    export default SimplePropertyCard
