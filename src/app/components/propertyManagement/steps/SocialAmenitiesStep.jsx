"use client"
import React from 'react'
import SocialAmenities from '../modules/SocialAmenities'

const SocialAmenitiesStep = ({ formData, updateFormData, mode }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="">Social Amenities</h2>
        <p className="">{mode === 'edit' ? 'Update the social amenities available in your property' : 'Add nearby social amenities like schools, hospitals, parks, etc.'}</p>
      </div>

      <SocialAmenities 
        formData={formData}
        updateFormData={updateFormData}
        isEditMode={mode === 'edit'} 
      />
    </div>
  )
}

export default SocialAmenitiesStep

