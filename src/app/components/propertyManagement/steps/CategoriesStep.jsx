"use client"
import React from 'react'
import PropertyCategories from '../modules/PropertyCategories'

const CategoriesStep = ({ formData, updateFormData, mode }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Categories</h2>
        <p className="text-sm text-gray-600">Select the categories, purposes, and types for your property</p>
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

