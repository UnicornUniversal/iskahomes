"use client"
import React from 'react'
import PropertyAmenities from '../modules/PropertyAmenities'

const AmenitiesStep = ({ formData, updateFormData, mode }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Amenities</h2>
        <p className="text-sm text-gray-600">Select the amenities available in your property</p>
      </div>

      <PropertyAmenities 
        formData={formData}
        updateFormData={updateFormData}
        mode={mode} 
      />
    </div>
  )
}

export default AmenitiesStep

