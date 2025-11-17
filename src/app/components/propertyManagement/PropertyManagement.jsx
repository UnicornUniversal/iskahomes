"use client"
import React from 'react'
import PropertyManagementWizard from './PropertyManagementWizard'

// Re-export wizard as PropertyManagement for backward compatibility
const PropertyManagement = ({ slug, propertyId, accountType }) => {
    return (
    <PropertyManagementWizard 
      slug={slug}
      propertyId={propertyId}
              accountType={accountType}
            />
  )
}

export default PropertyManagement
