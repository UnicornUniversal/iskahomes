import React from 'react'
import {FaLocationDot} from 'react-icons/fa6'

const SimplePropertyCard = (props) => {
  // Get specifications array (first 3-4)
  const specifications = props.specifications || []

  return (
    <div className="rounded-xl border border-primary_color backdrop-blur-md shadow-lg p-6 text-white bg-primary_color/50 max-w-lg w-full relative">
      {/* Badge */}
      <span className="absolute top-4 left-4 bg-orange-500 text-white text-xs font-bold px-4 py-1 rounded-md">{props.propertyType || 'Property'}</span>
      {/* Property Name */}
      <h4 className="text-md text-white  mb-2 mt-6">{props.propertyName}</h4>
      {/* Price */}
      <div className="text-md font-semibold mb-4">{props.propertyPrice}</div>
      {/* Location */}
      <div className="flex items-center gap-2 mb-3">
        <FaLocationDot className="text-white" />
        <span className='text-sm'>{props.propertyLocation}</span>
      </div>
      {/* Specifications */}
      {specifications.length > 0 && (
        <div className="flex items-center gap-4 flex-wrap mb-4">
          {specifications.map((spec, idx) => {
            const IconComponent = spec.icon
            return (
            <span key={idx} className="flex items-center gap-1.5 text-sm">
                {IconComponent && <IconComponent className="w-4 h-4" />}
              <span>{spec.label}</span>
            </span>
            )
          })}
        </div>
      )}
    </div>
  )
}

    export default SimplePropertyCard
