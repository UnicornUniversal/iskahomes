"use client"
import React from 'react'
import PropertyAmenities from '../modules/PropertyAmenities'

const AmenitiesStep = ({ formData, updateFormData, mode }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="">Amenities</h2>
        <p className="">{mode === 'edit' ? 'Update the amenities available in your property' : 'Select the amenities available in your property'}</p>
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

