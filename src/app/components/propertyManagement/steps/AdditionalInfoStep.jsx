"use client"
import React from 'react'
import PropertyAdditionalInfo from '../modules/PropertyAdditionalInfo'
import PropertyFiles from '../modules/PropertyFiles'

const AdditionalInfoStep = ({ formData, updateFormData, mode, accountType }) => {
  return (
    <div className="space-y-6">
      <div className='border-b border-white/50 pb-4'>
        <h2 className="">Additional Information</h2>
        <p className="  ">Add additional details, files, and information</p>
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

