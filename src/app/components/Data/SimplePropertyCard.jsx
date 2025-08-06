import React from 'react'
import {FaLocationDot,FaBed} from 'react-icons/fa6'

const SimplePropertyCard = (props) => {
  return (
    <div className="rounded-xl border border-primary_color backdrop-blur-md shadow-lg p-6 text-white max-w-lg w-full relative">
      {/* Badge */}
      <span className="absolute top-4 left-4 bg-orange-500 text-white text-xs font-bold px-4 py-1 rounded-md">Rent</span>
      {/* Property Name */}
      <h2 className="text-2xl text-white font-semibold mb-2 mt-6">{props.propertyName}</h2>
      {/* Price */}
      <div className="text-xl font-bold mb-4">{props.propertyPrice}</div>
      {/* Location and Bedrooms */}
      <div className="flex items-center gap-6 mb-4">
        <span className="flex items-center gap-2">
          <FaLocationDot className="text-white" />
          <span>{props.propertyLocation}</span>
        </span>
        <span className="flex items-center gap-2">
          <FaBed className="text-white" />
          <span>{props.propertyBedrooms} Bedrooms</span>
        </span>
      </div>
      {/* Button */}
      <button className="bg-orange-500 text-white px-5 py-2 rounded-md font-semibold hover:bg-orange-600 transition">
        View Details
      </button>
    </div>
  )
}

    export default SimplePropertyCard
