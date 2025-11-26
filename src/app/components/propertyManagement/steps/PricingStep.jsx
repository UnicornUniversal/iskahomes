"use client"
import React, { useState, useEffect } from 'react'
import PropertyPricing from '../modules/PropertyPricing'

const PricingStep = ({ formData, updateFormData, mode, user }) => {
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
        <h2 className="">Pricing & Availability</h2>
        <p className="">{mode === 'edit' ? 'Update the pricing and availability information for this property' : 'Set the pricing details and availability for your property'}</p>
      </div>

      <PropertyPricing 
        formData={formData}
        updateFormData={updateFormData}
        mode={mode}
        purposeData={purposeData}
        companyLocations={user?.profile?.company_locations || []}
      />
    </div>
  )
}

export default PricingStep

