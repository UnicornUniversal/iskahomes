"use client"
import React from 'react'
import PropertyCategories from '../modules/PropertyCategories'

const CategoriesStep = ({ formData, updateFormData, mode }) => {
  return (
    <div className="space-y-6">
   <div className="mb-4 sm:mb-6">
        <h2 className="2">Property Categories</h2>
        <p className="">
          {mode === 'edit' ? 'Update the property categories' : 'Select the appropriate categories for your property'}
        </p>
      </div>

      <PropertyCategories 
        formData={formData}
        updateFormData={updateFormData}
        isEditMode={mode === 'edit'} 
      />
    </div>
  )
}

export default CategoriesStep

