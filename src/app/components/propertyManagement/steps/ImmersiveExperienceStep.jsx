"use client"
import React from 'react'
import ImmersiveExperience from '../modules/ImmersiveExperience'

const ImmersiveExperienceStep = ({ formData, updateFormData, mode, accountType }) => {
  return (
    <div className="space-y-6">
      <div className='border-b border-white/50 pb-4'>
        <h2 className="mb-2">Immersive Experience</h2>
        <p className="">Add 3D models and virtual tour experiences for your property</p>
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

