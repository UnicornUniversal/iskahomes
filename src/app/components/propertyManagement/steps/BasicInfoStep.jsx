"use client"
import React from 'react'
import { Input } from '../../ui/input'
import DevelopmentSelector from '../modules/DevelopmentSelector'
import PropertyDescription from '../modules/PropertyDescription'

const BasicInfoStep = ({ formData, updateFormData, mode, accountType, developments, developmentsLoading, user }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Basic Information</h2>
        <p className="text-sm text-gray-600">Enter the basic details about your property</p>
      </div>

      {/* Development Selection - Only for developers */}
      {accountType === 'developer' && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Development *
          </label>
          <DevelopmentSelector
            developments={developments}
            loading={developmentsLoading}
            selectedDevelopmentId={formData.development_id || ''}
            onSelect={(developmentId) => updateFormData({ development_id: developmentId || '' })}
            required
            developerId={user?.profile?.developer_id}
          />
        </div>
      )}

      {/* Description Section */}
      <PropertyDescription 
        formData={formData}
        updateFormData={updateFormData}
        mode={mode} 
      />
    </div>
  )
}

export default BasicInfoStep

