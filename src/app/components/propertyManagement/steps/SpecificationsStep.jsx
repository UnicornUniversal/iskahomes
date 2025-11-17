"use client"
import React, { useState, useEffect } from 'react'
import PropertySpecifications from '../modules/PropertySpecifications'

const SpecificationsStep = ({ formData, updateFormData, mode }) => {
  const [purposeData, setPurposeData] = useState(null)

  // Fetch purpose data when purpose changes
  useEffect(() => {
    if (formData.purposes && formData.purposes.length > 0) {
      fetchPurposeData(formData.purposes[0])
    } else {
      setPurposeData(null)
    }
  }, [formData.purposes])

  const fetchPurposeData = async (purposeId) => {
    try {
      const response = await fetch('/api/cached-data?type=purposes')
      if (response.ok) {
        const result = await response.json()
        const purpose = result.data?.find(p => p.id === purposeId)
        setPurposeData(purpose)
      }
    } catch (error) {
      console.error('Error fetching purpose data:', error)
      setPurposeData(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Specifications</h2>
        <p className="text-sm text-gray-600">Enter the detailed specifications for your property</p>
      </div>

      <PropertySpecifications 
        selectedTypeIds={formData.types}
        specifications={formData.specifications}
        updateFormData={updateFormData}
        isEditMode={mode === 'edit'}
        purposeData={purposeData}
      />
    </div>
  )
}

export default SpecificationsStep

