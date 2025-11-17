"use client"
import React from 'react'
import PropertyAdditionalInfo from '../modules/PropertyAdditionalInfo'
import PropertyFiles from '../modules/PropertyFiles'

const AdditionalInfoStep = ({ formData, updateFormData, mode, accountType }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Additional Information</h2>
        <p className="text-sm text-gray-600">Add additional details, files, and information</p>
      </div>

      <PropertyAdditionalInfo 
        formData={formData}
        updateFormData={updateFormData}
        mode={mode} 
      />

      {/* Files Section - Only for developers */}
      {accountType === 'developer' && (
        <div className="mt-6">
          <PropertyFiles 
            formData={formData}
            updateFormData={updateFormData}
            isEditMode={mode === 'edit'}
            accountType={accountType}
          />
        </div>
      )}
    </div>
  )
}

export default AdditionalInfoStep

