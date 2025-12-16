"use client"
import React from 'react'
import PropertyLocation from '../modules/PropertyLocation'

const LocationStep = ({ formData, updateFormData, mode, user, accountType, developments }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="">Location</h2>
        <p className="">{mode === 'edit' ? 'Update the property location' : 'Set the location and address of your property'}</p>
      </div>

      <PropertyLocation 
        formData={formData}
        updateFormData={updateFormData}
        isEditMode={mode === 'edit'} 
        companyLocations={user?.profile?.company_locations || []}
        accountType={accountType}
        developments={developments}
        user={user}
      />
    </div>
  )
}

export default LocationStep

