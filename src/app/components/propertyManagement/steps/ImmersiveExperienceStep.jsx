"use client"
import React from 'react'
import ImmersiveExperience from '../modules/ImmersiveExperience'

const ImmersiveExperienceStep = ({ formData, updateFormData, mode, accountType }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Immersive Experience</h2>
        <p className="text-sm text-gray-600">Add 3D models and virtual tour experiences</p>
      </div>

      <ImmersiveExperience 
        formData={formData}
        updateFormData={updateFormData}
        mode={mode}
        accountType={accountType}
      />
    </div>
  )
}

export default ImmersiveExperienceStep

